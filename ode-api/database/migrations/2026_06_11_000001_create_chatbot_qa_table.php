<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Admin-managed knowledge base for the public chatbot widget.
 *
 * Each row is one Q&A entry: a set of trigger keywords and the answer the bot
 * replies with. These are layered on top of the widget's built-in defaults
 * (admin entries take priority), and are uploaded/managed from the admin
 * dashboard (CSV import or single add).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chatbot_qa', function (Blueprint $table) {
            $table->id();
            $table->string('keywords', 500);   // pipe-separated trigger phrases
            $table->text('answer');
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chatbot_qa');
    }
};
