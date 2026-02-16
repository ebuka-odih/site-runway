<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Finnhub Sync Settings
    |--------------------------------------------------------------------------
    |
    | max_calls_per_run should match your effective provider limit per minute
    | when this command is scheduled once per minute.
    |
    */

    'sync' => [
        'max_calls_per_run' => (int) env('FINNHUB_SYNC_CALLS_PER_RUN', 5),
    ],

    /*
    |--------------------------------------------------------------------------
    | Popular Stock Universe
    |--------------------------------------------------------------------------
    |
    | Core watchlist used for quote rotation. The sync command cycles through
    | this list based on call budget and keeps a cursor in cache.
    |
    */

    'popular' => [
        'AAPL' => 'Apple Inc.',
        'MSFT' => 'Microsoft Corporation',
        'NVDA' => 'NVIDIA Corporation',
        'AMZN' => 'Amazon.com, Inc.',
        'GOOGL' => 'Alphabet Inc. Class A',
        'META' => 'Meta Platforms, Inc.',
        'TSLA' => 'Tesla, Inc.',
        'BRK.B' => 'Berkshire Hathaway Inc. Class B',
        'JPM' => 'JPMorgan Chase & Co.',
        'V' => 'Visa Inc.',
        'MA' => 'Mastercard Incorporated',
        'UNH' => 'UnitedHealth Group Incorporated',
        'HD' => 'The Home Depot, Inc.',
        'PG' => 'The Procter & Gamble Company',
        'XOM' => 'Exxon Mobil Corporation',
        'JNJ' => 'Johnson & Johnson',
        'COST' => 'Costco Wholesale Corporation',
        'ABBV' => 'AbbVie Inc.',
        'BAC' => 'Bank of America Corporation',
        'KO' => 'The Coca-Cola Company',
        'PEP' => 'PepsiCo, Inc.',
        'AVGO' => 'Broadcom Inc.',
        'ORCL' => 'Oracle Corporation',
        'CRM' => 'Salesforce, Inc.',
        'NFLX' => 'Netflix, Inc.',
        'AMD' => 'Advanced Micro Devices, Inc.',
        'QCOM' => 'QUALCOMM Incorporated',
        'INTC' => 'Intel Corporation',
        'CSCO' => 'Cisco Systems, Inc.',
        'TMO' => 'Thermo Fisher Scientific Inc.',
        'MCD' => 'McDonald\'s Corporation',
        'WMT' => 'Walmart Inc.',
        'DIS' => 'The Walt Disney Company',
        'LIN' => 'Linde plc',
        'NKE' => 'NIKE, Inc.',
        'TXN' => 'Texas Instruments Incorporated',
        'PM' => 'Philip Morris International Inc.',
        'HON' => 'Honeywell International Inc.',
        'IBM' => 'International Business Machines Corporation',
        'AMAT' => 'Applied Materials, Inc.',
        'GE' => 'GE Aerospace',
        'GS' => 'The Goldman Sachs Group, Inc.',
        'CAT' => 'Caterpillar Inc.',
        'RTX' => 'RTX Corporation',
        'SPGI' => 'S&P Global Inc.',
        'BKNG' => 'Booking Holdings Inc.',
        'NOW' => 'ServiceNow, Inc.',
        'ADBE' => 'Adobe Inc.',
        'PLTR' => 'Palantir Technologies Inc.',
        'PANW' => 'Palo Alto Networks, Inc.',
        'MU' => 'Micron Technology, Inc.',
        'SHOP' => 'Shopify Inc.',
        'UBER' => 'Uber Technologies, Inc.',
        'PYPL' => 'PayPal Holdings, Inc.',
        'ABNB' => 'Airbnb, Inc.',
        'SNOW' => 'Snowflake Inc.',
        'SQ' => 'Block, Inc.',
        'SOFI' => 'SoFi Technologies, Inc.',
        'COIN' => 'Coinbase Global, Inc.',
        'F' => 'Ford Motor Company',
        'GM' => 'General Motors Company',
        'BA' => 'The Boeing Company',
        'PFE' => 'Pfizer Inc.',
        'MRK' => 'Merck & Co., Inc.',
        'CVX' => 'Chevron Corporation',
        'ADP' => 'Automatic Data Processing, Inc.',
        'LOW' => 'Lowe\'s Companies, Inc.',
        'T' => 'AT&T Inc.',
        'VZ' => 'Verizon Communications Inc.',
    ],

];
