<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Notifications\AdminApprovalNotification;
use App\Notifications\AuthOtpNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class KycSubmissionFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_submit_kyc_details_then_confirm_with_otp(): void
    {
        Storage::fake('public');
        Notification::fake();

        $user = User::factory()->create();
        $admin = User::factory()->admin()->create();

        Sanctum::actingAs($user);

        $submitResponse = $this->post('/api/v1/profile/kyc/submit', [
            'address' => '123 Wall Street',
            'city' => 'New York',
            'country' => 'United States',
            'document_type' => 'drivers_license',
            'document_file' => UploadedFile::fake()->image('kyc-id.jpg'),
        ], [
            'Accept' => 'application/json',
        ]);

        $submitResponse
            ->assertOk()
            ->assertJsonPath('data.kyc_submission.status', 'awaiting_otp')
            ->assertJsonStructure(['message', 'otp_expires_in_minutes', 'debug_otp', 'data']);

        $otp = (string) $submitResponse->json('debug_otp');

        Notification::assertSentTo($user, AuthOtpNotification::class);

        $this->assertDatabaseHas('kyc_submissions', [
            'user_id' => $user->id,
            'status' => 'awaiting_otp',
            'address_line' => '123 Wall Street',
            'city' => 'New York',
            'country' => 'United States',
            'id_document_type' => 'drivers_license',
        ]);

        $confirmResponse = $this->postJson('/api/v1/profile/kyc/confirm', [
            'otp' => $otp,
        ]);

        $confirmResponse
            ->assertOk()
            ->assertJsonPath('data.kyc_status', 'pending')
            ->assertJsonPath('data.kyc_submission.status', 'pending')
            ->assertJsonPath('data.kyc_submission.document_type', 'drivers_license');

        $this->assertDatabaseHas('kyc_submissions', [
            'user_id' => $user->id,
            'status' => 'pending',
            'address_line' => '123 Wall Street',
            'city' => 'New York',
            'country' => 'United States',
            'id_document_type' => 'drivers_license',
        ]);

        $user->refresh();
        $this->assertNull($user->kyc_otp_code);
        $this->assertNull($user->kyc_otp_expires_at);

        Notification::assertSentTo($admin, AdminApprovalNotification::class);
    }

    public function test_user_cannot_confirm_kyc_with_invalid_otp(): void
    {
        Storage::fake('public');
        Notification::fake();

        $user = User::factory()->create();

        Sanctum::actingAs($user);

        $this->post('/api/v1/profile/kyc/submit', [
            'address' => '12 Any Road',
            'city' => 'Toronto',
            'country' => 'Canada',
            'document_type' => 'international_passport',
            'document_file' => UploadedFile::fake()->image('passport.png'),
        ], [
            'Accept' => 'application/json',
        ])->assertOk();

        $this->postJson('/api/v1/profile/kyc/confirm', [
            'otp' => '000000',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['otp']);

        $this->assertDatabaseHas('kyc_submissions', [
            'user_id' => $user->id,
            'status' => 'awaiting_otp',
        ]);
    }

    public function test_user_cannot_request_kyc_otp_before_submitting_kyc_details(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->postJson('/api/v1/profile/kyc/send-otp')
            ->assertStatus(422)
            ->assertJsonPath('message', 'Submit your KYC details first before requesting an OTP.');
    }
}
