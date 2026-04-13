<?php

namespace Tests\Feature\Api;

use App\Jobs\SyncFinnhubStocksJob;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Bus;
use Tests\TestCase;

class StockScheduleTest extends TestCase
{
    public function test_schedule_run_dispatches_stock_sync_job_when_finnhub_is_configured(): void
    {
        Bus::fake();

        config()->set('services.finnhub.api_key', 'test-key');

        $exitCode = Artisan::call('schedule:run');

        $this->assertSame(0, $exitCode);
        Bus::assertDispatched(SyncFinnhubStocksJob::class);
    }

    public function test_schedule_run_skips_stock_sync_job_when_finnhub_is_not_configured(): void
    {
        Bus::fake();

        config()->set('services.finnhub.api_key', null);

        $exitCode = Artisan::call('schedule:run');

        $this->assertSame(0, $exitCode);
        Bus::assertNotDispatched(SyncFinnhubStocksJob::class);
    }
}
