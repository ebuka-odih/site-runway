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
