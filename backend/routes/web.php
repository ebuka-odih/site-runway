<?php

use Illuminate\Support\Facades\Route;

Route::match(['GET', 'HEAD'], '/', function () {
    return response()->json([
        'name' => 'RunwayAlgo API',
        'status' => 'ok',
        'version' => 'v1',
    ]);
});
