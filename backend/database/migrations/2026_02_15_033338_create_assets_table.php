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
        Schema::create('assets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('symbol')->unique();
            $table->string('name');
            $table->enum('type', ['stock', 'crypto', 'etf', 'share']);
            $table->decimal('current_price', 20, 8);
            $table->decimal('change_percent', 10, 4)->default(0);
            $table->decimal('change_value', 20, 8)->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['type', 'symbol']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('assets');
    }
};
