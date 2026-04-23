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
     * Add agent-specific commission fields to users.
     *
     * Per FULL-SPEC-V2.md §15, §25:
     *   commission_pct  — percentage of the lead premium (e.g. 10 = 10%)
     *   commission_flat — flat dollar amount per converted sale
     *   Agent formula:  (lead.premium × commission_pct / 100) + commission_flat
     *
     * Both default to 0 so existing users are unaffected.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->decimal('commission_pct', 5, 2)->default(0);
            $table->decimal('commission_flat', 10, 2)->default(0);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['commission_pct', 'commission_flat']);
        });
    }
};
