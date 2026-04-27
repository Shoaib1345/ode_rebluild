<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Email templates — admin-managed DB-stored templates for automated emails.
 *
 * Template keys match FULL-SPEC-V2.md §18.4:
 *   quote_submitted | payment_receipt | follow_up_reminder | post_event
 *   7day_saved      | 7day_invoice    | invoice_sent
 *
 * Variable substitution uses {variableName} syntax.
 * e.g. "Hi {firstName}," in the subject or body.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('email_templates', function (Blueprint $table) {
            $table->id();

            // Unique identifier used in code (e.g. EmailService::sendToLead($lead, 'post_event'))
            $table->string('key', 50)->unique();

            $table->string('subject', 255);

            // HTML body — rendered with {variable} substitution
            $table->longText('body');

            // Metadata: list of supported variables for the admin editor
            // Format: [{"name": "firstName", "description": "Recipient first name"}]
            $table->json('variables')->nullable();

            $table->boolean('is_active')->default(true);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_templates');
    }
};
