<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Coinpaprika Sync Settings
    |--------------------------------------------------------------------------
    |
    | max_calls_per_run should match your effective provider rate limits
    | when the sync command is scheduled to run every minute.
    |
    */

    'sync' => [
        'max_calls_per_run' => (int) env('COINPAPRIKA_SYNC_CALLS_PER_RUN', 8),
        'bootstrap_calls' => (int) env('COINPAPRIKA_BOOTSTRAP_CALLS', 40),
        'market_min_assets' => (int) env('CRYPTO_MARKET_MIN_ASSETS', 40),
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
        'BNB' => 'BNB',
        'XRP' => 'XRP',
        'SOL' => 'Solana',
        'DOGE' => 'Dogecoin',
        'ADA' => 'Cardano',
        'TRX' => 'Tron',
        'DOT' => 'Polkadot',
        'MATIC' => 'Polygon',
        'AVAX' => 'Avalanche',
        'LINK' => 'Chainlink',
        'SHIB' => 'Shiba Inu',
        'LTC' => 'Litecoin',
        'BCH' => 'Bitcoin Cash',
        'XLM' => 'Stellar',
        'TON' => 'Toncoin',
        'UNI' => 'Uniswap',
        'ETC' => 'Ethereum Classic',
        'ATOM' => 'Cosmos',
        'NEAR' => 'NEAR Protocol',
        'ICP' => 'Internet Computer',
        'FIL' => 'Filecoin',
        'HBAR' => 'Hedera',
        'APT' => 'Aptos',
        'CRO' => 'Cronos',
        'VET' => 'VeChain',
        'ALGO' => 'Algorand',
        'ARB' => 'Arbitrum',
        'OP' => 'Optimism',
        'INJ' => 'Injective',
        'STX' => 'Stacks',
        'IMX' => 'Immutable',
        'AAVE' => 'Aave',
        'MKR' => 'Maker',
        'EOS' => 'EOS',
        'XTZ' => 'Tezos',
        'THETA' => 'Theta Network',
        'SAND' => 'The Sandbox',
        'MANA' => 'Decentraland',
        'RUNE' => 'THORChain',
        'SEI' => 'Sei',
        'KAS' => 'Kaspa',
    ],

    /*
    |--------------------------------------------------------------------------
    | Symbol Mapping
    |--------------------------------------------------------------------------
    |
    | Optional per-symbol mapping when provider identifiers differ from your
    | local asset symbols. Coinpaprika uses ids like "btc-bitcoin".
    |
    */

    'symbol_map' => [
        // 'BTC' => 'btc-bitcoin',
    ],

];
