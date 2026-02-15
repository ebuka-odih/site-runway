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
        Schema::create('traders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('display_name');
            $table->string('username')->unique();
            $table->string('avatar_color')->nullable();
            $table->string('strategy');
            $table->decimal('total_return', 10, 4)->default(0);
            $table->decimal('win_rate', 6, 2)->default(0);
            $table->unsignedInteger('copiers_count')->default(0);
            $table->unsignedTinyInteger('risk_score')->default(5);
            $table->timestamp('joined_at');
            $table->boolean('is_verified')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['is_active', 'total_return']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('traders');
    }
};
