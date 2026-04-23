<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * GL limit options per carrier — used to build the coverage limit picker.
 * Maps to legacy crm_carriers_gl_limits.
 *
 * Each row is one line item in a coverage block (e.g. "Per Occurrence: $1 million").
 * Rows are grouped by min_limit + max_limit + carrier to form a complete GL package.
 *
 * carrier: matches event_rates.carrier enum values.
 * gl_limit: display string e.g. "$1 million", "$300,000 "
 * gl_limit_type: label e.g. "Per Occurrence", "Aggregate", "Medical"
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('carrier_gl_limits', function (Blueprint $table) {
            $table->id();
            $table->enum('carrier', ['ASI', 'FDEAN', 'IH']);
            $table->unsignedInteger('min_limit');
            $table->unsignedInteger('max_limit');
            $table->string('gl_limit', 30);        // display string e.g. "$1 million"
            $table->string('gl_limit_type', 50);   // label e.g. "Per Occurrence"
            $table->timestamps();

            $table->index(['carrier', 'min_limit', 'max_limit']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('carrier_gl_limits');
    }
};
