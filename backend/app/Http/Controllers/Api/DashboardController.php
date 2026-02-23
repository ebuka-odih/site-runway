<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\Position;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Services\Portfolio\PortfolioSnapshotService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;

class DashboardController extends Controller
{
    private const MIN_SNAPSHOT_COVERAGE_RATIO = 0.15;
    private const HEATMAP_ITEM_LIMIT = 6;

    /**
     * @var array<string, array{points: int, interval_minutes: int, trend_scale: float, noise_scale: float}>
     */
    private const RANGE_CONFIG = [
        '24h' => ['points' => 96, 'interval_minutes' => 15, 'trend_scale' => 1.0, 'noise_scale' => 0.65],
        '1w' => ['points' => 84, 'interval_minutes' => 120, 'trend_scale' => 1.6, 'noise_scale' => 0.95],
        '1m' => ['points' => 120, 'interval_minutes' => 360, 'trend_scale' => 2.2, 'noise_scale' => 1.2],
        '3m' => ['points' => 132, 'interval_minutes' => 960, 'trend_scale' => 3.0, 'noise_scale' => 1.45],
        '6m' => ['points' => 156, 'interval_minutes' => 1920, 'trend_scale' => 4.2, 'noise_scale' => 1.75],
        '1y' => ['points' => 208, 'interval_minutes' => 2520, 'trend_scale' => 5.5, 'noise_scale' => 2.1],
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
            'copyRelationships',
        ]);

        $positions = $user->positions;
        $wallet = $user->wallet;

        $positionsMarketValue = $positions->sum(fn (Position $position) => (float) $position->quantity * (float) $position->asset->current_price
        );
        $positionsCostBasis = $positions->sum(fn (Position $position) => (float) $position->quantity * (float) $position->average_price
        );
        $realizedProfit = $wallet instanceof Wallet
            ? $wallet->transactions()
                ->where('type', 'trade_sell')
                ->get(['metadata'])
                ->sum(fn (WalletTransaction $transaction) => (float) data_get($transaction->metadata, 'realized_pnl', 0))
            : 0.0;

        $cashBalance = $wallet instanceof Wallet
            ? $this->resolveAuthoritativeBalance((float) $wallet->cash_balance, (float) $user->balance)
            : (float) $user->balance;
        $persistedHoldingBalance = $wallet instanceof Wallet
            ? $this->resolveAuthoritativeBalance((float) $wallet->investing_balance, (float) $user->holding_balance)
            : (float) $user->holding_balance;
        $holdingBalance = max($persistedHoldingBalance, round($positionsMarketValue, 8));
        $tradingProfitBalance = round($realizedProfit + ($positionsMarketValue - $positionsCostBasis), 8);
        $copyProfitBalance = round(
            (float) $user->copyRelationships->sum(fn ($relationship) => (float) $relationship->pnl),
            8
        );
        $persistedProfitBalance = $wallet instanceof Wallet
            ? $this->resolveAuthoritativeBalance((float) $wallet->profit_loss, (float) $user->profit_balance)
            : (float) $user->profit_balance;
        $fundedProfitBalance = $wallet instanceof Wallet
            ? $this->calculateFundedProfitBalance($wallet)
            : 0.0;
        $legacyFundedProfitBalance = max(0.0, $persistedProfitBalance - $tradingProfitBalance - $copyProfitBalance);

        if ($this->isEffectivelyZero($fundedProfitBalance) && $legacyFundedProfitBalance > 0) {
            $fundedProfitBalance = $legacyFundedProfitBalance;
        }

        $profitBalance = round($tradingProfitBalance + $copyProfitBalance + $fundedProfitBalance, 8);
        $investingTotal = round($holdingBalance + $profitBalance + $tradingProfitBalance, 8);
        $profitPercent = $holdingBalance > 0
            ? ($profitBalance / $holdingBalance) * 100
            : 0.0;

        $this->syncAccountBalances($user, $cashBalance, $holdingBalance, $profitBalance);

        $portfolioValue = $cashBalance + $holdingBalance;
        $portfolioSnapshotService->captureFromValues($user, $portfolioValue, $cashBalance);
        $portfolioHistory = $this->buildPortfolioHistory($user, $positions, $cashBalance, $portfolioValue, (string) $range);
        $portfolioHistory = $this->enrichPortfolioHistoryWithInvestingTotals(
            $portfolioHistory,
            $wallet instanceof Wallet ? $wallet : null,
            $holdingBalance,
            $tradingProfitBalance,
            $copyProfitBalance
        );

        $baseInvestingValue = (float) ($portfolioHistory->first()['investing_total'] ?? $investingTotal);
        $dailyChange = $investingTotal - $baseInvestingValue;
        $dailyChangePercent = $this->calculateDailyChangePercent(
            $dailyChange,
            $baseInvestingValue,
            $investingTotal
        );

        $allocationByType = $positions
            ->groupBy(fn (Position $position) => $position->asset->type)
            ->map(function ($group) use ($positionsMarketValue) {
                $bucketValue = $group->sum(fn (Position $position) => (float) $position->quantity * (float) $position->asset->current_price
                );

                return $positionsMarketValue > 0 ? round(($bucketValue / $positionsMarketValue) * 100, 2) : 0;
            });
        $largestAllocationPercent = (float) ($allocationByType->max() ?? 0.0);
        $cashSharePercent = $portfolioValue > 0 ? ($cashBalance / $portfolioValue) * 100 : 100.0;
        $riskLevel = $this->resolveRiskLevel($largestAllocationPercent, $cashSharePercent, $positions->count());

        $watchlist = $user->watchlistItems
            ->sortBy('sort_order')
            ->values()
            ->map(fn ($item) => [
                'id' => $item->id,
                'asset_id' => $item->asset_id,
                'symbol' => $item->asset->symbol,
                'name' => $item->asset->name,
                'type' => $item->asset->type,
                'price' => (float) $item->asset->current_price,
                'change_percent' => (float) $item->asset->change_percent,
            ]);
        $mappedPositions = $positions
            ->map(fn (Position $position) => $this->mapPositionForDashboard($position))
            ->values();

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

        $heatmap = $mappedPositions
            ->map(fn (array $position) => [
                'symbol' => (string) $position['symbol'],
                'change' => (float) $position['day_change_percent'],
            ])
            ->sortByDesc(fn (array $item) => abs((float) $item['change']))
            ->take(self::HEATMAP_ITEM_LIMIT)
            ->values();

        if ($heatmap->isEmpty()) {
            $heatmap = $watchlist
                ->map(fn (array $item) => [
                    'symbol' => (string) $item['symbol'],
                    'change' => (float) $item['change_percent'],
                ])
                ->sortByDesc(fn (array $item) => abs((float) $item['change']))
                ->take(self::HEATMAP_ITEM_LIMIT)
                ->values();
        }

        return response()->json([
            'data' => [
                'portfolio' => [
                    'value' => round($portfolioValue, 2),
                    'buying_power' => round($cashBalance, 2),
                    'holdings_value' => round($holdingBalance, 2),
                    'investing_total' => round($investingTotal, 2),
                    'profit_balance' => round($profitBalance, 2),
                    'profit_percent' => round($profitPercent, 2),
                    'trade_profit' => round($tradingProfitBalance, 2),
                    'asset_profit' => round($tradingProfitBalance, 2),
                    'copy_profit' => round($copyProfitBalance, 2),
                    'funded_profit' => round($fundedProfitBalance, 2),
                    'daily_change' => round($dailyChange, 2),
                    'daily_change_percent' => round($dailyChangePercent, 2),
                    'history' => $portfolioHistory,
                ],
                'analytics' => [
                    'risk_level' => $riskLevel,
                    'diversification_score' => min(100, $positions->count() * 20),
                    'allocation' => $allocationByType,
                    'asset_count' => $positions->count(),
                ],
                'positions' => $mappedPositions,
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

    private function resolveRiskLevel(float $largestAllocationPercent, float $cashSharePercent, int $assetCount): string
    {
        if ($assetCount <= 0) {
            return 'Conservative';
        }

        if ($largestAllocationPercent >= 65 || $cashSharePercent < 15) {
            return 'Aggressive';
        }

        if ($largestAllocationPercent >= 45 || $cashSharePercent < 35) {
            return 'Moderate';
        }

        return 'Conservative';
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
        $requiredTimelineSeconds = max(60, ($points - 1) * $intervalMinutes * 60);
        $firstSnapshotTimestamp = (int) $normalizedTimeline[0]['timestamp'];
        $lastSnapshotTimestamp = (int) $normalizedTimeline[$timelineCount - 1]['timestamp'];
        $coveredSeconds = max(0, $lastSnapshotTimestamp - $firstSnapshotTimestamp);
        $coverageRatio = $coveredSeconds / $requiredTimelineSeconds;

        if ($coverageRatio < self::MIN_SNAPSHOT_COVERAGE_RATIO) {
            return null;
        }

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

                $holdingsValue = max(0, $value - $buyingPower);

                return [
                    'time' => $this->formatHistoryTime($pointTime, $range),
                    'timestamp' => $pointTime->getTimestampMs(),
                    'value' => round($value, 2),
                    'buying_power' => round($buyingPower, 2),
                    'holdings_value' => round($holdingsValue, 2),
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
                'holdings_value' => round(max(0, $currentPortfolioValue - $cashBalance), 2),
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
        $now = now();
        $hasPositions = $positions->isNotEmpty();

        $history = collect(range(0, $points - 1))
            ->map(function (int $index) use ($positions, $cashBalance, $points, $intervalMinutes, $now, $trendScale, $noiseScale, $range, $hasPositions) {
                $progress = $points > 1 ? $index / ($points - 1) : 1.0;
                $timestamp = $now->copy()->subMinutes(($points - 1 - $index) * $intervalMinutes);
                $timeLabel = $this->formatHistoryTime($timestamp, $range);

                if (! $hasPositions) {
                    return [
                        'time' => $timeLabel,
                        'timestamp' => $timestamp->getTimestampMs(),
                        'value' => round($cashBalance, 2),
                        'buying_power' => round($cashBalance, 2),
                        'holdings_value' => 0.0,
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
                    'holdings_value' => round($holdingsValue, 2),
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
                'holdings_value' => round(max(0, $currentPortfolioValue - $cashBalance), 2),
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

    private function enrichPortfolioHistoryWithInvestingTotals(
        Collection $history,
        ?Wallet $wallet,
        float $currentHoldingBalance,
        float $currentTradingProfitBalance,
        float $copyProfitBalance
    ): Collection {
        if ($history->isEmpty()) {
            return $history;
        }

        $fundedProfitTimeline = collect();

        if ($wallet instanceof Wallet) {
            $fundedProfitTimeline = $wallet->transactions()
                ->where('type', 'copy_pnl')
                ->where('status', 'approved')
                ->whereNotNull('occurred_at')
                ->orderBy('occurred_at')
                ->get(['occurred_at', 'direction', 'amount', 'metadata']);
        }

        $timelineIndex = 0;
        $timelineCount = $fundedProfitTimeline->count();
        $runningFundedProfit = 0.0;

        return $history
            ->map(function (array $point) use (
                $currentHoldingBalance,
                $currentTradingProfitBalance,
                $copyProfitBalance,
                $fundedProfitTimeline,
                &$timelineIndex,
                $timelineCount,
                &$runningFundedProfit
            ) {
                $pointTimestampMs = (int) ($point['timestamp'] ?? 0);
                $pointTimestamp = Carbon::createFromTimestampMs($pointTimestampMs);

                while ($timelineIndex < $timelineCount) {
                    $transaction = $fundedProfitTimeline->get($timelineIndex);
                    $occurredAt = $transaction?->occurred_at;

                    if (! $occurredAt || $occurredAt->gt($pointTimestamp)) {
                        break;
                    }

                    if (data_get($transaction->metadata, 'funding_target') === 'profit_balance') {
                        $amount = (float) $transaction->amount;

                        $runningFundedProfit += $transaction->direction === 'debit'
                            ? -$amount
                            : $amount;
                    }

                    $timelineIndex++;
                }

                $pointHoldingValue = (float) ($point['holdings_value'] ?? max(
                    0,
                    ((float) ($point['value'] ?? 0.0)) - ((float) ($point['buying_power'] ?? 0.0))
                ));
                $pointAssetProfit = round(
                    $currentTradingProfitBalance + ($pointHoldingValue - $currentHoldingBalance),
                    8
                );
                $pointFundedProfit = round($runningFundedProfit, 8);
                $pointProfitBalance = round($pointAssetProfit + $copyProfitBalance + $pointFundedProfit, 8);
                $pointInvestingTotal = round($pointHoldingValue + $pointProfitBalance + $pointAssetProfit, 8);

                return [
                    ...$point,
                    'asset_profit' => round($pointAssetProfit, 2),
                    'funded_profit' => round($pointFundedProfit, 2),
                    'profit_balance' => round($pointProfitBalance, 2),
                    'investing_total' => round($pointInvestingTotal, 2),
                ];
            })
            ->values();
    }

    private function calculateFundedProfitBalance(Wallet $wallet): float
    {
        $fundedProfit = $wallet->transactions()
            ->where('type', 'copy_pnl')
            ->where('status', 'approved')
            ->get(['direction', 'amount', 'metadata'])
            ->reduce(function (float $carry, WalletTransaction $transaction): float {
                if (data_get($transaction->metadata, 'funding_target') !== 'profit_balance') {
                    return $carry;
                }

                $amount = (float) $transaction->amount;

                return $transaction->direction === 'debit'
                    ? $carry - $amount
                    : $carry + $amount;
            }, 0.0);

        return round($fundedProfit, 8);
    }

    private function calculateFundedProfitDeltaSince(Wallet $wallet, Carbon $since): float
    {
        $delta = $wallet->transactions()
            ->where('type', 'copy_pnl')
            ->where('status', 'approved')
            ->where('occurred_at', '>=', $since)
            ->get(['direction', 'amount', 'metadata'])
            ->reduce(function (float $carry, WalletTransaction $transaction): float {
                if (data_get($transaction->metadata, 'funding_target') !== 'profit_balance') {
                    return $carry;
                }

                $amount = (float) $transaction->amount;

                return $transaction->direction === 'debit'
                    ? $carry - $amount
                    : $carry + $amount;
            }, 0.0);

        return round($delta, 8);
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

    private function calculateDailyChangePercent(float $dailyChange, float $baseInvestingValue, float $currentInvestingValue): float
    {
        if (abs($dailyChange) < 0.00000001) {
            return 0.0;
        }

        if (abs($baseInvestingValue) >= 0.00000001) {
            return ($dailyChange / $baseInvestingValue) * 100;
        }

        if (abs($currentInvestingValue) >= 0.00000001) {
            return ($dailyChange / $currentInvestingValue) * 100;
        }

        return 0.0;
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

        return max($walletValue, $userValue);
    }

    private function isEffectivelyZero(float $value): bool
    {
        return abs($value) < 0.00000001;
    }

    /**
     * @return array<string, float|string|null>
     */
    private function mapPositionForDashboard(Position $position): array
    {
        $quantity = (float) $position->quantity;
        $averagePrice = (float) $position->average_price;
        $currentPrice = (float) $position->asset->current_price;
        $assetChangeValue = (float) $position->asset->change_value;
        $openedAt = $position->opened_at;
        $isOpenedToday = $openedAt !== null && $openedAt->isToday();
        $previousClosePrice = $currentPrice - $assetChangeValue;

        $referencePrice = $isOpenedToday
            ? max(0.00000001, $averagePrice)
            : max(0.00000001, $previousClosePrice > 0 ? $previousClosePrice : $averagePrice);

        $dayChangeUnit = $currentPrice - $referencePrice;
        $dayChangePercent = $referencePrice > 0
            ? ($dayChangeUnit / $referencePrice) * 100
            : 0.0;

        return [
            'id' => $position->id,
            'asset_id' => $position->asset_id,
            'symbol' => $position->asset->symbol,
            'name' => $position->asset->name,
            'type' => $position->asset->type,
            'quantity' => $quantity,
            'average_price' => $averagePrice,
            'price' => $currentPrice,
            'change_percent' => (float) $position->asset->change_percent,
            'change_value' => $assetChangeValue,
            'day_change_value' => round($quantity * $dayChangeUnit, 2),
            'day_change_percent' => round($dayChangePercent, 2),
            'market_value' => round($quantity * $currentPrice, 2),
            'opened_at' => optional($openedAt)->toIso8601String(),
            'updated_at' => optional($position->updated_at)->toIso8601String(),
        ];
    }
}
