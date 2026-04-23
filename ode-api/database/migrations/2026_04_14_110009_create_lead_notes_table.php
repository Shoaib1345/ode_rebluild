<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Staff notes on a lead.
 * Maps to legacy crm_lead_notes.
 *
 * added_for: legacy stored a CSV of user IDs (e.g. "29,18") — kept as string.
 * These are the users notified/tagged in the note, not a formal FK list.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')
                  ->constrained('leads')
                  ->cascadeOnDelete();
            $table->foreignId('added_by')
                  ->constrained('users')
                  ->cascadeOnDelete();
            $table->string('added_for', 191)->nullable(); // CSV of user IDs tagged
            $table->text('message');
            $table->string('user_timezone', 35)->nullable();
            $table->timestamps();

            $table->index('lead_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_notes');
    }
};
