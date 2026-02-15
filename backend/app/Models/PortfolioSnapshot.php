<?php

namespace App\Models;

use App\Models\Concerns\UsesUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PortfolioSnapshot extends Model
{
    /** @use HasFactory<\Database\Factories\PortfolioSnapshotFactory> */
    use HasFactory, UsesUuid;

    protected $fillable = [
        'user_id',
        'value',
        'buying_power',
        'recorded_at',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'decimal:8',
            'buying_power' => 'decimal:8',
            'recorded_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
