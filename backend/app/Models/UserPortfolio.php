<?php

namespace App\Models;

use App\Models\Concerns\UsesUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UserPortfolio extends Model
{
    /** @use HasFactory<\Database\Factories\UserPortfolioFactory> */
    use HasFactory, UsesUuid;

    protected $fillable = [
        'user_id',
        'cash_balance',
        'holding_balance',
        'profit_balance',
        'asset_profit',
        'copy_profit',
        'funded_profit',
        'investing_total',
        'pnl_percent',
        'as_of',
    ];

    protected function casts(): array
    {
        return [
            'cash_balance' => 'decimal:8',
            'holding_balance' => 'decimal:8',
            'profit_balance' => 'decimal:8',
            'asset_profit' => 'decimal:8',
            'copy_profit' => 'decimal:8',
            'funded_profit' => 'decimal:8',
            'investing_total' => 'decimal:8',
            'pnl_percent' => 'decimal:4',
            'as_of' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(PortfolioEvent::class);
    }
}
