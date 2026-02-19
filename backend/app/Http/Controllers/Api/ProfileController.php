<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateProfileRequest;
use App\Models\KycSubmission;
use App\Models\User;
use App\Notifications\AdminApprovalNotification;
use App\Notifications\AuthOtpNotification;
use App\Notifications\UserEventNotification;
use App\Support\SiteSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
    private const OTP_EXPIRY_MINUTES = 10;

    /**
     * @var array<int, string>
     */
    private const ALLOWED_DOCUMENT_TYPES = [
        'drivers_license',
        'international_passport',
        'national_id_card',
    ];

    public function show(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->profilePayload($request->user()->loadMissing('kycSubmission')),
        ]);
    }

    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        if (! empty($validated['new_password'])) {
            if (empty($validated['current_password']) || ! Hash::check($validated['current_password'], $user->password)) {
                return response()->json([
                    'message' => 'Current password is incorrect.',
                ], 422);
            }

            $user->password = $validated['new_password'];
        }

        unset($validated['current_password'], $validated['new_password'], $validated['new_password_confirmation']);

        if ($validated !== []) {
            $user->fill($validated);
        }

        $user->save();

        return response()->json([
            'message' => 'Profile updated successfully.',
            'data' => $this->profilePayload($user->loadMissing('kycSubmission')),
        ]);
    }

    public function sendKycOtp(Request $request): JsonResponse
    {
        $user = $request->user()->loadMissing('kycSubmission');
        $submission = $user->kycSubmission;

        if (! $submission || $submission->status !== 'awaiting_otp') {
            return response()->json([
                'message' => 'Submit your KYC details first before requesting an OTP.',
            ], 422);
        }

        $otp = $this->issueKycOtp($user);

        return response()->json(array_merge([
            'message' => 'A KYC verification OTP has been sent to your email.',
            'otp_expires_in_minutes' => self::OTP_EXPIRY_MINUTES,
        ], $this->debugOtpPayload($otp)));
    }

    public function submitKyc(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'address' => ['required', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:120'],
            'country' => ['required', 'string', 'max:120'],
            'document_type' => ['required', 'string', 'in:'.implode(',', self::ALLOWED_DOCUMENT_TYPES)],
            'document_file' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120'],
        ]);

        $user = $request->user();

        $documentPath = $request->file('document_file')?->store('kyc-documents', 'public');

        if (! is_string($documentPath) || $documentPath === '') {
            return response()->json([
                'message' => 'Document upload failed. Please try again.',
            ], 422);
        }

        DB::transaction(function () use ($validated, $user, $documentPath): void {
            $existing = $user->kycSubmission()->first();

            if ($existing && $existing->id_document_path && Storage::disk('public')->exists($existing->id_document_path)) {
                Storage::disk('public')->delete($existing->id_document_path);
            }

            KycSubmission::query()->updateOrCreate(
                ['user_id' => $user->id],
                [
                    'status' => 'awaiting_otp',
                    'address_line' => $validated['address'],
                    'city' => $validated['city'],
                    'country' => $validated['country'],
                    'id_document_type' => $validated['document_type'],
                    'id_document_path' => $documentPath,
                    'submitted_at' => null,
                    'reviewed_at' => null,
                    'reviewed_by' => null,
                    'review_notes' => null,
                ]
            );

            $user->forceFill([
                'kyc_status' => 'pending',
                'kyc_otp_code' => null,
                'kyc_otp_expires_at' => null,
            ])->save();
        });

        $otp = $this->issueKycOtp($user);

        return response()->json(array_merge([
            'message' => 'KYC details saved. Enter the OTP sent to your email to complete submission.',
            'otp_expires_in_minutes' => self::OTP_EXPIRY_MINUTES,
            'data' => $this->profilePayload($user->fresh()->loadMissing('kycSubmission')),
        ], $this->debugOtpPayload($otp)));
    }

    public function confirmKyc(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'otp' => ['required', 'digits:6'],
        ]);

        $user = $request->user()->loadMissing('kycSubmission');
        $submission = $user->kycSubmission;

        if (! $submission || $submission->status !== 'awaiting_otp') {
            return response()->json([
                'message' => 'No KYC submission is waiting for OTP confirmation.',
            ], 422);
        }

        $this->assertValidKycOtp($validated['otp'], $user->kyc_otp_code, $user->kyc_otp_expires_at);

        DB::transaction(function () use ($user, $submission): void {
            $submission->forceFill([
                'status' => 'pending',
                'submitted_at' => now(),
                'reviewed_at' => null,
                'reviewed_by' => null,
                'review_notes' => null,
            ])->save();

            $user->forceFill([
                'kyc_status' => 'pending',
                'kyc_otp_code' => null,
                'kyc_otp_expires_at' => null,
            ])->save();
        });

        $submission->refresh();
        $user->refresh();

        $admins = User::query()->where('is_admin', true)->get();
        $adminMessage = sprintf(
            'KYC submission received from %s (%s) for %s.',
            (string) ($user->name ?? 'User'),
            (string) ($user->email ?? '-'),
            $this->resolveDocumentTypeLabel((string) $submission->id_document_type)
        );

        if ($admins->isNotEmpty()) {
            Notification::send($admins, new AdminApprovalNotification(
                title: 'KYC approval required',
                message: $adminMessage,
                actionUrl: '/admin/kyc',
            ));
        } else {
            $supportEmail = (string) (SiteSettings::get()['support_email'] ?? '');
            if ($supportEmail !== '') {
                Notification::route('mail', $supportEmail)->notify(new AdminApprovalNotification(
                    title: 'KYC approval required',
                    message: $adminMessage,
                    actionUrl: '/admin/kyc',
                ));
            }
        }

        $user->notify(new UserEventNotification(
            eventType: 'kyc.submitted',
            title: 'KYC submitted',
            message: 'Your KYC details have been submitted and are pending admin review.',
            metadata: [
                'kyc_submission_id' => $submission->id,
                'status' => 'pending',
                'document_type' => $submission->id_document_type,
            ],
            actionUrl: '/dashboard/profile?section=kyc',
            sendEmail: false,
        ));

        return response()->json([
            'message' => 'KYC details submitted successfully. Admin review is pending.',
            'data' => $this->profilePayload($user->loadMissing('kycSubmission')),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function profilePayload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'timezone' => $user->timezone,
            'membership_tier' => $user->membership_tier,
            'kyc_status' => $user->kyc_status,
            'notification_email_alerts' => $user->notification_email_alerts,
            'kyc_submission' => $this->kycSubmissionPayload($user->kycSubmission),
            'security' => [
                'two_factor_enabled' => false,
                'password_last_changed_at' => optional($user->updated_at)->toIso8601String(),
            ],
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function kycSubmissionPayload(?KycSubmission $submission): ?array
    {
        if (! $submission) {
            return null;
        }

        return [
            'id' => $submission->id,
            'status' => $submission->status,
            'address' => $submission->address_line,
            'city' => $submission->city,
            'country' => $submission->country,
            'document_type' => $submission->id_document_type,
            'submitted_at' => $submission->submitted_at?->toIso8601String(),
            'reviewed_at' => $submission->reviewed_at?->toIso8601String(),
            'review_notes' => $submission->review_notes,
        ];
    }

    private function assertValidKycOtp(string $otp, ?string $hashedOtp, mixed $expiresAt): void
    {
        $expiresAtTimestamp = $expiresAt;

        if (is_string($expiresAtTimestamp)) {
            $expiresAtTimestamp = Carbon::parse($expiresAtTimestamp);
        }

        if (! $hashedOtp || ! $expiresAtTimestamp || now()->greaterThan($expiresAtTimestamp) || ! Hash::check($otp, $hashedOtp)) {
            throw ValidationException::withMessages([
                'otp' => ['The KYC verification code is invalid or expired.'],
            ]);
        }
    }

    /**
     * @return array<string, string>
     */
    private function debugOtpPayload(string $otp): array
    {
        if (app()->environment(['local', 'testing'])) {
            return ['debug_otp' => $otp];
        }

        return [];
    }

    private function resolveDocumentTypeLabel(string $documentType): string
    {
        return match ($documentType) {
            'drivers_license' => 'Driver License',
            'international_passport' => 'International Passport',
            'national_id_card' => 'National ID Card',
            default => 'ID document',
        };
    }

    private function issueKycOtp(User $user): string
    {
        $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $expiresAt = now()->addMinutes(self::OTP_EXPIRY_MINUTES);

        $user->forceFill([
            'kyc_otp_code' => Hash::make($otp),
            'kyc_otp_expires_at' => $expiresAt,
        ])->save();

        $user->notify(new AuthOtpNotification($otp, 'kyc_verification'));

        return $otp;
    }
}
