<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CopyTradingController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\MarketController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PublicSettingsController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\WatchlistController;
use App\Http\Controllers\Api\WalletController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('/', function () {
        return response()->json([
            'name' => 'RunwayAlgo API',
            'status' => 'ok',
            'version' => 'v1',
        ]);
    });

    Route::get('/public/settings', [PublicSettingsController::class, 'show']);

    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/verify-otp', [AuthController::class, 'verifyEmailOtp']);
    Route::post('/auth/resend-otp', [AuthController::class, 'resendEmailOtp']);
    Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/auth/reset-password', [AuthController::class, 'resetPasswordWithOtp']);
    Route::post('/auth/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/broadcasting/auth', function (Request $request) {
            return Broadcast::auth($request);
        });

        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);

        Route::get('/dashboard', [DashboardController::class, 'index']);
        Route::get('/watchlist', [WatchlistController::class, 'index']);
        Route::post('/watchlist', [WatchlistController::class, 'store']);
        Route::delete('/watchlist/{watchlistItem}', [WatchlistController::class, 'destroy']);

        Route::get('/market/assets', [MarketController::class, 'index']);
        Route::get('/market/assets/{asset}', [MarketController::class, 'show']);

        Route::get('/orders', [OrderController::class, 'index']);
        Route::post('/orders', [OrderController::class, 'store']);

        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);
        Route::patch('/notifications/{notificationId}/read', [NotificationController::class, 'markRead']);

        Route::get('/wallet', [WalletController::class, 'summary']);
        Route::get('/wallet/transactions', [WalletController::class, 'transactions']);
        Route::post('/wallet/deposits', [WalletController::class, 'storeDeposit']);
        Route::post('/wallet/deposits/{depositRequest}/proof', [WalletController::class, 'submitProof']);
        Route::post('/wallet/withdrawals', [WalletController::class, 'storeWithdrawal']);

        Route::get('/copy-trading/discover', [CopyTradingController::class, 'discover']);
        Route::get('/copy-trading/following', [CopyTradingController::class, 'following']);
        Route::get('/copy-trading/history', [CopyTradingController::class, 'history']);
        Route::post('/copy-trading/follow', [CopyTradingController::class, 'follow']);
        Route::patch('/copy-trading/following/{copyRelationship}', [CopyTradingController::class, 'update']);
        Route::delete('/copy-trading/following/{copyRelationship}', [CopyTradingController::class, 'destroy']);

        Route::get('/profile', [ProfileController::class, 'show']);
        Route::patch('/profile', [ProfileController::class, 'update']);
        Route::post('/profile/kyc/send-otp', [ProfileController::class, 'sendKycOtp']);
        Route::post('/profile/kyc/submit', [ProfileController::class, 'submitKyc']);
        Route::post('/profile/kyc/confirm', [ProfileController::class, 'confirmKyc']);
    });
});
