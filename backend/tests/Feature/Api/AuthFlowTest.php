<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Notifications\AuthOtpNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class AuthFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_verify_email_with_otp_and_login(): void
    {
        Notification::fake();

        $registerResponse = $this->postJson('/api/v1/auth/register', [
            'username' => 'algo_user',
            'name' => 'Algo User',
            'email' => 'algo@example.com',
            'country' => 'United States',
            'phone' => '+1 555 000 1122',
            'password' => 'strong-pass-123',
        ]);

        $registerResponse
            ->assertCreated()
            ->assertJsonStructure([
                'message',
                'email',
                'otp_expires_in_minutes',
                'debug_otp',
            ]);

        /** @var User $user */
        $user = User::query()->where('email', 'algo@example.com')->firstOrFail();
        $otp = (string) $registerResponse->json('debug_otp');

        Notification::assertSentTo($user, AuthOtpNotification::class);

        $this->assertNull($user->email_verified_at);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'algo@example.com',
            'password' => 'strong-pass-123',
        ])->assertStatus(403)->assertJsonPath('requires_verification', true);

        $verifyResponse = $this->postJson('/api/v1/auth/verify-otp', [
            'email' => 'algo@example.com',
            'otp' => $otp,
            'device_name' => 'phpunit',
        ]);

        $verifyResponse
            ->assertOk()
            ->assertJsonStructure([
                'token',
                'token_type',
                'user' => ['id', 'username', 'name', 'email'],
            ]);

        $this->assertNotNull($user->fresh()->email_verified_at);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'algo@example.com',
            'password' => 'strong-pass-123',
        ])->assertOk();
    }

    public function test_user_can_reset_password_with_otp(): void
    {
        Notification::fake();

        $user = User::factory()->create([
            'email' => 'reset-me@example.com',
            'password' => 'old-password-123',
            'email_verified_at' => now(),
        ]);

        $forgotResponse = $this->postJson('/api/v1/auth/forgot-password', [
            'email' => 'reset-me@example.com',
        ]);

        $forgotResponse
            ->assertOk()
            ->assertJsonStructure(['message', 'debug_otp']);

        Notification::assertSentTo($user, AuthOtpNotification::class);

        $otp = (string) $forgotResponse->json('debug_otp');

        $this->postJson('/api/v1/auth/reset-password', [
            'email' => 'reset-me@example.com',
            'otp' => $otp,
            'password' => 'new-password-123',
        ])->assertOk();

        $this->postJson('/api/v1/auth/login', [
            'email' => 'reset-me@example.com',
            'password' => 'old-password-123',
        ])->assertStatus(422);

        $this->postJson('/api/v1/auth/login', [
            'email' => 'reset-me@example.com',
            'password' => 'new-password-123',
        ])->assertOk();
    }
}
