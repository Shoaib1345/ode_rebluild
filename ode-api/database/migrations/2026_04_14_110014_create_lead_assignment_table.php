<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Pivot: which agents/staff are assigned to a lead.
 * Maps to legacy crm_lead_assignment.
 *
 * A lead can be assigned to multiple users simultaneously.
 * Unique constraint prevents duplicate assignments.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_assignment', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')
                  ->constrained('leads')
                  ->cascadeOnDelete();
            $table->foreignId('user_id')
                  ->constrained('users')
                  ->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['lead_id', 'user_id']);
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_assignment');
    }
};
