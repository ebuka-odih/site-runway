<?php

namespace Tests\Feature\Api;

use App\Models\Asset;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class FinnhubSyncCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_sync_command_fetches_quotes_and_updates_assets(): void
    {
        $this->seed();

        config()->set('services.finnhub.api_key', 'test-key');
        config()->set('services.finnhub.base_url', 'https://finnhub.io/api/v1');

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

        $exitCode = Artisan::call('stocks:sync-finnhub', [
            '--calls' => 2,
            '--symbol' => ['AAPL', 'MSFT'],
        ]);

        $this->assertSame(0, $exitCode);

        $aapl = Asset::query()->where('symbol', 'AAPL')->firstOrFail();
        $msft = Asset::query()->where('symbol', 'MSFT')->firstOrFail();

        $this->assertSame(189.55, (float) $aapl->current_price);
        $this->assertSame(0.64, (float) $aapl->change_percent);

        $this->assertSame(410.10, (float) $msft->current_price);
        $this->assertSame(-0.51, (float) $msft->change_percent);
    }

    public function test_sync_command_fails_when_api_key_is_missing(): void
    {
        config()->set('services.finnhub.api_key', null);

        $exitCode = Artisan::call('stocks:sync-finnhub', [
            '--calls' => 1,
            '--symbol' => ['AAPL'],
        ]);

        $this->assertSame(1, $exitCode);
    }
}
