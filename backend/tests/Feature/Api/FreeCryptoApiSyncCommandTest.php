<?php

namespace Tests\Feature\Api;

use App\Models\Asset;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class FreeCryptoApiSyncCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_sync_command_fetches_quotes_and_updates_assets(): void
    {
        $this->seed();

        config()->set('services.freecryptoapi.api_key', 'test-key');
        config()->set('services.freecryptoapi.base_url', 'https://freecryptoapi.com/api/v1');
        config()->set('services.freecryptoapi.quote_endpoint', '/getData');

        Http::fake(function (Request $request) {
            $symbol = strtoupper((string) ($request->data()['symbol'] ?? ''));

            return match ($symbol) {
                'BTC' => Http::response([
                    'data' => [
                        'symbol' => 'BTC',
                        'price' => 255.12,
                        'change_percent_24h' => -1.34,
                        'change_24h' => -3.46,
                        'timestamp' => 1700000000,
                    ],
                ], 200),
                'ETH' => Http::response([
                    'data' => [
                        'symbol' => 'ETH',
                        'price' => 401.44,
                        'change_percent_24h' => 2.01,
                        'change_24h' => 7.91,
                        'timestamp' => 1700000000,
                    ],
                ], 200),
                default => Http::response([], 404),
            };
        });

        $exitCode = Artisan::call('crypto:sync-freecryptoapi', [
            '--calls' => 2,
            '--symbol' => ['BTC', 'ETH'],
        ]);

        $this->assertSame(0, $exitCode);

        $btc = Asset::query()->where('symbol', 'BTC')->firstOrFail();
        $eth = Asset::query()->where('symbol', 'ETH')->firstOrFail();

        $this->assertSame(255.12, (float) $btc->current_price);
        $this->assertSame(-1.34, (float) $btc->change_percent);

        $this->assertSame(401.44, (float) $eth->current_price);
        $this->assertSame(2.01, (float) $eth->change_percent);
    }

    public function test_sync_command_fails_when_api_key_is_missing(): void
    {
        config()->set('services.freecryptoapi.api_key', null);

        $exitCode = Artisan::call('crypto:sync-freecryptoapi', [
            '--calls' => 1,
            '--symbol' => ['BTC'],
        ]);

        $this->assertSame(1, $exitCode);
    }
}
