<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->decimal('balance', 20, 8)->default(0)->after('password');
            $table->decimal('profit_balance', 20, 8)->default(0)->after('balance');
            $table->decimal('holding_balance', 20, 8)->default(0)->after('profit_balance');
        });

        if (! Schema::hasTable('wallets')) {
            return;
        }

        $wallets = DB::table('wallets')
            ->select(['user_id', 'cash_balance', 'profit_loss', 'investing_balance'])
            ->get();

        foreach ($wallets as $wallet) {
            DB::table('users')
                ->where('id', $wallet->user_id)
                ->update([
                    'balance' => $wallet->cash_balance,
                    'profit_balance' => $wallet->profit_loss,
                    'holding_balance' => $wallet->investing_balance,
                ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'balance',
                'profit_balance',
                'holding_balance',
            ]);
        });
    }
};
