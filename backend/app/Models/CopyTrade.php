<?php

namespace App\Models;

use App\Models\Concerns\UsesUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CopyTrade extends Model
{
    /** @use HasFactory<\Database\Factories\CopyTradeFactory> */
    use HasFactory, UsesUuid;

    protected $fillable = [
        'copy_relationship_id',
        'asset_id',
        'side',
        'quantity',
        'price',
        'pnl',
        'executed_at',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:8',
            'price' => 'decimal:8',
            'pnl' => 'decimal:8',
            'executed_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public function copyRelationship(): BelongsTo
    {
        return $this->belongsTo(CopyRelationship::class);
    }

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }
}
