<?php

namespace Tests\Feature\Api;

use App\Models\Trader;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CopyTradingFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_following_trader_charges_copy_fee_and_records_wallet_transaction(): void
    {
        $user = User::factory()->create();

        $wallet = Wallet::query()->create([
            'user_id' => $user->id,
            'cash_balance' => 1000,
            'investing_balance' => 0,
            'profit_loss' => 0,
            'currency' => 'USD',
        ]);

        $trader = Trader::query()->create([
            'display_name' => 'Alpha Whale',
            'username' => 'alpha_whale',
            'avatar_color' => 'emerald',
            'strategy' => 'Momentum',
            'copy_fee' => 50,
            'total_return' => 12.5,
            'win_rate' => 80,
            'copiers_count' => 0,
            'risk_score' => 3,
            'joined_at' => now()->subDays(10),
            'is_verified' => true,
            'is_active' => true,
        ]);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/v1/copy-trading/follow', [
            'trader_id' => $trader->id,
            'copy_ratio' => 1,
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.user_id', $user->id)
            ->assertJsonPath('data.trader_id', $trader->id)
            ->assertJsonPath('data.status', 'active');

        $wallet->refresh();
        $this->assertEqualsWithDelta(950, (float) $wallet->cash_balance, 0.00000001);

        $transaction = WalletTransaction::query()
            ->where('wallet_id', $wallet->id)
            ->latest('created_at')
            ->first();

        $this->assertNotNull($transaction);
        $this->assertContains($transaction->type, ['copy_fee', 'copy_allocation']);
        $this->assertSame('approved', $transaction->status);
        $this->assertSame('debit', $transaction->direction);
        $this->assertEqualsWithDelta(50, (float) $transaction->amount, 0.00000001);
    }
}
