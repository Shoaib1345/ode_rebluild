<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * HTML email templates used when sending invoices.
 * Maps to legacy crm_invoice_templates.
 *
 * status: 0 = active, 1 = archived (legacy default was 0)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoice_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agency_id')
                  ->nullable()
                  ->constrained('agencies')
                  ->nullOnDelete();
            $table->string('name', 191);
            $table->text('template')->nullable();
            $table->foreignId('added_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();
            $table->foreignId('updated_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();
            $table->tinyInteger('status')->default(0); // 0=active, 1=archived
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_templates');
    }
};
