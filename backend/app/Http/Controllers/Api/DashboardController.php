<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\Position;
use App\Models\User;
use App\Models\Wallet;
use App\Services\Portfolio\PortfolioSnapshotService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;

class DashboardController extends Controller
{
    /**
     * @var array<string, array{points: int, interval_minutes: int, trend_scale: float, noise_scale: float, cash_noise_scale: float}>
     */
    private const RANGE_CONFIG = [
        '24h' => ['points' => 96, 'interval_minutes' => 15, 'trend_scale' => 1.0, 'noise_scale' => 0.65, 'cash_noise_scale' => 0.0007],
        '1w' => ['points' => 84, 'interval_minutes' => 120, 'trend_scale' => 1.6, 'noise_scale' => 0.95, 'cash_noise_scale' => 0.0010],
        '1m' => ['points' => 120, 'interval_minutes' => 360, 'trend_scale' => 2.2, 'noise_scale' => 1.2, 'cash_noise_scale' => 0.0014],
        '3m' => ['points' => 132, 'interval_minutes' => 960, 'trend_scale' => 3.0, 'noise_scale' => 1.45, 'cash_noise_scale' => 0.0018],
        '6m' => ['points' => 156, 'interval_minutes' => 1920, 'trend_scale' => 4.2, 'noise_scale' => 1.75, 'cash_noise_scale' => 0.0021],
        '1y' => ['points' => 208, 'interval_minutes' => 2520, 'trend_scale' => 5.5, 'noise_scale' => 2.1, 'cash_noise_scale' => 0.0025],
    ];

    public function index(Request $request, PortfolioSnapshotService $portfolioSnapshotService): JsonResponse
    {
        $validated = $request->validate([
            'range' => ['sometimes', 'string', Rule::in(array_keys(self::RANGE_CONFIG))],
        ]);

        $range = $validated['range'] ?? '24h';

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
        $portfolioSnapshotService->captureFromValues($user, $portfolioValue, $cashBalance);
        $portfolioHistory = $this->buildPortfolioHistory($user, $positions, $cashBalance, $portfolioValue, (string) $range);

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

    private function buildPortfolioHistory(User $user, $positions, float $cashBalance, float $currentPortfolioValue, string $range): Collection
    {
        $snapshotHistory = $this->buildSnapshotBackedPortfolioHistory($user, $cashBalance, $currentPortfolioValue, $range);

        if ($snapshotHistory !== null) {
            return $snapshotHistory;
        }

        return $this->buildSimulatedPortfolioHistory($positions, $cashBalance, $currentPortfolioValue, $range);
    }

    private function buildSnapshotBackedPortfolioHistory(User $user, float $cashBalance, float $currentPortfolioValue, string $range): ?Collection
    {
        $config = self::RANGE_CONFIG[$range] ?? self::RANGE_CONFIG['24h'];
        $points = $config['points'];
        $intervalMinutes = $config['interval_minutes'];
        $now = now();
        $start = $now->copy()->subMinutes(($points - 1) * $intervalMinutes);

        $anchor = $user->portfolioSnapshots()
            ->where('recorded_at', '<', $start)
            ->latest('recorded_at')
            ->first(['value', 'buying_power', 'recorded_at']);

        $snapshotsInRange = $user->portfolioSnapshots()
            ->whereBetween('recorded_at', [$start, $now])
            ->orderBy('recorded_at')
            ->get(['value', 'buying_power', 'recorded_at']);

        $timeline = collect();

        if ($anchor !== null) {
            $timeline->push($anchor);
        }

        $timeline = $timeline->concat($snapshotsInRange)->values();

        if ($timeline->count() < 2) {
            return null;
        }

        $normalizedTimeline = $timeline->map(fn ($snapshot) => [
            'timestamp' => $snapshot->recorded_at->getTimestamp(),
            'value' => (float) $snapshot->value,
            'buying_power' => (float) $snapshot->buying_power,
        ])->values()->all();

        $timelineCount = count($normalizedTimeline);
        $cursor = 0;

        $history = collect(range(0, $points - 1))
            ->map(function (int $index) use (&$cursor, $timelineCount, $normalizedTimeline, $intervalMinutes, $range, $start) {
                $pointTime = $start->copy()->addMinutes($index * $intervalMinutes);
                $targetTimestamp = $pointTime->getTimestamp();

                while (
                    $cursor < $timelineCount - 1 &&
                    (int) $normalizedTimeline[$cursor + 1]['timestamp'] <= $targetTimestamp
                ) {
                    $cursor++;
                }

                $left = $normalizedTimeline[$cursor];
                $right = $cursor < $timelineCount - 1 ? $normalizedTimeline[$cursor + 1] : null;

                $value = (float) $left['value'];
                $buyingPower = (float) $left['buying_power'];

                if ($right !== null && $targetTimestamp > (int) $left['timestamp']) {
                    $span = max(1, (int) $right['timestamp'] - (int) $left['timestamp']);
                    $ratio = ($targetTimestamp - (int) $left['timestamp']) / $span;

                    $value = (float) $left['value'] + (((float) $right['value'] - (float) $left['value']) * $ratio);
                    $buyingPower = (float) $left['buying_power'] + (((float) $right['buying_power'] - (float) $left['buying_power']) * $ratio);
                }

                return [
                    'time' => $this->formatHistoryTime($pointTime, $range),
                    'timestamp' => $pointTime->getTimestampMs(),
                    'value' => round($value, 2),
                    'buying_power' => round($buyingPower, 2),
                ];
            })
            ->values();

        if ($history->isNotEmpty()) {
            $lastIndex = $history->count() - 1;
            $lastPoint = $history->get($lastIndex);

            $history->put($lastIndex, [
                ...$lastPoint,
                'time' => $this->formatHistoryTime($now, $range),
                'timestamp' => $now->getTimestampMs(),
                'value' => round($currentPortfolioValue, 2),
                'buying_power' => round($cashBalance, 2),
            ]);
        }

        return $history;
    }

    private function buildSimulatedPortfolioHistory($positions, float $cashBalance, float $currentPortfolioValue, string $range): Collection
    {
        $config = self::RANGE_CONFIG[$range] ?? self::RANGE_CONFIG['24h'];
        $points = $config['points'];
        $intervalMinutes = $config['interval_minutes'];
        $trendScale = $config['trend_scale'];
        $noiseScale = $config['noise_scale'];
        $cashNoiseScale = $config['cash_noise_scale'];
        $now = now();
        $hasPositions = $positions->isNotEmpty();

        $history = collect(range(0, $points - 1))
            ->map(function (int $index) use ($positions, $cashBalance, $points, $intervalMinutes, $now, $trendScale, $noiseScale, $cashNoiseScale, $range, $hasPositions) {
                $progress = $points > 1 ? $index / ($points - 1) : 1.0;
                $timestamp = $now->copy()->subMinutes(($points - 1 - $index) * $intervalMinutes);
                $timeLabel = $this->formatHistoryTime($timestamp, $range);

                if (! $hasPositions) {
                    $phase = deg2rad((float) (crc32($range) % 360));
                    $waveOne = sin(($progress * M_PI * 2.8) + $phase) * 0.65;
                    $waveTwo = cos(($progress * M_PI * 7.5) + ($phase / 2)) * 0.35;
                    $envelope = 1 - (($progress - 0.5) * ($progress - 0.5));
                    $drift = sin(($progress * M_PI * 1.1) + $phase) * 0.0004 * $trendScale;
                    $noise = ($waveOne + $waveTwo) * $cashNoiseScale * $envelope;
                    $portfolioValue = max(0.01, $cashBalance * (1 + $drift + $noise));

                    return [
                        'time' => $timeLabel,
                        'timestamp' => $timestamp->getTimestampMs(),
                        'value' => round($portfolioValue, 2),
                        'buying_power' => round($cashBalance, 2),
                    ];
                }

                $holdingsValue = $positions->sum(function (Position $position) use ($progress, $trendScale, $noiseScale, $range) {
                    $quantity = (float) $position->quantity;
                    $currentPrice = (float) $position->asset->current_price;

                    if ($quantity <= 0 || $currentPrice <= 0) {
                        return 0.0;
                    }

                    $changePercent = (float) $position->asset->change_percent;
                    $volatility = max(abs($changePercent) / 100, 0.0025);
                    $drift = ($changePercent / 100) * 0.45 * $trendScale;
                    $startPrice = $currentPrice / max(0.1, 1 + $drift);
                    $trendPrice = $startPrice + (($currentPrice - $startPrice) * $progress);

                    $seed = crc32((string) $position->asset->symbol.$range);
                    $phase = deg2rad((float) ($seed % 360));
                    $waveOne = sin(($progress * M_PI * 3.2) + $phase);
                    $waveTwo = cos(($progress * M_PI * 8.4) + ($phase / 2));
                    $waveThree = sin(($progress * M_PI * 17.8) + ($phase / 3));
                    $noiseMix = ($waveOne * 0.55) + ($waveTwo * 0.3) + ($waveThree * 0.15);
                    $taper = 1 - pow($progress, 1.35);
                    $noiseAmplitude = $currentPrice * $volatility * $noiseScale;
                    $simulatedPrice = max(0.00000001, $trendPrice + ($noiseMix * $noiseAmplitude * $taper));

                    return $quantity * $simulatedPrice;
                });

                return [
                    'time' => $timeLabel,
                    'timestamp' => $timestamp->getTimestampMs(),
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
                'time' => $this->formatHistoryTime($now, $range),
                'timestamp' => $now->getTimestampMs(),
                'value' => round($currentPortfolioValue, 2),
                'buying_power' => round($cashBalance, 2),
            ]);
        }

        return $history;
    }

    private function formatHistoryTime(Carbon $timestamp, string $range): string
    {
        return match ($range) {
            '24h', '1w' => $timestamp->format('H:i'),
            '1m', '3m' => $timestamp->format('M j'),
            '6m', '1y' => $timestamp->format('M Y'),
            default => $timestamp->format('H:i'),
        };
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
