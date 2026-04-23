<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Log of all outbound emails sent for a lead.
 * Maps to legacy crm_lead_emails.
 *
 * status: 0 = visible in CRM, 1 = hidden
 * has_attachment: whether the email had a file attachment
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_emails', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')
                  ->constrained('leads')
                  ->cascadeOnDelete();
            $table->integer('email_msg_number')->nullable(); // internal message sequence
            $table->string('email_from', 100)->nullable();  // display name of sender
            $table->string('from_email_address', 191)->nullable();
            $table->string('subject', 191)->nullable();
            $table->text('message')->nullable();
            $table->text('mail_to')->nullable();
            $table->text('mail_cc')->nullable();
            $table->text('mail_bcc')->nullable();
            $table->boolean('has_attachment')->default(false);
            $table->tinyInteger('status')->default(0); // 0=show, 1=hidden
            $table->timestamps();

            $table->index('lead_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_emails');
    }
};
