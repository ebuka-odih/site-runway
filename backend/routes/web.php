<?php

use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\CopyTraderController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\KycVerificationController;
use App\Http\Controllers\Admin\PaymentMethodController;
use App\Http\Controllers\Admin\SettingController;
use App\Http\Controllers\Admin\TransactionController;
use App\Http\Controllers\Admin\UserController;
use App\Support\SiteSettings;
use Illuminate\Support\Facades\Route;

Route::any('/', function () {
    $brandName = (string) (SiteSettings::get()['brand_name'] ?? SiteSettings::defaults()['brand_name']);

    return response()->json([
        'name' => "{$brandName} API",
        'status' => 'ok',
        'version' => 'v1',
    ]);
});

Route::get('/login', [AuthController::class, 'create']);
Route::post('/login', [AuthController::class, 'store']);

Route::prefix('admin')->name('admin.')->group(function () {
    Route::get('/login', [AuthController::class, 'create'])->name('login');
    Route::post('/login', [AuthController::class, 'store'])->name('login.store');

    Route::middleware('admin')->group(function () {
        Route::get('/', [DashboardController::class, 'index'])->name('dashboard');
        Route::post('/logout', [AuthController::class, 'destroy'])->name('logout');

        Route::get('/transactions', [TransactionController::class, 'index'])->name('transactions.index');
        Route::get('/transactions/deposits/{depositRequest}/receipt', [TransactionController::class, 'showDepositReceipt'])->name('transactions.deposits.receipt');
        Route::post('/transactions/deposits/{depositRequest}/approve', [TransactionController::class, 'approveDepositRequest'])->name('transactions.deposits.approve');
        Route::post('/transactions/deposits/{depositRequest}/decline', [TransactionController::class, 'declineDepositRequest'])->name('transactions.deposits.decline');
        Route::delete('/transactions/deposits/{depositRequest}', [TransactionController::class, 'destroyDepositRequest'])->name('transactions.deposits.destroy');
        Route::post('/transactions/withdrawals/{walletTransaction}/approve', [TransactionController::class, 'approveWithdrawalTransaction'])->name('transactions.withdrawals.approve');
        Route::post('/transactions/withdrawals/{walletTransaction}/decline', [TransactionController::class, 'declineWithdrawalTransaction'])->name('transactions.withdrawals.decline');
        Route::delete('/transactions/withdrawals/{walletTransaction}', [TransactionController::class, 'destroyWithdrawalTransaction'])->name('transactions.withdrawals.destroy');
        Route::get('/payment-methods', [PaymentMethodController::class, 'index'])->name('payment-methods.index');
        Route::get('/payment-methods/create', [PaymentMethodController::class, 'create'])->name('payment-methods.create');
        Route::post('/payment-methods', [PaymentMethodController::class, 'store'])->name('payment-methods.store');
        Route::get('/payment-methods/{paymentMethod}/edit', [PaymentMethodController::class, 'edit'])->name('payment-methods.edit');
        Route::put('/payment-methods/{paymentMethod}', [PaymentMethodController::class, 'update'])->name('payment-methods.update');
        Route::delete('/payment-methods/{paymentMethod}', [PaymentMethodController::class, 'destroy'])->name('payment-methods.destroy');

        Route::get('/copy-traders', [CopyTraderController::class, 'index'])->name('copy-traders.index');
        Route::get('/copy-traders/create', [CopyTraderController::class, 'create'])->name('copy-traders.create');
        Route::post('/copy-traders', [CopyTraderController::class, 'store'])->name('copy-traders.store');
        Route::get('/copy-traders/{trader}/edit', [CopyTraderController::class, 'edit'])->name('copy-traders.edit');
        Route::put('/copy-traders/{trader}', [CopyTraderController::class, 'update'])->name('copy-traders.update');
        Route::post('/copy-traders/{trader}/trades', [CopyTraderController::class, 'storeTrade'])->name('copy-traders.trades.store');
        Route::put('/copy-traders/{trader}/trades/{copyTrade}', [CopyTraderController::class, 'updateTrade'])->name('copy-traders.trades.update');
        Route::delete('/copy-traders/{trader}', [CopyTraderController::class, 'destroy'])->name('copy-traders.destroy');

        Route::get('/kyc', [KycVerificationController::class, 'index'])->name('kyc.index');
        Route::get('/kyc/{kycSubmission}/document', [KycVerificationController::class, 'showDocument'])->name('kyc.document');
        Route::post('/kyc/{kycSubmission}/approve', [KycVerificationController::class, 'approve'])->name('kyc.approve');
        Route::post('/kyc/{kycSubmission}/decline', [KycVerificationController::class, 'decline'])->name('kyc.decline');

        Route::get('/settings', [SettingController::class, 'index'])->name('settings.index');
        Route::post('/settings', [SettingController::class, 'update'])->name('settings.update');
        Route::post('/settings/security', [SettingController::class, 'updateSecurity'])->name('settings.security');
        Route::get('/settings/export/database', [SettingController::class, 'exportSiteDatabaseDetails'])->name('settings.export.database');
        Route::get('/settings/export/users', [SettingController::class, 'exportUserDatabaseDetails'])->name('settings.export.users');

        Route::get('/users', [UserController::class, 'index'])->name('users.index');
        Route::get('/users/create', [UserController::class, 'create'])->name('users.create');
        Route::post('/users', [UserController::class, 'store'])->name('users.store');
        Route::get('/users/{user}/edit', [UserController::class, 'edit'])->name('users.edit');
        Route::put('/users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::post('/users/{user}/fund', [UserController::class, 'fund'])->name('users.fund');
        Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
    });
});
