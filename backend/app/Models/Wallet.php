<?php

namespace App\Models;

use App\Models\Concerns\UsesUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Wallet extends Model
{
    /** @use HasFactory<\Database\Factories\WalletFactory> */
    use HasFactory, UsesUuid;

    protected $fillable = [
        'user_id',
        'cash_balance',
        'investing_balance',
        'profit_loss',
        'currency',
    ];

    protected function casts(): array
    {
        return [
            'cash_balance' => 'decimal:8',
            'investing_balance' => 'decimal:8',
            'profit_loss' => 'decimal:8',
        ];
    }

    protected static function booted(): void
    {
        static::saved(function (Wallet $wallet): void {
            $cashBalance = $wallet->cash_balance ?? 0;
            $profitLoss = $wallet->profit_loss ?? 0;
            $investingBalance = $wallet->investing_balance ?? 0;

            User::withoutTimestamps(function () use ($wallet, $cashBalance, $profitLoss, $investingBalance): void {
                User::query()
                    ->whereKey($wallet->user_id)
                    ->update([
                        'balance' => $cashBalance,
                        'profit_balance' => $profitLoss,
                        'holding_balance' => $investingBalance,
                    ]);
            });
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(WalletTransaction::class);
    }

    public function depositRequests(): HasMany
    {
        return $this->hasMany(DepositRequest::class);
    }
}
