<?php

namespace Tests\Feature\Admin;

use App\Models\DepositRequest;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Notifications\UserEventNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class TransactionNotificationDispatchTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_approving_deposit_sends_database_and_email_notification_to_user(): void
    {
        Notification::fake();

        $admin = User::factory()->admin()->create();
        $customer = User::factory()->create([
            'notification_email_alerts' => true,
        ]);

        $wallet = Wallet::query()->create([
            'user_id' => $customer->id,
            'cash_balance' => 10,
        ]);

        $depositRequest = DepositRequest::query()->create([
            'wallet_id' => $wallet->id,
            'amount' => 50,
            'currency' => 'USDT',
            'network' => 'TRC20',
            'wallet_address' => 'T000000000000',
            'status' => 'processing',
            'submitted_at' => now(),
        ]);

        $this->actingAs($admin)
            ->post(route('admin.transactions.deposits.approve', $depositRequest))
            ->assertRedirect();

        Notification::assertSentTo($customer, UserEventNotification::class, function (UserEventNotification $notification, array $channels) use ($customer): bool {
            return in_array('database', $channels, true)
                && in_array('mail', $channels, true)
                && data_get($notification->toArray($customer), 'event_type') === 'wallet.deposit_approved';
        });
    }

    public function test_admin_approving_withdrawal_sends_database_and_email_notification_to_user(): void
    {
        Notification::fake();

        $admin = User::factory()->admin()->create();
        $customer = User::factory()->create([
            'notification_email_alerts' => true,
        ]);

        $wallet = Wallet::query()->create([
            'user_id' => $customer->id,
            'cash_balance' => 500,
        ]);

        $withdrawal = WalletTransaction::query()->create([
            'wallet_id' => $wallet->id,
            'type' => 'withdrawal',
            'status' => 'pending',
            'direction' => 'debit',
            'amount' => 120,
            'occurred_at' => now(),
        ]);

        $this->actingAs($admin)
            ->post(route('admin.transactions.withdrawals.approve', $withdrawal))
            ->assertRedirect();

        Notification::assertSentTo($customer, UserEventNotification::class, function (UserEventNotification $notification, array $channels) use ($customer): bool {
            return in_array('database', $channels, true)
                && in_array('mail', $channels, true)
                && data_get($notification->toArray($customer), 'event_type') === 'wallet.withdrawal_approved';
        });
    }
}
