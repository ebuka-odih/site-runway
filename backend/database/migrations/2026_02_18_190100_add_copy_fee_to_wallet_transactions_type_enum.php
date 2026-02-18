<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() !== 'mysql') {
            return;
        }

        DB::statement(
            "ALTER TABLE `wallet_transactions` MODIFY `type` ENUM('deposit', 'withdrawal', 'trade_buy', 'trade_sell', 'copy_allocation', 'copy_pnl', 'copy_fee') NOT NULL"
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() !== 'mysql') {
            return;
        }

        DB::table('wallet_transactions')
            ->where('type', 'copy_fee')
            ->update(['type' => 'copy_allocation']);

        DB::statement(
            "ALTER TABLE `wallet_transactions` MODIFY `type` ENUM('deposit', 'withdrawal', 'trade_buy', 'trade_sell', 'copy_allocation', 'copy_pnl') NOT NULL"
        );
    }
};
