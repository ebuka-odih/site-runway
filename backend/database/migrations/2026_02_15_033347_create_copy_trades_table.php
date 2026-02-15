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
        Schema::create('copy_trades', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('copy_relationship_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('asset_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('side', ['buy', 'sell']);
            $table->decimal('quantity', 24, 8);
            $table->decimal('price', 20, 8);
            $table->decimal('pnl', 20, 8)->default(0);
            $table->timestamp('executed_at');
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['copy_relationship_id', 'executed_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('copy_trades');
    }
};
