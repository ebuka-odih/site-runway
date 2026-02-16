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
