<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MarketAssetsUpdated implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    /**
     * @param  array<int, array{
     *   id: string,
     *   symbol: string,
     *   type: string,
     *   price: float,
     *   change_percent: float,
     *   change_value: float,
     *   last_price_update_at: string|null
     * }>  $assets
     */
    public function __construct(
        public readonly array $assets,
        public readonly int $timestampMs,
        public readonly string $source = 'finnhub',
    ) {}

    public function broadcastAs(): string
    {
        return 'market.assets.updated';
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel('market')];
    }

    public function broadcastWith(): array
    {
        return [
            'assets' => $this->assets,
            'source' => $this->source,
            'timestamp' => $this->timestampMs,
        ];
    }
}
