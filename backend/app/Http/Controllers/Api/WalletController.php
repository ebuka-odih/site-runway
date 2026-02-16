<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDepositRequest;
use App\Http\Requests\StoreWithdrawalRequest;
use App\Http\Requests\SubmitDepositProofRequest;
use App\Models\Asset;
use App\Models\DepositRequest;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WalletController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        $wallet = $this->resolveUserWallet($request->user());

        $wallet->load([
            'transactions' => fn ($query) => $query->with('asset:id,symbol')->latest('occurred_at')->limit(10),
            'depositRequests' => fn ($query) => $query->latest(),
        ]);

        return response()->json([
            'data' => [
                'wallet' => [
                    'id' => $wallet->id,
                    'cash_balance' => (float) $wallet->cash_balance,
                    'investing_balance' => (float) $wallet->investing_balance,
                    'profit_loss' => (float) $wallet->profit_loss,
                    'currency' => $wallet->currency,
                ],
                'recent_transactions' => $wallet->transactions->map(fn ($transaction) => [
                    'id' => $transaction->id,
                    'type' => $transaction->type,
                    'status' => $transaction->status,
                    'direction' => $transaction->direction,
                    'amount' => (float) $transaction->amount,
                    'quantity' => $transaction->quantity ? (float) $transaction->quantity : null,
                    'symbol' => $transaction->asset?->symbol,
                    'occurred_at' => $transaction->occurred_at?->toIso8601String(),
                ]),
                'pending_deposits' => $wallet->depositRequests
                    ->whereIn('status', ['payment', 'processing'])
                    ->values()
                    ->map(fn ($deposit) => [
                        'id' => $deposit->id,
                        'amount' => (float) $deposit->amount,
                        'currency' => $deposit->currency,
                        'network' => $deposit->network,
                        'status' => $deposit->status,
                        'expires_at' => optional($deposit->expires_at)->toIso8601String(),
                    ]),
            ],
        ]);
    }

    public function transactions(Request $request): JsonResponse
    {
        $wallet = $this->resolveUserWallet($request->user());

        $validated = $request->validate([
            'type' => ['sometimes', 'string'],
            'status' => ['sometimes', 'string'],
        ]);

        $transactions = $wallet->transactions()
            ->with('asset:id,symbol,name')
            ->when(isset($validated['type']), fn ($query) => $query->where('type', $validated['type']))
            ->when(isset($validated['status']), fn ($query) => $query->where('status', $validated['status']))
            ->latest('occurred_at')
            ->paginate(20);

        return response()->json($transactions);
    }

    public function storeDeposit(StoreDepositRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $wallet = $this->resolveUserWallet($request->user());

        $asset = Asset::query()
            ->where('symbol', $validated['currency'])
            ->first();

        $deposit = $wallet->depositRequests()->create([
            'asset_id' => $validated['asset_id'] ?? $asset?->id,
            'amount' => $validated['amount'],
            'currency' => $validated['currency'],
            'network' => $validated['network'] ?? null,
            'wallet_address' => '0x906b2533218Df3581da06c697B51eF29f8c86381',
            'status' => 'payment',
            'expires_at' => now()->addMinutes(15),
        ]);

        return response()->json([
            'message' => 'Deposit request created.',
            'data' => $deposit,
        ], 201);
    }

    public function submitProof(SubmitDepositProofRequest $request, DepositRequest $depositRequest): JsonResponse
    {
        $wallet = $this->resolveUserWallet($request->user());

        if ($depositRequest->wallet_id !== $wallet->id) {
            abort(403, 'You are not allowed to modify this deposit request.');
        }

        if (in_array($depositRequest->status, ['approved', 'rejected'], true)) {
            return response()->json([
                'message' => 'This deposit request has already been finalized.',
            ], 409);
        }

        $validated = $request->validated();
        $proofPath = $request->file('proof_file')?->store('deposit-proofs', 'public');

        if ($proofPath === null) {
            return response()->json([
                'message' => 'Proof image upload failed.',
            ], 422);
        }

        DB::transaction(function () use ($depositRequest, $validated, $proofPath) {
            $depositRequest->update([
                'transaction_hash' => $validated['transaction_hash'],
                'proof_path' => $proofPath,
                'status' => 'processing',
                'submitted_at' => now(),
            ]);
        });

        return response()->json([
            'message' => 'Deposit proof submitted. Awaiting admin approval.',
            'data' => $depositRequest->fresh(),
        ]);
    }

    public function storeWithdrawal(StoreWithdrawalRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $wallet = $this->resolveUserWallet($request->user());

        $asset = Asset::query()
            ->where('symbol', $validated['currency'])
            ->first();

        $pendingWithdrawalAmount = (float) $wallet->transactions()
            ->where('type', 'withdrawal')
            ->where('status', 'pending')
            ->sum('amount');

        $availableForWithdrawal = max(0, (float) $wallet->cash_balance - $pendingWithdrawalAmount);

        if ((float) $validated['amount'] > $availableForWithdrawal) {
            return response()->json([
                'message' => 'Insufficient available balance for this withdrawal request.',
                'meta' => [
                    'available_balance' => round($availableForWithdrawal, 2),
                ],
            ], 422);
        }

        $withdrawal = WalletTransaction::query()->create([
            'wallet_id' => $wallet->id,
            'asset_id' => $validated['asset_id'] ?? $asset?->id,
            'type' => 'withdrawal',
            'status' => 'pending',
            'direction' => 'debit',
            'amount' => $validated['amount'],
            'network' => $validated['network'] ?? null,
            'notes' => 'Withdrawal request submitted. Awaiting admin approval.',
            'occurred_at' => now(),
            'metadata' => [
                'destination' => $validated['destination'],
            ],
        ]);

        return response()->json([
            'message' => 'Withdrawal request submitted. Awaiting admin approval.',
            'data' => [
                'id' => $withdrawal->id,
                'type' => $withdrawal->type,
                'status' => $withdrawal->status,
                'direction' => $withdrawal->direction,
                'amount' => (float) $withdrawal->amount,
                'quantity' => $withdrawal->quantity ? (float) $withdrawal->quantity : null,
                'symbol' => $asset?->symbol ?? $validated['currency'],
                'occurred_at' => $withdrawal->occurred_at?->toIso8601String(),
            ],
        ], 201);
    }

    private function resolveUserWallet(User $user): Wallet
    {
        $wallet = $user->wallet()->first();
        $cashBalanceFromUser = (float) $user->balance;
        $holdingBalanceFromUser = (float) $user->holding_balance;
        $profitBalanceFromUser = (float) $user->profit_balance;

        if (! $wallet) {
            return $user->wallet()->create([
                'cash_balance' => $cashBalanceFromUser,
                'investing_balance' => $holdingBalanceFromUser,
                'profit_loss' => $profitBalanceFromUser,
                'currency' => 'USD',
            ]);
        }

        $cashBalance = $this->resolveCashBalance((float) $wallet->cash_balance, $cashBalanceFromUser);
        $holdingBalance = $this->resolveAuthoritativeBalance((float) $wallet->investing_balance, $holdingBalanceFromUser);
        $profitBalance = $this->resolveAuthoritativeBalance((float) $wallet->profit_loss, $profitBalanceFromUser);

        if (
            $this->isDrifted((float) $wallet->cash_balance, $cashBalance) ||
            $this->isDrifted((float) $wallet->investing_balance, $holdingBalance) ||
            $this->isDrifted((float) $wallet->profit_loss, $profitBalance)
        ) {
            $wallet->fill([
                'cash_balance' => $cashBalance,
                'investing_balance' => $holdingBalance,
                'profit_loss' => $profitBalance,
            ]);
            $wallet->save();
            $wallet->refresh();
        }

        if (
            $this->isDrifted((float) $user->balance, $cashBalance) ||
            $this->isDrifted((float) $user->holding_balance, $holdingBalance) ||
            $this->isDrifted((float) $user->profit_balance, $profitBalance)
        ) {
            User::withoutTimestamps(function () use ($user, $cashBalance, $holdingBalance, $profitBalance): void {
                User::query()
                    ->whereKey($user->id)
                    ->update([
                        'balance' => $cashBalance,
                        'holding_balance' => $holdingBalance,
                        'profit_balance' => $profitBalance,
                    ]);
            });
        }

        return $wallet;
    }

    private function resolveAuthoritativeBalance(float $walletValue, float $userValue): float
    {
        $walletIsZero = $this->isEffectivelyZero($walletValue);
        $userIsZero = $this->isEffectivelyZero($userValue);

        if ($walletIsZero && ! $userIsZero) {
            return $userValue;
        }

        if ($userIsZero && ! $walletIsZero) {
            return $walletValue;
        }

        return $walletValue;
    }

    private function resolveCashBalance(float $walletValue, float $userValue): float
    {
        $walletIsZero = $this->isEffectivelyZero($walletValue);
        $userIsZero = $this->isEffectivelyZero($userValue);

        if ($walletIsZero && ! $userIsZero) {
            return $userValue;
        }

        if ($userIsZero && ! $walletIsZero) {
            return $walletValue;
        }

        return max($walletValue, $userValue);
    }

    private function isEffectivelyZero(float $value): bool
    {
        return abs($value) < 0.00000001;
    }

    private function isDrifted(float $current, float $expected): bool
    {
        return abs($current - $expected) >= 0.00000001;
    }
}
