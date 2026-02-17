<?php

namespace Tests\Feature\Api;

use App\Models\Asset;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserEventNotificationFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_order_deposit_and_withdrawal_create_user_notifications(): void
    {
        $this->seed();

        $token = $this->postJson('/api/v1/auth/login', [
            'email' => 'tommygreymassey@yahoo.com',
            'password' => 'password',
            'device_name' => 'phpunit',
        ])->json('token');

        $user = User::query()->where('email', 'tommygreymassey@yahoo.com')->firstOrFail();
        $createdAfter = now()->subSecond();

        $asset = Asset::query()->where('symbol', 'AAPL')->firstOrFail();

        $this->withToken($token)
            ->postJson('/api/v1/orders', [
                'asset_id' => $asset->id,
                'side' => 'buy',
                'quantity' => 1,
                'order_type' => 'market',
            ])
            ->assertCreated();

        $this->withToken($token)
            ->postJson('/api/v1/wallet/deposits', [
                'amount' => 100,
                'currency' => 'USDT',
                'network' => 'ERC 20',
            ])
            ->assertCreated();

        $this->withToken($token)
            ->postJson('/api/v1/wallet/withdrawals', [
                'amount' => 100,
                'currency' => 'USDT',
                'network' => 'ERC 20',
                'destination' => '0x1111111111111111111111111111111111111111',
            ])
            ->assertCreated();

        $eventTypes = $user->notifications()
            ->where('created_at', '>=', $createdAfter)
            ->get()
            ->pluck('data.event_type')
            ->all();

        $this->assertContains('order.buy_filled', $eventTypes);
        $this->assertContains('wallet.deposit_requested', $eventTypes);
        $this->assertContains('wallet.withdrawal_requested', $eventTypes);

        $notificationsResponse = $this->withToken($token)
            ->getJson('/api/v1/notifications?limit=10');

        $notificationsResponse
            ->assertOk()
            ->assertJsonPath('meta.unread_count', count($eventTypes));
    }
}
