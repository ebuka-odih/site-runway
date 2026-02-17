<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('stocks:sync-finnhub')
    ->everyMinute()
    ->withoutOverlapping()
    ->when(fn (): bool => filled(config('services.finnhub.api_key')));

Schedule::command('crypto:sync-freecryptoapi')
    ->everyMinute()
    ->withoutOverlapping()
    ->when(fn (): bool => filled(config('services.freecryptoapi.api_key')));

Schedule::command('portfolio:capture-snapshots')
    ->everyMinute()
    ->withoutOverlapping();

Schedule::command('portfolio:compact-snapshots')
    ->dailyAt('03:10')
    ->withoutOverlapping();
