<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Seeds the insurance pricing catalog — event types, carrier rates (ASI / FDEAN
 * / IH), and per-rate state availability — sourced from the legacy CRM
 * (crm_event_types + crm_event_rates).
 *
 * The data lives in a gzipped SQL dump (database/seeders/data/event_pricing.sql.gz)
 * so it is fully self-contained: no legacy database connection is required to
 * seed it. The dump TRUNCATEs the three tables before inserting, so the seeder
 * is idempotent and safe to re-run.
 */
class EventPricingSeeder extends Seeder
{
    public function run(): void
    {
        $path = database_path('seeders/data/event_pricing.sql.gz');

        if (! is_file($path)) {
            $this->command?->warn('event_pricing.sql.gz not found — skipping pricing seed.');
            return;
        }

        $sql = gzdecode((string) file_get_contents($path));

        if ($sql === false) {
            $this->command?->error('Could not decompress event_pricing.sql.gz.');
            return;
        }

        DB::unprepared($sql);

        $this->command?->info(sprintf(
            'Pricing seeded: %d event types, %d rates, %d state links.',
            DB::table('event_types')->count(),
            DB::table('event_rates')->count(),
            DB::table('event_rate_states')->count(),
        ));
    }
}
