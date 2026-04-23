<?php

namespace App\Console\Commands\Migration;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Migrates crm_event_types → event_types
 *
 * Legacy schema:  uid (PK), event_type, client_added
 * New schema:     id (PK), event_type, client_added, timestamps
 *
 * Run: php artisan migrate:event-types --legacy-db=crm_new
 */
class MigrateEventTypes extends Command
{
    protected $signature   = 'migrate:event-types {--legacy-db=crm_new : Name of the legacy database}';
    protected $description = 'Migrate crm_event_types → event_types';

    public function handle(): int
    {
        $legacyDb = $this->option('legacy-db');
        $this->info("Source: {$legacyDb}.crm_event_types");

        $rows = DB::connection('legacy')->table('crm_event_types')->get();
        $this->info("Found {$rows->count()} event types.");

        $bar = $this->output->createProgressBar($rows->count());
        $bar->start();

        $inserted = 0;

        foreach ($rows as $row) {
            $exists = DB::table('event_types')->where('id', $row->uid)->exists();

            if (! $exists) {
                DB::table('event_types')->insert([
                    'id'           => $row->uid,
                    'event_type'   => $row->event_type,
                    'client_added' => (bool) ($row->client_added ?? false),
                    'created_at'   => now(),
                    'updated_at'   => now(),
                ]);
                $inserted++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("Done. Inserted: {$inserted}, Skipped (already exist): " . ($rows->count() - $inserted));

        return self::SUCCESS;
    }
}
