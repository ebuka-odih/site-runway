<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrderRequest;
use App\Models\Asset;
use App\Models\PortfolioSnapshot;
use App\Models\Position;
use App\Models\Wallet;
use App\Models\WalletTransaction;
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
            $wallet = $user->wallet()->firstOrCreate([], [
                'cash_balance' => 0,
                'investing_balance' => 0,
                'profit_loss' => 0,
                'currency' => 'USD',
            ]);

            $side = $validated['side'];
            $quantity = (float) $validated['quantity'];
            $fillPrice = (float) ($validated['requested_price'] ?? $asset->current_price);
            $totalValue = $quantity * $fillPrice;

            /** @var Position|null $position */
            $position = $user->positions()->where('asset_id', $asset->id)->lockForUpdate()->first();

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
                    $user->positions()->create([
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

                $remainingQty = (float) $position->quantity - $quantity;

                if ($remainingQty <= 0) {
                    $position->delete();
                } else {
                    $position->update(['quantity' => $remainingQty]);
                }
            }

            $order = $user->orders()->create([
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
                ],
            ]);

            $wallet = $this->refreshWalletMetrics($wallet);

            PortfolioSnapshot::query()->create([
                'user_id' => $user->id,
                'value' => (float) $wallet->cash_balance + (float) $wallet->investing_balance,
                'buying_power' => (float) $wallet->cash_balance,
                'recorded_at' => now(),
            ]);

            return $order->load('asset:id,symbol,name,type,current_price,change_percent');
        });

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

        $wallet->investing_balance = $investingValue;
        $wallet->profit_loss = $investingValue - $costBasis;
        $wallet->save();

        return $wallet;
    }
}
