<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * W9 uploads table.
 *
 * Affiliates, agents, planners, and customers must upload a W9 before
 * their commission dollar amounts become visible (FULL-SPEC-V2.md §14, §21, §25).
 *
 * One user may have multiple uploads (re-upload for corrections). The most
 * recent row is considered the current W9. A user is "verified" when the
 * most recent row has a non-null verified_at.
 *
 * Files stored at: referrals/{userId}-w9-{timestamp}.pdf  (per §21.2)
 * Access: private — served only via signed URL.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('w9_uploads', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                  ->constrained('users')
                  ->cascadeOnDelete();

            // S3 / local storage path
            $table->string('file_path');
            $table->string('file_name');                 // original filename shown in UI
            $table->unsignedBigInteger('file_size');     // bytes

            // Admin verification
            $table->timestamp('verified_at')->nullable();
            $table->foreignId('verified_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();

            $table->timestamps();

            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('w9_uploads');
    }
};
