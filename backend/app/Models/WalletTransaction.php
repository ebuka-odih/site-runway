<?php

namespace App\Models;

use App\Models\Concerns\UsesUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WalletTransaction extends Model
{
    /** @use HasFactory<\Database\Factories\WalletTransactionFactory> */
    use HasFactory, UsesUuid;

    protected $fillable = [
        'wallet_id',
        'asset_id',
        'type',
        'status',
        'direction',
        'amount',
        'quantity',
        'network',
        'notes',
        'metadata',
        'occurred_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:8',
            'quantity' => 'decimal:8',
            'metadata' => 'array',
            'occurred_at' => 'datetime',
        ];
    }

    public function wallet(): BelongsTo
    {
        return $this->belongsTo(Wallet::class);
    }

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }
}
