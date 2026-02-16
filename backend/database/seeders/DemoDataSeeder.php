<?php

namespace Database\Seeders;

use App\Models\Asset;
use App\Models\CopyRelationship;
use App\Models\CopyTrade;
use App\Models\DepositRequest;
use App\Models\Order;
use App\Models\PortfolioSnapshot;
use App\Models\Trader;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Models\WatchlistItem;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $assets = collect([
            ['symbol' => 'BTC', 'name' => 'Bitcoin', 'type' => 'crypto', 'current_price' => 88325.00, 'change_percent' => -0.48, 'change_value' => -427.00],
            ['symbol' => 'ETH', 'name' => 'Ethereum', 'type' => 'crypto', 'current_price' => 3450.20, 'change_percent' => -0.23, 'change_value' => -8.00],
            ['symbol' => 'USDC', 'name' => 'USD Coin', 'type' => 'crypto', 'current_price' => 1.00, 'change_percent' => 0, 'change_value' => 0],
            ['symbol' => 'USDT', 'name' => 'Tether', 'type' => 'crypto', 'current_price' => 1.00, 'change_percent' => 0, 'change_value' => 0],
            ['symbol' => 'SOL', 'name' => 'Solana', 'type' => 'crypto', 'current_price' => 212.45, 'change_percent' => 5.80, 'change_value' => 12.30],
            ['symbol' => 'FTM', 'name' => 'Fantom', 'type' => 'crypto', 'current_price' => 0.62, 'change_percent' => 701.56, 'change_value' => 0.54],
            ['symbol' => 'AMD', 'name' => 'Advanced Micro Devices', 'type' => 'stock', 'current_price' => 145.20, 'change_percent' => 50.90, 'change_value' => 3634.00],
            ['symbol' => 'QQQ', 'name' => 'Invesco QQQ Trust', 'type' => 'etf', 'current_price' => 425.10, 'change_percent' => 12.50, 'change_value' => 11335.00],
            ['symbol' => 'AAPL', 'name' => 'Apple Inc.', 'type' => 'stock', 'current_price' => 273.08, 'change_percent' => -0.25, 'change_value' => -0.68],
            ['symbol' => 'MSFT', 'name' => 'Microsoft Corporation', 'type' => 'stock', 'current_price' => 486.99, 'change_percent' => 2.10, 'change_value' => 10.02],
            ['symbol' => 'TSLA', 'name' => 'Tesla Inc.', 'type' => 'stock', 'current_price' => 454.43, 'change_percent' => -1.13, 'change_value' => -5.15],
            ['symbol' => 'NVDA', 'name' => 'NVIDIA Corporation', 'type' => 'stock', 'current_price' => 180.39, 'change_percent' => 1.45, 'change_value' => 2.57],
            ['symbol' => 'XOM', 'name' => 'Exxon Mobil Corporation', 'type' => 'stock', 'current_price' => 112.35, 'change_percent' => 5.61, 'change_value' => 5.96],
            ['symbol' => 'MA', 'name' => 'Mastercard Incorporated', 'type' => 'stock', 'current_price' => 425.67, 'change_percent' => 6.89, 'change_value' => 27.50],
            ['symbol' => 'MATIC', 'name' => 'Polygon', 'type' => 'crypto', 'current_price' => 0.65, 'change_percent' => 0.00, 'change_value' => 0],
            ['symbol' => 'TRX', 'name' => 'Tron', 'type' => 'crypto', 'current_price' => 0.28, 'change_percent' => -0.49, 'change_value' => -0.01],
            ['symbol' => 'APT', 'name' => 'Aptos', 'type' => 'crypto', 'current_price' => 1.69, 'change_percent' => -1.18, 'change_value' => -0.02],
            ['symbol' => 'SPY', 'name' => 'SPDR S&P 500 ETF Trust', 'type' => 'etf', 'current_price' => 602.31, 'change_percent' => 0.81, 'change_value' => 4.83],
            ['symbol' => 'GOOG', 'name' => 'Alphabet Inc. Class C', 'type' => 'stock', 'current_price' => 208.12, 'change_percent' => 0.47, 'change_value' => 0.98],
            ['symbol' => 'BRK.B', 'name' => 'Berkshire Hathaway Inc. Class B', 'type' => 'stock', 'current_price' => 517.77, 'change_percent' => 1.02, 'change_value' => 5.23],
            ['symbol' => 'JPM', 'name' => 'JPMorgan Chase & Co.', 'type' => 'stock', 'current_price' => 241.60, 'change_percent' => 0.91, 'change_value' => 2.18],
            ['symbol' => 'V', 'name' => 'Visa Inc.', 'type' => 'stock', 'current_price' => 334.25, 'change_percent' => 0.76, 'change_value' => 2.52],
        ])->mapWithKeys(function (array $asset) {
            $model = Asset::query()->create($asset);

            return [$asset['symbol'] => $model];
        });

        $user = User::query()->create([
            'username' => 'franklin',
            'name' => 'Franklin',
            'email' => 'tommygreymassey@yahoo.com',
            'password' => Hash::make('password'),
            'phone' => '+1 (555) 013-9302',
            'country' => 'United States',
            'is_admin' => false,
            'membership_tier' => 'free',
            'kyc_status' => 'pending',
            'notification_email_alerts' => true,
            'timezone' => 'America/New_York',
            'email_verified_at' => now(),
        ]);

        $wallet = Wallet::query()->create([
            'user_id' => $user->id,
            'cash_balance' => 2851035.83,
            'investing_balance' => 0,
            'profit_loss' => 0,
            'currency' => 'USD',
        ]);

        $positions = [
            ['symbol' => 'BTC', 'quantity' => 1.00, 'average_price' => 86500.00],
            ['symbol' => 'ETH', 'quantity' => 5.00, 'average_price' => 3200.00],
            ['symbol' => 'USDC', 'quantity' => 15439.00, 'average_price' => 1.00],
            ['symbol' => 'AMD', 'quantity' => 50.00, 'average_price' => 72.00],
            ['symbol' => 'QQQ', 'quantity' => 74.00, 'average_price' => 378.00],
        ];

        foreach ($positions as $position) {
            $user->positions()->create([
                'asset_id' => $assets[$position['symbol']]->id,
                'quantity' => $position['quantity'],
                'average_price' => $position['average_price'],
                'opened_at' => now()->subMonths(rand(2, 14)),
            ]);
        }

        $watchlistSymbols = ['BTC', 'FTM', 'SOL'];

        foreach ($watchlistSymbols as $index => $symbol) {
            WatchlistItem::query()->create([
                'user_id' => $user->id,
                'asset_id' => $assets[$symbol]->id,
                'sort_order' => $index + 1,
            ]);
        }

        $historyValues = [
            '09:00' => 2850000,
            '10:00' => 2875000,
            '11:00' => 2920000,
            '12:00' => 2900000,
            '13:00' => 2950000,
            '14:00' => 2980000,
            '15:00' => 3010000,
            '16:00' => 3020287.58,
        ];

        $snapshotDay = Carbon::now()->startOfDay();

        foreach ($historyValues as $time => $value) {
            [$hour, $minute] = explode(':', $time);

            PortfolioSnapshot::query()->create([
                'user_id' => $user->id,
                'value' => $value,
                'buying_power' => 2851035.83,
                'recorded_at' => $snapshotDay->copy()->setTime((int) $hour, (int) $minute),
            ]);
        }

        $orders = [
            ['symbol' => 'AMD', 'side' => 'buy', 'quantity' => 50, 'price' => 72.00, 'placed_at' => now()->subDays(45)],
            ['symbol' => 'QQQ', 'side' => 'buy', 'quantity' => 74, 'price' => 378.00, 'placed_at' => now()->subDays(34)],
            ['symbol' => 'BTC', 'side' => 'buy', 'quantity' => 1, 'price' => 86500.00, 'placed_at' => now()->subDays(30)],
            ['symbol' => 'ETH', 'side' => 'buy', 'quantity' => 5, 'price' => 3200.00, 'placed_at' => now()->subDays(18)],
            ['symbol' => 'SOL', 'side' => 'buy', 'quantity' => 12, 'price' => 188.00, 'placed_at' => now()->subDays(12)],
        ];

        foreach ($orders as $row) {
            Order::query()->create([
                'user_id' => $user->id,
                'asset_id' => $assets[$row['symbol']]->id,
                'side' => $row['side'],
                'order_type' => 'market',
                'status' => 'filled',
                'quantity' => $row['quantity'],
                'requested_price' => $row['price'],
                'average_fill_price' => $row['price'],
                'total_value' => $row['quantity'] * $row['price'],
                'placed_at' => $row['placed_at'],
                'filled_at' => $row['placed_at']->copy()->addSeconds(4),
            ]);
        }

        $walletTransactions = [
            ['type' => 'deposit', 'status' => 'approved', 'direction' => 'credit', 'amount' => 100000.00, 'symbol' => 'ETH', 'occurred_at' => Carbon::parse('2025-12-16 10:20:00')],
            ['type' => 'deposit', 'status' => 'approved', 'direction' => 'credit', 'amount' => 5000.00, 'symbol' => 'USDT', 'occurred_at' => Carbon::parse('2025-12-16 11:10:00')],
            ['type' => 'deposit', 'status' => 'approved', 'direction' => 'credit', 'amount' => 800000.00, 'symbol' => 'USDT', 'occurred_at' => Carbon::parse('2025-12-05 14:15:00')],
            ['type' => 'withdrawal', 'status' => 'approved', 'direction' => 'debit', 'amount' => 5000.00, 'symbol' => 'USDT', 'occurred_at' => Carbon::parse('2025-12-24 09:05:00')],
        ];

        foreach ($walletTransactions as $transaction) {
            $assetId = $assets->get($transaction['symbol'])?->id;

            WalletTransaction::query()->create([
                'wallet_id' => $wallet->id,
                'asset_id' => $assetId,
                'type' => $transaction['type'],
                'status' => $transaction['status'],
                'direction' => $transaction['direction'],
                'amount' => $transaction['amount'],
                'network' => $transaction['symbol'] === 'USDT' ? 'ERC 20' : null,
                'occurred_at' => $transaction['occurred_at'],
            ]);
        }

        DepositRequest::query()->create([
            'wallet_id' => $wallet->id,
            'asset_id' => $assets['USDT']->id,
            'amount' => 15000,
            'currency' => 'USDT',
            'network' => 'ERC 20',
            'wallet_address' => '0x906b2533218Df3581da06c697B51eF29f8c86381',
            'transaction_hash' => '0x18ef21f7c4e7a9bb8c7890abcd12344ef9012ab',
            'proof_path' => 'uploads/deposits/demo-proof-1.png',
            'status' => 'approved',
            'expires_at' => now()->subMinutes(10),
            'submitted_at' => now()->subMinutes(20),
            'processed_at' => now()->subMinutes(8),
        ]);

        $traders = collect([
            ['display_name' => 'Tommy Massey', 'username' => 'day_trading', 'avatar_color' => 'emerald', 'strategy' => 'day_trading', 'total_return' => 145.2, 'win_rate' => 68, 'copiers_count' => 1240, 'risk_score' => 4, 'joined_at' => now()->subDays(120), 'is_verified' => true],
            ['display_name' => 'THOMAS', 'username' => 'thomas_algo', 'avatar_color' => 'emerald', 'strategy' => 'day_trading', 'total_return' => 89.4, 'win_rate' => 52, 'copiers_count' => 2450, 'risk_score' => 3, 'joined_at' => now()->subDays(220), 'is_verified' => true],
            ['display_name' => 'Frank Taylor', 'username' => 'dca_momentum', 'avatar_color' => 'emerald', 'strategy' => 'DCA & MOMENTUM', 'total_return' => 210.5, 'win_rate' => 36, 'copiers_count' => 312, 'risk_score' => 6, 'joined_at' => now()->subDays(20), 'is_verified' => true],
            ['display_name' => 'Elite Trader', 'username' => 'scalp_master', 'avatar_color' => 'emerald', 'strategy' => 'SCALPING', 'total_return' => 12.4, 'win_rate' => 78, 'copiers_count' => 154, 'risk_score' => 2, 'joined_at' => now()->subDays(90), 'is_verified' => false],
            ['display_name' => 'Alpha Whale', 'username' => 'alpha_w', 'avatar_color' => 'blue', 'strategy' => 'LONG_TERM', 'total_return' => 340.1, 'win_rate' => 82, 'copiers_count' => 5600, 'risk_score' => 2, 'joined_at' => now()->subDays(360), 'is_verified' => true],
            ['display_name' => 'Neo Trader', 'username' => 'neo_1', 'avatar_color' => 'purple', 'strategy' => 'SCALPING', 'total_return' => 15.6, 'win_rate' => 91, 'copiers_count' => 45, 'risk_score' => 1, 'joined_at' => now()->subDays(7), 'is_verified' => false],
        ])->mapWithKeys(function (array $trader) {
            $model = Trader::query()->create(array_merge($trader, ['is_active' => true]));

            return [$trader['username'] => $model];
        });

        $firstRelationship = CopyRelationship::query()->create([
            'user_id' => $user->id,
            'trader_id' => $traders['day_trading']->id,
            'allocation_amount' => 100,
            'copy_ratio' => 2,
            'status' => 'active',
            'pnl' => 0,
            'trades_count' => 12,
            'started_at' => now()->subDays(15),
        ]);

        CopyRelationship::query()->create([
            'user_id' => $user->id,
            'trader_id' => $traders['thomas_algo']->id,
            'allocation_amount' => 100,
            'copy_ratio' => 2,
            'status' => 'active',
            'pnl' => 0,
            'trades_count' => 45,
            'started_at' => now()->subDays(9),
        ]);

        CopyTrade::query()->create([
            'copy_relationship_id' => $firstRelationship->id,
            'asset_id' => $assets['BTC']->id,
            'side' => 'buy',
            'quantity' => 0.005,
            'price' => 87940,
            'pnl' => 124.39,
            'executed_at' => now()->subDays(6),
            'metadata' => ['source' => 'leader_trade'],
        ]);

        CopyTrade::query()->create([
            'copy_relationship_id' => $firstRelationship->id,
            'asset_id' => $assets['ETH']->id,
            'side' => 'buy',
            'quantity' => 0.40,
            'price' => 3320,
            'pnl' => -14.50,
            'executed_at' => now()->subDays(3),
            'metadata' => ['source' => 'leader_trade'],
        ]);

        $investingValue = $user->positions()->with('asset')->get()->sum(fn ($position) => (float) $position->quantity * (float) $position->asset->current_price
        );

        $costBasis = $user->positions()->get()->sum(fn ($position) => (float) $position->quantity * (float) $position->average_price
        );

        $wallet->update([
            'investing_balance' => $investingValue,
            'profit_loss' => $investingValue - $costBasis,
        ]);
    }
}
