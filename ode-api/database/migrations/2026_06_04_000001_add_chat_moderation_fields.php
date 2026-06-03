<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Chat moderation:
 *   - leads.is_chat_blocked  → admin can disable a customer's chat entirely.
 *   - leads.chat_closed_at   → archive a resolved conversation (null = open).
 *   - lead_messages.is_internal → admin-only note the customer never sees.
 *   - lead_messages soft-deletes → admin can remove a spam/abuse message.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->boolean('is_chat_blocked')->default(false)->after('is_on_hold');
            $table->timestamp('chat_closed_at')->nullable()->after('is_chat_blocked');
        });

        Schema::table('lead_messages', function (Blueprint $table) {
            $table->boolean('is_internal')->default(false)->after('body');
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn(['is_chat_blocked', 'chat_closed_at']);
        });

        Schema::table('lead_messages', function (Blueprint $table) {
            $table->dropColumn('is_internal');
            $table->dropSoftDeletes();
        });
    }
};
