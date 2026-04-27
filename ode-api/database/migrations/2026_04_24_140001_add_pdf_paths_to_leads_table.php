<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add PDF storage paths to the leads table (§22).
 *
 * Paths are relative to the storage disk root.
 *   policy_pdf_path  → policies/{leadId}.pdf
 *   receipt_pdf_path → receipts/{leadId}-receipt.pdf
 *   coi_pdf_path     → cois/filled_claims/{leadId}-coi.pdf
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->string('policy_pdf_path', 255)->nullable()->after('closing_reason');
            $table->string('receipt_pdf_path', 255)->nullable()->after('policy_pdf_path');
            $table->string('coi_pdf_path', 255)->nullable()->after('receipt_pdf_path');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn(['policy_pdf_path', 'receipt_pdf_path', 'coi_pdf_path']);
        });
    }
};
