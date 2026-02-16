<?php

namespace Tests\Feature\Admin;

use App\Models\DepositRequest;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TransactionTabsTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_filter_transactions_using_deposit_and_withdrawal_tabs(): void
    {
        $admin = User::factory()->admin()->create();
        $customer = User::factory()->create();

        $wallet = Wallet::query()->create([
            'user_id' => $customer->id,
        ]);

        $depositRequest = DepositRequest::query()->create([
            'wallet_id' => $wallet->id,
            'amount' => 120,
            'currency' => 'USDT',
            'network' => 'TRC20',
            'wallet_address' => 'T111',
            'status' => 'processing',
        ]);

        $withdrawalTransaction = WalletTransaction::query()->create([
            'wallet_id' => $wallet->id,
            'type' => 'withdrawal',
            'status' => 'pending',
            'direction' => 'debit',
            'amount' => 40,
            'occurred_at' => now(),
        ]);

        $this->actingAs($admin)
            ->get('/admin/transactions?tab=deposit')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Transactions/Index')
                ->where('activeTab', 'deposit')
                ->has('transactions.data', 1)
                ->where('transactions.data.0.id', $depositRequest->id)
                ->where('transactions.data.0.type', 'deposit')
            );

        $this->actingAs($admin)
            ->get('/admin/transactions?tab=withdrawal')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Transactions/Index')
                ->where('activeTab', 'withdrawal')
                ->has('transactions.data', 1)
                ->where('transactions.data.0.id', $withdrawalTransaction->id)
                ->where('transactions.data.0.type', 'withdrawal')
            );
    }

    public function test_invalid_tab_defaults_to_deposit(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->get('/admin/transactions?tab=invalid-tab')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Transactions/Index')
                ->where('activeTab', 'deposit')
            );
    }

    public function test_transactions_payload_contains_action_urls_for_each_tab(): void
    {
        $admin = User::factory()->admin()->create();
        $customer = User::factory()->create();

        $wallet = Wallet::query()->create([
            'user_id' => $customer->id,
        ]);

        $depositRequest = DepositRequest::query()->create([
            'wallet_id' => $wallet->id,
            'amount' => 55,
            'currency' => 'BTC',
            'network' => 'BTC',
            'wallet_address' => 'bc1abc',
            'status' => 'processing',
        ]);

        $withdrawalTransaction = WalletTransaction::query()->create([
            'wallet_id' => $wallet->id,
            'type' => 'withdrawal',
            'status' => 'pending',
            'direction' => 'debit',
            'amount' => 25,
            'occurred_at' => now(),
        ]);

        $this->actingAs($admin)
            ->get('/admin/transactions?tab=deposit')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Transactions/Index')
                ->where('transactions.data.0.id', $depositRequest->id)
                ->where('transactions.data.0.approve_url', route('admin.transactions.deposits.approve', $depositRequest))
                ->where('transactions.data.0.decline_url', route('admin.transactions.deposits.decline', $depositRequest))
                ->where('transactions.data.0.delete_url', route('admin.transactions.deposits.destroy', $depositRequest))
            );

        $this->actingAs($admin)
            ->get('/admin/transactions?tab=withdrawal')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Transactions/Index')
                ->where('transactions.data.0.id', $withdrawalTransaction->id)
                ->where('transactions.data.0.approve_url', route('admin.transactions.withdrawals.approve', $withdrawalTransaction))
                ->where('transactions.data.0.decline_url', route('admin.transactions.withdrawals.decline', $withdrawalTransaction))
                ->where('transactions.data.0.delete_url', route('admin.transactions.withdrawals.destroy', $withdrawalTransaction))
            );
    }
}
