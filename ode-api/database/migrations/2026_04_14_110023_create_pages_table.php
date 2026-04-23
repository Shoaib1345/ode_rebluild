<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * CMS pages for the public-facing website (About, Terms, event landing pages, etc.).
 * Maps to legacy crm_create_page.
 *
 * parent_page_id: self-referential FK for nested pages
 * event_type_id:  links a page to a specific event type (for event landing pages)
 * add_to_menu:    whether the page appears in the main navigation
 * status:         1=active/published, 0=deactivated
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pages', function (Blueprint $table) {
            $table->id();
            $table->string('title', 191);
            $table->string('slug', 191)->unique();
            $table->string('navbar_text', 155)->nullable();   // label shown in nav
            $table->string('meta_keywords', 191)->nullable();
            $table->string('meta_description', 191)->nullable();
            $table->unsignedBigInteger('parent_page_id')->nullable();
            $table->text('editor_content')->nullable();       // main HTML body
            $table->text('header_content')->nullable();
            $table->string('content_title', 155)->nullable();
            $table->string('banner_image', 155)->nullable();
            $table->string('content_image', 155)->nullable();

            // Tips section (3 tips with text + image each)
            $table->string('tips_heading', 191)->nullable();
            $table->text('tip1_text')->nullable();
            $table->text('tip2_text')->nullable();
            $table->text('tip3_text')->nullable();
            $table->string('tip1_image', 155)->nullable();
            $table->string('tip2_image', 155)->nullable();
            $table->string('tip3_image', 155)->nullable();

            $table->foreignId('event_type_id')
                  ->nullable()
                  ->constrained('event_types')
                  ->nullOnDelete();
            $table->integer('sort_order')->default(0);
            $table->boolean('add_to_menu')->default(false);
            $table->tinyInteger('status')->default(1); // 1=active, 0=inactive
            $table->timestamps();

            $table->index('status');
            $table->index('add_to_menu');

            $table->foreign('parent_page_id')
                  ->references('id')->on('pages')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pages');
    }
};
