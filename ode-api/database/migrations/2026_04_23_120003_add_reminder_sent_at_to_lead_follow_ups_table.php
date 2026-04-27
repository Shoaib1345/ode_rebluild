<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tracks when the automated reminder email was sent for a follow-up.
 *
 * Separate from `status` (which tracks staff completion) — a follow-up can have
 * its reminder email sent but still be "pending" until the staff member acts on it.
 *
 * Per FULL-SPEC-V2.md §18.2:
 *   SendFollowUpRemindersJob fires hourly for follow_ups WHERE reminder not yet sent
 *   AND follow_up_date <= today.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lead_follow_ups', function (Blueprint $table) {
            $table->timestamp('reminder_sent_at')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('lead_follow_ups', function (Blueprint $table) {
            $table->dropColumn('reminder_sent_at');
        });
    }
};
