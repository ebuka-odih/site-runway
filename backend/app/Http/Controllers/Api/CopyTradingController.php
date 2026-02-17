<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\FollowTraderRequest;
use App\Http\Requests\UpdateCopyRelationshipRequest;
use App\Models\CopyRelationship;
use App\Models\CopyTrade;
use App\Models\Trader;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class CopyTradingController extends Controller
{
    public function discover(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['sometimes', 'string', 'max:100'],
            'filter' => ['sometimes', Rule::in(['top_return', 'most_copied', 'low_risk', 'rising_stars'])],
        ]);

        $user = $request->user();
        $activeFilter = $validated['filter'] ?? 'top_return';

        $traders = Trader::query()
            ->where('is_active', true)
            ->when(isset($validated['search']), function ($query) use ($validated) {
                $search = $validated['search'];

                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('display_name', 'like', "%{$search}%")
                        ->orWhere('username', 'like', "%{$search}%")
                        ->orWhere('strategy', 'like', "%{$search}%");
                });
            })
            ->get();

        $traders = match ($activeFilter) {
            'most_copied' => $traders->sortByDesc('copiers_count')->values(),
            'low_risk' => $traders->where('risk_score', '<=', 3)->sortByDesc('win_rate')->values(),
            'rising_stars' => $traders->sortByDesc('joined_at')->values(),
            default => $traders->sortByDesc('total_return')->values(),
        };

        $relationships = $user->copyRelationships()->get()->keyBy('trader_id');

        return response()->json([
            'data' => [
                'active_filter' => $activeFilter,
                'traders' => $traders->map(function (Trader $trader) use ($relationships) {
                    $relationship = $relationships->get($trader->id);

                    return [
                        'id' => $trader->id,
                        'name' => $trader->display_name,
                        'username' => $trader->username,
                        'avatar_color' => $trader->avatar_color,
                        'strategy' => $trader->strategy,
                        'copy_fee' => (float) $trader->copy_fee,
                        'return' => (float) $trader->total_return,
                        'win_rate' => (float) $trader->win_rate,
                        'copiers' => (int) $trader->copiers_count,
                        'risk_score' => (int) $trader->risk_score,
                        'is_verified' => (bool) $trader->is_verified,
                        'is_following' => (bool) $relationship && $relationship->status === 'active',
                        'allocation' => $relationship ? (float) $relationship->allocation_amount : null,
                        'pnl' => $relationship ? (float) $relationship->pnl : null,
                        'trades' => $relationship ? (int) $relationship->trades_count : null,
                    ];
                }),
            ],
        ]);
    }

    public function following(Request $request): JsonResponse
    {
        $relationships = $request->user()
            ->copyRelationships()
            ->with('trader')
            ->whereIn('status', ['active', 'paused'])
            ->get();

        $totalAllocated = $relationships->sum(fn (CopyRelationship $relationship) => (float) $relationship->allocation_amount);
        $totalPnl = $relationships->sum(fn (CopyRelationship $relationship) => (float) $relationship->pnl);

        return response()->json([
            'data' => [
                'summary' => [
                    'following_count' => $relationships->count(),
                    'total_allocated' => round($totalAllocated, 2),
                    'total_pnl' => round($totalPnl, 2),
                ],
                'items' => $relationships->map(fn (CopyRelationship $relationship) => [
                    'id' => $relationship->id,
                    'trader_id' => $relationship->trader_id,
                    'trader_name' => $relationship->trader->display_name,
                    'strategy' => $relationship->trader->strategy,
                    'copy_fee' => (float) ($relationship->trader->copy_fee ?? 0),
                    'status' => $relationship->status,
                    'allocation' => (float) $relationship->allocation_amount,
                    'copy_ratio' => (float) $relationship->copy_ratio,
                    'pnl' => (float) $relationship->pnl,
                    'trades' => (int) $relationship->trades_count,
                ]),
            ],
        ]);
    }

    public function history(Request $request): JsonResponse
    {
        $trades = CopyTrade::query()
            ->with(['copyRelationship.trader:id,display_name', 'asset:id,symbol'])
            ->whereHas('copyRelationship', fn ($query) => $query->where('user_id', $request->user()->id))
            ->latest('executed_at')
            ->paginate(20);

        return response()->json($trades);
    }

    public function follow(FollowTraderRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $user = $request->user();
        $trader = Trader::query()->whereKey($validated['trader_id'])->firstOrFail();

        $existingRelationship = CopyRelationship::query()
            ->where('user_id', $user->id)
            ->where('trader_id', $validated['trader_id'])
            ->first();

        $shouldCharge = ! $existingRelationship || $existingRelationship->status !== 'active';
        $copyFee = (float) $trader->copy_fee;
        $wallet = null;

        if ($shouldCharge && $copyFee > 0) {
            $wallet = $this->resolveUserWallet($user);
            if ((float) $wallet->cash_balance < $copyFee) {
                return response()->json([
                    'message' => 'Insufficient balance to cover the copy trader fee.',
                    'available_balance' => (float) $wallet->cash_balance,
                    'required_fee' => $copyFee,
                ], 403);
            }
        }

        $relationship = null;

        DB::transaction(function () use (
            $validated,
            $user,
            $trader,
            $existingRelationship,
            $shouldCharge,
            $copyFee,
            &$wallet,
            &$relationship
        ) {
            if ($shouldCharge && $copyFee > 0) {
                $wallet = Wallet::query()->whereKey($wallet?->id)->lockForUpdate()->first();

                if (! $wallet) {
                    $wallet = $this->resolveUserWallet($user);
                }

                $cashBalance = (float) $wallet->cash_balance;

                if ($cashBalance < $copyFee) {
                    abort(403, 'Insufficient balance to cover the copy trader fee.');
                }

                $wallet->cash_balance = $cashBalance - $copyFee;
                $wallet->save();

                $wallet->transactions()->create([
                    'type' => 'copy_fee',
                    'status' => 'approved',
                    'direction' => 'debit',
                    'amount' => $copyFee,
                    'notes' => 'Copy trader fee charged on activation',
                    'occurred_at' => now(),
                    'metadata' => [
                        'trader_id' => $trader->id,
                        'trader_name' => $trader->display_name,
                    ],
                ]);
            }

            $relationship = CopyRelationship::query()->updateOrCreate(
                [
                    'user_id' => $user->id,
                    'trader_id' => $validated['trader_id'],
                ],
                [
                    'allocation_amount' => $validated['allocation_amount'],
                    'copy_ratio' => $validated['copy_ratio'],
                    'status' => 'active',
                    'started_at' => now(),
                    'ended_at' => null,
                ]
            );

            if (! $existingRelationship || $existingRelationship->status !== 'active') {
                Trader::query()->whereKey($validated['trader_id'])->increment('copiers_count');
            }
        });

        return response()->json([
            'message' => 'Copy trading relationship active.',
            'data' => $relationship->load('trader'),
        ], 201);
    }

    public function update(UpdateCopyRelationshipRequest $request, CopyRelationship $copyRelationship): JsonResponse
    {
        if ($copyRelationship->user_id !== $request->user()->id) {
            abort(403, 'You are not allowed to update this relationship.');
        }

        $payload = $request->validated();

        if (($payload['status'] ?? null) === 'closed') {
            $payload['ended_at'] = now();
        }

        if (($payload['status'] ?? null) === 'active') {
            $payload['ended_at'] = null;
        }

        $copyRelationship->update($payload);

        return response()->json([
            'message' => 'Copy settings updated.',
            'data' => $copyRelationship->fresh('trader'),
        ]);
    }

    public function destroy(Request $request, CopyRelationship $copyRelationship): JsonResponse
    {
        if ($copyRelationship->user_id !== $request->user()->id) {
            abort(403, 'You are not allowed to close this relationship.');
        }

        if ($copyRelationship->status === 'active') {
            $copyRelationship->trader()->decrement('copiers_count');
        }

        $copyRelationship->update([
            'status' => 'closed',
            'ended_at' => now(),
        ]);

        return response()->json([
            'message' => 'Copy relationship closed.',
        ]);
    }

    private function resolveUserWallet(User $user): Wallet
    {
        $wallet = $user->wallet()->first();

        if ($wallet) {
            return $wallet;
        }

        return $user->wallet()->create([
            'cash_balance' => (float) $user->balance,
            'investing_balance' => (float) $user->holding_balance,
            'profit_loss' => (float) $user->profit_balance,
            'currency' => 'USD',
        ]);
    }
}
