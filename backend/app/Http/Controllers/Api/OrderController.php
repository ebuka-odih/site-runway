<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrderRequest;
use App\Models\Asset;
use App\Models\PortfolioSnapshot;
use App\Models\Position;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Notifications\UserEventNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $orders = $request->user()
            ->orders()
            ->with('asset:id,symbol,name,type')
            ->latest('placed_at')
            ->paginate(20);

        return response()->json($orders);
    }

    public function store(StoreOrderRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $user = $request->user();
        $asset = Asset::query()->findOrFail($validated['asset_id']);

        $order = DB::transaction(function () use ($user, $asset, $validated) {
            /** @var User $lockedUser */
            $lockedUser = User::query()
                ->whereKey($user->id)
                ->lockForUpdate()
                ->firstOrFail();

            $wallet = $this->resolveTradingWallet($lockedUser);

            $side = $validated['side'];
            $quantity = (float) $validated['quantity'];
            $fillPrice = (float) ($validated['requested_price'] ?? $asset->current_price);
            $totalValue = $quantity * $fillPrice;
            $realizedProfit = 0.0;

            /** @var Position|null $position */
            $position = $lockedUser->positions()->where('asset_id', $asset->id)->lockForUpdate()->first();

            if ($side === 'buy') {
                if ((float) $wallet->cash_balance < $totalValue) {
                    throw ValidationException::withMessages([
                        'quantity' => 'Insufficient buying power for this order.',
                    ]);
                }

                $wallet->cash_balance = (float) $wallet->cash_balance - $totalValue;

                if ($position) {
                    $existingQty = (float) $position->quantity;
                    $existingAvg = (float) $position->average_price;
                    $newQty = $existingQty + $quantity;
                    $newAvg = (($existingQty * $existingAvg) + $totalValue) / max($newQty, 0.00000001);

                    $position->update([
                        'quantity' => $newQty,
                        'average_price' => $newAvg,
                    ]);
                } else {
                    $lockedUser->positions()->create([
                        'asset_id' => $asset->id,
                        'quantity' => $quantity,
                        'average_price' => $fillPrice,
                        'opened_at' => now(),
                    ]);
                }
            }

            if ($side === 'sell') {
                if (! $position || (float) $position->quantity < $quantity) {
                    throw ValidationException::withMessages([
                        'quantity' => 'You do not have enough quantity to sell.',
                    ]);
                }

                $wallet->cash_balance = (float) $wallet->cash_balance + $totalValue;
                $realizedProfit = ($fillPrice - (float) $position->average_price) * $quantity;

                $remainingQty = (float) $position->quantity - $quantity;

                if ($remainingQty <= 0) {
                    $position->delete();
                } else {
                    $position->update(['quantity' => $remainingQty]);
                }
            }

            $order = $lockedUser->orders()->create([
                'asset_id' => $asset->id,
                'side' => $side,
                'order_type' => $validated['order_type'] ?? 'market',
                'status' => 'filled',
                'quantity' => $quantity,
                'requested_price' => $validated['requested_price'] ?? null,
                'average_fill_price' => $fillPrice,
                'total_value' => $totalValue,
                'placed_at' => now(),
                'filled_at' => now(),
                'metadata' => $validated['metadata'] ?? null,
            ]);

            WalletTransaction::query()->create([
                'wallet_id' => $wallet->id,
                'asset_id' => $asset->id,
                'type' => $side === 'buy' ? 'trade_buy' : 'trade_sell',
                'status' => 'approved',
                'direction' => $side === 'buy' ? 'debit' : 'credit',
                'amount' => $totalValue,
                'quantity' => $quantity,
                'notes' => strtoupper($side).' order executed for '.$asset->symbol,
                'occurred_at' => now(),
                'metadata' => [
                    'order_id' => $order->id,
                    'realized_pnl' => $side === 'sell' ? $realizedProfit : 0,
                ],
            ]);

            $wallet = $this->refreshWalletMetrics($wallet);

            PortfolioSnapshot::query()->create([
                'user_id' => $lockedUser->id,
                'value' => (float) $wallet->cash_balance + (float) $wallet->investing_balance,
                'buying_power' => (float) $wallet->cash_balance,
                'recorded_at' => now(),
            ]);

            return $order->load('asset:id,symbol,name,type,current_price,change_percent');
        });

        $orderSymbol = (string) data_get($order, 'asset.symbol', $asset->symbol);
        $orderQuantity = $this->formatQuantity((float) $order->quantity);
        $orderValue = $this->formatCurrency((float) $order->total_value);
        $eventType = $order->side === 'buy' ? 'order.buy_filled' : 'order.sell_filled';
        $title = $order->side === 'buy' ? 'Buy order filled' : 'Sell order filled';
        $message = sprintf(
            'Your %s order for %s %s was filled for %s.',
            strtoupper((string) $order->side),
            $orderQuantity,
            $orderSymbol,
            $orderValue
        );

        $user->notify(new UserEventNotification(
            eventType: $eventType,
            title: $title,
            message: $message,
            metadata: [
                'order_id' => $order->id,
                'side' => $order->side,
                'symbol' => $orderSymbol,
                'quantity' => (float) $order->quantity,
                'total_value' => (float) $order->total_value,
            ],
            actionUrl: '/dashboard/trade',
            sendEmail: false,
        ));

        return response()->json([
            'message' => 'Order executed successfully.',
            'data' => $order,
        ], 201);
    }

    private function refreshWalletMetrics(Wallet $wallet): Wallet
    {
        $wallet->loadMissing('user.positions.asset');

        $investingValue = $wallet->user->positions->sum(fn (Position $position) => (float) $position->quantity * (float) $position->asset->current_price
        );

        $costBasis = $wallet->user->positions->sum(fn (Position $position) => (float) $position->quantity * (float) $position->average_price
        );
        $realizedProfit = $wallet->transactions()
            ->where('type', 'trade_sell')
            ->get(['metadata'])
            ->sum(fn (WalletTransaction $transaction) => (float) data_get($transaction->metadata, 'realized_pnl', 0));

        $tradingProfitBalance = $realizedProfit + ($investingValue - $costBasis);
        $persistedProfitBalance = $this->resolveAuthoritativeBalance((float) $wallet->profit_loss, (float) $wallet->user->profit_balance);
        $fundedProfitBalance = $this->calculateFundedProfitBalance($wallet);
        $copyProfitBalance = round(
            (float) $wallet->user->copyRelationships()->sum('pnl'),
            8
        );
        $legacyFundedProfitBalance = max(0.0, $persistedProfitBalance - $tradingProfitBalance - $copyProfitBalance);

        if ($this->isEffectivelyZero($fundedProfitBalance) && $legacyFundedProfitBalance > 0) {
            $fundedProfitBalance = $legacyFundedProfitBalance;
        }

        $totalProfitBalance = round($tradingProfitBalance + $copyProfitBalance + $fundedProfitBalance, 8);

        $wallet->investing_balance = $investingValue;
        $wallet->profit_loss = $totalProfitBalance;
        $wallet->save();

        return $wallet;
    }

    private function resolveTradingWallet(User $user): Wallet
    {
        $wallet = Wallet::query()
            ->where('user_id', $user->id)
            ->lockForUpdate()
            ->first();

        $cashBalanceFromUser = (float) $user->balance;
        $holdingBalanceFromUser = (float) $user->holding_balance;
        $profitBalanceFromUser = (float) $user->profit_balance;

        if (! $wallet) {
            return $user->wallet()->create([
                'cash_balance' => $cashBalanceFromUser,
                'investing_balance' => $holdingBalanceFromUser,
                'profit_loss' => $profitBalanceFromUser,
                'currency' => 'USD',
            ]);
        }

        $cashBalance = $this->resolveCashBalance((float) $wallet->cash_balance, $cashBalanceFromUser);
        $holdingBalance = $this->resolveAuthoritativeBalance((float) $wallet->investing_balance, $holdingBalanceFromUser);
        $profitBalance = $this->resolveAuthoritativeBalance((float) $wallet->profit_loss, $profitBalanceFromUser);

        if (
            $this->isDrifted((float) $wallet->cash_balance, $cashBalance) ||
            $this->isDrifted((float) $wallet->investing_balance, $holdingBalance) ||
            $this->isDrifted((float) $wallet->profit_loss, $profitBalance)
        ) {
            $wallet->fill([
                'cash_balance' => $cashBalance,
                'investing_balance' => $holdingBalance,
                'profit_loss' => $profitBalance,
            ]);
            $wallet->save();
            $wallet->refresh();
        }

        if (
            $this->isDrifted((float) $user->balance, $cashBalance) ||
            $this->isDrifted((float) $user->holding_balance, $holdingBalance) ||
            $this->isDrifted((float) $user->profit_balance, $profitBalance)
        ) {
            User::withoutTimestamps(function () use ($user, $cashBalance, $holdingBalance, $profitBalance): void {
                User::query()
                    ->whereKey($user->id)
                    ->update([
                        'balance' => $cashBalance,
                        'holding_balance' => $holdingBalance,
                        'profit_balance' => $profitBalance,
                    ]);
            });
        }

        return $wallet;
    }

    private function resolveAuthoritativeBalance(float $walletValue, float $userValue): float
    {
        $walletIsZero = $this->isEffectivelyZero($walletValue);
        $userIsZero = $this->isEffectivelyZero($userValue);

        if ($walletIsZero && ! $userIsZero) {
            return $userValue;
        }

        if ($userIsZero && ! $walletIsZero) {
            return $walletValue;
        }

        return max($walletValue, $userValue);
    }

    private function resolveCashBalance(float $walletValue, float $userValue): float
    {
        $walletIsZero = $this->isEffectivelyZero($walletValue);
        $userIsZero = $this->isEffectivelyZero($userValue);

        if ($walletIsZero && ! $userIsZero) {
            return $userValue;
        }

        if ($userIsZero && ! $walletIsZero) {
            return $walletValue;
        }

        return max($walletValue, $userValue);
    }

    private function isEffectivelyZero(float $value): bool
    {
        return abs($value) < 0.00000001;
    }

    private function isDrifted(float $current, float $expected): bool
    {
        return abs($current - $expected) >= 0.00000001;
    }

    private function calculateFundedProfitBalance(Wallet $wallet): float
    {
        $fundedProfit = $wallet->transactions()
            ->where('type', 'copy_pnl')
            ->where('status', 'approved')
            ->get(['direction', 'amount', 'metadata'])
            ->reduce(function (float $carry, WalletTransaction $transaction): float {
                if (data_get($transaction->metadata, 'funding_target') !== 'profit_balance') {
                    return $carry;
                }

                $amount = (float) $transaction->amount;

                return $transaction->direction === 'debit'
                    ? $carry - $amount
                    : $carry + $amount;
            }, 0.0);

        return round($fundedProfit, 8);
    }

    private function formatQuantity(float $value): string
    {
        return rtrim(rtrim(number_format($value, 8, '.', ''), '0'), '.');
    }

    private function formatCurrency(float $value): string
    {
        return '$'.number_format($value, 2, '.', ',');
    }
}
