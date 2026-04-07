<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WalletBalanceDisplayTest extends TestCase
{
    use RefreshDatabase;

    public function test_wallet_summary_reserves_pending_withdrawals_from_profit_before_cash(): void
    {
        $user = User::factory()->create();
        $wallet = Wallet::query()->create([
            'user_id' => $user->id,
            'cash_balance' => 300,
            'investing_balance' => 200,
            'profit_loss' => 100,
            'currency' => 'USD',
        ]);

        WalletTransaction::query()->create([
            'wallet_id' => $wallet->id,
            'type' => 'withdrawal',
            'status' => 'pending',
            'direction' => 'debit',
            'amount' => 200,
            'occurred_at' => now(),
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/wallet')
            ->assertOk();

        $this->assertEqualsWithDelta(200, (float) $response->json('data.wallet.cash_balance'), 0.00000001);
        $this->assertEqualsWithDelta(0, (float) $response->json('data.wallet.profit_loss'), 0.00000001);
        $this->assertEqualsWithDelta(400, (float) $response->json('data.wallet.total_balance'), 0.00000001);

        $wallet->refresh();
        $user->refresh();

        $this->assertEqualsWithDelta(300, (float) $wallet->cash_balance, 0.00000001);
        $this->assertEqualsWithDelta(100, (float) $wallet->profit_loss, 0.00000001);
        $this->assertEqualsWithDelta(300, (float) $user->balance, 0.00000001);
        $this->assertEqualsWithDelta(100, (float) $user->profit_balance, 0.00000001);
    }

    public function test_dashboard_reserves_pending_withdrawals_from_profit_before_cash_without_persisting_balances(): void
    {
        $user = User::factory()->create();
        $wallet = Wallet::query()->create([
            'user_id' => $user->id,
            'cash_balance' => 300,
            'investing_balance' => 0,
            'profit_loss' => 100,
            'currency' => 'USD',
        ]);

        WalletTransaction::query()->create([
            'wallet_id' => $wallet->id,
            'type' => 'withdrawal',
            'status' => 'pending',
            'direction' => 'debit',
            'amount' => 200,
            'occurred_at' => now(),
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/dashboard')
            ->assertOk();

        $this->assertEqualsWithDelta(200, (float) $response->json('data.portfolio.buying_power'), 0.00000001);
        $this->assertEqualsWithDelta(200, (float) $response->json('data.portfolio.value'), 0.00000001);
        $this->assertEqualsWithDelta(0, (float) $response->json('data.portfolio.profit_balance'), 0.00000001);

        $wallet->refresh();
        $user->refresh();

        $this->assertEqualsWithDelta(300, (float) $wallet->cash_balance, 0.00000001);
        $this->assertEqualsWithDelta(100, (float) $wallet->profit_loss, 0.00000001);
        $this->assertEqualsWithDelta(300, (float) $user->balance, 0.00000001);
        $this->assertEqualsWithDelta(100, (float) $user->profit_balance, 0.00000001);
    }
}
