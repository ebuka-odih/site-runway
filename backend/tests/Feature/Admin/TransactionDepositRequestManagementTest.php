<?php

namespace Tests\Feature\Admin;

use App\Models\DepositRequest;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class TransactionDepositRequestManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_approve_a_processing_deposit_request(): void
    {
        $admin = User::factory()->admin()->create();
        $customer = User::factory()->create();

        $wallet = Wallet::query()->create([
            'user_id' => $customer->id,
            'cash_balance' => 100,
        ]);

        $depositRequest = DepositRequest::query()->create([
            'wallet_id' => $wallet->id,
            'amount' => 250,
            'currency' => 'USDT',
            'network' => 'TRC20',
            'wallet_address' => 'T1234567890',
            'transaction_hash' => '0xabc123',
            'proof_path' => 'uploads/deposits/proof-1.png',
            'status' => 'processing',
            'submitted_at' => now(),
        ]);

        $this->actingAs($admin)
            ->post(route('admin.transactions.deposits.approve', $depositRequest))
            ->assertRedirect();

        $depositRequest->refresh();
        $wallet->refresh();

        $this->assertSame('approved', $depositRequest->status);
        $this->assertNotNull($depositRequest->processed_at);
        $this->assertSame(350.0, (float) $wallet->cash_balance);

        $walletTransaction = WalletTransaction::query()
            ->where('wallet_id', $wallet->id)
            ->where('type', 'deposit')
            ->first();

        $this->assertNotNull($walletTransaction);
        $this->assertSame('approved', $walletTransaction->status);
        $this->assertSame('credit', $walletTransaction->direction);
        $this->assertSame(250.0, (float) $walletTransaction->amount);
        $this->assertSame($depositRequest->id, data_get($walletTransaction->metadata, 'deposit_request_id'));
    }

    public function test_admin_can_decline_a_deposit_request(): void
    {
        $admin = User::factory()->admin()->create();
        $customer = User::factory()->create();

        $wallet = Wallet::query()->create([
            'user_id' => $customer->id,
            'cash_balance' => 500,
        ]);

        $depositRequest = DepositRequest::query()->create([
            'wallet_id' => $wallet->id,
            'amount' => 80,
            'currency' => 'BTC',
            'network' => 'BTC',
            'wallet_address' => 'bc1abc123',
            'status' => 'processing',
            'submitted_at' => now(),
        ]);

        $this->actingAs($admin)
            ->post(route('admin.transactions.deposits.decline', $depositRequest))
            ->assertRedirect();

        $depositRequest->refresh();
        $wallet->refresh();

        $this->assertSame('rejected', $depositRequest->status);
        $this->assertNotNull($depositRequest->processed_at);
        $this->assertSame(500.0, (float) $wallet->cash_balance);
        $this->assertSame(0, WalletTransaction::query()->count());
    }

    public function test_admin_can_delete_non_approved_deposit_request_and_proof_file(): void
    {
        Storage::fake('local');

        $admin = User::factory()->admin()->create();
        $customer = User::factory()->create();

        $wallet = Wallet::query()->create([
            'user_id' => $customer->id,
        ]);

        Storage::disk('local')->put('uploads/deposits/proof-2.png', 'proof');

        $depositRequest = DepositRequest::query()->create([
            'wallet_id' => $wallet->id,
            'amount' => 120,
            'currency' => 'ETH',
            'network' => 'ERC20',
            'wallet_address' => '0xabc123',
            'proof_path' => 'uploads/deposits/proof-2.png',
            'status' => 'payment',
        ]);

        $this->actingAs($admin)
            ->delete(route('admin.transactions.deposits.destroy', $depositRequest))
            ->assertRedirect();

        $this->assertDatabaseMissing('deposit_requests', [
            'id' => $depositRequest->id,
        ]);

        Storage::disk('local')->assertMissing('uploads/deposits/proof-2.png');
    }

    public function test_approved_deposit_request_cannot_be_deleted(): void
    {
        $admin = User::factory()->admin()->create();
        $customer = User::factory()->create();

        $wallet = Wallet::query()->create([
            'user_id' => $customer->id,
        ]);

        $depositRequest = DepositRequest::query()->create([
            'wallet_id' => $wallet->id,
            'amount' => 300,
            'currency' => 'USDT',
            'network' => 'ERC20',
            'wallet_address' => '0xabc',
            'status' => 'approved',
            'processed_at' => now(),
        ]);

        $this->actingAs($admin)
            ->delete(route('admin.transactions.deposits.destroy', $depositRequest))
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->assertDatabaseHas('deposit_requests', [
            'id' => $depositRequest->id,
            'status' => 'approved',
        ]);
    }

    public function test_transactions_page_includes_receipt_url_for_deposit_requests(): void
    {
        $admin = User::factory()->admin()->create();
        $customer = User::factory()->create();

        $wallet = Wallet::query()->create([
            'user_id' => $customer->id,
        ]);

        $depositRequest = DepositRequest::query()->create([
            'wallet_id' => $wallet->id,
            'amount' => 55,
            'currency' => 'USDT',
            'network' => 'TRC20',
            'wallet_address' => 'T999',
            'proof_path' => 'uploads/deposits/proof-3.png',
            'status' => 'processing',
        ]);

        $this->actingAs($admin)
            ->get('/admin/transactions')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Transactions/Index')
                ->where('transactions.data.0.id', $depositRequest->id)
                ->where('transactions.data.0.has_receipt', true)
                ->where('transactions.data.0.receipt_url', route('admin.transactions.deposits.receipt', $depositRequest, false))
            );
    }

    public function test_missing_receipt_path_returns_informative_page_instead_of_404(): void
    {
        $admin = User::factory()->admin()->create();
        $customer = User::factory()->create();

        $wallet = Wallet::query()->create([
            'user_id' => $customer->id,
        ]);

        $depositRequest = DepositRequest::query()->create([
            'wallet_id' => $wallet->id,
            'amount' => 25,
            'currency' => 'USDT',
            'network' => 'TRC20',
            'wallet_address' => 'T555',
            'proof_path' => 'uploads/deposits/missing-file.png',
            'status' => 'processing',
        ]);

        $this->actingAs($admin)
            ->get(route('admin.transactions.deposits.receipt', $depositRequest))
            ->assertOk()
            ->assertSeeText('Receipt Not Available')
            ->assertSeeText('Stored Path: uploads/deposits/missing-file.png');
    }
}
