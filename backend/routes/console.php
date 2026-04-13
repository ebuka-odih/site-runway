<?php

use App\Jobs\SyncFinnhubStocksJob;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::job(new SyncFinnhubStocksJob, 'market-data', 'default')
    ->everyMinute()
    ->withoutOverlapping()
    ->when(fn (): bool => filled(config('services.finnhub.api_key')));

Schedule::command('crypto:sync-coinpaprika')
    ->everyMinute()
    ->withoutOverlapping()
    ->when(fn (): bool => filled(config('services.coinpaprika.base_url')));

Schedule::command('portfolio:capture-snapshots')
    ->everyMinute()
    ->withoutOverlapping();

Schedule::command('portfolio:compact-snapshots')
    ->dailyAt('03:10')
    ->withoutOverlapping();
