<?php

namespace Tests\Feature\Api;

use App\Models\Asset;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class CoinpaprikaSyncCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_sync_command_fetches_quotes_and_updates_assets(): void
    {
        $this->seed();

        config()->set('services.coinpaprika.base_url', 'https://api.coinpaprika.com/v1');
        config()->set('crypto.symbol_map.BTC', 'btc-bitcoin');
        config()->set('crypto.symbol_map.ETH', 'eth-ethereum');

        Http::fake(function (Request $request) {
            $url = $request->url();

            return match (true) {
                str_contains($url, '/tickers/btc-bitcoin') => Http::response([
                    'id' => 'btc-bitcoin',
                    'symbol' => 'BTC',
                    'quotes' => [
                        'USD' => [
                            'price' => 255.12,
                            'percent_change_24h' => -1.34,
                        ],
                    ],
                    'last_updated' => '2024-01-10T10:00:00Z',
                ], 200),
                str_contains($url, '/tickers/eth-ethereum') => Http::response([
                    'id' => 'eth-ethereum',
                    'symbol' => 'ETH',
                    'quotes' => [
                        'USD' => [
                            'price' => 401.44,
                            'percent_change_24h' => 2.01,
                        ],
                    ],
                    'last_updated' => '2024-01-10T10:00:00Z',
                ], 200),
                default => Http::response([], 404),
            };
        });

        $exitCode = Artisan::call('crypto:sync-coinpaprika', [
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

    public function test_sync_command_fails_when_base_url_is_missing(): void
    {
        config()->set('services.coinpaprika.base_url', null);

        $exitCode = Artisan::call('crypto:sync-coinpaprika', [
            '--calls' => 1,
            '--symbol' => ['BTC'],
        ]);

        $this->assertSame(1, $exitCode);
    }
}
