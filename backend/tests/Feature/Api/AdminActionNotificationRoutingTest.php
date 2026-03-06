<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Models\Wallet;
use App\Notifications\AdminApprovalNotification;
use App\Support\SiteSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminActionNotificationRoutingTest extends TestCase
{
    use RefreshDatabase;

    public function test_deposit_request_sends_admin_alert_to_admin_user_and_configured_mailbox(): void
    {
        Notification::fake();
        $this->setSettings([
            'support_email' => 'support@runwayalgo.test',
            'admin_notification_email' => 'alerts@runwayalgo.test',
        ]);

        $user = User::factory()->create([
            'email' => 'customer@runwayalgo.test',
        ]);
        $admin = User::factory()->admin()->create([
            'email' => 'admin@runwayalgo.test',
        ]);

        Sanctum::actingAs($user);

        $this->postJson('/api/v1/wallet/deposits', [
            'amount' => 250,
            'currency' => 'USDT',
            'network' => 'ERC20',
        ])->assertCreated();

        Notification::assertSentTo($admin, AdminApprovalNotification::class);
        Notification::assertSentOnDemand(AdminApprovalNotification::class, function (
            AdminApprovalNotification $notification,
            array $channels,
            object $notifiable
        ): bool {
            return $notifiable->routeNotificationFor('mail') === 'alerts@runwayalgo.test';
        });
    }

    public function test_withdrawal_request_sends_admin_alert_to_admin_user_and_configured_mailbox(): void
    {
        Notification::fake();
        $this->setSettings([
            'support_email' => 'support@runwayalgo.test',
            'admin_notification_email' => 'alerts@runwayalgo.test',
        ]);

        $user = User::factory()->create([
            'email' => 'withdraw-customer@runwayalgo.test',
            'kyc_status' => 'verified',
        ]);
        $admin = User::factory()->admin()->create([
            'email' => 'admin@runwayalgo.test',
        ]);

        Wallet::query()->create([
            'user_id' => $user->id,
            'cash_balance' => 1200,
            'investing_balance' => 0,
            'profit_loss' => 0,
            'currency' => 'USD',
        ]);

        Sanctum::actingAs($user);

        $this->postJson('/api/v1/wallet/withdrawals', [
            'amount' => 300,
            'currency' => 'USDT',
            'network' => 'ERC20',
            'destination' => '0x1111111111111111111111111111111111111111',
        ])->assertCreated();

        Notification::assertSentTo($admin, AdminApprovalNotification::class);
        Notification::assertSentOnDemand(AdminApprovalNotification::class, function (
            AdminApprovalNotification $notification,
            array $channels,
            object $notifiable
        ): bool {
            return $notifiable->routeNotificationFor('mail') === 'alerts@runwayalgo.test';
        });
    }

    public function test_deposit_request_falls_back_to_support_email_when_no_admin_or_mailer_override_exists(): void
    {
        Notification::fake();
        $this->setSettings([
            'support_email' => 'support@runwayalgo.test',
            'admin_notification_email' => null,
        ]);

        $user = User::factory()->create([
            'email' => 'fallback-customer@runwayalgo.test',
        ]);

        Sanctum::actingAs($user);

        $this->postJson('/api/v1/wallet/deposits', [
            'amount' => 180,
            'currency' => 'USDT',
            'network' => 'ERC20',
        ])->assertCreated();

        Notification::assertSentOnDemandTimes(AdminApprovalNotification::class, 1);
        Notification::assertSentOnDemand(AdminApprovalNotification::class, function (
            AdminApprovalNotification $notification,
            array $channels,
            object $notifiable
        ): bool {
            return $notifiable->routeNotificationFor('mail') === 'support@runwayalgo.test';
        });
    }

    public function test_configured_mailer_is_deduplicated_when_it_matches_admin_user_email(): void
    {
        Notification::fake();
        $this->setSettings([
            'support_email' => 'support@runwayalgo.test',
            'admin_notification_email' => 'admin@runwayalgo.test',
        ]);

        $user = User::factory()->create([
            'email' => 'dedupe-customer@runwayalgo.test',
        ]);
        $admin = User::factory()->admin()->create([
            'email' => 'admin@runwayalgo.test',
        ]);

        Sanctum::actingAs($user);

        $this->postJson('/api/v1/wallet/deposits', [
            'amount' => 90,
            'currency' => 'USDT',
            'network' => 'ERC20',
        ])->assertCreated();

        Notification::assertSentTo($admin, AdminApprovalNotification::class, 1);
        Notification::assertSentOnDemandTimes(AdminApprovalNotification::class, 0);
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function setSettings(array $overrides): void
    {
        Cache::forever(SiteSettings::CACHE_KEY, [
            ...SiteSettings::defaults(),
            ...$overrides,
        ]);
    }
}
