<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('user_portfolios', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->decimal('cash_balance', 20, 8)->default(0);
            $table->decimal('holding_balance', 20, 8)->default(0);
            $table->decimal('profit_balance', 20, 8)->default(0);
            $table->decimal('asset_profit', 20, 8)->default(0);
            $table->decimal('copy_profit', 20, 8)->default(0);
            $table->decimal('funded_profit', 20, 8)->default(0);
            $table->decimal('investing_total', 20, 8)->default(0);
            $table->decimal('pnl_percent', 10, 4)->default(0);
            $table->timestamp('as_of')->nullable();
            $table->timestamps();
        });

        Schema::create('portfolio_events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('user_portfolio_id')->nullable()->constrained('user_portfolios')->nullOnDelete();
            $table->string('event_type', 64);
            $table->string('source_type', 120)->nullable();
            $table->string('source_id', 64)->nullable();
            $table->string('status', 20)->default('posted');
            $table->timestamp('occurred_at');

            $table->decimal('cash_delta', 20, 8)->default(0);
            $table->decimal('holding_delta', 20, 8)->default(0);
            $table->decimal('profit_delta', 20, 8)->default(0);
            $table->decimal('asset_profit_delta', 20, 8)->default(0);
            $table->decimal('copy_profit_delta', 20, 8)->default(0);
            $table->decimal('funded_profit_delta', 20, 8)->default(0);

            $table->decimal('cash_balance_after', 20, 8)->default(0);
            $table->decimal('holding_balance_after', 20, 8)->default(0);
            $table->decimal('profit_balance_after', 20, 8)->default(0);
            $table->decimal('asset_profit_after', 20, 8)->default(0);
            $table->decimal('copy_profit_after', 20, 8)->default(0);
            $table->decimal('funded_profit_after', 20, 8)->default(0);
            $table->decimal('investing_total_after', 20, 8)->default(0);
            $table->decimal('pnl_percent_after', 10, 4)->default(0);

            $table->json('metadata')->nullable();
            $table->foreignUuid('created_by_admin_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['user_id', 'occurred_at']);
            $table->index(['event_type', 'occurred_at']);
            $table->index(['source_type', 'source_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('portfolio_events');
        Schema::dropIfExists('user_portfolios');
    }
};
