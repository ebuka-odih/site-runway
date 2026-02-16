<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DepositRequest;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $stats = [
            'users_total' => User::query()->count(),
            'users_admin' => User::query()->where('is_admin', true)->count(),
            'wallets_total' => Wallet::query()->count(),
            'pending_transactions' => WalletTransaction::query()->where('status', 'pending')->count(),
            'pending_deposits' => DepositRequest::query()->whereIn('status', ['input', 'payment', 'processing'])->count(),
        ];

        $recentUsers = User::query()
            ->latest('created_at')
            ->limit(8)
            ->get(['id', 'name', 'email', 'is_admin', 'membership_tier', 'created_at'])
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'is_admin' => (bool) $user->is_admin,
                'membership_tier' => $user->membership_tier,
                'created_at' => $user->created_at?->toIso8601String(),
            ]);

        $recentTransactions = WalletTransaction::query()
            ->with(['wallet.user:id,name,email', 'asset:id,symbol'])
            ->latest('occurred_at')
            ->limit(8)
            ->get()
            ->map(fn (WalletTransaction $transaction) => [
                'id' => $transaction->id,
                'type' => $transaction->type,
                'status' => $transaction->status,
                'direction' => $transaction->direction,
                'amount' => (float) $transaction->amount,
                'asset_symbol' => $transaction->asset?->symbol,
                'user_name' => $transaction->wallet?->user?->name,
                'user_email' => $transaction->wallet?->user?->email,
                'occurred_at' => $transaction->occurred_at?->toIso8601String(),
            ]);

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
            'recentUsers' => $recentUsers,
            'recentTransactions' => $recentTransactions,
        ]);
    }
}
