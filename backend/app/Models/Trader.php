<?php

namespace App\Models;

use App\Models\Concerns\UsesUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Trader extends Model
{
    /** @use HasFactory<\Database\Factories\TraderFactory> */
    use HasFactory, UsesUuid;

    protected $fillable = [
        'display_name',
        'username',
        'avatar_color',
        'strategy',
        'copy_fee',
        'total_return',
        'win_rate',
        'copiers_count',
        'risk_score',
        'joined_at',
        'is_verified',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'copy_fee' => 'decimal:2',
            'total_return' => 'decimal:4',
            'win_rate' => 'decimal:2',
            'copiers_count' => 'integer',
            'risk_score' => 'integer',
            'joined_at' => 'datetime',
            'is_verified' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function copyRelationships(): HasMany
    {
        return $this->hasMany(CopyRelationship::class);
    }
}
