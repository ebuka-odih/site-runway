<?php

namespace App\Models;

use App\Models\Concerns\UsesUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DepositRequest extends Model
{
    /** @use HasFactory<\Database\Factories\DepositRequestFactory> */
    use HasFactory, UsesUuid;

    protected $fillable = [
        'wallet_id',
        'asset_id',
        'amount',
        'currency',
        'network',
        'wallet_address',
        'transaction_hash',
        'proof_path',
        'status',
        'expires_at',
        'submitted_at',
        'processed_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:8',
            'expires_at' => 'datetime',
            'submitted_at' => 'datetime',
            'processed_at' => 'datetime',
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
