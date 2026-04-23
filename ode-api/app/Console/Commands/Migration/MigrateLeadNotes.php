<?php

namespace App\Console\Commands\Migration;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Migrates crm_lead_notes → lead_notes
 *
 * Legacy schema: id, lead_id, added_by, added_for, message, date_added, user_timezone
 * New schema:    id, lead_id, added_by (FK users), message, user_timezone, timestamps
 *
 * Run: php artisan migrate:lead-notes --legacy-db=crm_new
 */
class MigrateLeadNotes extends Command
{
    protected $signature   = 'migrate:lead-notes {--legacy-db=crm_new : Name of the legacy database}';
    protected $description = 'Migrate crm_lead_notes → lead_notes';

    public function handle(): int
    {
        $legacyDb = $this->option('legacy-db');
        $this->info("Source: {$legacyDb}.crm_lead_notes");

        $rows = DB::connection('legacy')->table('crm_lead_notes')->get();
        $this->info("Found {$rows->count()} notes.");

        $bar = $this->output->createProgressBar($rows->count());
        $bar->start();

        $inserted = 0;
        $skipped  = 0;

        foreach ($rows as $row) {
            if (DB::table('lead_notes')->where('id', $row->id)->exists()) {
                $skipped++;
                $bar->advance();
                continue;
            }

            // Skip orphaned notes
            if (! DB::table('leads')->where('id', $row->lead_id)->exists()) {
                $skipped++;
                $bar->advance();
                continue;
            }

            // added_by must be a valid user or null
            $addedBy = null;
            if (! empty($row->added_by) && DB::table('users')->where('id', $row->added_by)->exists()) {
                $addedBy = $row->added_by;
            }

            DB::table('lead_notes')->insert([
                'id'            => $row->id,
                'lead_id'       => $row->lead_id,
                'added_by'      => $addedBy,
                'message'       => $row->message       ?? '',
                'user_timezone' => $row->user_timezone ?? null,
                'created_at'    => $row->date_added    ?? now(),
                'updated_at'    => $row->date_added    ?? now(),
            ]);
            $inserted++;
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("Done. Inserted: {$inserted}, Skipped: {$skipped}");

        return self::SUCCESS;
    }
}
