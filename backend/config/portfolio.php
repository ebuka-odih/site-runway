<?php

return [
    'snapshots' => [
        'retention' => [
            // Keep full-resolution snapshots for this many recent days.
            'fine_days' => (int) env('PORTFOLIO_SNAPSHOT_FINE_DAYS', 7),
            // First compaction window upper bound in days.
            'mid_days' => (int) env('PORTFOLIO_SNAPSHOT_MID_DAYS', 30),
            // Second compaction window upper bound in days.
            'coarse_days' => (int) env('PORTFOLIO_SNAPSHOT_COARSE_DAYS', 365),
        ],
        'compaction' => [
            // 7-30 days old snapshots -> keep one per 5-minute bucket by default.
            'mid_bucket_minutes' => (int) env('PORTFOLIO_SNAPSHOT_MID_BUCKET_MINUTES', 5),
            // 30-365 days old snapshots -> keep one per 60-minute bucket by default.
            'coarse_bucket_minutes' => (int) env('PORTFOLIO_SNAPSHOT_COARSE_BUCKET_MINUTES', 60),
            // Older than 365 days -> keep one per day by default.
            'archive_bucket_minutes' => (int) env('PORTFOLIO_SNAPSHOT_ARCHIVE_BUCKET_MINUTES', 1440),
        ],
    ],
];
