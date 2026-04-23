<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Change history log for a lead.
 * Maps to legacy crm_lead_changes.
 *
 * Human-readable HTML diff strings of what changed, who changed it, and when.
 * Used in the CRM lead detail view to show edit history.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_changes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')
                  ->constrained('leads')
                  ->cascadeOnDelete();
            $table->foreignId('changes_made_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();
            $table->text('changes');
            $table->string('user_timezone', 25)->nullable();
            $table->timestamps();

            $table->index('lead_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_changes');
    }
};
