<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\Portfolio\PortfolioSnapshotService;
use Illuminate\Console\Command;

class CapturePortfolioSnapshotsCommand extends Command
{
    /**
     * @var string
     */
    protected $signature = 'portfolio:capture-snapshots
                            {--user= : Capture snapshot for a specific user UUID only}';

    /**
     * @var string
     */
    protected $description = 'Capture per-minute portfolio snapshots from live wallet + position values.';

    public function handle(PortfolioSnapshotService $snapshotService): int
    {
        $userId = $this->option('user');

        if (is_string($userId) && $userId !== '') {
            $user = User::query()->find($userId);

            if ($user === null) {
                $this->error('User not found for --user option.');

                return self::FAILURE;
            }

            $captured = $snapshotService->captureForUser($user);

            $this->info($captured
                ? "Captured snapshot for user {$user->id}."
                : "No snapshot update needed for user {$user->id}.");

            return self::SUCCESS;
        }

        $capturedCount = $snapshotService->captureForActiveUsers();

        $this->info("Portfolio snapshots processed for {$capturedCount} active user(s).");

        return self::SUCCESS;
    }
}
