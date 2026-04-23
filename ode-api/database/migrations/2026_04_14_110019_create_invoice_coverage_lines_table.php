<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Coverage/benefit display lines on an invoice.
 * Maps to legacy crm_invoice_benefits.
 *
 * These are the GL limit rows shown on the invoice PDF:
 *   "Per Occurrence: $1 million"
 *   "Aggregate: $2 million"
 *   "Property Damage: $300,000"
 *   etc.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoice_coverage_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')
                  ->constrained('invoices')
                  ->cascadeOnDelete();
            $table->string('benefit_type', 155)->nullable();   // e.g. "Per Occurrence"
            $table->string('benefit_value', 55)->nullable();   // e.g. "$1 million"
            $table->timestamps();

            $table->index('invoice_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_coverage_lines');
    }
};
