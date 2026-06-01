<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Stores the named additional-insured parties for a lead.
 *
 * The leads.additional_insured column only holds the COUNT; this JSON column
 * holds the per-party details (name, relation, street, city, state, zip, email)
 * collected by the wizard's additional-insured step (legacy ODE10A), so the
 * certificate can name each additional insured.
 *
 * Shape: [{ name, relation, street, city, state, zip, email }, ...]
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->json('additional_insured_details')->nullable()->after('additional_insured');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn('additional_insured_details');
        });
    }
};
