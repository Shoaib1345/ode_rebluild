<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Commissions table — tracks every commission owed or paid to a user.
 *
 * Commission types (per FULL-SPEC-V2.md §14, §15, §16, §25):
 *   affiliate : $10 per converted lead  (role access_level = 6)
 *   agent     : (premium × pct/100) + flat  (access_level = 7)
 *   planner   : $15 per converted lead  (access_level = 8)
 *   customer  : $5 per referred converted lead  (access_level = 5)
 *
 * Idempotency: unique index on (lead_id, type) prevents duplicate accruals.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('commissions', function (Blueprint $table) {
            $table->id();

            // Who earns this commission
            $table->foreignId('user_id')
                  ->constrained('users')
                  ->cascadeOnDelete();

            // Which lead triggered it
            $table->foreignId('lead_id')
                  ->constrained('leads')
                  ->cascadeOnDelete();

            // Dollar amount owed
            $table->decimal('amount', 10, 2);

            // Role-based type — determines the accrual formula used
            $table->enum('type', ['affiliate', 'agent', 'planner', 'customer']);

            // Lifecycle
            $table->enum('status', ['accrued', 'paid'])->default('accrued')->index();
            $table->timestamp('accrued_at')->useCurrent();
            $table->timestamp('paid_at')->nullable();
            $table->string('paid_method', 50)->nullable(); // Zelle, Check, ACH, Wire
            $table->text('paid_note')->nullable();

            $table->timestamps();

            // Prevent double-accrual for the same lead + commission type
            $table->unique(['lead_id', 'type']);

            $table->index(['user_id', 'status']);
            $table->index('accrued_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('commissions');
    }
};
