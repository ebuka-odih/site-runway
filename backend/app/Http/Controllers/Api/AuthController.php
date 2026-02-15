<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Models\User;
use App\Notifications\AuthOtpNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    private const OTP_EXPIRY_MINUTES = 10;

    /**
     * @var array<int, string>
     */
    private const BASE_COUNTRIES = [
        'United States',
        'United Kingdom',
        'Canada',
    ];

    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::query()->where('email', $request->string('email'))->first();

        if (! $user || ! Hash::check($request->string('password'), $user->password)) {
            return response()->json([
                'message' => 'The provided credentials are incorrect.',
            ], 422);
        }

        if (! $user->email_verified_at) {
            return response()->json([
                'message' => 'Email is not verified yet. Complete OTP verification to continue.',
                'requires_verification' => true,
            ], 403);
        }

        $token = $user->createToken($request->string('device_name', 'web-client'))->plainTextToken;

        return response()->json([
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => $this->authUser($user),
        ]);
    }

    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'username' => ['required', 'string', 'alpha_dash', 'min:3', 'max:30', Rule::unique('users', 'username')],
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'country' => ['required', 'string', Rule::in(self::BASE_COUNTRIES)],
            'phone' => ['required', 'string', 'max:30'],
            'password' => ['required', 'string', 'min:8', 'max:100'],
        ]);

        $user = User::query()->create([
            'username' => $validated['username'],
            'name' => $validated['name'],
            'email' => strtolower($validated['email']),
            'country' => $validated['country'],
            'phone' => $validated['phone'],
            'password' => $validated['password'],
            'membership_tier' => 'free',
            'kyc_status' => 'pending',
            'notification_email_alerts' => true,
            'timezone' => null,
            'email_verified_at' => null,
        ]);

        $otp = $this->issueOtp($user, 'email_verification');

        return response()->json(array_merge([
            'message' => 'Account created. Verify your email with the OTP we sent.',
            'email' => $user->email,
            'otp_expires_in_minutes' => self::OTP_EXPIRY_MINUTES,
        ], $this->debugOtpPayload($otp)), 201);
    }

    public function verifyEmailOtp(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'otp' => ['required', 'digits:6'],
            'device_name' => ['sometimes', 'string', 'max:100'],
        ]);

        /** @var User|null $user */
        $user = User::query()->where('email', strtolower($validated['email']))->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'email' => ['No account exists for this email address.'],
            ]);
        }

        if ($user->email_verified_at) {
            return response()->json([
                'message' => 'Email is already verified.',
            ]);
        }

        $this->assertValidOtp(
            $validated['otp'],
            $user->email_otp_code,
            $user->email_otp_expires_at,
            'The verification code is invalid or expired.',
        );

        $user->forceFill([
            'email_verified_at' => now(),
            'email_otp_code' => null,
            'email_otp_expires_at' => null,
        ])->save();

        $token = $user->createToken($validated['device_name'] ?? 'web-client')->plainTextToken;

        return response()->json([
            'message' => 'Email verified successfully.',
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => $this->authUser($user),
        ]);
    }

    public function resendEmailOtp(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
        ]);

        /** @var User|null $user */
        $user = User::query()->where('email', strtolower($validated['email']))->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'email' => ['No account exists for this email address.'],
            ]);
        }

        if ($user->email_verified_at) {
            return response()->json([
                'message' => 'Email is already verified.',
            ], 422);
        }

        $otp = $this->issueOtp($user, 'email_verification');

        return response()->json(array_merge([
            'message' => 'A new verification code has been sent.',
            'otp_expires_in_minutes' => self::OTP_EXPIRY_MINUTES,
        ], $this->debugOtpPayload($otp)));
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
        ]);

        /** @var User|null $user */
        $user = User::query()->where('email', strtolower($validated['email']))->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'email' => ['No account exists for this email address.'],
            ]);
        }

        $otp = $this->issueOtp($user, 'password_reset');

        return response()->json(array_merge([
            'message' => 'Password reset OTP sent to your email.',
            'otp_expires_in_minutes' => self::OTP_EXPIRY_MINUTES,
        ], $this->debugOtpPayload($otp)));
    }

    public function resetPasswordWithOtp(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'otp' => ['required', 'digits:6'],
            'password' => ['required', 'string', 'min:8', 'max:100'],
        ]);

        /** @var User|null $user */
        $user = User::query()->where('email', strtolower($validated['email']))->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'email' => ['No account exists for this email address.'],
            ]);
        }

        $this->assertValidOtp(
            $validated['otp'],
            $user->password_reset_otp_code,
            $user->password_reset_otp_expires_at,
            'The password reset code is invalid or expired.',
        );

        $user->forceFill([
            'password' => $validated['password'],
            'password_reset_otp_code' => null,
            'password_reset_otp_expires_at' => null,
        ])->save();

        $user->tokens()->delete();

        return response()->json([
            'message' => 'Password has been reset successfully.',
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'data' => $this->authUser($user),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function authUser(User $user): array
    {
        return [
            'id' => $user->id,
            'username' => $user->username,
            'name' => $user->name,
            'email' => $user->email,
            'country' => $user->country,
            'phone' => $user->phone,
            'timezone' => $user->timezone,
            'membership_tier' => $user->membership_tier,
            'kyc_status' => $user->kyc_status,
            'notification_email_alerts' => $user->notification_email_alerts,
        ];
    }

    private function issueOtp(User $user, string $purpose): string
    {
        $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $expiresAt = now()->addMinutes(self::OTP_EXPIRY_MINUTES);

        if ($purpose === 'email_verification') {
            $user->forceFill([
                'email_otp_code' => Hash::make($otp),
                'email_otp_expires_at' => $expiresAt,
            ])->save();
        } else {
            $user->forceFill([
                'password_reset_otp_code' => Hash::make($otp),
                'password_reset_otp_expires_at' => $expiresAt,
            ])->save();
        }

        $user->notify(new AuthOtpNotification($otp, $purpose));

        return $otp;
    }

    private function assertValidOtp(string $otp, ?string $hashedOtp, mixed $expiresAt, string $message): void
    {
        if (! $hashedOtp || ! $expiresAt || now()->greaterThan($expiresAt) || ! Hash::check($otp, $hashedOtp)) {
            throw ValidationException::withMessages([
                'otp' => [$message],
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
}
