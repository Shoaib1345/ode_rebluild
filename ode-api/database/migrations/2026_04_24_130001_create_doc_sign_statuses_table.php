<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * DocuSign envelope tracking per lead (§20.3).
 *
 * One lead can have multiple envelopes (resend = new envelope).
 * The active envelope is always the most recent row for a given lead.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('doc_sign_statuses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained('leads')->cascadeOnDelete();
            $table->string('envelope_id', 191)->unique();
            // sent | delivered | completed | declined | voided
            $table->string('status', 30)->default('sent');
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('signed_at')->nullable();   // set when status = completed
            $table->timestamps();

            $table->index(['lead_id', 'created_at']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('doc_sign_statuses');
    }
};
