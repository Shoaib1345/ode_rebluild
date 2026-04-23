<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Invoice records sent to customers by CRM staff.
 * Consolidates legacy crm_sent_invoices (single-plan) and
 * crm_multiple_plan_invoice (multi-plan quote bundles) into one table.
 *
 * type:
 *   'single'     — one selected plan sent as a payment invoice
 *   'multi_plan' — multiple quote options sent for customer to choose
 *
 * encode_id: unique token used in the public payment URL (replaces legacy MD5 hash)
 * invoice_status: 0=unpaid, 1=paid
 *
 * Typos fixed: brocker_fee → broker_fee, total_permium → total_premium
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')
                  ->nullable()
                  ->constrained('leads')
                  ->nullOnDelete();
            $table->foreignId('created_by')
                  ->constrained('users')
                  ->cascadeOnDelete();

            // Invoice type
            $table->enum('type', ['single', 'multi_plan'])->default('single');

            // Public access token for payment link
            $table->string('encode_id', 64)->unique();

            // Recipient
            $table->string('first_name', 100)->nullable();
            $table->string('last_name', 100)->nullable();
            $table->string('email', 191)->nullable()->index();
            $table->string('email_cc', 155)->nullable();
            $table->string('email_bcc', 155)->nullable();
            $table->string('email_subject', 155)->nullable();

            // Coverage snapshot (single-plan invoices)
            $table->string('event_type', 155)->nullable();
            $table->string('carrier', 55)->nullable();
            $table->date('effective_date')->nullable();
            $table->date('expiration_date')->nullable();
            $table->unsignedInteger('min_limit')->nullable();
            $table->unsignedInteger('max_limit')->nullable();

            // Pricing snapshot
            $table->decimal('broker_fee', 8, 2)->nullable();
            $table->decimal('processing_fee', 8, 2)->nullable();
            $table->decimal('total_premium', 8, 2)->nullable();
            $table->decimal('total_payable', 8, 2)->nullable();

            // Insured address
            $table->string('street', 150)->nullable();
            $table->string('suite', 100)->nullable();
            $table->string('city', 55)->nullable();
            $table->char('state', 2)->nullable();
            $table->char('zip', 10)->nullable();

            // Multi-plan quotes JSON (type='multi_plan')
            $table->json('plans')->nullable();

            // Payment
            $table->tinyInteger('invoice_status')->default(0); // 0=unpaid, 1=paid
            $table->text('paypal_response')->nullable();
            $table->string('paypal_transaction_id', 155)->nullable();

            $table->string('user_timezone', 35)->nullable();
            $table->timestamps();

            $table->index(['lead_id', 'invoice_status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
