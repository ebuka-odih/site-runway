<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WalletWithdrawalFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_submit_withdrawal_request_for_admin_approval(): void
    {
        $this->seed();

        $token = $this->postJson('/api/v1/auth/login', [
            'email' => 'tommygreymassey@yahoo.com',
            'password' => 'password',
            'device_name' => 'phpunit',
        ])->json('token');

        $user = User::query()->where('email', 'tommygreymassey@yahoo.com')->firstOrFail();
        $wallet = Wallet::query()->where('user_id', $user->id)->firstOrFail();
        $initialCashBalance = (float) $wallet->cash_balance;

        $response = $this
            ->withToken($token)
            ->postJson('/api/v1/wallet/withdrawals', [
                'amount' => 1500,
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

        $this->assertEqualsWithDelta($initialCashBalance, (float) $wallet->cash_balance, 0.00000001);

        $this->assertDatabaseHas('wallet_transactions', [
            'wallet_id' => $wallet->id,
            'type' => 'withdrawal',
            'status' => 'pending',
            'direction' => 'debit',
        ]);
    }

    public function test_user_cannot_submit_withdrawal_request_above_available_balance(): void
    {
        $this->seed();

        $token = $this->postJson('/api/v1/auth/login', [
            'email' => 'tommygreymassey@yahoo.com',
            'password' => 'password',
            'device_name' => 'phpunit',
        ])->json('token');

        $user = User::query()->where('email', 'tommygreymassey@yahoo.com')->firstOrFail();
        $wallet = Wallet::query()->where('user_id', $user->id)->firstOrFail();
        $amountAboveBalance = (float) $wallet->cash_balance + 1;
        $withdrawalCountBefore = WalletTransaction::query()->where('type', 'withdrawal')->count();

        $this
            ->withToken($token)
            ->postJson('/api/v1/wallet/withdrawals', [
                'amount' => $amountAboveBalance,
                'currency' => 'USDT',
                'network' => 'ERC 20',
                'destination' => '0x2222222222222222222222222222222222222222',
            ])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Insufficient available balance for this withdrawal request.');

        $withdrawalCountAfter = WalletTransaction::query()->where('type', 'withdrawal')->count();

        $this->assertSame($withdrawalCountBefore, $withdrawalCountAfter);
    }
}
