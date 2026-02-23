<?php

namespace App\Services\Portfolio;

use App\Models\PortfolioEvent;
use App\Models\User;
use App\Models\UserPortfolio;
use App\Models\Wallet;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class PortfolioLedgerService
{
    /**
     * Ensure a portfolio projection row exists for the user.
     */
    public function ensurePortfolio(User $user): UserPortfolio
    {
        return DB::transaction(fn () => $this->lockOrCreatePortfolio($user));
    }

    /**
     * Append a portfolio event and update the projection snapshot.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function post(User $user, string $eventType, array $attributes = []): PortfolioEvent
    {
        return DB::transaction(function () use ($user, $eventType, $attributes): PortfolioEvent {
            $portfolio = $this->lockOrCreatePortfolio($user);
            $occurredAt = $this->resolveOccurredAt($attributes['occurred_at'] ?? null);
            $deltas = $this->extractDeltas($attributes);
            $nextState = $this->projectNextState($portfolio, $deltas);

            $portfolio->fill([
                'cash_balance' => $nextState['cash_balance'],
                'holding_balance' => $nextState['holding_balance'],
                'profit_balance' => $nextState['profit_balance'],
                'asset_profit' => $nextState['asset_profit'],
                'copy_profit' => $nextState['copy_profit'],
                'funded_profit' => $nextState['funded_profit'],
                'investing_total' => $nextState['investing_total'],
                'pnl_percent' => $nextState['pnl_percent'],
                'as_of' => $occurredAt,
            ]);
            $portfolio->save();

            $event = PortfolioEvent::query()->create([
                'user_id' => $user->id,
                'user_portfolio_id' => $portfolio->id,
                'event_type' => $eventType,
                'source_type' => $attributes['source_type'] ?? null,
                'source_id' => $attributes['source_id'] ?? null,
                'status' => (string) ($attributes['status'] ?? 'posted'),
                'occurred_at' => $occurredAt,
                'cash_delta' => $deltas['cash_delta'],
                'holding_delta' => $deltas['holding_delta'],
                'profit_delta' => $deltas['profit_delta'],
                'asset_profit_delta' => $deltas['asset_profit_delta'],
                'copy_profit_delta' => $deltas['copy_profit_delta'],
                'funded_profit_delta' => $deltas['funded_profit_delta'],
                'cash_balance_after' => $nextState['cash_balance'],
                'holding_balance_after' => $nextState['holding_balance'],
                'profit_balance_after' => $nextState['profit_balance'],
                'asset_profit_after' => $nextState['asset_profit'],
                'copy_profit_after' => $nextState['copy_profit'],
                'funded_profit_after' => $nextState['funded_profit'],
                'investing_total_after' => $nextState['investing_total'],
                'pnl_percent_after' => $nextState['pnl_percent'],
                'metadata' => $attributes['metadata'] ?? null,
                'created_by_admin_id' => $attributes['created_by_admin_id'] ?? null,
            ]);

            if (($attributes['mirror_legacy'] ?? true) === true) {
                $this->mirrorLegacyBalances($user, $nextState);
            }

            return $event;
        });
    }

    private function lockOrCreatePortfolio(User $user): UserPortfolio
    {
        $portfolio = UserPortfolio::query()
            ->where('user_id', $user->id)
            ->lockForUpdate()
            ->first();

        if ($portfolio !== null) {
            return $portfolio;
        }

        $seed = [
            'cash_balance' => round((float) $user->balance, 8),
            'holding_balance' => round((float) $user->holding_balance, 8),
            'profit_balance' => round((float) $user->profit_balance, 8),
            'asset_profit' => 0.0,
            'copy_profit' => 0.0,
            'funded_profit' => 0.0,
        ];

        $seed['investing_total'] = $this->calculateInvestingTotal($seed);
        $seed['pnl_percent'] = $this->calculatePnlPercent($seed['profit_balance'], $seed['holding_balance']);

        return UserPortfolio::query()->create([
            'user_id' => $user->id,
            'cash_balance' => $seed['cash_balance'],
            'holding_balance' => $seed['holding_balance'],
            'profit_balance' => $seed['profit_balance'],
            'asset_profit' => $seed['asset_profit'],
            'copy_profit' => $seed['copy_profit'],
            'funded_profit' => $seed['funded_profit'],
            'investing_total' => $seed['investing_total'],
            'pnl_percent' => $seed['pnl_percent'],
            'as_of' => now(),
        ]);
    }

    /**
     * @param  array<string, mixed>  $attributes
     * @return array{
     *     cash_delta: float,
     *     holding_delta: float,
     *     profit_delta: float,
     *     asset_profit_delta: float,
     *     copy_profit_delta: float,
     *     funded_profit_delta: float
     * }
     */
    private function extractDeltas(array $attributes): array
    {
        return [
            'cash_delta' => $this->normalizeDecimal($attributes['cash_delta'] ?? 0),
            'holding_delta' => $this->normalizeDecimal($attributes['holding_delta'] ?? 0),
            'profit_delta' => $this->normalizeDecimal($attributes['profit_delta'] ?? 0),
            'asset_profit_delta' => $this->normalizeDecimal($attributes['asset_profit_delta'] ?? 0),
            'copy_profit_delta' => $this->normalizeDecimal($attributes['copy_profit_delta'] ?? 0),
            'funded_profit_delta' => $this->normalizeDecimal($attributes['funded_profit_delta'] ?? 0),
        ];
    }

    /**
     * @param  array{
     *     cash_delta: float,
     *     holding_delta: float,
     *     profit_delta: float,
     *     asset_profit_delta: float,
     *     copy_profit_delta: float,
     *     funded_profit_delta: float
     * }  $deltas
     * @return array{
     *     cash_balance: float,
     *     holding_balance: float,
     *     profit_balance: float,
     *     asset_profit: float,
     *     copy_profit: float,
     *     funded_profit: float,
     *     investing_total: float,
     *     pnl_percent: float
     * }
     */
    private function projectNextState(UserPortfolio $portfolio, array $deltas): array
    {
        $nextState = [
            'cash_balance' => round((float) $portfolio->cash_balance + $deltas['cash_delta'], 8),
            'holding_balance' => round((float) $portfolio->holding_balance + $deltas['holding_delta'], 8),
            'profit_balance' => round((float) $portfolio->profit_balance + $deltas['profit_delta'], 8),
            'asset_profit' => round((float) $portfolio->asset_profit + $deltas['asset_profit_delta'], 8),
            'copy_profit' => round((float) $portfolio->copy_profit + $deltas['copy_profit_delta'], 8),
            'funded_profit' => round((float) $portfolio->funded_profit + $deltas['funded_profit_delta'], 8),
        ];

        $nextState['investing_total'] = $this->calculateInvestingTotal($nextState);
        $nextState['pnl_percent'] = $this->calculatePnlPercent($nextState['profit_balance'], $nextState['holding_balance']);

        return $nextState;
    }

    /**
     * @param  array{
     *     holding_balance: float,
     *     profit_balance: float,
     *     asset_profit: float
     * }  $state
     */
    private function calculateInvestingTotal(array $state): float
    {
        return round(
            $state['holding_balance']
            + $state['profit_balance']
            + $state['asset_profit'],
            8
        );
    }

    private function calculatePnlPercent(float $profitBalance, float $holdingBalance): float
    {
        if (abs($holdingBalance) < 0.00000001) {
            return 0.0;
        }

        return round(($profitBalance / $holdingBalance) * 100, 4);
    }

    /**
     * @param  array{
     *     cash_balance: float,
     *     holding_balance: float,
     *     profit_balance: float
     * }  $state
     */
    private function mirrorLegacyBalances(User $user, array $state): void
    {
        $wallet = Wallet::query()->firstOrCreate(
            ['user_id' => $user->id],
            ['currency' => 'USD'],
        );

        $wallet->fill([
            'cash_balance' => $state['cash_balance'],
            'investing_balance' => $state['holding_balance'],
            'profit_loss' => $state['profit_balance'],
        ]);
        $wallet->save();

        if (
            $this->isDrifted((float) $user->balance, $state['cash_balance']) ||
            $this->isDrifted((float) $user->holding_balance, $state['holding_balance']) ||
            $this->isDrifted((float) $user->profit_balance, $state['profit_balance'])
        ) {
            User::withoutTimestamps(function () use ($user, $state): void {
                User::query()
                    ->whereKey($user->id)
                    ->update([
                        'balance' => $state['cash_balance'],
                        'holding_balance' => $state['holding_balance'],
                        'profit_balance' => $state['profit_balance'],
                    ]);
            });
        }
    }

    private function resolveOccurredAt(mixed $value): Carbon
    {
        if ($value instanceof Carbon) {
            return $value;
        }

        if (is_string($value) && $value !== '') {
            return Carbon::parse($value);
        }

        return now();
    }

    private function normalizeDecimal(mixed $value): float
    {
        return round((float) $value, 8);
    }

    private function isDrifted(float $current, float $expected): bool
    {
        return abs($current - $expected) >= 0.00000001;
    }
}
