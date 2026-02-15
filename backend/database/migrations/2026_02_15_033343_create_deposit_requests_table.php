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
        Schema::create('deposit_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('wallet_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('asset_id')->nullable()->constrained()->nullOnDelete();
            $table->decimal('amount', 20, 8);
            $table->string('currency', 10);
            $table->string('network', 20)->nullable();
            $table->string('wallet_address');
            $table->string('transaction_hash')->nullable();
            $table->string('proof_path')->nullable();
            $table->enum('status', ['input', 'payment', 'processing', 'approved', 'rejected'])->default('input');
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            $table->index(['wallet_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('deposit_requests');
    }
};
