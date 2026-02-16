<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PortfolioSnapshotUpdated implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly string $userId,
        public readonly float $value,
        public readonly float $buyingPower,
        public readonly int $timestampMs,
    ) {}

    public function broadcastAs(): string
    {
        return 'portfolio.snapshot.updated';
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel('portfolio.'.$this->userId)];
    }

    public function broadcastWith(): array
    {
        return [
            'user_id' => $this->userId,
            'value' => round($this->value, 2),
            'buying_power' => round($this->buyingPower, 2),
            'timestamp' => $this->timestampMs,
        ];
    }
}
