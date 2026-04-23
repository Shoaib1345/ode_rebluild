<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Scheduled follow-up tasks for a lead.
 * Maps to legacy crm_lead_follow_up.
 *
 * user_id: the agent/staff the follow-up is assigned TO
 * created_by: the user who created the follow-up task
 * follow_up_date: legacy stored as varchar "12/04/2020" — normalized to date
 * status: 0 = pending, 1 = completed
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_follow_ups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')
                  ->constrained('leads')
                  ->cascadeOnDelete();
            $table->foreignId('user_id')
                  ->constrained('users')
                  ->cascadeOnDelete();
            $table->foreignId('created_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();
            $table->date('follow_up_date');
            $table->text('notes');
            $table->tinyInteger('status')->default(0); // 0=pending, 1=completed
            $table->timestamps();

            $table->index(['lead_id', 'status']);
            $table->index(['user_id', 'follow_up_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_follow_ups');
    }
};
