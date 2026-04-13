<?php

namespace App\Jobs;

use App\Models\Asset;
use App\Services\Finnhub\FinnhubStockSyncService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SyncFinnhubStocksJob implements ShouldQueue
{
    use Queueable;

    public function __construct() {}

    public function handle(FinnhubStockSyncService $syncService): void
    {
        $calls = $this->resolveCallsForRun();

        $syncService->sync($calls);
    }

    private function resolveCallsForRun(): int
    {
        $defaultCalls = max(1, (int) config('stocks.sync.max_calls_per_run', 5));
        $bootstrapCalls = max($defaultCalls, (int) config('stocks.sync.bootstrap_calls', 25));
        $universeCount = count($this->stockUniverse());
        $targetCount = min(
            max(1, (int) config('stocks.sync.market_min_assets', 40)),
            max(1, $universeCount),
        );

        if ($this->currentTrackedAssetCount() < $targetCount) {
            return min($bootstrapCalls, max(1, $universeCount));
        }

        return min($defaultCalls, max(1, $universeCount));
    }

    /**
     * @return array<int, string>
     */
    private function stockUniverse(): array
    {
        $popular = config('stocks.popular', []);

        return array_keys(is_array($popular) ? $popular : []);
    }

    private function currentTrackedAssetCount(): int
    {
        $universe = $this->stockUniverse();

        if ($universe === []) {
            return 0;
        }

        return (int) Asset::query()
            ->whereIn('symbol', $universe)
            ->whereIn('type', ['stock', 'share', 'etf'])
            ->count();
    }
}
