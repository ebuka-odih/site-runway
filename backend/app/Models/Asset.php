<?php

namespace App\Models;

use App\Models\Concerns\UsesUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Asset extends Model
{
    /** @use HasFactory<\Database\Factories\AssetFactory> */
    use HasFactory, UsesUuid;

    protected $fillable = [
        'symbol',
        'name',
        'type',
        'current_price',
        'change_percent',
        'change_value',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'current_price' => 'decimal:8',
            'change_percent' => 'decimal:4',
            'change_value' => 'decimal:8',
            'is_active' => 'boolean',
        ];
    }

    public function positions(): HasMany
    {
        return $this->hasMany(Position::class);
    }

    public function watchlistItems(): HasMany
    {
        return $this->hasMany(WatchlistItem::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function walletTransactions(): HasMany
    {
        return $this->hasMany(WalletTransaction::class);
    }

    public function copyTrades(): HasMany
    {
        return $this->hasMany(CopyTrade::class);
    }
}
