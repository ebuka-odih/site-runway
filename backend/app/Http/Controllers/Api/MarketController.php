<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\Order;
use App\Services\Finnhub\FinnhubStockSyncService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Throwable;

class MarketController extends Controller
{
    public function index(Request $request, FinnhubStockSyncService $stockSyncService): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['sometimes', Rule::in(['stock', 'crypto', 'etf', 'share'])],
            'search' => ['sometimes', 'string', 'max:100'],
        ]);

        $this->syncStockQuotesIfDue($validated['type'] ?? null, $stockSyncService);

        $assets = Asset::query()
            ->when(isset($validated['type']), fn ($query) => $query->where('type', $validated['type']))
            ->when(isset($validated['search']), function ($query) use ($validated) {
                $search = $validated['search'];

                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('symbol', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%");
                });
            })
            ->orderBy('symbol')
            ->get();

        return response()->json([
            'data' => $assets->map(fn ($asset) => [
                'id' => $asset->id,
                'symbol' => $asset->symbol,
                'name' => $asset->name,
                'type' => $asset->type,
                'price' => (float) $asset->current_price,
                'change_percent' => (float) $asset->change_percent,
                'change_value' => (float) $asset->change_value,
                'is_positive' => (float) $asset->change_percent >= 0,
            ]),
        ]);
    }

    public function show(Asset $asset): JsonResponse
    {
        $relatedAssets = Asset::query()
            ->where('type', $asset->type)
            ->whereKeyNot($asset->id)
            ->limit(4)
            ->get(['id', 'symbol', 'name']);

        $recentTrades = Order::query()
            ->with('user:id,name')
            ->where('asset_id', $asset->id)
            ->where('status', 'filled')
            ->latest('filled_at')
            ->limit(10)
            ->get()
            ->map(fn ($order) => [
                'id' => $order->id,
                'side' => $order->side,
                'quantity' => (float) $order->quantity,
                'price' => (float) $order->average_fill_price,
                'executed_at' => optional($order->filled_at)->toIso8601String(),
                'trader' => $order->user->name,
            ]);

        $history = collect(range(0, 39))->map(function (int $index) use ($asset) {
            $base = (float) $asset->current_price;
            $factor = 1 + (sin($index / 3) * 0.018) - ((39 - $index) * 0.0004);

            return [
                'time' => now()->subMinutes((39 - $index) * 15)->format('H:i'),
                'value' => round($base * $factor, 8),
            ];
        });

        $marketCap = round((float) $asset->current_price * 1_000_000_000, 2);
        $volume24h = round((float) $asset->current_price * 12_500_000, 2);

        return response()->json([
            'data' => [
                'id' => $asset->id,
                'symbol' => $asset->symbol,
                'name' => $asset->name,
                'type' => $asset->type,
                'price' => (float) $asset->current_price,
                'change_percent' => (float) $asset->change_percent,
                'change_value' => (float) $asset->change_value,
                'market_cap' => $marketCap,
                'volume_24h' => $volume24h,
                'chart' => $history,
                'related_assets' => $relatedAssets,
                'recent_trades' => $recentTrades,
            ],
        ]);
    }

    private function syncStockQuotesIfDue(?string $requestedType, FinnhubStockSyncService $stockSyncService): void
    {
        if (app()->environment('testing')) {
            return;
        }

        if ($requestedType !== null && ! in_array($requestedType, ['stock', 'share', 'etf'], true)) {
            return;
        }

        if (! filled(config('services.finnhub.api_key'))) {
            return;
        }

        // Fallback sync when scheduler/cron is delayed. Throttle to once per minute.
        if (! Cache::add('stocks:finnhub:lazy-sync-lock', now()->timestamp, now()->addSeconds(55))) {
            return;
        }

        $calls = max(1, (int) config('stocks.sync.max_calls_per_run', 5));

        try {
            $stockSyncService->sync($calls);
        } catch (Throwable $exception) {
            Log::warning('Finnhub fallback sync failed during market assets request.', [
                'exception' => $exception->getMessage(),
            ]);
        }
    }
}
