<?php

namespace App\Console\Commands\Migration;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Migrates crm_create_blog + crm_create_page → blogs + pages
 *
 * crm_create_blog → blogs
 *   - editor → content (column rename)
 *   - blog_order → sort_order
 *   - slug: generated from title (not in legacy)
 *
 * crm_create_page → pages
 *   - editor → editor_content
 *   - page_order → sort_order
 *   - parent_page → parent_page_id
 *   - event_type → event_type_id
 *   - slug: generated from title (not in legacy)
 *
 * Run: php artisan migrate:blog-pages --legacy-db=crm_new
 */
class MigrateBlogAndPages extends Command
{
    protected $signature   = 'migrate:blog-pages {--legacy-db=crm_new : Name of the legacy database}';
    protected $description = 'Migrate crm_create_blog + crm_create_page → blogs + pages';

    public function handle(): int
    {
        $legacyDb = $this->option('legacy-db');

        $this->migrateBlog($legacyDb);
        $this->migratePages($legacyDb);

        return self::SUCCESS;
    }

    // ── Blog ─────────────────────────────────────────────────────────────────

    private function migrateBlog(string $legacyDb): void
    {
        $this->info("\n── crm_create_blog → blogs ──");
        $rows = DB::connection('legacy')->table('crm_create_blog')->get();
        $this->info("Found {$rows->count()} blog posts.");

        $inserted = 0;
        $skipped  = 0;

        foreach ($rows as $row) {
            if (DB::table('blogs')->where('id', $row->id)->exists()) {
                $skipped++;
                continue;
            }

            $slug = $this->uniqueSlug('blogs', $row->title ?? 'post-' . $row->id);

            DB::table('blogs')->insert([
                'id'          => $row->id,
                'title'       => $row->title      ?? '',
                'slug'        => $slug,
                'keywords'    => $row->keywords   ?? null,
                'description' => $row->description ?? null,
                'img_path'    => $row->img_path   ?? null,
                'content'     => $row->editor     ?? null,   // column rename
                'sort_order'  => $row->blog_order ?? 0,
                'status'      => (int) ($row->status ?? 1),
                'created_at'  => now(),
                'updated_at'  => now(),
            ]);
            $inserted++;
        }

        $this->info("Blog posts inserted: {$inserted}, Skipped: {$skipped}");
    }

    // ── Pages ─────────────────────────────────────────────────────────────────

    private function migratePages(string $legacyDb): void
    {
        $this->info("\n── crm_create_page → pages ──");
        $rows = DB::connection('legacy')->table('crm_create_page')->get();
        $this->info("Found {$rows->count()} pages.");

        $inserted = 0;
        $skipped  = 0;

        foreach ($rows as $row) {
            if (DB::table('pages')->where('id', $row->id)->exists()) {
                $skipped++;
                continue;
            }

            $slug = $this->uniqueSlug('pages', $row->title ?? 'page-' . $row->id);

            // Resolve event_type_id — legacy stores event type ID in `event_type` column
            $eventTypeId = null;
            if (! empty($row->event_type) && is_numeric($row->event_type)) {
                if (DB::table('event_types')->where('id', $row->event_type)->exists()) {
                    $eventTypeId = (int) $row->event_type;
                }
            }

            // parent_page maps to parent_page_id (self-referential)
            $parentPageId = null;
            if (! empty($row->parent_page) && is_numeric($row->parent_page)) {
                $parentPageId = (int) $row->parent_page;
            }

            DB::table('pages')->insert([
                'id'              => $row->id,
                'title'           => $row->title          ?? '',
                'slug'            => $slug,
                'navbar_text'     => $row->navbar_text    ?? null,
                'meta_keywords'   => $row->keywords       ?? null,
                'meta_description'=> $row->description    ?? null,
                'parent_page_id'  => $parentPageId,
                'editor_content'  => $row->editor         ?? null,  // column rename
                'header_content'  => $row->header_content ?? null,
                'content_title'   => $row->content_title  ?? null,
                'banner_image'    => $row->banner_image   ?? null,
                'content_image'   => $row->content_image  ?? null,
                'tips_heading'    => $row->tips_heading   ?? null,
                'tip1_text'       => $row->tip1_text      ?? null,
                'tip2_text'       => $row->tip2_text      ?? null,
                'tip3_text'       => $row->tip3_text      ?? null,
                'tip1_image'      => $row->tip1_image     ?? null,
                'tip2_image'      => $row->tip2_image     ?? null,
                'tip3_image'      => $row->tip3_image     ?? null,
                'event_type_id'   => $eventTypeId,
                'sort_order'      => $row->page_order     ?? 0,
                'add_to_menu'     => (bool) ($row->add_to_menu ?? false),
                'status'          => (int) ($row->status  ?? 1),
                'created_at'      => now(),
                'updated_at'      => now(),
            ]);
            $inserted++;
        }

        $this->info("Pages inserted: {$inserted}, Skipped: {$skipped}");
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function uniqueSlug(string $table, string $title): string
    {
        $base = Str::slug($title) ?: 'item';
        $slug = $base;
        $i    = 2;
        while (DB::table($table)->where('slug', $slug)->exists()) {
            $slug = $base . '-' . $i++;
        }
        return $slug;
    }
}
