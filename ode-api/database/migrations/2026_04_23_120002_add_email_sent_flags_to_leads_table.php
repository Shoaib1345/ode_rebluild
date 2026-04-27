<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Idempotency flags for automated emails sent to leads.
 * Prevents the scheduler from re-sending the same email on subsequent runs.
 *
 * Per FULL-SPEC-V2.md §18.2:
 *   post_event_email_sent  — set after SendPostEventEmailsJob fires for this lead
 *   seven_day_reminder_sent — set after Send7DayReminderJob fires (saved or MQ path)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->boolean('post_event_email_sent')->default(false)->after('is_email_blocked');
            $table->boolean('seven_day_reminder_sent')->default(false)->after('post_event_email_sent');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn(['post_event_email_sent', 'seven_day_reminder_sent']);
        });
    }
};
