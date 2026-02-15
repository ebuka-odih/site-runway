<?php

namespace App\Models;

use App\Models\Concerns\UsesUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Order extends Model
{
    /** @use HasFactory<\Database\Factories\OrderFactory> */
    use HasFactory, UsesUuid;

    protected $fillable = [
        'user_id',
        'asset_id',
        'side',
        'order_type',
        'status',
        'quantity',
        'requested_price',
        'average_fill_price',
        'total_value',
        'placed_at',
        'filled_at',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:8',
            'requested_price' => 'decimal:8',
            'average_fill_price' => 'decimal:8',
            'total_value' => 'decimal:8',
            'placed_at' => 'datetime',
            'filled_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }
}
