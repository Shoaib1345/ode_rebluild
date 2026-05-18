<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Enriches lead_actions with a structured action_type and a JSON meta bag.
 *
 * action_type values (see LeadAction constants):
 *   lead_created | email_sent | invoice_created | invoice_viewed | invoice_paid
 *   pdf_generated | coi_generated | agent_assigned | agent_unassigned
 *   note_added | follow_up_added | status_changed
 *   docusign_sent | docusign_completed | lead_viewed_by_agent
 *
 * meta is a free-form JSON bag for contextual data (invoice_id, email subject, etc.)
 * Rows created before this migration have action_type = NULL (treated as 'generic').
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lead_actions', function (Blueprint $table) {
            $table->string('action_type', 60)->nullable()->after('user_id');
            $table->json('meta')->nullable()->after('action_type');

            $table->index('action_type');
        });
    }

    public function down(): void
    {
        Schema::table('lead_actions', function (Blueprint $table) {
            $table->dropIndex(['action_type']);
            $table->dropColumn(['action_type', 'meta']);
        });
    }
};
