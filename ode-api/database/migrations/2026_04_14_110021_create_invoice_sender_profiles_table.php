<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Agency sender profiles — the "From" identity shown on invoices.
 * Consolidates legacy crm_send_invoice_address_details,
 * crm_send_invoice_companyname, and crm_send_invoice_phone_details
 * into a single table.
 *
 * An agency can have multiple named profiles (e.g. different DBA names).
 * is_active: only active profiles appear in the invoice sender dropdown.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoice_sender_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agency_id')
                  ->constrained('agencies')
                  ->cascadeOnDelete();
            $table->string('company_name', 100);
            $table->string('contact_first_name', 32)->nullable();
            $table->string('contact_last_name', 32)->nullable();
            $table->string('phone', 32)->nullable();
            $table->string('phone_ext', 14)->nullable();
            $table->string('address', 191)->nullable();
            $table->string('address2', 191)->nullable();
            $table->string('city', 64)->nullable();
            $table->char('state', 4)->nullable();
            $table->string('zipcode', 12)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['agency_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_sender_profiles');
    }
};
