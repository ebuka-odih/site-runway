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
            $table->string('username')->nullable()->unique()->after('id');
            $table->string('country')->nullable()->after('phone');
            $table->string('email_otp_code')->nullable()->after('remember_token');
            $table->timestamp('email_otp_expires_at')->nullable()->after('email_otp_code');
            $table->string('password_reset_otp_code')->nullable()->after('email_otp_expires_at');
            $table->timestamp('password_reset_otp_expires_at')->nullable()->after('password_reset_otp_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'username',
                'country',
                'email_otp_code',
                'email_otp_expires_at',
                'password_reset_otp_code',
                'password_reset_otp_expires_at',
            ]);
        });
    }
};
