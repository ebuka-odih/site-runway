<?php

namespace Tests\Feature\Admin;

use App\Models\CopyRelationship;
use App\Models\CopyTrade;
use App\Models\Trader;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CopyTraderTradeManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_edit_copy_trade_pnl_and_update_wallet_profit_balance(): void
    {
        $admin = User::factory()->admin()->create();
        $follower = User::factory()->create([
            'balance' => 5000,
            'holding_balance' => 1000,
            'profit_balance' => 20,
        ]);

        $wallet = Wallet::query()->create([
            'user_id' => $follower->id,
            'cash_balance' => 5000,
            'investing_balance' => 1000,
            'profit_loss' => 20,
            'currency' => 'USD',
        ]);

        $trader = Trader::query()->create([
            'display_name' => 'Alpha Whale',
            'username' => 'alpha_whale',
            'avatar_color' => 'emerald',
            'strategy' => 'Momentum',
            'copy_fee' => 50000,
            'total_return' => 42.2,
            'win_rate' => 74.5,
            'copiers_count' => 1,
            'risk_score' => 3,
            'joined_at' => now()->subDays(20),
            'is_verified' => true,
            'is_active' => true,
        ]);

        $relationship = CopyRelationship::query()->create([
            'user_id' => $follower->id,
            'trader_id' => $trader->id,
            'allocation_amount' => 50000,
            'copy_ratio' => 1,
            'status' => 'active',
            'pnl' => 40,
            'trades_count' => 1,
            'started_at' => now()->subDays(2),
        ]);

        $copyTrade = CopyTrade::query()->create([
            'copy_relationship_id' => $relationship->id,
            'asset_id' => null,
            'side' => 'buy',
            'quantity' => 1,
            'price' => 100,
            'pnl' => 40,
            'executed_at' => now()->subHours(3),
            'metadata' => [
                'source' => 'admin',
                'copy_ratio' => 1,
                'leader_pnl' => 40,
            ],
        ]);

        $editRoute = route('admin.copy-traders.edit', $trader);
        $updateRoute = route('admin.copy-traders.trades.update', [$trader, $copyTrade]);

        $this->actingAs($admin)
            ->from($editRoute)
            ->put($updateRoute, ['pnl' => 65])
            ->assertRedirect($editRoute);

        $copyTrade->refresh();
        $relationship->refresh();
        $wallet->refresh();
        $follower->refresh();

        $this->assertSame(65.0, (float) $copyTrade->pnl);
        $this->assertSame(65.0, (float) $relationship->pnl);
        $this->assertSame(1, (int) $relationship->trades_count);
        $this->assertSame(45.0, (float) $wallet->profit_loss);
        $this->assertSame(45.0, (float) $follower->profit_balance);

        $this->assertDatabaseHas('wallet_transactions', [
            'wallet_id' => $wallet->id,
            'type' => 'copy_pnl',
            'direction' => 'credit',
            'status' => 'approved',
            'amount' => 25,
        ]);

        $this->actingAs($admin)
            ->from($editRoute)
            ->put($updateRoute, ['pnl' => 15])
            ->assertRedirect($editRoute);

        $copyTrade->refresh();
        $relationship->refresh();
        $wallet->refresh();
        $follower->refresh();

        $this->assertSame(15.0, (float) $copyTrade->pnl);
        $this->assertSame(15.0, (float) $relationship->pnl);
        $this->assertSame(-5.0, (float) $wallet->profit_loss);
        $this->assertSame(-5.0, (float) $follower->profit_balance);

        $this->assertDatabaseHas('wallet_transactions', [
            'wallet_id' => $wallet->id,
            'type' => 'copy_pnl',
            'direction' => 'debit',
            'status' => 'approved',
            'amount' => 50,
        ]);

        $this->assertSame(2, WalletTransaction::query()->where('wallet_id', $wallet->id)->count());
    }

    public function test_admin_pnl_edit_is_reflected_in_dashboard_daily_change_and_history(): void
    {
        $admin = User::factory()->admin()->create();
        $follower = User::factory()->create([
            'balance' => 5000,
            'holding_balance' => 0,
            'profit_balance' => 40,
        ]);

        $wallet = Wallet::query()->create([
            'user_id' => $follower->id,
            'cash_balance' => 5000,
            'investing_balance' => 0,
            'profit_loss' => 40,
            'currency' => 'USD',
        ]);

        $trader = Trader::query()->create([
            'display_name' => 'Alpha Whale',
            'username' => 'alpha_whale',
            'avatar_color' => 'emerald',
            'strategy' => 'Momentum',
            'copy_fee' => 50000,
            'total_return' => 42.2,
            'win_rate' => 74.5,
            'copiers_count' => 1,
            'risk_score' => 3,
            'joined_at' => now()->subDays(20),
            'is_verified' => true,
            'is_active' => true,
        ]);

        $relationship = CopyRelationship::query()->create([
            'user_id' => $follower->id,
            'trader_id' => $trader->id,
            'allocation_amount' => 50000,
            'copy_ratio' => 1,
            'status' => 'active',
            'pnl' => 40,
            'trades_count' => 1,
            'started_at' => now()->subDays(2),
        ]);

        $copyTrade = CopyTrade::query()->create([
            'copy_relationship_id' => $relationship->id,
            'asset_id' => null,
            'side' => 'buy',
            'quantity' => 1,
            'price' => 100,
            'pnl' => 40,
            'executed_at' => now()->subHours(3),
            'metadata' => [
                'source' => 'admin',
                'copy_ratio' => 1,
                'leader_pnl' => 40,
            ],
        ]);

        $editRoute = route('admin.copy-traders.edit', $trader);
        $updateRoute = route('admin.copy-traders.trades.update', [$trader, $copyTrade]);

        $this->actingAs($admin)
            ->from($editRoute)
            ->put($updateRoute, ['pnl' => 65])
            ->assertRedirect($editRoute);

        $wallet->refresh();
        $relationship->refresh();

        $this->assertSame(65.0, (float) $relationship->pnl);
        $this->assertSame(65.0, (float) $wallet->profit_loss);

        Sanctum::actingAs($follower);

        $dashboardResponse = $this->getJson('/api/v1/dashboard?range=24h')
            ->assertOk();

        $this->assertEqualsWithDelta(
            65.0,
            (float) $dashboardResponse->json('data.portfolio.profit_balance'),
            0.01
        );
        $this->assertEqualsWithDelta(
            25.0,
            (float) $dashboardResponse->json('data.portfolio.daily_change'),
            0.01
        );
        $this->assertEqualsWithDelta(
            62.5,
            (float) $dashboardResponse->json('data.portfolio.daily_change_percent'),
            0.01
        );

        $history = collect($dashboardResponse->json('data.portfolio.history'));

        $this->assertNotEmpty($history);

        $firstInvestingTotal = (float) data_get($history->first(), 'investing_total', 0);
        $lastInvestingTotal = (float) data_get($history->last(), 'investing_total', 0);

        $this->assertEqualsWithDelta(40.0, $firstInvestingTotal, 0.01);
        $this->assertEqualsWithDelta(65.0, $lastInvestingTotal, 0.01);
    }
}
