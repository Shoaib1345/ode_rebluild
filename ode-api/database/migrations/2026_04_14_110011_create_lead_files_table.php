<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * File attachments uploaded against a lead.
 * Maps to legacy crm_lead_files.
 *
 * path: S3 URL or local path to the file.
 * category: e.g. "Quote", "Application", "Certificate", "Signed Acceptance"
 * send_to_customer: whether this file is visible on the customer portal
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')
                  ->constrained('leads')
                  ->cascadeOnDelete();
            $table->string('name', 155)->nullable();
            $table->string('category', 100)->nullable();
            $table->text('comments')->nullable();
            $table->text('path');
            $table->boolean('send_to_customer')->default(false);
            $table->string('user_timezone', 35)->nullable();
            $table->timestamps();

            $table->index('lead_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_files');
    }
};
