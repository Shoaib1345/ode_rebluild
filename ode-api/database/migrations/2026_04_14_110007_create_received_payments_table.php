<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Payments received against leads — logged by CRM staff.
 * Maps to legacy crm_received_payments.
 *
 * Payment modes (legacy tinyint):
 *   1 = Credit Card, 2 = PayPal, 3 = Cheque, 4 = Cash, 5 = Other, 6 = Stripe
 *
 * Fee columns store the actual dollar amount after the percentage is applied.
 * broker_fee_percentage / paypal_fee_percentage / tria_fee_percentage store
 * the rate used at time of payment for audit purposes.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('received_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')
                  ->constrained('leads')
                  ->cascadeOnDelete();
            $table->foreignId('payment_received_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();

            // Payment method
            $table->tinyInteger('payment_mode')->nullable();  // 1-6, see docblock
            $table->string('payment_carrier', 50)->nullable();
            $table->string('payment_received_other', 50)->nullable(); // mode=5 free text

            // Amounts
            $table->decimal('amount_received', 8, 2)->nullable();
            $table->string('broker_fee_percentage', 10)->nullable();
            $table->decimal('broker_fee', 8, 2)->nullable();
            $table->string('paypal_fee_percentage', 10)->nullable();
            $table->decimal('paypal_fee', 8, 2)->nullable();
            $table->string('tria_fee_percentage', 10)->nullable();
            $table->decimal('tria_fee', 8, 2)->nullable();

            // Policy dates
            $table->date('policy_effective_date')->nullable();
            $table->date('policy_expiry_date')->nullable();

            // Supporting docs / notes
            $table->mediumText('proof_of_payment')->nullable(); // base64 or file path
            $table->text('comments')->nullable();

            $table->string('user_timezone', 35)->nullable();
            $table->timestamps();

            $table->index('lead_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('received_payments');
    }
};
