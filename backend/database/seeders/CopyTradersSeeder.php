<?php

namespace Database\Seeders;

use App\Models\Trader;
use Illuminate\Database\Seeder;

class CopyTradersSeeder extends Seeder
{
    /**
     * @var array<int, array<string, bool|float|int|string>>
     */
    private const TRADERS = [
        ['display_name' => 'Tommy Massey', 'username' => 'day_trading', 'avatar_color' => 'emerald', 'strategy' => 'day_trading', 'total_return' => 145.2, 'win_rate' => 68, 'copiers_count' => 1240, 'risk_score' => 4, 'joined_days_ago' => 120, 'is_verified' => true, 'is_active' => true],
        ['display_name' => 'THOMAS', 'username' => 'thomas_algo', 'avatar_color' => 'emerald', 'strategy' => 'day_trading', 'total_return' => 89.4, 'win_rate' => 52, 'copiers_count' => 2450, 'risk_score' => 3, 'joined_days_ago' => 220, 'is_verified' => true, 'is_active' => true],
        ['display_name' => 'Frank Taylor', 'username' => 'dca_momentum', 'avatar_color' => 'emerald', 'strategy' => 'DCA & MOMENTUM', 'total_return' => 210.5, 'win_rate' => 36, 'copiers_count' => 312, 'risk_score' => 6, 'joined_days_ago' => 20, 'is_verified' => true, 'is_active' => true],
        ['display_name' => 'Elite Trader', 'username' => 'scalp_master', 'avatar_color' => 'emerald', 'strategy' => 'SCALPING', 'total_return' => 12.4, 'win_rate' => 78, 'copiers_count' => 154, 'risk_score' => 2, 'joined_days_ago' => 90, 'is_verified' => false, 'is_active' => true],
        ['display_name' => 'Alpha Whale', 'username' => 'alpha_w', 'avatar_color' => 'blue', 'strategy' => 'LONG_TERM', 'total_return' => 340.1, 'win_rate' => 82, 'copiers_count' => 5600, 'risk_score' => 2, 'joined_days_ago' => 360, 'is_verified' => true, 'is_active' => true],
        ['display_name' => 'Neo Trader', 'username' => 'neo_1', 'avatar_color' => 'purple', 'strategy' => 'SCALPING', 'total_return' => 15.6, 'win_rate' => 91, 'copiers_count' => 45, 'risk_score' => 1, 'joined_days_ago' => 7, 'is_verified' => false, 'is_active' => true],
    ];

    /**
     * @return array<int, string>
     */
    public static function usernames(): array
    {
        return array_map(
            static fn (array $trader): string => (string) $trader['username'],
            self::TRADERS,
        );
    }

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        foreach (self::TRADERS as $trader) {
            $joinedDaysAgo = (int) $trader['joined_days_ago'];

            unset($trader['joined_days_ago']);

            Trader::query()->updateOrCreate(
                ['username' => (string) $trader['username']],
                [
                    ...$trader,
                    'joined_at' => now()->subDays($joinedDaysAgo),
                ],
            );
        }
    }
}
