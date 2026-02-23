<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KycSubmission;
use App\Notifications\UserEventNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class KycVerificationController extends Controller
{
    public function index(Request $request): Response
    {
        $status = (string) $request->string('status', 'all');
        $reviewableStatuses = ['pending', 'approved', 'rejected'];

        if (! in_array($status, array_merge(['all'], $reviewableStatuses), true)) {
            $status = 'all';
        }

        $submissions = KycSubmission::query()
            ->with([
                'user:id,name,email',
                'reviewer:id,name,email',
            ])
            ->whereIn('status', $reviewableStatuses)
            ->when($status !== 'all', fn ($query) => $query->where('status', $status))
            ->latest('submitted_at')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (KycSubmission $submission) => $this->submissionPayload($submission));

        return Inertia::render('Admin/Kyc/Index', [
            'submissions' => $submissions,
            'filters' => [
                'status' => $status,
            ],
            'stats' => [
                'total' => KycSubmission::query()->whereIn('status', $reviewableStatuses)->count(),
                'pending' => KycSubmission::query()->where('status', 'pending')->count(),
                'approved' => KycSubmission::query()->where('status', 'approved')->count(),
                'rejected' => KycSubmission::query()->where('status', 'rejected')->count(),
            ],
        ]);
    }

    public function showDocument(KycSubmission $kycSubmission): SymfonyResponse
    {
        $path = trim((string) $kycSubmission->id_document_path);

        if ($path === '' || ! Storage::disk('public')->exists($path)) {
            abort(404, 'Document file not found.');
        }

        return Storage::disk('public')->response($path);
    }

    public function approve(Request $request, KycSubmission $kycSubmission): RedirectResponse
    {
        if ($kycSubmission->status !== 'pending') {
            return back()->with('error', 'Only pending KYC submissions can be approved.');
        }

        $kycSubmission->update([
            'status' => 'approved',
            'reviewed_at' => now(),
            'reviewed_by' => $request->user()?->id,
            'review_notes' => null,
        ]);

        $user = $kycSubmission->user()->first();
        if ($user) {
            $user->update([
                'kyc_status' => 'verified',
            ]);

            $user->notify(new UserEventNotification(
                eventType: 'kyc.approved',
                title: 'KYC approved',
                message: 'Your account verification has been approved by admin.',
                metadata: [
                    'kyc_submission_id' => $kycSubmission->id,
                    'status' => 'approved',
                ],
                actionUrl: '/dashboard/profile?section=kyc',
                sendEmail: true,
            ));
        }

        return back()->with('success', 'KYC submission approved.');
    }

    public function decline(Request $request, KycSubmission $kycSubmission): RedirectResponse
    {
        if ($kycSubmission->status !== 'pending') {
            return back()->with('error', 'Only pending KYC submissions can be declined.');
        }

        $validated = $request->validate([
            'review_notes' => ['nullable', 'string', 'max:500'],
        ]);

        $kycSubmission->update([
            'status' => 'rejected',
            'reviewed_at' => now(),
            'reviewed_by' => $request->user()?->id,
            'review_notes' => $validated['review_notes'] ?? null,
        ]);

        $user = $kycSubmission->user()->first();
        if ($user) {
            $user->update([
                'kyc_status' => 'rejected',
            ]);

            $user->notify(new UserEventNotification(
                eventType: 'kyc.rejected',
                title: 'KYC declined',
                message: 'Your KYC submission was declined. Update your details and submit again.',
                metadata: [
                    'kyc_submission_id' => $kycSubmission->id,
                    'status' => 'rejected',
                    'review_notes' => $validated['review_notes'] ?? null,
                ],
                actionUrl: '/dashboard/profile?section=kyc',
                sendEmail: true,
            ));
        }

        return back()->with('success', 'KYC submission declined.');
    }

    /**
     * @return array<string, mixed>
     */
    private function submissionPayload(KycSubmission $submission): array
    {
        return [
            'id' => $submission->id,
            'status' => $submission->status,
            'address' => $submission->address_line,
            'city' => $submission->city,
            'country' => $submission->country,
            'document_type' => $submission->id_document_type,
            'review_notes' => $submission->review_notes,
            'submitted_at' => $submission->submitted_at?->toIso8601String(),
            'reviewed_at' => $submission->reviewed_at?->toIso8601String(),
            'user_name' => $submission->user?->name,
            'user_email' => $submission->user?->email,
            'reviewer_name' => $submission->reviewer?->name,
            'document_url' => $this->withBaseUrl(route('admin.kyc.document', $submission, false)),
            'can_approve' => $submission->status === 'pending',
            'can_decline' => $submission->status === 'pending',
            'approve_url' => $this->withBaseUrl(route('admin.kyc.approve', $submission, false)),
            'decline_url' => $this->withBaseUrl(route('admin.kyc.decline', $submission, false)),
        ];
    }

    private function withBaseUrl(string $path): string
    {
        $baseUrl = request()->getBaseUrl();

        if ($baseUrl === '') {
            return $path;
        }

        return rtrim($baseUrl, '/') . '/' . ltrim($path, '/');
    }
}
