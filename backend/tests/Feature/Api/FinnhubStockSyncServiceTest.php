<?php

namespace Tests\Feature\Api;

use App\Events\MarketAssetsUpdated;
use App\Models\Asset;
use App\Services\Finnhub\FinnhubStockSyncService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class FinnhubStockSyncServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_sync_dispatches_market_asset_updates_event_for_successful_quotes(): void
    {
        $this->seed();

        config()->set('services.finnhub.api_key', 'test-key');
        config()->set('services.finnhub.base_url', 'https://finnhub.io/api/v1');

        Event::fake([MarketAssetsUpdated::class]);

        Http::fake(function (Request $request) {
            $symbol = strtoupper((string) ($request->data()['symbol'] ?? ''));

            return match ($symbol) {
                'AAPL' => Http::response([
                    'c' => 189.55,
                    'd' => 1.20,
                    'dp' => 0.64,
                    'pc' => 188.35,
                    't' => 1700000000,
                ], 200),
                'MSFT' => Http::response([
                    'c' => 410.10,
                    'd' => -2.10,
                    'dp' => -0.51,
                    'pc' => 412.20,
                    't' => 1700000000,
                ], 200),
                default => Http::response([], 404),
            };
        });

        /** @var FinnhubStockSyncService $service */
        $service = $this->app->make(FinnhubStockSyncService::class);
        $service->sync(2, ['AAPL', 'MSFT']);

        Event::assertDispatched(MarketAssetsUpdated::class, function (MarketAssetsUpdated $event): bool {
            $symbols = collect($event->assets)->pluck('symbol')->all();

            return $symbols === ['AAPL', 'MSFT'];
        });
    }

    public function test_sync_skips_market_event_when_all_quotes_fail(): void
    {
        Asset::factory()->create([
            'symbol' => 'AAPL',
            'name' => 'Apple Inc.',
            'type' => 'stock',
            'current_price' => 180.00,
            'change_percent' => 0,
            'change_value' => 0,
            'is_active' => true,
        ]);

        config()->set('services.finnhub.api_key', 'test-key');
        config()->set('services.finnhub.base_url', 'https://finnhub.io/api/v1');

        Event::fake([MarketAssetsUpdated::class]);
        Http::fake(fn () => Http::response(['error' => 'rate limited'], 429));

        /** @var FinnhubStockSyncService $service */
        $service = $this->app->make(FinnhubStockSyncService::class);
        $service->sync(1, ['AAPL']);

        Event::assertNotDispatched(MarketAssetsUpdated::class);
    }
}
