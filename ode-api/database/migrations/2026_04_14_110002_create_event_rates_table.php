<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Insurance rate table — the pricing source of truth.
 * Maps to legacy crm_event_rates.
 *
 * Each row = one carrier's rate for a specific event type + audience range + liquor combo.
 *
 * Add-on columns (noha, w_o_s, p_a_n_c_b, e_a_i) store the add-on cost OR:
 *   'N/A' = not available for this rate
 *   'M/Q' = manual quote required
 *
 * States are normalized into event_rate_states pivot table (was a CSV in legacy).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('event_rates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_type_id')
                  ->constrained('event_types')
                  ->cascadeOnDelete();

            // Insurance carrier
            $table->enum('carrier', ['ASI', 'FDEAN', 'IH']);

            // Audience size range this rate applies to
            $table->unsignedInteger('min_audience')->default(1);
            $table->unsignedInteger('max_audience')->default(9999);

            // Base premium in USD
            $table->decimal('rate', 8, 2);

            // GL policy limit range (used to retrieve limit options from carriers_gl_limits)
            $table->unsignedInteger('min_limit')->nullable();
            $table->unsignedInteger('max_limit')->nullable();
            $table->string('limit_type', 100)->nullable();

            // Alcohol options (both can't be 1 at the same time)
            $table->boolean('host_liquor')->default(false); // host provides alcohol
            $table->boolean('liquor')->default(false);       // alcohol sold for profit

            // Optional add-on costs (dollars) — 'N/A' or 'M/Q' as strings
            $table->string('noha', 20)->default('N/A');     // Non-Owned/Hired Auto
            $table->string('w_o_s', 20)->default('N/A');    // Waiver of Subrogation
            $table->string('p_a_n_c_b', 20)->default('N/A'); // Primary Additional Named
            $table->string('e_a_i', 20)->default('N/A');    // Employee/Additional Insured

            // Availability flags
            $table->boolean('same_day_coverage')->default(false);
            $table->boolean('weekend_coverage')->default(false);
            $table->boolean('quote_instantly')->default(true);
            $table->boolean('bind_instantly')->default(true);

            // Additional insured pricing
            $table->unsignedInteger('additional_people')->nullable();  // per N people
            $table->unsignedInteger('additional_charges')->nullable(); // costs this much

            $table->timestamps();

            $table->index(['event_type_id', 'carrier']);
            $table->index(['min_audience', 'max_audience']);
            $table->index('same_day_coverage');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_rates');
    }
};
