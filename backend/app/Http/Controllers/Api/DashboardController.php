<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\Position;
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

        $wallet = $user->wallet;
        $positions = $user->positions;

        $investingValue = $positions->sum(fn (Position $position) => (float) $position->quantity * (float) $position->asset->current_price
        );

        $cashBalance = (float) ($wallet?->cash_balance ?? 0);
        $portfolioValue = $cashBalance + $investingValue;

        $portfolioHistory = $user->portfolioSnapshots
            ->take(-30)
            ->values()
            ->map(fn ($snapshot) => [
                'time' => $snapshot->recorded_at->format('H:i'),
                'value' => (float) $snapshot->value,
                'buying_power' => (float) $snapshot->buying_power,
            ]);

        $baseValue = (float) ($user->portfolioSnapshots->last()?->value ?? $portfolioValue);
        $dailyChange = $portfolioValue - $baseValue;
        $dailyChangePercent = $baseValue > 0 ? ($dailyChange / $baseValue) * 100 : 0;

        $allocationByType = $positions
            ->groupBy(fn (Position $position) => $position->asset->type)
            ->map(function ($group) use ($investingValue) {
                $bucketValue = $group->sum(fn (Position $position) => (float) $position->quantity * (float) $position->asset->current_price
                );

                return $investingValue > 0 ? round(($bucketValue / $investingValue) * 100, 2) : 0;
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
}
