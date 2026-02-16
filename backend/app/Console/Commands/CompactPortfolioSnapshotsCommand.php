<?php

namespace App\Console\Commands;

use App\Models\PortfolioSnapshot;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class CompactPortfolioSnapshotsCommand extends Command
{
    /**
     * @var string
     */
    protected $signature = 'portfolio:compact-snapshots
                            {--user= : Compact snapshots for a specific user UUID only}
                            {--dry-run : Report deletions without applying them}';

    /**
     * @var string
     */
    protected $description = 'Downsample older portfolio snapshots while keeping recent minute-level fidelity.';

    public function handle(): int
    {
        $userId = $this->option('user');
        $dryRun = (bool) $this->option('dry-run');

        $query = User::query()->select(['id'])->whereHas('portfolioSnapshots');

        if (is_string($userId) && $userId !== '') {
            $query->whereKey($userId);
        }

        $fineDays = max(1, (int) config('portfolio.snapshots.retention.fine_days', 7));
        $midDays = max($fineDays + 1, (int) config('portfolio.snapshots.retention.mid_days', 30));
        $coarseDays = max($midDays + 1, (int) config('portfolio.snapshots.retention.coarse_days', 365));
        $midBucketMinutes = max(1, (int) config('portfolio.snapshots.compaction.mid_bucket_minutes', 5));
        $coarseBucketMinutes = max(1, (int) config('portfolio.snapshots.compaction.coarse_bucket_minutes', 60));
        $archiveBucketMinutes = max(1, (int) config('portfolio.snapshots.compaction.archive_bucket_minutes', 1440));

        $now = now();
        $fineCutoff = $now->copy()->subDays($fineDays);
        $midCutoff = $now->copy()->subDays($midDays);
        $coarseCutoff = $now->copy()->subDays($coarseDays);

        $usersProcessed = 0;
        $snapshotsDeleted = 0;

        $query->chunk(100, function ($users) use (
            &$usersProcessed,
            &$snapshotsDeleted,
            $dryRun,
            $fineCutoff,
            $midCutoff,
            $coarseCutoff,
            $midBucketMinutes,
            $coarseBucketMinutes,
            $archiveBucketMinutes,
        ): void {
            foreach ($users as $user) {
                $usersProcessed++;

                $idsToDelete = array_merge(
                    $this->collectDeleteIds($user->id, $midCutoff, $fineCutoff, $midBucketMinutes),
                    $this->collectDeleteIds($user->id, $coarseCutoff, $midCutoff, $coarseBucketMinutes),
                    $this->collectDeleteIds($user->id, null, $coarseCutoff, $archiveBucketMinutes),
                );

                if ($idsToDelete === []) {
                    continue;
                }

                $snapshotsDeleted += count($idsToDelete);

                if ($dryRun) {
                    continue;
                }

                foreach (array_chunk($idsToDelete, 500) as $chunk) {
                    PortfolioSnapshot::query()
                        ->whereIn('id', $chunk)
                        ->delete();
                }
            }
        });

        $verb = $dryRun ? 'Would delete' : 'Deleted';
        $this->info(sprintf(
            '%s %d snapshot(s) across %d user(s).',
            $verb,
            $snapshotsDeleted,
            $usersProcessed
        ));

        return self::SUCCESS;
    }

    /**
     * @return array<int, string>
     */
    private function collectDeleteIds(string $userId, ?Carbon $rangeStartInclusive, Carbon $rangeEndExclusive, int $bucketMinutes): array
    {
        $query = PortfolioSnapshot::query()
            ->where('user_id', $userId)
            ->where('recorded_at', '<', $rangeEndExclusive)
            ->orderByDesc('recorded_at')
            ->select(['id', 'recorded_at']);

        if ($rangeStartInclusive !== null) {
            $query->where('recorded_at', '>=', $rangeStartInclusive);
        }

        $bucketSeconds = max(60, $bucketMinutes * 60);
        $seenBuckets = [];
        $deleteIds = [];

        foreach ($query->cursor() as $snapshot) {
            $timestamp = $snapshot->recorded_at->getTimestamp();
            $bucket = (int) floor($timestamp / $bucketSeconds);

            if (isset($seenBuckets[$bucket])) {
                $deleteIds[] = $snapshot->id;

                continue;
            }

            $seenBuckets[$bucket] = true;
        }

        return $deleteIds;
    }
}
