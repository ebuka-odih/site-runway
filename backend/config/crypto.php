<?php

return [

    /*
    |--------------------------------------------------------------------------
    | FreeCryptoAPI Sync Settings
    |--------------------------------------------------------------------------
    |
    | max_calls_per_run should match your effective provider rate limits
    | when the sync command is scheduled to run every minute.
    |
    */

    'sync' => [
        'max_calls_per_run' => (int) env('FREECRYPTOAPI_SYNC_CALLS_PER_RUN', 8),
    ],

    /*
    |--------------------------------------------------------------------------
    | Popular Crypto Universe
    |--------------------------------------------------------------------------
    |
    | Core watchlist used for quote rotation. The sync command cycles through
    | this list based on call budget and keeps a cursor in cache.
    |
    */

    'popular' => [
        'BTC' => 'Bitcoin',
        'ETH' => 'Ethereum',
        'USDT' => 'Tether',
        'USDC' => 'USD Coin',
        'SOL' => 'Solana',
        'XRP' => 'XRP',
        'BNB' => 'BNB',
        'DOGE' => 'Dogecoin',
        'ADA' => 'Cardano',
        'TRX' => 'Tron',
        'MATIC' => 'Polygon',
        'AVAX' => 'Avalanche',
        'LINK' => 'Chainlink',
    ],

    /*
    |--------------------------------------------------------------------------
    | Symbol Mapping
    |--------------------------------------------------------------------------
    |
    | Optional per-symbol mapping when provider symbols differ from your
    | local asset symbols.
    |
    */

    'symbol_map' => [
        // 'BTC' => 'BTCUSDT',
    ],

];
