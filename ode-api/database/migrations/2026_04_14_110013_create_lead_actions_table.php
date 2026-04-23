<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Audit log of actions taken on a lead.
 * Maps to legacy crm_lead_actions.
 *
 * Auto-generated entries like "Payment Received", "Lead assigned to...", etc.
 * user_id = 0 in legacy means system-generated action.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_actions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')
                  ->constrained('leads')
                  ->cascadeOnDelete();
            $table->foreignId('user_id')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();
            $table->text('message');
            $table->string('user_timezone', 35)->nullable();
            $table->timestamps();

            $table->index('lead_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_actions');
    }
};
