<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Sales / completed purchase records.
 * Maps to legacy crm_sales.
 *
 * Created when a lead reaches payment_received / finished.
 * Drives affiliate commission reporting.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')
                  ->constrained('leads')
                  ->cascadeOnDelete();
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->unsignedInteger('quantity')->default(1);
            $table->string('affiliate_string', 100)->default('')->index();
            $table->string('referral_string', 100)->default('')->index();
            $table->decimal('price', 8, 2);
            $table->timestamp('purchase_date')->useCurrent();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};
