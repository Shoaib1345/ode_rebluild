<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Customer / lead support chat.
 *
 * Each row is a single message in the conversation tied to one lead. A lead's
 * messages, ordered by created_at, form a threaded conversation between the
 * customer and the admin/CSR team.
 *
 *   direction = 'in'  → message FROM the customer/lead (inbound to support)
 *   direction = 'out' → message FROM an admin/CSR (outbound to the customer)
 *
 * read_at is set when the *recipient* reads the message:
 *   - inbound  messages are marked read when an admin opens the thread
 *   - outbound messages are marked read when the customer opens the thread
 *
 * user_id is the sender's user row (nullable — an inbound message can come from
 * a guest lead that has no account yet).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_messages', function (Blueprint $table) {
            $table->id();

            $table->foreignId('lead_id')
                  ->constrained('leads')
                  ->cascadeOnDelete();

            $table->foreignId('user_id')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();

            $table->enum('direction', ['in', 'out'])->index();
            $table->text('body');
            $table->timestamp('read_at')->nullable();

            $table->timestamps();

            $table->index(['lead_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_messages');
    }
};
