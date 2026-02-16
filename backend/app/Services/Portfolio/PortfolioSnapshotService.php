<?php

namespace App\Services\Portfolio;

use App\Events\PortfolioSnapshotUpdated;
use App\Models\PortfolioSnapshot;
use App\Models\Position;
use App\Models\User;
use Illuminate\Support\Carbon;

class PortfolioSnapshotService
{
    private const DRIFT_EPSILON = 0.01;

    public function captureForUser(User $user, ?Carbon $recordedAt = null): bool
    {
        $user->loadMissing([
            'wallet:id,user_id,cash_balance',
            'positions:id,user_id,asset_id,quantity',
            'positions.asset:id,current_price',
        ]);

        $cashBalance = $user->wallet !== null
            ? $this->resolveAuthoritativeBalance((float) $user->wallet->cash_balance, (float) $user->balance)
            : (float) $user->balance;

        $holdingsValue = $user->positions->sum(
            fn (Position $position) => (float) $position->quantity * (float) $position->asset->current_price
        );

        $portfolioValue = $cashBalance + $holdingsValue;

        return $this->captureFromValues($user, $portfolioValue, $cashBalance, $recordedAt);
    }

    public function captureForActiveUsers(?Carbon $recordedAt = null): int
    {
        $captured = 0;

        User::query()
            ->where(function ($query): void {
                $query->whereHas('wallet')->orWhereHas('positions');
            })
            ->with([
                'wallet:id,user_id,cash_balance',
                'positions:id,user_id,asset_id,quantity',
                'positions.asset:id,current_price',
            ])
            ->chunk(100, function ($users) use (&$captured, $recordedAt): void {
                foreach ($users as $user) {
                    if ($this->captureForUser($user, $recordedAt)) {
                        $captured++;
                    }
                }
            });

        return $captured;
    }

    public function captureFromValues(User $user, float $portfolioValue, float $buyingPower, ?Carbon $recordedAt = null): bool
    {
        $bucketedTime = ($recordedAt ?? now())->copy()->startOfMinute();

        $existing = PortfolioSnapshot::query()
            ->where('user_id', $user->id)
            ->where('recorded_at', $bucketedTime)
            ->first();

        if ($existing !== null) {
            if (
                $this->isDrifted((float) $existing->value, $portfolioValue) ||
                $this->isDrifted((float) $existing->buying_power, $buyingPower)
            ) {
                $existing->update([
                    'value' => round($portfolioValue, 8),
                    'buying_power' => round($buyingPower, 8),
                ]);

                event(new PortfolioSnapshotUpdated(
                    (string) $user->id,
                    $portfolioValue,
                    $buyingPower,
                    $bucketedTime->getTimestampMs(),
                ));

                return true;
            }

            return false;
        }

        PortfolioSnapshot::query()->create([
            'user_id' => $user->id,
            'value' => round($portfolioValue, 8),
            'buying_power' => round($buyingPower, 8),
            'recorded_at' => $bucketedTime,
        ]);

        event(new PortfolioSnapshotUpdated(
            (string) $user->id,
            $portfolioValue,
            $buyingPower,
            $bucketedTime->getTimestampMs(),
        ));

        return true;
    }

    private function isDrifted(float $current, float $expected): bool
    {
        return abs($current - $expected) >= self::DRIFT_EPSILON;
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

    private function isEffectivelyZero(float $value): bool
    {
        return abs($value) < 0.00000001;
    }
}
