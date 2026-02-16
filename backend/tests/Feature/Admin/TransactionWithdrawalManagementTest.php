<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TransactionWithdrawalManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_approve_pending_withdrawal_transaction(): void
    {
        $admin = User::factory()->admin()->create();
        $customer = User::factory()->create();

        $wallet = Wallet::query()->create([
            'user_id' => $customer->id,
            'cash_balance' => 120,
        ]);

        $withdrawal = WalletTransaction::query()->create([
            'wallet_id' => $wallet->id,
            'type' => 'withdrawal',
            'status' => 'pending',
            'direction' => 'debit',
            'amount' => 80,
            'occurred_at' => now(),
        ]);

        $this->actingAs($admin)
            ->post(route('admin.transactions.withdrawals.approve', $withdrawal))
            ->assertRedirect();

        $withdrawal->refresh();
        $wallet->refresh();

        $this->assertSame('approved', $withdrawal->status);
        $this->assertEqualsWithDelta(40, (float) $wallet->cash_balance, 0.00000001);
    }

    public function test_admin_can_decline_pending_withdrawal_transaction(): void
    {
        $admin = User::factory()->admin()->create();
        $customer = User::factory()->create();

        $wallet = Wallet::query()->create([
            'user_id' => $customer->id,
        ]);

        $withdrawal = WalletTransaction::query()->create([
            'wallet_id' => $wallet->id,
            'type' => 'withdrawal',
            'status' => 'pending',
            'direction' => 'debit',
            'amount' => 60,
            'occurred_at' => now(),
        ]);

        $this->actingAs($admin)
            ->post(route('admin.transactions.withdrawals.decline', $withdrawal))
            ->assertRedirect();

        $withdrawal->refresh();

        $this->assertSame('rejected', $withdrawal->status);
    }

    public function test_admin_can_delete_non_approved_withdrawal_transaction(): void
    {
        $admin = User::factory()->admin()->create();
        $customer = User::factory()->create();

        $wallet = Wallet::query()->create([
            'user_id' => $customer->id,
        ]);

        $withdrawal = WalletTransaction::query()->create([
            'wallet_id' => $wallet->id,
            'type' => 'withdrawal',
            'status' => 'pending',
            'direction' => 'debit',
            'amount' => 45,
            'occurred_at' => now(),
        ]);

        $this->actingAs($admin)
            ->delete(route('admin.transactions.withdrawals.destroy', $withdrawal))
            ->assertRedirect();

        $this->assertDatabaseMissing('wallet_transactions', [
            'id' => $withdrawal->id,
        ]);
    }

    public function test_approved_withdrawal_transaction_cannot_be_deleted(): void
    {
        $admin = User::factory()->admin()->create();
        $customer = User::factory()->create();

        $wallet = Wallet::query()->create([
            'user_id' => $customer->id,
        ]);

        $withdrawal = WalletTransaction::query()->create([
            'wallet_id' => $wallet->id,
            'type' => 'withdrawal',
            'status' => 'approved',
            'direction' => 'debit',
            'amount' => 25,
            'occurred_at' => now(),
        ]);

        $this->actingAs($admin)
            ->delete(route('admin.transactions.withdrawals.destroy', $withdrawal))
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->assertDatabaseHas('wallet_transactions', [
            'id' => $withdrawal->id,
            'status' => 'approved',
        ]);
    }
}
