<?php

namespace App\Services\FreeCryptoApi;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class FreeCryptoApiClient
{
    public function isConfigured(): bool
    {
        return filled($this->apiKey());
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
        $token = $this->apiKey();

        if (blank($token)) {
            throw new RuntimeException('FREECRYPTOAPI_API_KEY is not configured.');
        }

        $normalizedSymbol = strtoupper(trim($symbol));

        $response = Http::baseUrl($this->baseUrl())
            ->acceptJson()
            ->timeout((int) config('services.freecryptoapi.timeout', 10))
            ->retry(2, 200)
            ->withToken($token)
            ->get($this->quoteEndpoint(), [
                'symbol' => $normalizedSymbol,
            ]);

        if ($response->status() === 429) {
            throw new RuntimeException('FreeCryptoAPI rate limit reached (HTTP 429).');
        }

        if ($response->failed()) {
            throw new RuntimeException(sprintf(
                'FreeCryptoAPI quote request failed for %s (HTTP %d).',
                $normalizedSymbol,
                $response->status()
            ));
        }

        $payload = $response->json();

        if (! is_array($payload)) {
            throw new RuntimeException('FreeCryptoAPI response is not a valid JSON object.');
        }

        $currentPrice = $this->findFirstNumericValue($payload, [
            'price',
            'current_price',
            'currentPrice',
            'last_price',
            'close',
            'c',
        ]) ?? 0.0;

        $changeValue = $this->findFirstNumericValue($payload, [
            'change_value',
            'changeValue',
            'change_24h',
            'price_change',
            'delta',
            'd',
        ]) ?? 0.0;

        $changePercent = $this->findFirstNumericValue($payload, [
            'change_percent',
            'changePercent',
            'change_percent_24h',
            'change_percentage_24h',
            'price_change_percentage_24h',
            'dp',
        ]);

        $previousClose = $this->findFirstNumericValue($payload, [
            'previous_close',
            'previousClose',
            'prev_close',
            'pc',
        ]) ?? 0.0;

        if ($changePercent === null && $previousClose > 0) {
            $changePercent = (($currentPrice - $previousClose) / $previousClose) * 100;
        }

        if ($previousClose <= 0 && $changePercent !== null) {
            $previousClose = $currentPrice / max(0.00000001, 1 + ($changePercent / 100));
        }

        if (abs($changeValue) <= 0.00000001 && $previousClose > 0) {
            $changeValue = $currentPrice - $previousClose;
        }

        $timestamp = (int) ($this->findFirstNumericValue($payload, [
            'timestamp',
            'time',
            't',
            'updated_at',
            'last_updated',
        ]) ?? 0);

        return [
            'symbol' => $normalizedSymbol,
            'current_price' => (float) $currentPrice,
            'change_value' => (float) $changeValue,
            'change_percent' => (float) ($changePercent ?? 0.0),
            'previous_close' => (float) $previousClose,
            'timestamp' => $timestamp,
        ];
    }

    private function findFirstNumericValue(array $payload, array $keys): ?float
    {
        foreach ($keys as $key) {
            $value = $this->findValueByKeyRecursive($payload, $key);

            if (is_numeric($value)) {
                return (float) $value;
            }
        }

        return null;
    }

    private function findValueByKeyRecursive(array $payload, string $targetKey): mixed
    {
        foreach ($payload as $key => $value) {
            if (is_string($key) && strcasecmp($key, $targetKey) === 0) {
                return $value;
            }

            if (is_array($value)) {
                $nested = $this->findValueByKeyRecursive($value, $targetKey);

                if ($nested !== null) {
                    return $nested;
                }
            }
        }

        return null;
    }

    private function apiKey(): ?string
    {
        $key = config('services.freecryptoapi.api_key');

        if (! is_string($key)) {
            return null;
        }

        $trimmed = trim($key);

        return $trimmed !== '' ? $trimmed : null;
    }

    private function baseUrl(): string
    {
        return rtrim((string) config('services.freecryptoapi.base_url', 'https://freecryptoapi.com/api/v1'), '/');
    }

    private function quoteEndpoint(): string
    {
        $endpoint = trim((string) config('services.freecryptoapi.quote_endpoint', '/getData'));

        if ($endpoint === '') {
            return '/getData';
        }

        return '/'.ltrim($endpoint, '/');
    }
}
