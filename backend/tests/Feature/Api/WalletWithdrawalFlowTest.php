<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WalletWithdrawalFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_submit_withdrawal_request_using_combined_profit_and_cash_balances(): void
    {
        $user = User::factory()->create([
            'kyc_status' => 'verified',
        ]);

        $wallet = Wallet::query()->create([
            'user_id' => $user->id,
            'cash_balance' => 300,
            'investing_balance' => 0,
            'profit_loss' => 100,
            'currency' => 'USD',
        ]);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/v1/wallet/withdrawals', [
            'amount' => 200,
            'currency' => 'USDT',
            'network' => 'ERC 20',
            'destination' => '0x1111111111111111111111111111111111111111',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.type', 'withdrawal')
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.direction', 'debit');

        $wallet->refresh();

        $this->assertEqualsWithDelta(300, (float) $wallet->cash_balance, 0.00000001);
        $this->assertEqualsWithDelta(100, (float) $wallet->profit_loss, 0.00000001);

        $this->assertDatabaseHas('wallet_transactions', [
            'wallet_id' => $wallet->id,
            'type' => 'withdrawal',
            'status' => 'pending',
            'direction' => 'debit',
        ]);

        $withdrawal = WalletTransaction::query()->where('wallet_id', $wallet->id)->firstOrFail();

        $this->assertEqualsWithDelta(100, (float) data_get($withdrawal->metadata, 'profit_debit'), 0.00000001);
        $this->assertEqualsWithDelta(100, (float) data_get($withdrawal->metadata, 'cash_debit'), 0.00000001);
    }

    public function test_user_cannot_submit_withdrawal_request_above_combined_available_balance(): void
    {
        $user = User::factory()->create([
            'kyc_status' => 'verified',
        ]);

        $wallet = Wallet::query()->create([
            'user_id' => $user->id,
            'cash_balance' => 300,
            'investing_balance' => 0,
            'profit_loss' => 100,
            'currency' => 'USD',
        ]);

        Sanctum::actingAs($user);

        $withdrawalCountBefore = WalletTransaction::query()->where('type', 'withdrawal')->count();

        $this
            ->postJson('/api/v1/wallet/withdrawals', [
                'amount' => 401,
                'currency' => 'USDT',
                'network' => 'ERC 20',
                'destination' => '0x2222222222222222222222222222222222222222',
            ])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Insufficient available balance for this withdrawal request.')
            ->assertJsonPath('meta.available_balance', 400);

        $wallet->refresh();
        $withdrawalCountAfter = WalletTransaction::query()->where('type', 'withdrawal')->count();

        $this->assertSame($withdrawalCountBefore, $withdrawalCountAfter);
        $this->assertEqualsWithDelta(300, (float) $wallet->cash_balance, 0.00000001);
        $this->assertEqualsWithDelta(100, (float) $wallet->profit_loss, 0.00000001);
    }

    public function test_user_can_submit_bank_transfer_withdrawal_request(): void
    {
        $user = User::factory()->create([
            'kyc_status' => 'verified',
        ]);

        $wallet = Wallet::query()->create([
            'user_id' => $user->id,
            'cash_balance' => 500,
            'investing_balance' => 0,
            'profit_loss' => 50,
            'currency' => 'USD',
        ]);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/v1/wallet/withdrawals', [
            'amount' => 200,
            'currency' => 'USD',
            'payout_method' => 'bank_transfer',
            'bank_name' => 'First Test Bank',
            'account_name' => 'Jane Customer',
            'account_number' => '0123456789',
            'routing_number' => '110000000',
            'swift_code' => 'TESTUS33',
            'bank_address' => '123 Demo Street',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.type', 'withdrawal')
            ->assertJsonPath('data.status', 'pending');

        $withdrawal = WalletTransaction::query()->where('wallet_id', $wallet->id)->firstOrFail();

        $this->assertSame('bank_transfer', data_get($withdrawal->metadata, 'payout_method'));
        $this->assertNull(data_get($withdrawal->metadata, 'destination'));
        $this->assertSame('First Test Bank', data_get($withdrawal->metadata, 'bank_details.bank_name'));
        $this->assertSame('Jane Customer', data_get($withdrawal->metadata, 'bank_details.account_name'));
        $this->assertSame('0123456789', data_get($withdrawal->metadata, 'bank_details.account_number'));
    }
}
