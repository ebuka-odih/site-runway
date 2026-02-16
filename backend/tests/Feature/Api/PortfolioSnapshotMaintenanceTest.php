<?php

namespace Tests\Feature\Api;

use App\Models\PortfolioSnapshot;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class PortfolioSnapshotMaintenanceTest extends TestCase
{
    use RefreshDatabase;

    public function test_compaction_downsamples_mid_window_snapshots(): void
    {
        $user = User::factory()->create();

        config()->set('portfolio.snapshots.retention.fine_days', 1);
        config()->set('portfolio.snapshots.retention.mid_days', 3);
        config()->set('portfolio.snapshots.retention.coarse_days', 7);
        config()->set('portfolio.snapshots.compaction.mid_bucket_minutes', 5);

        $start = now()->subDays(2)->startOfHour();

        foreach (range(0, 9) as $minute) {
            PortfolioSnapshot::query()->create([
                'user_id' => $user->id,
                'value' => 100000 + $minute,
                'buying_power' => 90000,
                'recorded_at' => $start->copy()->addMinutes($minute),
            ]);
        }

        $this->assertSame(10, PortfolioSnapshot::query()->where('user_id', $user->id)->count());

        Artisan::call('portfolio:compact-snapshots', [
            '--user' => $user->id,
        ]);

        $remaining = PortfolioSnapshot::query()
            ->where('user_id', $user->id)
            ->whereBetween('recorded_at', [$start, $start->copy()->addMinutes(9)])
            ->count();

        $this->assertSame(2, $remaining);
    }

    public function test_compaction_dry_run_keeps_snapshots_unchanged(): void
    {
        $user = User::factory()->create();

        config()->set('portfolio.snapshots.retention.fine_days', 1);
        config()->set('portfolio.snapshots.retention.mid_days', 3);
        config()->set('portfolio.snapshots.retention.coarse_days', 7);
        config()->set('portfolio.snapshots.compaction.mid_bucket_minutes', 5);

        $start = now()->subDays(2)->startOfHour();

        foreach (range(0, 9) as $minute) {
            PortfolioSnapshot::query()->create([
                'user_id' => $user->id,
                'value' => 200000 + $minute,
                'buying_power' => 150000,
                'recorded_at' => $start->copy()->addMinutes($minute),
            ]);
        }

        Artisan::call('portfolio:compact-snapshots', [
            '--user' => $user->id,
            '--dry-run' => true,
        ]);

        $this->assertSame(10, PortfolioSnapshot::query()->where('user_id', $user->id)->count());
    }
}
