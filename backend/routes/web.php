<?php

use Illuminate\Support\Facades\Route;

Route::any('/', function () {
    return response()->json([
        'name' => 'RunwayAlgo API',
        'status' => 'ok',
        'version' => 'v1',
    ]);
});
