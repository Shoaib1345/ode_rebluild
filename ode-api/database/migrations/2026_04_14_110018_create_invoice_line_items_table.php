<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Fee line items on an invoice (premium, TRIA, Waiver of Subrogation, etc.).
 * Maps to legacy crm_invoice_additional_fee.
 *
 * fee_type: e.g. "Premium", "TRIA", "Waiver of Sub", "Liquor Lia", "Medical"
 * amount: decimal — was varchar in legacy (e.g. "98.75")
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoice_line_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')
                  ->constrained('invoices')
                  ->cascadeOnDelete();
            $table->unsignedInteger('quantity')->default(1);
            $table->string('policy', 155)->nullable();
            $table->string('fee_type', 50)->nullable();   // "Premium", "TRIA", etc.
            $table->decimal('amount', 8, 2)->default(0);
            $table->timestamps();

            $table->index('invoice_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_line_items');
    }
};
