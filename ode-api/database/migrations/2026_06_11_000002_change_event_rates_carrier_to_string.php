<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Widen event_rates.carrier from ENUM('ASI','FDEAN','IH') to a short string so
 * the full legacy carrier set (adds K&K and HCC) can be stored. The pricing
 * engine keys off literal carrier strings (e.g. 'ASI', 'FDEAN'), so a varchar
 * is functionally equivalent and simply less restrictive.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('event_rates', function (Blueprint $table) {
            $table->string('carrier', 20)->change();
        });
    }

    public function down(): void
    {
        Schema::table('event_rates', function (Blueprint $table) {
            $table->enum('carrier', ['ASI', 'FDEAN', 'IH'])->change();
        });
    }
};
