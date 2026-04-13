<?php

namespace Tests\Feature\Api;

use App\Jobs\SyncFinnhubStocksJob;
use App\Models\Asset;
use App\Services\Finnhub\FinnhubStockSyncService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class SyncFinnhubStocksJobTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Mockery::close();

        parent::tearDown();
    }

    public function test_job_uses_bootstrap_call_budget_when_local_stock_catalog_is_too_small(): void
    {
        config()->set('stocks.sync.max_calls_per_run', 5);
        config()->set('stocks.sync.bootstrap_calls', 25);
        config()->set('stocks.sync.market_min_assets', 40);

        Asset::factory()->create([
            'symbol' => 'AAPL',
            'name' => 'Apple Inc.',
            'type' => 'stock',
            'current_price' => 200,
            'change_percent' => 1,
            'change_value' => 2,
            'is_active' => true,
        ]);

        $service = Mockery::mock(FinnhubStockSyncService::class);
        $service->shouldReceive('sync')
            ->once()
            ->with(25);

        $this->app->instance(FinnhubStockSyncService::class, $service);

        $this->app->call([new SyncFinnhubStocksJob, 'handle']);
        $this->addToAssertionCount(1);
    }

    public function test_job_uses_standard_call_budget_when_local_stock_catalog_is_healthy(): void
    {
        config()->set('stocks.sync.max_calls_per_run', 5);
        config()->set('stocks.sync.bootstrap_calls', 25);
        config()->set('stocks.sync.market_min_assets', 3);

        foreach (['AAPL', 'MSFT', 'NVDA'] as $symbol) {
            Asset::factory()->create([
                'symbol' => $symbol,
                'name' => $symbol,
                'type' => 'stock',
                'current_price' => 200,
                'change_percent' => 1,
                'change_value' => 2,
                'is_active' => true,
            ]);
        }

        $service = Mockery::mock(FinnhubStockSyncService::class);
        $service->shouldReceive('sync')
            ->once()
            ->with(5);

        $this->app->instance(FinnhubStockSyncService::class, $service);

        $this->app->call([new SyncFinnhubStocksJob, 'handle']);
        $this->addToAssertionCount(1);
    }
}
