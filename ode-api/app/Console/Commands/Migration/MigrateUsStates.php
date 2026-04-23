<?php

namespace App\Console\Commands\Migration;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Migrates crm_us_states → us_states
 *
 * Legacy schema:  id, name, abbreviation
 * New schema:     id, name, abbreviation, timestamps
 *
 * This is typically done first as other migrations depend on it.
 *
 * Run: php artisan migrate:us-states --legacy-db=crm_new
 */
class MigrateUsStates extends Command
{
    protected $signature   = 'migrate:us-states {--legacy-db=crm_new : Name of the legacy database}';
    protected $description = 'Migrate crm_us_states → us_states';

    public function handle(): int
    {
        $legacyDb = $this->option('legacy-db');
        $this->info("Source: {$legacyDb}.crm_us_states");

        $rows = DB::connection('legacy')->table('crm_us_states')->get();
        $this->info("Found {$rows->count()} states.");

        $inserted = 0;
        $skipped  = 0;

        foreach ($rows as $row) {
            if (DB::table('us_states')->where('id', $row->id)->exists()) {
                $skipped++;
                continue;
            }

            DB::table('us_states')->insert([
                'id'           => $row->id,
                'name'         => $row->name,
                'abbreviation' => $row->abbreviation,
                'created_at'   => now(),
                'updated_at'   => now(),
            ]);
            $inserted++;
        }

        $this->info("Done. Inserted: {$inserted}, Skipped: {$skipped}");

        return self::SUCCESS;
    }
}
