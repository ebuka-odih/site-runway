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
        Schema::table('users', function (Blueprint $table) {
            $table->string('kyc_otp_code')->nullable()->after('password_reset_otp_expires_at');
            $table->timestamp('kyc_otp_expires_at')->nullable()->after('kyc_otp_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'kyc_otp_code',
                'kyc_otp_expires_at',
            ]);
        });
    }
};
