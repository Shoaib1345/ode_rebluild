<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Pivot: event_rates ↔ US states.
 *
 * Legacy system stored states as a CSV string in crm_event_rates.states
 * e.g. "CA, NY, TX, FL"
 * This table normalizes that into proper rows.
 *
 * state_code = 2-letter US abbreviation (e.g. "CA", "NY")
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('event_rate_states', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_rate_id')
                  ->constrained('event_rates')
                  ->cascadeOnDelete();
            $table->char('state_code', 2);

            $table->unique(['event_rate_id', 'state_code']);
            $table->index('state_code');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_rate_states');
    }
};
