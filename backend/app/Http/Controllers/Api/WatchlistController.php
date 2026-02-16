<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WatchlistItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WatchlistController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $items = $request->user()
            ->watchlistItems()
            ->with('asset')
            ->orderBy('sort_order')
            ->get();

        return response()->json([
            'data' => $items->map(fn (WatchlistItem $item) => $this->mapItem($item)),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'asset_id' => ['required', 'uuid', 'exists:assets,id'],
        ]);

        $user = $request->user();
        $existingItem = $user->watchlistItems()
            ->where('asset_id', $validated['asset_id'])
            ->with('asset')
            ->first();

        if ($existingItem) {
            return response()->json([
                'message' => 'Asset already on watchlist.',
                'data' => $this->mapItem($existingItem),
            ]);
        }

        $nextSortOrder = ((int) $user->watchlistItems()->max('sort_order')) + 1;

        $item = $user->watchlistItems()->create([
            'asset_id' => $validated['asset_id'],
            'sort_order' => $nextSortOrder,
        ]);

        $item->load('asset');

        return response()->json([
            'message' => 'Asset added to watchlist.',
            'data' => $this->mapItem($item),
        ], 201);
    }

    public function destroy(Request $request, WatchlistItem $watchlistItem): JsonResponse
    {
        if ($watchlistItem->user_id !== $request->user()->id) {
            abort(403, 'You are not allowed to remove this watchlist item.');
        }

        $watchlistItem->delete();

        return response()->json([
            'message' => 'Watchlist item removed.',
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function mapItem(WatchlistItem $watchlistItem): array
    {
        $asset = $watchlistItem->asset;

        return [
            'id' => $watchlistItem->id,
            'asset_id' => $asset->id,
            'symbol' => $asset->symbol,
            'name' => $asset->name,
            'type' => $asset->type,
            'price' => (float) $asset->current_price,
            'change_percent' => (float) $asset->change_percent,
        ];
    }
}
