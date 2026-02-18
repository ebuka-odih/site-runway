<?php

namespace Tests\Feature\Api;

use App\Models\DepositRequest;
use App\Models\PaymentMethod;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class WalletDepositProofFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_submitted_deposit_proof_stays_processing_and_does_not_credit_wallet(): void
    {
        $this->seed();
        Storage::fake('public');

        $token = $this->postJson('/api/v1/auth/login', [
            'email' => 'tommygreymassey@yahoo.com',
            'password' => 'password',
            'device_name' => 'phpunit',
        ])->json('token');

        $user = User::query()->where('email', 'tommygreymassey@yahoo.com')->firstOrFail();
        $wallet = Wallet::query()->where('user_id', $user->id)->firstOrFail();
        $initialCashBalance = (float) $wallet->cash_balance;

        $createDepositResponse = $this
            ->withToken($token)
            ->postJson('/api/v1/wallet/deposits', [
                'amount' => 5000,
                'currency' => 'USDT',
                'network' => 'ERC 20',
            ])
            ->assertCreated()
            ->assertJsonPath('data.wallet_address', '0x906b2533218Df3581da06c697B51eF29f8c86381');

        $depositRequestId = (string) $createDepositResponse->json('data.id');

        $this
            ->withToken($token)
            ->post('/api/v1/wallet/deposits/'.$depositRequestId.'/proof', [
                'transaction_hash' => '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
                'proof_file' => UploadedFile::fake()->image('deposit-proof.png'),
                // Even if sent by clients, this must be ignored for user-side submission.
                'auto_approve' => true,
            ], [
                'Accept' => 'application/json',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'processing');

        $depositRequest = DepositRequest::query()->findOrFail($depositRequestId);
        $wallet->refresh();

        $this->assertSame('processing', $depositRequest->status);
        $this->assertNull($depositRequest->processed_at);
        $this->assertNotNull($depositRequest->submitted_at);
        $this->assertNotNull($depositRequest->proof_path);
        $this->assertEqualsWithDelta($initialCashBalance, (float) $wallet->cash_balance, 0.00000001);

        Storage::disk('public')->assertExists((string) $depositRequest->proof_path);
    }

    public function test_user_cannot_submit_deposit_proof_without_image_file(): void
    {
        $this->seed();

        $token = $this->postJson('/api/v1/auth/login', [
            'email' => 'tommygreymassey@yahoo.com',
            'password' => 'password',
            'device_name' => 'phpunit',
        ])->json('token');

        $createDepositResponse = $this
            ->withToken($token)
            ->postJson('/api/v1/wallet/deposits', [
                'amount' => 2500,
                'currency' => 'USDT',
                'network' => 'ERC 20',
            ])
            ->assertCreated();

        $depositRequestId = (string) $createDepositResponse->json('data.id');

        $this
            ->withToken($token)
            ->postJson('/api/v1/wallet/deposits/'.$depositRequestId.'/proof', [
                'transaction_hash' => '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['proof_file']);
    }

    public function test_user_deposit_uses_admin_payment_method_wallet_when_selected(): void
    {
        $this->seed();

        $paymentMethod = PaymentMethod::query()->create([
            'name' => 'USDT ERC20',
            'channel' => 'crypto',
            'currency' => 'USDT',
            'network' => 'ERC20',
            'wallet_address' => '0x1111111111111111111111111111111111111111',
            'status' => 'active',
            'display_order' => 1,
        ]);

        $token = $this->postJson('/api/v1/auth/login', [
            'email' => 'tommygreymassey@yahoo.com',
            'password' => 'password',
            'device_name' => 'phpunit',
        ])->json('token');

        $this->withToken($token)
            ->getJson('/api/v1/wallet')
            ->assertOk()
            ->assertJsonPath('data.deposit_methods.0.id', $paymentMethod->id)
            ->assertJsonPath('data.deposit_methods.0.wallet_address', $paymentMethod->wallet_address);

        $createDepositResponse = $this
            ->withToken($token)
            ->postJson('/api/v1/wallet/deposits', [
                'amount' => 2750,
                'currency' => 'USDT',
                'network' => 'ERC 20',
                'payment_method_id' => $paymentMethod->id,
            ])
            ->assertCreated()
            ->assertJsonPath('data.wallet_address', $paymentMethod->wallet_address)
            ->assertJsonPath('data.currency', 'USDT')
            ->assertJsonPath('data.network', 'ERC20');

        $this->assertDatabaseHas('deposit_requests', [
            'id' => $createDepositResponse->json('data.id'),
            'wallet_address' => $paymentMethod->wallet_address,
            'currency' => 'USDT',
            'network' => 'ERC20',
        ]);
    }

    public function test_user_deposit_returns_validation_error_when_selected_wallet_config_does_not_exist(): void
    {
        $this->seed();

        PaymentMethod::query()->create([
            'name' => 'USDT TRC20',
            'channel' => 'crypto',
            'currency' => 'USDT',
            'network' => 'TRC20',
            'wallet_address' => 'T111111111111111111111111111111111',
            'status' => 'active',
            'display_order' => 1,
        ]);

        $token = $this->postJson('/api/v1/auth/login', [
            'email' => 'tommygreymassey@yahoo.com',
            'password' => 'password',
            'device_name' => 'phpunit',
        ])->json('token');

        $this->withToken($token)
            ->postJson('/api/v1/wallet/deposits', [
                'amount' => 500,
                'currency' => 'BTC',
                'network' => 'ERC20',
            ])
            ->assertStatus(422)
            ->assertJsonPath('message', 'No active wallet is configured for the selected deposit method.');
    }
}
