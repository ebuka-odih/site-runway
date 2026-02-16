<?php

namespace App\Console\Commands;

use App\Services\Finnhub\FinnhubStockSyncService;
use Illuminate\Console\Command;
use Throwable;

class SyncFinnhubStocksCommand extends Command
{
    /**
     * @var string
     */
    protected $signature = 'stocks:sync-finnhub
                            {--calls= : Max Finnhub quote calls for this run}
                            {--symbol=* : Specific symbols to sync (repeatable)}
                            {--no-create : Update only existing stock assets}';

    /**
     * @var string
     */
    protected $description = 'Sync stock prices from Finnhub into local assets table using a call-budgeted rotation.';

    public function handle(FinnhubStockSyncService $syncService): int
    {
        $defaultCalls = (int) config('stocks.sync.max_calls_per_run', 5);
        $calls = (int) ($this->option('calls') ?? $defaultCalls);

        if ($calls < 1) {
            $this->error('--calls must be at least 1.');

            return self::FAILURE;
        }

        /** @var array<int, string> $symbols */
        $symbols = array_values(array_filter((array) $this->option('symbol')));
        $createMissing = ! (bool) $this->option('no-create');

        try {
            $result = $syncService->sync($calls, $symbols, $createMissing);
        } catch (Throwable $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        }

        $this->info('Finnhub sync completed.');
        $this->line(sprintf(
            'Universe: %d | Calls used: %d | Cursor: %d -> %d',
            $result['requested_universe'],
            $result['calls_budget'],
            $result['cursor'],
            $result['next_cursor']
        ));

        if ($result['synced_symbols'] !== []) {
            $this->line('Symbols synced this run: '.implode(', ', $result['synced_symbols']));
        }

        if ($result['updated'] !== []) {
            $rows = collect($result['updated'])
                ->map(fn (array $quote, string $symbol): array => [
                    $symbol,
                    number_format($quote['price'], 2),
                    number_format($quote['change_percent'], 2).'%',
                    number_format($quote['change_value'], 2),
                ])
                ->values()
                ->all();

            $this->table(['Symbol', 'Price', 'Change %', 'Change'], $rows);
        }

        if ($result['skipped'] !== []) {
            $this->warn('Skipped symbols:');

            foreach ($result['skipped'] as $symbol => $reason) {
                $this->line(" - {$symbol}: {$reason}");
            }
        }

        if ($result['errors'] !== []) {
            $this->error('Symbols with errors:');

            foreach ($result['errors'] as $symbol => $reason) {
                $this->line(" - {$symbol}: {$reason}");
            }

            return self::FAILURE;
        }

        return self::SUCCESS;
    }
}
