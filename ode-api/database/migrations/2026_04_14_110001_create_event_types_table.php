<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Event types lookup table.
 * Maps to legacy crm_event_types (uid → id).
 * Examples: Wedding, Birthday Party, Concert, Baby Shower, Corporate Event
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('event_types', function (Blueprint $table) {
            $table->id();
            $table->string('event_type');
            // client_added = 1 means the event type was added by a client
            // (not shown in public quote dropdown)
            $table->boolean('client_added')->default(false);
            $table->timestamps();

            $table->index('event_type');
            $table->index('client_added');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('event_types');
    }
};
