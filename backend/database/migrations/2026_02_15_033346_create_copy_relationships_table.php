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
        Schema::create('copy_relationships', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('trader_id')->constrained()->cascadeOnDelete();
            $table->decimal('allocation_amount', 20, 8);
            $table->decimal('copy_ratio', 6, 2)->default(1);
            $table->enum('status', ['active', 'paused', 'closed'])->default('active');
            $table->decimal('pnl', 20, 8)->default(0);
            $table->unsignedInteger('trades_count')->default(0);
            $table->timestamp('started_at');
            $table->timestamp('ended_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'trader_id']);
            $table->index(['user_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('copy_relationships');
    }
};
