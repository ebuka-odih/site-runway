<?php

namespace App\Models;

use App\Models\Concerns\UsesUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CopyRelationship extends Model
{
    /** @use HasFactory<\Database\Factories\CopyRelationshipFactory> */
    use HasFactory, UsesUuid;

    protected $fillable = [
        'user_id',
        'trader_id',
        'allocation_amount',
        'copy_ratio',
        'status',
        'pnl',
        'trades_count',
        'started_at',
        'ended_at',
    ];

    protected function casts(): array
    {
        return [
            'allocation_amount' => 'decimal:8',
            'copy_ratio' => 'decimal:2',
            'pnl' => 'decimal:8',
            'trades_count' => 'integer',
            'started_at' => 'datetime',
            'ended_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function trader(): BelongsTo
    {
        return $this->belongsTo(Trader::class);
    }

    public function copyTrades(): HasMany
    {
        return $this->hasMany(CopyTrade::class);
    }
}
