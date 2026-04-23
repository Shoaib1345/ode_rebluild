<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Creates agencies, user_roles, and users tables in dependency order.
 * agencies and user_roles must exist before users (FK constraints).
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── 1. Agencies ──────────────────────────────────────────────────────
        Schema::create('agencies', function (Blueprint $table) {
            $table->id();
            $table->string('agency_name');
            $table->json('modules_setup')->nullable();
            $table->timestamps();
        });

        // ── 2. User Roles ────────────────────────────────────────────────────
        // access_level mapping (matches legacy crm_users.user_role_id):
        //   0 = super_admin  1 = admin  2-4 = staff
        //   5 = customer  6 = affiliate  7 = agent  8 = planner/venue
        Schema::create('user_roles', function (Blueprint $table) {
            $table->id();
            $table->string('role_name');
            $table->tinyInteger('access_level')->default(5);
            $table->timestamps();
        });

        // ── 3. Users ─────────────────────────────────────────────────────────
        // Replaces legacy crm_users + crm_user_profile.
        // Passwords: bcrypt (replaces insecure MD5 from legacy system).
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agency_id')
                  ->nullable()
                  ->constrained('agencies')
                  ->nullOnDelete();
            $table->foreignId('role_id')
                  ->default(5)                 // default = customer
                  ->constrained('user_roles')
                  ->restrictOnDelete();
            $table->string('email')->unique();
            $table->string('password');        // bcrypt — never MD5
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('phone', 20)->nullable();
            $table->tinyInteger('status')->default(1); // 1=active, 0=inactive
            $table->string('referral_string', 50)->nullable()->unique();
            $table->boolean('w9_status')->default(false);
            $table->string('w9_file')->nullable();
            $table->boolean('is_agency')->default(false);
            $table->boolean('is_on_payroll')->default(false);
            $table->timestamp('email_verified_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();
        });

        // ── 4. Password Reset Tokens ─────────────────────────────────────────
        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        // ── 5. Sessions ───────────────────────────────────────────────────────
        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
        Schema::dropIfExists('user_roles');
        Schema::dropIfExists('agencies');
    }
};
