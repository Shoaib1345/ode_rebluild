<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Blog posts for the public-facing website.
 * Maps to legacy crm_create_blog.
 *
 * status: 1=published, 0=draft/hidden
 * slug: SEO-friendly URL segment (derived from title — not in legacy, added for clean URLs)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('blogs', function (Blueprint $table) {
            $table->id();
            $table->string('title', 191);
            $table->string('slug', 191)->unique();
            $table->string('keywords', 191)->nullable();
            $table->text('description')->nullable();   // meta description
            $table->string('img_path', 191)->nullable();
            $table->longText('content')->nullable();   // HTML body (was "editor" in legacy)
            $table->integer('sort_order')->default(0);
            $table->tinyInteger('status')->default(1); // 1=published, 0=draft
            $table->timestamps();

            $table->index('status');
            $table->index('sort_order');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('blogs');
    }
};
