<?php

namespace App\Jobs;

use App\Services\Finnhub\FinnhubStockSyncService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SyncFinnhubStocksJob implements ShouldQueue
{
    use Queueable;

    public function __construct() {}

    public function handle(FinnhubStockSyncService $syncService): void
    {
        $calls = max(1, (int) config('stocks.sync.max_calls_per_run', 5));

        $syncService->sync($calls);
    }
}
