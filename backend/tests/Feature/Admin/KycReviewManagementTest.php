<?php

namespace Tests\Feature\Admin;

use App\Models\KycSubmission;
use App\Models\User;
use App\Notifications\UserEventNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class KycReviewManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_approve_pending_kyc_submission(): void
    {
        Notification::fake();

        $admin = User::factory()->admin()->create();
        $customer = User::factory()->create([
            'kyc_status' => 'pending',
        ]);

        $submission = KycSubmission::query()->create([
            'user_id' => $customer->id,
            'status' => 'pending',
            'address_line' => '123 Main St',
            'city' => 'London',
            'country' => 'United Kingdom',
            'id_document_type' => 'drivers_license',
            'id_document_path' => 'kyc-documents/sample.jpg',
            'submitted_at' => now(),
        ]);

        $this->actingAs($admin)
            ->post(route('admin.kyc.approve', $submission))
            ->assertRedirect();

        $submission->refresh();
        $customer->refresh();

        $this->assertSame('approved', $submission->status);
        $this->assertSame($admin->id, $submission->reviewed_by);
        $this->assertSame('verified', $customer->kyc_status);

        Notification::assertSentTo($customer, UserEventNotification::class);
    }

    public function test_admin_can_decline_pending_kyc_submission_with_note(): void
    {
        Notification::fake();

        $admin = User::factory()->admin()->create();
        $customer = User::factory()->create([
            'kyc_status' => 'pending',
        ]);

        $submission = KycSubmission::query()->create([
            'user_id' => $customer->id,
            'status' => 'pending',
            'address_line' => '55 Harbor Road',
            'city' => 'Lagos',
            'country' => 'Nigeria',
            'id_document_type' => 'national_id_card',
            'id_document_path' => 'kyc-documents/sample-2.jpg',
            'submitted_at' => now(),
        ]);

        $this->actingAs($admin)
            ->post(route('admin.kyc.decline', $submission), [
                'review_notes' => 'Document image is not clear.',
            ])
            ->assertRedirect();

        $submission->refresh();
        $customer->refresh();

        $this->assertSame('rejected', $submission->status);
        $this->assertSame('Document image is not clear.', $submission->review_notes);
        $this->assertSame('rejected', $customer->kyc_status);

        Notification::assertSentTo($customer, UserEventNotification::class);
    }
}
