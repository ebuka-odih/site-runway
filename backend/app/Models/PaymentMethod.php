<?php

namespace App\Models;

use App\Models\Concerns\UsesUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentMethod extends Model
{
    /** @use HasFactory<\Database\Factories\PaymentMethodFactory> */
    use HasFactory, UsesUuid;

    protected $fillable = [
        'name',
        'channel',
        'currency',
        'network',
        'wallet_address',
        'status',
        'description',
        'settings',
        'display_order',
    ];

    protected function casts(): array
    {
        return [
            'settings' => 'array',
        ];
    }
}
