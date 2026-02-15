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
        Schema::create('orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('asset_id')->constrained()->cascadeOnDelete();
            $table->enum('side', ['buy', 'sell']);
            $table->enum('order_type', ['market', 'limit'])->default('market');
            $table->enum('status', ['pending', 'filled', 'cancelled', 'rejected'])->default('pending');
            $table->decimal('quantity', 24, 8);
            $table->decimal('requested_price', 20, 8)->nullable();
            $table->decimal('average_fill_price', 20, 8)->nullable();
            $table->decimal('total_value', 20, 8)->nullable();
            $table->timestamp('placed_at');
            $table->timestamp('filled_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'placed_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
