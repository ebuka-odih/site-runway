<?php

namespace App\Services\Finnhub;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class FinnhubClient
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
            throw new RuntimeException('FINNHUB_API_KEY is not configured.');
        }

        $normalizedSymbol = strtoupper(trim($symbol));

        $response = Http::baseUrl($this->baseUrl())
            ->acceptJson()
            ->timeout((int) config('services.finnhub.timeout', 10))
            ->retry(2, 200)
            ->get('/quote', [
                'symbol' => $normalizedSymbol,
                'token' => $token,
            ]);

        if ($response->status() === 429) {
            throw new RuntimeException('Finnhub rate limit reached (HTTP 429).');
        }

        if ($response->failed()) {
            throw new RuntimeException(sprintf(
                'Finnhub quote request failed for %s (HTTP %d).',
                $normalizedSymbol,
                $response->status()
            ));
        }

        $payload = $response->json();

        if (! is_array($payload)) {
            throw new RuntimeException('Finnhub response is not valid JSON object.');
        }

        $currentPrice = (float) ($payload['c'] ?? 0);
        $previousClose = (float) ($payload['pc'] ?? 0);
        $changeValue = (float) ($payload['d'] ?? ($currentPrice - $previousClose));
        $changePercent = (float) ($payload['dp'] ?? ($previousClose > 0
            ? (($currentPrice - $previousClose) / $previousClose) * 100
            : 0
        ));

        return [
            'symbol' => $normalizedSymbol,
            'current_price' => $currentPrice,
            'change_value' => $changeValue,
            'change_percent' => $changePercent,
            'previous_close' => $previousClose,
            'timestamp' => (int) ($payload['t'] ?? 0),
        ];
    }

    private function apiKey(): ?string
    {
        $key = config('services.finnhub.api_key');

        if (! is_string($key)) {
            return null;
        }

        $trimmed = trim($key);

        return $trimmed !== '' ? $trimmed : null;
    }

    private function baseUrl(): string
    {
        return rtrim((string) config('services.finnhub.base_url', 'https://finnhub.io/api/v1'), '/');
    }
}
