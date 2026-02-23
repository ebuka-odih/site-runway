<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\CopyRelationship;
use App\Models\CopyTrade;
use App\Models\Trader;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CopyTraderController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->string('search'));
        $status = (string) $request->string('status', 'all');
        $verification = (string) $request->string('verification', 'all');

        $traders = Trader::query()
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($innerQuery) use ($search) {
                    $innerQuery
                        ->where('display_name', 'like', "%{$search}%")
                        ->orWhere('username', 'like', "%{$search}%")
                        ->orWhere('strategy', 'like', "%{$search}%");
                });
            })
            ->when($status === 'active', fn ($query) => $query->where('is_active', true))
            ->when($status === 'inactive', fn ($query) => $query->where('is_active', false))
            ->when($verification === 'verified', fn ($query) => $query->where('is_verified', true))
            ->when($verification === 'unverified', fn ($query) => $query->where('is_verified', false))
            ->orderByDesc('total_return')
            ->paginate(12)
            ->withQueryString()
            ->through(fn (Trader $trader) => $this->traderPayload($trader));

        $stats = [
            'total' => Trader::query()->count(),
            'active' => Trader::query()->where('is_active', true)->count(),
            'inactive' => Trader::query()->where('is_active', false)->count(),
            'verified' => Trader::query()->where('is_verified', true)->count(),
        ];

        return Inertia::render('Admin/CopyTraders/Index', [
            'traders' => $traders,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'verification' => $verification,
            ],
            'stats' => $stats,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/CopyTraders/Create');
    }

    public function edit(Trader $trader): Response
    {
        $assets = Asset::query()
            ->orderBy('symbol')
            ->get(['id', 'symbol', 'name', 'type', 'current_price']);

        $activeFollowers = CopyRelationship::query()
            ->where('trader_id', $trader->id)
            ->where('status', 'active')
            ->count();

        $followers = CopyRelationship::query()
            ->with('user:id,name,email')
            ->where('trader_id', $trader->id)
            ->whereIn('status', ['active', 'paused'])
            ->orderByRaw("CASE WHEN status = 'active' THEN 0 ELSE 1 END")
            ->latest('created_at')
            ->get();

        $tradeHistory = CopyTrade::query()
            ->with([
                'asset:id,symbol,name',
                'copyRelationship.user:id,name,email',
            ])
            ->whereHas('copyRelationship', fn ($query) => $query->where('trader_id', $trader->id))
            ->latest('executed_at')
            ->limit(120)
            ->get();

        return Inertia::render('Admin/CopyTraders/Edit', [
            'trader' => $this->traderPayload($trader),
            'assets' => $assets->map(fn (Asset $asset) => [
                'id' => $asset->id,
                'symbol' => $asset->symbol,
                'name' => $asset->name,
                'type' => $asset->type,
                'price' => (float) $asset->current_price,
            ]),
            'active_followers' => $activeFollowers,
            'followers' => $followers->map(fn (CopyRelationship $relationship) => [
                'id' => $relationship->id,
                'status' => $relationship->status,
                'copy_ratio' => (float) $relationship->copy_ratio,
                'user' => [
                    'name' => $relationship->user?->name,
                    'email' => $relationship->user?->email,
                ],
            ]),
            'trade_history' => $tradeHistory->map(fn (CopyTrade $trade) => [
                'id' => $trade->id,
                'side' => $trade->side,
                'quantity' => (float) $trade->quantity,
                'price' => (float) $trade->price,
                'pnl' => (float) $trade->pnl,
                'executed_at' => optional($trade->executed_at)->toIso8601String(),
                'asset' => [
                    'symbol' => $trade->asset?->symbol,
                    'name' => $trade->asset?->name,
                ],
                'follower' => [
                    'name' => $trade->copyRelationship?->user?->name,
                    'email' => $trade->copyRelationship?->user?->email,
                ],
                'metadata' => [
                    'source' => data_get($trade->metadata, 'source'),
                    'note' => data_get($trade->metadata, 'note'),
                    'copy_ratio' => data_get($trade->metadata, 'copy_ratio'),
                    'leader_quantity' => data_get($trade->metadata, 'leader_quantity'),
                    'leader_pnl' => data_get($trade->metadata, 'leader_pnl'),
                ],
            ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'display_name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:255', Rule::unique('traders', 'username')],
            'avatar_color' => ['nullable', 'string', 'max:50'],
            'strategy' => ['required', 'string', 'max:255'],
            'copy_fee' => ['required', 'numeric', 'min:0'],
            'total_return' => ['required', 'numeric'],
            'win_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'copiers_count' => ['required', 'integer', 'min:0'],
            'risk_score' => ['required', 'integer', 'min:1', 'max:10'],
            'joined_at' => ['required', 'date'],
            'is_verified' => ['required', 'boolean'],
            'is_active' => ['required', 'boolean'],
        ]);

        $trader = Trader::query()->create([
            ...$validated,
            'joined_at' => Carbon::parse($validated['joined_at']),
        ]);

        return redirect()
            ->route('admin.copy-traders.edit', $trader)
            ->with('success', 'Copy trader created successfully.');
    }

    public function update(Request $request, Trader $trader): RedirectResponse
    {
        $validated = $request->validate([
            'display_name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:255', Rule::unique('traders', 'username')->ignore($trader->id)],
            'avatar_color' => ['nullable', 'string', 'max:50'],
            'strategy' => ['required', 'string', 'max:255'],
            'copy_fee' => ['required', 'numeric', 'min:0'],
            'total_return' => ['required', 'numeric'],
            'win_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'copiers_count' => ['required', 'integer', 'min:0'],
            'risk_score' => ['required', 'integer', 'min:1', 'max:10'],
            'joined_at' => ['required', 'date'],
            'is_verified' => ['required', 'boolean'],
            'is_active' => ['required', 'boolean'],
        ]);

        $trader->update([
            ...$validated,
            'joined_at' => Carbon::parse($validated['joined_at']),
        ]);

        return redirect()
            ->route('admin.copy-traders.edit', $trader)
            ->with('success', 'Copy trader updated successfully.');
    }

    public function destroy(Trader $trader): RedirectResponse
    {
        $trader->delete();

        return redirect()
            ->route('admin.copy-traders.index')
            ->with('success', 'Copy trader deleted successfully.');
    }

    public function storeTrade(Request $request, Trader $trader): RedirectResponse
    {
        $validated = $request->validate([
            'asset_id' => ['required', 'uuid', 'exists:assets,id'],
            'side' => ['required', Rule::in(['buy', 'sell'])],
            'quantity' => ['required', 'numeric', 'gt:0'],
            'price' => ['required', 'numeric', 'gt:0'],
            'apply_to' => ['nullable', Rule::in(['all', 'single'])],
            'copy_relationship_id' => [
                Rule::requiredIf((string) $request->input('apply_to', 'all') === 'single'),
                'nullable',
                'uuid',
                Rule::exists('copy_relationships', 'id')->where(fn ($query) => $query
                    ->where('trader_id', $trader->id)
                    ->whereIn('status', ['active', 'paused'])),
            ],
            'executed_at' => ['nullable', 'date'],
            'pnl' => ['nullable', 'numeric'],
            'note' => ['nullable', 'string', 'max:255'],
        ]);

        $applyTo = $validated['apply_to'] ?? 'all';

        $relationships = CopyRelationship::query()
            ->where('trader_id', $trader->id)
            ->when(
                $applyTo === 'single',
                fn ($query) => $query
                    ->whereKey($validated['copy_relationship_id'] ?? null)
                    ->whereIn('status', ['active', 'paused']),
                fn ($query) => $query->where('status', 'active')
            )
            ->get();

        if ($relationships->isEmpty()) {
            $message = $applyTo === 'single'
                ? 'Selected follower was not found or is no longer eligible for manual trade history.'
                : 'No active followers to receive this trade.';

            return back()->with('error', $message);
        }

        $executedAt = isset($validated['executed_at'])
            ? Carbon::parse($validated['executed_at'])
            : now();

        $quantity = (float) $validated['quantity'];
        $price = (float) $validated['price'];
        $leaderPnl = array_key_exists('pnl', $validated) && $validated['pnl'] !== null
            ? (float) $validated['pnl']
            : null;

        $created = 0;
        $skipped = 0;

        DB::transaction(function () use (
            $relationships,
            $validated,
            $quantity,
            $price,
            $executedAt,
            $leaderPnl,
            &$created,
            &$skipped
        ) {
            foreach ($relationships as $relationship) {
                $ratio = (float) $relationship->copy_ratio;

                if ($ratio <= 0) {
                    $skipped++;
                    continue;
                }

                $scaledQuantity = round($quantity * $ratio, 8);

                if ($scaledQuantity <= 0) {
                    $skipped++;
                    continue;
                }

                $scaledPnl = $leaderPnl !== null ? round($leaderPnl * $ratio, 8) : 0.0;

                CopyTrade::query()->create([
                    'copy_relationship_id' => $relationship->id,
                    'asset_id' => $validated['asset_id'],
                    'side' => $validated['side'],
                    'quantity' => $scaledQuantity,
                    'price' => $price,
                    'pnl' => $scaledPnl,
                    'executed_at' => $executedAt,
                    'metadata' => [
                        'source' => 'admin',
                        'leader_quantity' => $quantity,
                        'leader_pnl' => $leaderPnl,
                        'copy_ratio' => $ratio,
                        'apply_to' => $applyTo,
                        'note' => $validated['note'] ?? null,
                    ],
                ]);

                $relationship->trades_count = (int) $relationship->trades_count + 1;
                $relationship->pnl = (float) $relationship->pnl + $scaledPnl;
                $relationship->save();

                $created++;
            }
        });

        $message = "Trade executed for {$created} follower".($created === 1 ? '' : 's').'.';

        if ($skipped > 0) {
            $message .= " Skipped {$skipped} due to inactive copy ratios.";
        }

        return back()->with('success', $message);
    }

    private function traderPayload(Trader $trader): array
    {
        return [
            'id' => $trader->id,
            'display_name' => $trader->display_name,
            'username' => $trader->username,
            'avatar_color' => $trader->avatar_color,
            'strategy' => $trader->strategy,
            'copy_fee' => (float) $trader->copy_fee,
            'total_return' => (float) $trader->total_return,
            'win_rate' => (float) $trader->win_rate,
            'copiers_count' => (int) $trader->copiers_count,
            'risk_score' => (int) $trader->risk_score,
            'joined_at' => optional($trader->joined_at)->toIso8601String(),
            'is_verified' => (bool) $trader->is_verified,
            'is_active' => (bool) $trader->is_active,
        ];
    }
}
