<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    /**
     * Add explicit referral FK columns to leads.
     *
     * The existing `affiliate_string` column stores the text code of the
     * referring affiliate (matching users.referral_string). For planner and
     * customer referrals we use explicit FK columns for clarity and query
     * performance. Affiliate FK is also added to complement the string column.
     *
     * Per FULL-SPEC-V2.md §14, §15, §16:
     *   referred_by_affiliate_id — set when ?ref={user_id} or affiliate cookie present
     *   referred_by_planner_id   — set when ?planner={user_id} present
     *   referred_by_customer_id  — set when ?cref={user_id} present
     */
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->foreignId('referred_by_affiliate_id')
                  ->nullable()
                  ->after('referral_string')
                  ->constrained('users')
                  ->nullOnDelete();

            $table->foreignId('referred_by_planner_id')
                  ->nullable()
                  ->after('referred_by_affiliate_id')
                  ->constrained('users')
                  ->nullOnDelete();

            $table->foreignId('referred_by_customer_id')
                  ->nullable()
                  ->after('referred_by_planner_id')
                  ->constrained('users')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropForeign(['referred_by_affiliate_id']);
            $table->dropForeign(['referred_by_planner_id']);
            $table->dropForeign(['referred_by_customer_id']);
            $table->dropColumn([
                'referred_by_affiliate_id',
                'referred_by_planner_id',
                'referred_by_customer_id',
            ]);
        });
    }
};
