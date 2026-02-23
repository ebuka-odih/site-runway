<?php

namespace App\Models;

use App\Models\Concerns\UsesUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PortfolioEvent extends Model
{
    /** @use HasFactory<\Database\Factories\PortfolioEventFactory> */
    use HasFactory, UsesUuid;

    protected $fillable = [
        'user_id',
        'user_portfolio_id',
        'event_type',
        'source_type',
        'source_id',
        'status',
        'occurred_at',
        'cash_delta',
        'holding_delta',
        'profit_delta',
        'asset_profit_delta',
        'copy_profit_delta',
        'funded_profit_delta',
        'cash_balance_after',
        'holding_balance_after',
        'profit_balance_after',
        'asset_profit_after',
        'copy_profit_after',
        'funded_profit_after',
        'investing_total_after',
        'pnl_percent_after',
        'metadata',
        'created_by_admin_id',
    ];

    protected function casts(): array
    {
        return [
            'occurred_at' => 'datetime',
            'cash_delta' => 'decimal:8',
            'holding_delta' => 'decimal:8',
            'profit_delta' => 'decimal:8',
            'asset_profit_delta' => 'decimal:8',
            'copy_profit_delta' => 'decimal:8',
            'funded_profit_delta' => 'decimal:8',
            'cash_balance_after' => 'decimal:8',
            'holding_balance_after' => 'decimal:8',
            'profit_balance_after' => 'decimal:8',
            'asset_profit_after' => 'decimal:8',
            'copy_profit_after' => 'decimal:8',
            'funded_profit_after' => 'decimal:8',
            'investing_total_after' => 'decimal:8',
            'pnl_percent_after' => 'decimal:4',
            'metadata' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function portfolio(): BelongsTo
    {
        return $this->belongsTo(UserPortfolio::class, 'user_portfolio_id');
    }

    public function createdByAdmin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_admin_id');
    }
}
