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

    public function test_wallet_summary_reserves_pending_withdrawals_in_displayed_cash_balance(): void
    {
        $user = User::factory()->create();
        $wallet = Wallet::query()->create([
            'user_id' => $user->id,
            'cash_balance' => 1000,
            'investing_balance' => 200,
            'profit_loss' => 50,
            'currency' => 'USD',
        ]);

        WalletTransaction::query()->create([
            'wallet_id' => $wallet->id,
            'type' => 'withdrawal',
            'status' => 'pending',
            'direction' => 'debit',
            'amount' => 300,
            'occurred_at' => now(),
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/wallet')
            ->assertOk();

        $this->assertEqualsWithDelta(700, (float) $response->json('data.wallet.cash_balance'), 0.00000001);
        $this->assertEqualsWithDelta(950, (float) $response->json('data.wallet.total_balance'), 0.00000001);

        $wallet->refresh();
        $user->refresh();

        $this->assertEqualsWithDelta(1000, (float) $wallet->cash_balance, 0.00000001);
        $this->assertEqualsWithDelta(1000, (float) $user->balance, 0.00000001);
    }

    public function test_dashboard_uses_available_cash_without_persisting_reserved_balance(): void
    {
        $user = User::factory()->create();
        $wallet = Wallet::query()->create([
            'user_id' => $user->id,
            'cash_balance' => 900,
            'investing_balance' => 0,
            'profit_loss' => 0,
            'currency' => 'USD',
        ]);

        WalletTransaction::query()->create([
            'wallet_id' => $wallet->id,
            'type' => 'withdrawal',
            'status' => 'pending',
            'direction' => 'debit',
            'amount' => 250,
            'occurred_at' => now(),
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/dashboard')
            ->assertOk();

        $this->assertEqualsWithDelta(650, (float) $response->json('data.portfolio.buying_power'), 0.00000001);
        $this->assertEqualsWithDelta(650, (float) $response->json('data.portfolio.value'), 0.00000001);

        $wallet->refresh();
        $user->refresh();

        $this->assertEqualsWithDelta(900, (float) $wallet->cash_balance, 0.00000001);
        $this->assertEqualsWithDelta(900, (float) $user->balance, 0.00000001);
    }
}
