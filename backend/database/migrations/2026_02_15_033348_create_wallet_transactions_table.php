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
        Schema::create('wallet_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('wallet_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('asset_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('type', ['deposit', 'withdrawal', 'trade_buy', 'trade_sell', 'copy_allocation', 'copy_pnl']);
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->enum('direction', ['credit', 'debit']);
            $table->decimal('amount', 20, 8);
            $table->decimal('quantity', 24, 8)->nullable();
            $table->string('network')->nullable();
            $table->string('notes')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('occurred_at');
            $table->timestamps();

            $table->index(['wallet_id', 'occurred_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wallet_transactions');
    }
};
