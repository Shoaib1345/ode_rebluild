<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * US States lookup table.
 * Maps to legacy crm_us_states.
 * Seeded from the 50 states + DC.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('us_states', function (Blueprint $table) {
            $table->id();
            $table->string('name');              // e.g. "California"
            $table->char('abbreviation', 2);     // e.g. "CA"
            $table->timestamps();

            $table->unique('abbreviation');
            $table->index('name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('us_states');
    }
};
