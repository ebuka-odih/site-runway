<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\Position;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user()->load([
            'wallet',
            'positions.asset',
            'watchlistItems.asset',
            'portfolioSnapshots' => fn ($query) => $query->orderBy('recorded_at', 'asc'),
        ]);

        $positions = $user->positions;
        $wallet = $user->wallet;

        $positionsMarketValue = $positions->sum(fn (Position $position) => (float) $position->quantity * (float) $position->asset->current_price
        );
        $positionsCostBasis = $positions->sum(fn (Position $position) => (float) $position->quantity * (float) $position->average_price
        );

        $cashBalance = $wallet instanceof Wallet
            ? (float) $wallet->cash_balance
            : (float) $user->balance;
        $holdingBalance = round($positionsMarketValue, 8);
        $profitBalance = round($positionsMarketValue - $positionsCostBasis, 8);

        $this->syncAccountBalances($user, $cashBalance, $holdingBalance, $profitBalance);

        $portfolioValue = $cashBalance + $holdingBalance;

        $portfolioHistory = $user->portfolioSnapshots
            ->take(-30)
            ->values()
            ->map(fn ($snapshot) => [
                'time' => $snapshot->recorded_at->format('H:i'),
                'value' => (float) $snapshot->value,
                'buying_power' => (float) $snapshot->buying_power,
            ]);

        $portfolioHistory = $portfolioHistory
            ->push([
                'time' => now()->format('H:i:s'),
                'value' => round($portfolioValue, 2),
                'buying_power' => round($cashBalance, 2),
            ])
            ->take(-30)
            ->values();

        $dailyChange = $profitBalance;
        $baseValue = $portfolioValue - $dailyChange;
        $dailyChangePercent = $baseValue > 0 ? ($dailyChange / $baseValue) * 100 : 0;

        $allocationByType = $positions
            ->groupBy(fn (Position $position) => $position->asset->type)
            ->map(function ($group) use ($positionsMarketValue) {
                $bucketValue = $group->sum(fn (Position $position) => (float) $position->quantity * (float) $position->asset->current_price
                );

                return $positionsMarketValue > 0 ? round(($bucketValue / $positionsMarketValue) * 100, 2) : 0;
            });

        $watchlist = $user->watchlistItems
            ->sortBy('sort_order')
            ->values()
            ->map(fn ($item) => [
                'id' => $item->id,
                'symbol' => $item->asset->symbol,
                'name' => $item->asset->name,
                'type' => $item->asset->type,
                'price' => (float) $item->asset->current_price,
                'change_percent' => (float) $item->asset->change_percent,
            ]);

        $topGainers = Asset::query()
            ->orderByDesc('change_percent')
            ->limit(3)
            ->get(['id', 'symbol', 'change_percent'])
            ->map(fn ($asset) => [
                'id' => $asset->id,
                'symbol' => $asset->symbol,
                'change' => (float) $asset->change_percent,
            ]);

        $topLosers = Asset::query()
            ->orderBy('change_percent')
            ->limit(3)
            ->get(['id', 'symbol', 'change_percent'])
            ->map(fn ($asset) => [
                'id' => $asset->id,
                'symbol' => $asset->symbol,
                'change' => (float) $asset->change_percent,
            ]);

        $heatmap = Asset::query()
            ->orderByRaw('ABS(change_percent) DESC')
            ->limit(16)
            ->get(['symbol', 'change_percent'])
            ->map(fn ($asset) => [
                'symbol' => $asset->symbol,
                'change' => (float) $asset->change_percent,
            ]);

        return response()->json([
            'data' => [
                'portfolio' => [
                    'value' => round($portfolioValue, 2),
                    'buying_power' => round($cashBalance, 2),
                    'daily_change' => round($dailyChange, 2),
                    'daily_change_percent' => round($dailyChangePercent, 2),
                    'history' => $portfolioHistory,
                ],
                'analytics' => [
                    'risk_level' => 'Conservative',
                    'diversification_score' => min(100, $positions->count() * 20),
                    'allocation' => $allocationByType,
                    'asset_count' => $positions->count(),
                ],
                'positions' => $positions->map(fn (Position $position) => [
                    'id' => $position->id,
                    'asset_id' => $position->asset_id,
                    'symbol' => $position->asset->symbol,
                    'name' => $position->asset->name,
                    'type' => $position->asset->type,
                    'quantity' => (float) $position->quantity,
                    'average_price' => (float) $position->average_price,
                    'price' => (float) $position->asset->current_price,
                    'change_percent' => (float) $position->asset->change_percent,
                    'market_value' => round((float) $position->quantity * (float) $position->asset->current_price, 2),
                ]),
                'watchlist' => $watchlist,
                'top_gainers' => $topGainers,
                'top_losers' => $topLosers,
                'heatmap' => $heatmap,
            ],
        ]);
    }

    private function syncAccountBalances(User $user, float $cashBalance, float $holdingBalance, float $profitBalance): void
    {
        $wallet = $user->wallet;

        if ($wallet instanceof Wallet) {
            if (
                $this->isDrifted((float) $wallet->cash_balance, $cashBalance) ||
                $this->isDrifted((float) $wallet->investing_balance, $holdingBalance) ||
                $this->isDrifted((float) $wallet->profit_loss, $profitBalance)
            ) {
                $wallet->update([
                    'cash_balance' => $cashBalance,
                    'investing_balance' => $holdingBalance,
                    'profit_loss' => $profitBalance,
                ]);
            }
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
    }

    private function isDrifted(float $current, float $expected): bool
    {
        return abs($current - $expected) >= 0.00000001;
    }
}
