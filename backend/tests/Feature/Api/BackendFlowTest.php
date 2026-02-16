<?php

namespace Tests\Feature\Api;

use App\Models\Asset;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BackendFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_login_fetch_dashboard_and_place_order(): void
    {
        $this->seed();

        $loginResponse = $this->postJson('/api/v1/auth/login', [
            'email' => 'tommygreymassey@yahoo.com',
            'password' => 'password',
            'device_name' => 'phpunit',
        ]);

        $loginResponse
            ->assertOk()
            ->assertJsonStructure([
                'token',
                'token_type',
                'user' => ['id', 'name', 'email'],
            ]);

        $token = $loginResponse->json('token');

        $dashboardResponse = $this
            ->withToken($token)
            ->getJson('/api/v1/dashboard');

        $dashboardResponse
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'portfolio',
                    'analytics',
                    'positions',
                    'watchlist',
                ],
            ]);

        $btc = Asset::query()->where('symbol', 'BTC')->firstOrFail();

        $orderResponse = $this
            ->withToken($token)
            ->postJson('/api/v1/orders', [
                'asset_id' => $btc->id,
                'side' => 'buy',
                'quantity' => 0.01,
                'order_type' => 'market',
            ]);

        $orderResponse
            ->assertCreated()
            ->assertJsonPath('data.asset.symbol', 'BTC');

        $user = User::query()->where('email', 'tommygreymassey@yahoo.com')->firstOrFail();

        $this->assertGreaterThan(0, $user->orders()->count());
    }

    public function test_dashboard_syncs_user_and_wallet_balances_from_positions(): void
    {
        $this->seed();

        $user = User::query()->where('email', 'tommygreymassey@yahoo.com')->firstOrFail();
        $wallet = Wallet::query()->where('user_id', $user->id)->firstOrFail();
        $positions = $user->positions()->with('asset')->get();

        $expectedHolding = round($positions->sum(
            fn ($position) => (float) $position->quantity * (float) $position->asset->current_price
        ), 8);
        $expectedProfit = round($positions->sum(
            fn ($position) => ((float) $position->asset->current_price - (float) $position->average_price) * (float) $position->quantity
        ), 8);
        $expectedPortfolioValue = round((float) $wallet->cash_balance + $expectedHolding, 2);

        $user->update([
            'holding_balance' => 0,
            'profit_balance' => 0,
        ]);

        $loginResponse = $this->postJson('/api/v1/auth/login', [
            'email' => 'tommygreymassey@yahoo.com',
            'password' => 'password',
            'device_name' => 'phpunit',
        ]);

        $token = $loginResponse->json('token');

        $dashboardResponse = $this
            ->withToken($token)
            ->getJson('/api/v1/dashboard');

        $dashboardResponse
            ->assertOk()
            ->assertJsonPath('data.portfolio.value', $expectedPortfolioValue)
            ->assertJsonPath('data.portfolio.buying_power', round((float) $wallet->cash_balance, 2));

        $history = $dashboardResponse->json('data.portfolio.history');

        $this->assertIsArray($history);
        $this->assertGreaterThanOrEqual(32, count($history));
        $this->assertSame(
            $expectedPortfolioValue,
            round((float) data_get($history, (count($history) - 1).'.value'), 2)
        );

        $user->refresh();
        $wallet->refresh();

        $this->assertEqualsWithDelta((float) $wallet->cash_balance, (float) $user->balance, 0.00000001);
        $this->assertEqualsWithDelta($expectedHolding, (float) $user->holding_balance, 0.00000001);
        $this->assertEqualsWithDelta($expectedProfit, (float) $user->profit_balance, 0.00000001);
        $this->assertEqualsWithDelta($expectedHolding, (float) $wallet->investing_balance, 0.00000001);
        $this->assertEqualsWithDelta($expectedProfit, (float) $wallet->profit_loss, 0.00000001);
    }

    public function test_dashboard_history_respects_selected_range(): void
    {
        $this->seed();

        $loginResponse = $this->postJson('/api/v1/auth/login', [
            'email' => 'tommygreymassey@yahoo.com',
            'password' => 'password',
            'device_name' => 'phpunit',
        ]);

        $token = $loginResponse->json('token');

        $dayResponse = $this->withToken($token)->getJson('/api/v1/dashboard?range=24h');
        $yearResponse = $this->withToken($token)->getJson('/api/v1/dashboard?range=1y');

        $dayHistory = $dayResponse->json('data.portfolio.history');
        $yearHistory = $yearResponse->json('data.portfolio.history');

        $this->assertIsArray($dayHistory);
        $this->assertIsArray($yearHistory);
        $this->assertCount(96, $dayHistory);
        $this->assertCount(208, $yearHistory);
    }
}
