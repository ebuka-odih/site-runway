<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CopyTradingController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\MarketController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\WalletController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('/auth/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);

        Route::get('/dashboard', [DashboardController::class, 'index']);

        Route::get('/market/assets', [MarketController::class, 'index']);
        Route::get('/market/assets/{asset}', [MarketController::class, 'show']);

        Route::get('/orders', [OrderController::class, 'index']);
        Route::post('/orders', [OrderController::class, 'store']);

        Route::get('/wallet', [WalletController::class, 'summary']);
        Route::get('/wallet/transactions', [WalletController::class, 'transactions']);
        Route::post('/wallet/deposits', [WalletController::class, 'storeDeposit']);
        Route::post('/wallet/deposits/{depositRequest}/proof', [WalletController::class, 'submitProof']);

        Route::get('/copy-trading/discover', [CopyTradingController::class, 'discover']);
        Route::get('/copy-trading/following', [CopyTradingController::class, 'following']);
        Route::get('/copy-trading/history', [CopyTradingController::class, 'history']);
        Route::post('/copy-trading/follow', [CopyTradingController::class, 'follow']);
        Route::patch('/copy-trading/following/{copyRelationship}', [CopyTradingController::class, 'update']);
        Route::delete('/copy-trading/following/{copyRelationship}', [CopyTradingController::class, 'destroy']);

        Route::get('/profile', [ProfileController::class, 'show']);
        Route::patch('/profile', [ProfileController::class, 'update']);
    });
});
