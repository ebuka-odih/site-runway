<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\Position;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class DashboardController extends Controller
{
    private const HISTORY_POINTS = 64;

    private const HISTORY_INTERVAL_MINUTES = 5;

    public function index(Request $request): JsonResponse
    {
        $user = $request->user()->load([
            'wallet',
            'positions.asset',
            'watchlistItems.asset',
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
        $portfolioHistory = $this->buildPortfolioHistory($positions, $cashBalance, $portfolioValue);

        $baseValue = (float) ($portfolioHistory->first()['value'] ?? $portfolioValue);
        $dailyChange = $portfolioValue - $baseValue;
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

    private function buildPortfolioHistory($positions, float $cashBalance, float $currentPortfolioValue): Collection
    {
        $points = self::HISTORY_POINTS;
        $intervalMinutes = self::HISTORY_INTERVAL_MINUTES;
        $now = now();

        $history = collect(range(0, $points - 1))
            ->map(function (int $index) use ($positions, $cashBalance, $points, $intervalMinutes, $now) {
                $progress = $points > 1 ? $index / ($points - 1) : 1.0;

                $holdingsValue = $positions->sum(function (Position $position) use ($progress) {
                    $quantity = (float) $position->quantity;
                    $currentPrice = (float) $position->asset->current_price;

                    if ($quantity <= 0 || $currentPrice <= 0) {
                        return 0.0;
                    }

                    $changePercent = (float) $position->asset->change_percent;
                    $denominator = 1 + ($changePercent / 100);
                    $openingPrice = abs($denominator) < 0.0001 ? $currentPrice : ($currentPrice / $denominator);
                    $basePrice = $openingPrice + (($currentPrice - $openingPrice) * $progress);

                    $phase = deg2rad((float) (crc32((string) $position->asset->symbol) % 360));
                    $waveOne = sin(($progress * M_PI * 4) + $phase) * $currentPrice * 0.0025;
                    $waveTwo = cos(($progress * M_PI * 8) + $phase) * $currentPrice * 0.0015;
                    $simulatedPrice = max(0.00000001, $basePrice + $waveOne + $waveTwo);

                    return $quantity * $simulatedPrice;
                });

                return [
                    'time' => $now->copy()->subMinutes(($points - 1 - $index) * $intervalMinutes)->format('H:i'),
                    'value' => round($cashBalance + $holdingsValue, 2),
                    'buying_power' => round($cashBalance, 2),
                ];
            })
            ->values();

        if ($history->isNotEmpty()) {
            $lastIndex = $history->count() - 1;
            $lastPoint = $history->get($lastIndex);

            $history->put($lastIndex, [
                ...$lastPoint,
                'time' => $now->format('H:i'),
                'value' => round($currentPortfolioValue, 2),
                'buying_power' => round($cashBalance, 2),
            ]);
        }

        return $history;
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
