<?php

namespace App\Services\FreeCryptoApi;

use App\Models\Asset;
use Illuminate\Support\Facades\Cache;
use RuntimeException;
use Throwable;

class FreeCryptoApiSyncService
{
    public function __construct(private readonly FreeCryptoApiClient $freeCryptoApiClient) {}

    /**
     * @param  array<int, string>  $symbols
     * @return array{
     *   requested_universe: int,
     *   calls_budget: int,
     *   cursor: int,
     *   next_cursor: int,
     *   synced_symbols: array<int, string>,
     *   updated: array<string, array{price: float, change_percent: float, change_value: float}>,
     *   skipped: array<string, string>,
     *   errors: array<string, string>
     * }
     */
    public function sync(int $maxCalls, array $symbols = [], bool $createMissing = true): array
    {
        if (! $this->freeCryptoApiClient->isConfigured()) {
            throw new RuntimeException('FREECRYPTOAPI_API_KEY is missing. Add it to your backend .env before syncing.');
        }

        $universe = $this->resolveUniverse($symbols);

        if ($universe === []) {
            return [
                'requested_universe' => 0,
                'calls_budget' => 0,
                'cursor' => 0,
                'next_cursor' => 0,
                'synced_symbols' => [],
                'updated' => [],
                'skipped' => [],
                'errors' => [],
            ];
        }

        $callsBudget = min(max(1, $maxCalls), count($universe));

        $cursorKey = $this->cursorCacheKey($universe);
        $cursor = (int) Cache::get($cursorKey, 0);
        $symbolsToSync = $this->sliceByCursor($universe, $cursor, $callsBudget);
        $nextCursor = ($cursor + $callsBudget) % count($universe);

        Cache::put($cursorKey, $nextCursor, now()->addDays(7));

        $updated = [];
        $skipped = [];
        $errors = [];

        foreach ($symbolsToSync as $symbol) {
            $providerSymbol = $this->providerSymbol($symbol);

            try {
                $quote = $this->freeCryptoApiClient->quote($providerSymbol);
            } catch (Throwable $exception) {
                $errors[$symbol] = $exception->getMessage();

                continue;
            }

            if (($quote['current_price'] ?? 0) <= 0) {
                $skipped[$symbol] = 'FreeCryptoAPI returned empty/invalid price.';

                continue;
            }

            $asset = Asset::query()->firstWhere('symbol', $symbol);

            if ($asset === null && ! $createMissing) {
                $skipped[$symbol] = 'Asset does not exist locally and --no-create was used.';

                continue;
            }

            if ($asset === null) {
                $asset = new Asset;
                $asset->symbol = $symbol;
                $asset->name = $this->displayName($symbol);
                $asset->type = 'crypto';
            }

            if (blank($asset->name)) {
                $asset->name = $this->displayName($symbol);
            }

            $asset->current_price = round((float) $quote['current_price'], 8);
            $asset->change_percent = round((float) $quote['change_percent'], 4);
            $asset->change_value = round((float) $quote['change_value'], 8);
            $asset->is_active = true;
            $asset->save();

            $updated[$symbol] = [
                'price' => (float) $asset->current_price,
                'change_percent' => (float) $asset->change_percent,
                'change_value' => (float) $asset->change_value,
            ];
        }

        return [
            'requested_universe' => count($universe),
            'calls_budget' => $callsBudget,
            'cursor' => $cursor,
            'next_cursor' => $nextCursor,
            'synced_symbols' => $symbolsToSync,
            'updated' => $updated,
            'skipped' => $skipped,
            'errors' => $errors,
        ];
    }

    /**
     * @param  array<int, string>  $symbols
     * @return array<int, string>
     */
    private function resolveUniverse(array $symbols): array
    {
        $normalized = collect($symbols)
            ->map(fn (string $symbol): string => strtoupper(trim($symbol)))
            ->filter()
            ->unique()
            ->values()
            ->all();

        if ($normalized !== []) {
            return $normalized;
        }

        $popular = config('crypto.popular', []);

        return array_keys(is_array($popular) ? $popular : []);
    }

    /**
     * @param  array<int, string>  $universe
     * @return array<int, string>
     */
    private function sliceByCursor(array $universe, int $cursor, int $size): array
    {
        $count = count($universe);

        $batch = [];

        for ($offset = 0; $offset < $size; $offset++) {
            $batch[] = $universe[($cursor + $offset) % $count];
        }

        return $batch;
    }

    /**
     * @param  array<int, string>  $universe
     */
    private function cursorCacheKey(array $universe): string
    {
        return 'crypto:freecryptoapi:cursor:'.sha1(implode(',', $universe));
    }

    private function displayName(string $symbol): string
    {
        $name = config('crypto.popular.'.strtoupper($symbol));

        return is_string($name) && $name !== '' ? $name : strtoupper($symbol);
    }

    private function providerSymbol(string $symbol): string
    {
        $mapped = config('crypto.symbol_map.'.strtoupper($symbol));

        if (! is_string($mapped)) {
            return strtoupper($symbol);
        }

        $trimmed = strtoupper(trim($mapped));

        return $trimmed !== '' ? $trimmed : strtoupper($symbol);
    }
}
