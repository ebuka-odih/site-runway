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

    public function test_order_uses_wallet_buying_power_when_user_balance_is_stale(): void
    {
        $this->seed();

        $user = User::query()->where('email', 'tommygreymassey@yahoo.com')->firstOrFail();
        $wallet = Wallet::query()->where('user_id', $user->id)->firstOrFail();

        $this->assertGreaterThan(0, (float) $wallet->cash_balance);

        $user->update([
            'balance' => 0,
            'profit_balance' => 0,
            'holding_balance' => 0,
        ]);

        $token = $this->postJson('/api/v1/auth/login', [
            'email' => 'tommygreymassey@yahoo.com',
            'password' => 'password',
            'device_name' => 'phpunit',
        ])->json('token');

        $asset = Asset::query()->where('symbol', 'AAPL')->firstOrFail();

        $this->withToken($token)
            ->postJson('/api/v1/orders', [
                'asset_id' => $asset->id,
                'side' => 'buy',
                'quantity' => 1,
                'order_type' => 'market',
            ])
            ->assertCreated();

        $user->refresh();

        $this->assertGreaterThan(0, (float) $user->balance);
    }

    public function test_order_uses_user_balance_when_wallet_is_missing(): void
    {
        $asset = Asset::query()->create([
            'symbol' => 'SYNC',
            'name' => 'Sync Asset',
            'type' => 'stock',
            'current_price' => 100,
            'change_percent' => 0,
            'change_value' => 0,
            'is_active' => true,
        ]);

        $user = User::factory()->create([
            'email' => 'walletless@example.com',
            'balance' => 1000,
            'profit_balance' => 0,
            'holding_balance' => 0,
        ]);

        $token = $this->postJson('/api/v1/auth/login', [
            'email' => 'walletless@example.com',
            'password' => 'password',
            'device_name' => 'phpunit',
        ])->json('token');

        $this->withToken($token)
            ->postJson('/api/v1/orders', [
                'asset_id' => $asset->id,
                'side' => 'buy',
                'quantity' => 2,
                'order_type' => 'market',
            ])
            ->assertCreated();

        $wallet = Wallet::query()->where('user_id', $user->id)->first();

        $this->assertNotNull($wallet);
        $this->assertEqualsWithDelta(800, (float) $wallet->cash_balance, 0.00000001);

        $user->refresh();

        $this->assertEqualsWithDelta((float) $wallet->cash_balance, (float) $user->balance, 0.00000001);
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

    public function test_dashboard_history_includes_holdings_value_series(): void
    {
        $this->seed();

        $loginResponse = $this->postJson('/api/v1/auth/login', [
            'email' => 'tommygreymassey@yahoo.com',
            'password' => 'password',
            'device_name' => 'phpunit',
        ]);

        $token = $loginResponse->json('token');

        $dashboardResponse = $this
            ->withToken($token)
            ->getJson('/api/v1/dashboard?range=24h');

        $dashboardResponse
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'portfolio' => [
                        'holdings_value',
                        'history' => [
                            '*' => ['holdings_value'],
                        ],
                    ],
                ],
            ]);

        $history = collect($dashboardResponse->json('data.portfolio.history'));

        $this->assertTrue($history->isNotEmpty());
        $this->assertTrue($history->every(fn (array $point): bool => array_key_exists('holdings_value', $point)));

        $lastPoint = $history->last();
        $summaryHoldingsValue = (float) $dashboardResponse->json('data.portfolio.holdings_value');
        $lastHistoryHoldingsValue = (float) data_get($lastPoint, 'holdings_value', 0);

        $this->assertEqualsWithDelta($summaryHoldingsValue, $lastHistoryHoldingsValue, 0.01);
    }

    public function test_market_assets_include_price_update_timestamp(): void
    {
        $this->seed();

        $loginResponse = $this->postJson('/api/v1/auth/login', [
            'email' => 'tommygreymassey@yahoo.com',
            'password' => 'password',
            'device_name' => 'phpunit',
        ]);

        $token = $loginResponse->json('token');

        $marketResponse = $this
            ->withToken($token)
            ->getJson('/api/v1/market/assets?type=stock');

        $marketResponse
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'symbol',
                        'price',
                        'last_price_update_at',
                    ],
                ],
            ]);

        $firstAsset = collect($marketResponse->json('data'))->first();

        $this->assertIsArray($firstAsset);
        $this->assertNotNull($firstAsset['last_price_update_at'] ?? null);

        $detailResponse = $this
            ->withToken($token)
            ->getJson('/api/v1/market/assets/'.$firstAsset['id']);

        $detailResponse
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'symbol',
                    'last_price_update_at',
                ],
            ]);

        $this->assertNotNull($detailResponse->json('data.last_price_update_at'));
    }

    public function test_newly_opened_position_day_change_uses_purchase_reference_price(): void
    {
        $this->seed();

        $token = $this->postJson('/api/v1/auth/login', [
            'email' => 'tommygreymassey@yahoo.com',
            'password' => 'password',
            'device_name' => 'phpunit',
        ])->json('token');

        $asset = Asset::query()->where('symbol', 'AAPL')->firstOrFail();

        $this->withToken($token)
            ->postJson('/api/v1/orders', [
                'asset_id' => $asset->id,
                'side' => 'buy',
                'quantity' => 1,
                'order_type' => 'market',
            ])
            ->assertCreated();

        $dashboardResponse = $this
            ->withToken($token)
            ->getJson('/api/v1/dashboard?range=24h');

        $position = collect($dashboardResponse->json('data.positions'))
            ->firstWhere('symbol', 'AAPL');

        $this->assertIsArray($position);
        $this->assertArrayHasKey('day_change_value', $position);
        $this->assertArrayHasKey('day_change_percent', $position);
        $this->assertArrayHasKey('updated_at', $position);
        $this->assertEqualsWithDelta(0.0, (float) data_get($position, 'day_change_value'), 0.01);
    }
}
