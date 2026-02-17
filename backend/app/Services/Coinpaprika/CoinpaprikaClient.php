<?php

namespace App\Services\Coinpaprika;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class CoinpaprikaClient
{
    public function isConfigured(): bool
    {
        return filled($this->baseUrl());
    }

    /**
     * @return array{
     *   symbol: string,
     *   current_price: float,
     *   change_value: float,
     *   change_percent: float,
     *   previous_close: float,
     *   timestamp: int
     * }
     */
    public function quote(string $symbol): array
    {
        $normalizedSymbol = strtoupper(trim($symbol));
        $coinId = $this->resolveCoinId($normalizedSymbol);

        if ($coinId === null) {
            throw new RuntimeException("Coinpaprika mapping missing for {$normalizedSymbol}.");
        }

        $response = Http::baseUrl($this->baseUrl())
            ->acceptJson()
            ->timeout((int) config('services.coinpaprika.timeout', 10))
            ->retry(2, 200)
            ->get("/tickers/{$coinId}", [
                'quotes' => 'USD',
            ]);

        if ($response->status() === 429) {
            throw new RuntimeException('Coinpaprika rate limit reached (HTTP 429).');
        }

        if ($response->failed()) {
            throw new RuntimeException(sprintf(
                'Coinpaprika quote request failed for %s (HTTP %d).',
                $normalizedSymbol,
                $response->status()
            ));
        }

        $payload = $response->json();

        if (! is_array($payload)) {
            throw new RuntimeException('Coinpaprika response is not a valid JSON object.');
        }

        $quotes = $payload['quotes']['USD'] ?? null;

        if (! is_array($quotes)) {
            throw new RuntimeException('Coinpaprika response is missing USD quotes.');
        }

        $price = (float) ($quotes['price'] ?? 0.0);
        $changePercent = (float) ($quotes['percent_change_24h'] ?? 0.0);
        $changeValue = $price * ($changePercent / 100);
        $previousClose = $price - $changeValue;

        $timestamp = 0;
        $lastUpdated = $payload['last_updated'] ?? null;
        if (is_string($lastUpdated)) {
            $parsed = strtotime($lastUpdated);
            if ($parsed !== false) {
                $timestamp = (int) $parsed;
            }
        }

        return [
            'symbol' => $normalizedSymbol,
            'current_price' => $price,
            'change_value' => $changeValue,
            'change_percent' => $changePercent,
            'previous_close' => $previousClose,
            'timestamp' => $timestamp,
        ];
    }

    private function resolveCoinId(string $symbol): ?string
    {
        $mapped = config('crypto.symbol_map.'.strtoupper($symbol));

        if (is_string($mapped)) {
            $trimmed = trim($mapped);

            if ($trimmed !== '') {
                return $trimmed;
            }
        }

        $map = $this->coinIdMap();

        return $map[strtoupper($symbol)] ?? null;
    }

    /**
     * @return array<string, string>
     */
    private function coinIdMap(): array
    {
        $cacheKey = 'coinpaprika:coin-map';

        /** @var array<string, string> $cached */
        $cached = Cache::remember($cacheKey, now()->addDay(), function (): array {
            $response = Http::baseUrl($this->baseUrl())
                ->acceptJson()
                ->timeout((int) config('services.coinpaprika.timeout', 10))
                ->retry(2, 200)
                ->get('/coins');

            if ($response->failed()) {
                throw new RuntimeException(sprintf(
                    'Coinpaprika coins list request failed (HTTP %d).',
                    $response->status()
                ));
            }

            $payload = $response->json();

            if (! is_array($payload)) {
                throw new RuntimeException('Coinpaprika coins list response is not a valid JSON array.');
            }

            $map = [];

            foreach ($payload as $coin) {
                if (! is_array($coin)) {
                    continue;
                }

                if (! ($coin['is_active'] ?? false)) {
                    continue;
                }

                if (($coin['type'] ?? 'coin') !== 'coin') {
                    continue;
                }

                $symbol = strtoupper((string) ($coin['symbol'] ?? ''));
                $id = (string) ($coin['id'] ?? '');
                $rank = (int) ($coin['rank'] ?? PHP_INT_MAX);

                if ($symbol === '' || $id === '') {
                    continue;
                }

                if (! isset($map[$symbol]) || $rank < $map[$symbol]['rank']) {
                    $map[$symbol] = [
                        'id' => $id,
                        'rank' => $rank,
                    ];
                }
            }

            return collect($map)
                ->map(fn (array $entry): string => $entry['id'])
                ->all();
        });

        return $cached;
    }

    private function baseUrl(): string
    {
        return rtrim((string) config('services.coinpaprika.base_url', 'https://api.coinpaprika.com/v1'), '/');
    }
}
