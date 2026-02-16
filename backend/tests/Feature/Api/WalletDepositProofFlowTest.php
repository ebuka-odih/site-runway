<?php

namespace Tests\Feature\Api;

use App\Models\DepositRequest;
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
            ->assertCreated();

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
}
