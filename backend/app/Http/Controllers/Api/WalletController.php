<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDepositRequest;
use App\Http\Requests\SubmitDepositProofRequest;
use App\Models\Asset;
use App\Models\DepositRequest;
use App\Models\WalletTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WalletController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        $wallet = $request->user()->wallet()->firstOrCreate([], [
            'cash_balance' => 0,
            'investing_balance' => 0,
            'profit_loss' => 0,
            'currency' => 'USD',
        ]);

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
        $wallet = $request->user()->wallet()->firstOrFail();

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
        $wallet = $request->user()->wallet()->firstOrFail();

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
        $wallet = $request->user()->wallet()->firstOrFail();

        if ($depositRequest->wallet_id !== $wallet->id) {
            abort(403, 'You are not allowed to modify this deposit request.');
        }

        if (in_array($depositRequest->status, ['approved', 'rejected'], true)) {
            return response()->json([
                'message' => 'This deposit request has already been finalized.',
            ], 409);
        }

        $validated = $request->validated();

        DB::transaction(function () use ($depositRequest, $wallet, $validated, $request) {
            $depositRequest->update([
                'transaction_hash' => $validated['transaction_hash'],
                'proof_path' => $validated['proof_path'] ?? null,
                'status' => 'processing',
                'submitted_at' => now(),
            ]);

            if ($request->boolean('auto_approve', true)) {
                $depositRequest->update([
                    'status' => 'approved',
                    'processed_at' => now(),
                ]);

                $wallet->cash_balance = (float) $wallet->cash_balance + (float) $depositRequest->amount;
                $wallet->save();

                WalletTransaction::query()->create([
                    'wallet_id' => $wallet->id,
                    'asset_id' => $depositRequest->asset_id,
                    'type' => 'deposit',
                    'status' => 'approved',
                    'direction' => 'credit',
                    'amount' => $depositRequest->amount,
                    'network' => $depositRequest->network,
                    'notes' => 'Deposit approved',
                    'occurred_at' => now(),
                    'metadata' => [
                        'deposit_request_id' => $depositRequest->id,
                        'transaction_hash' => $depositRequest->transaction_hash,
                    ],
                ]);
            }
        });

        return response()->json([
            'message' => 'Deposit proof submitted.',
            'data' => $depositRequest->fresh(),
        ]);
    }
}
