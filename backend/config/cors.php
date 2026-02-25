<?php

$defaultAllowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'http://localhost:3003',
    'http://127.0.0.1:3003',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://runwayalgo.com',
    'https://www.runwayalgo.com',
    'https://prologezprime.com',
    'https://www.prologezprime.com',
];

$configuredAllowedOrigins = explode(',', (string) env('CORS_ALLOWED_ORIGINS', ''));

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Configure your settings for cross-origin resource sharing so browsers
    | can safely call your API from approved frontend origins.
    |
    */

    'paths' => ['api/*', 'backend/public/api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_values(array_unique(array_filter(array_map(
        static fn (string $origin): string => trim($origin),
        array_merge($defaultAllowedOrigins, $configuredAllowedOrigins)
    )))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
