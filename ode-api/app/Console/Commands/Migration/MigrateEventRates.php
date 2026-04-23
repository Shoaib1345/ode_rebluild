<?php

namespace App\Console\Commands\Migration;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Migrates crm_event_rates → event_rates + event_rate_states
 *
 * Legacy `states` column: comma-separated state abbreviations (e.g. "CA,NY,TX")
 * New schema: event_rate_states join table (event_rate_id, state_id)
 *
 * Run: php artisan migrate:event-rates --legacy-db=crm_new
 */
class MigrateEventRates extends Command
{
    protected $signature   = 'migrate:event-rates {--legacy-db=crm_new : Name of the legacy database}';
    protected $description = 'Migrate crm_event_rates → event_rates + event_rate_states';

    public function handle(): int
    {
        $legacyDb = $this->option('legacy-db');
        $this->info("Source: {$legacyDb}.crm_event_rates");

        $rows = DB::connection('legacy')->table('crm_event_rates')->get();
        $this->info("Found {$rows->count()} rates.");

        // Build abbreviation → id map for us_states
        $stateMap = DB::table('us_states')
            ->pluck('id', 'abbreviation')
            ->toArray();

        $bar = $this->output->createProgressBar($rows->count());
        $bar->start();

        $rateInserted   = 0;
        $stateInserted  = 0;

        foreach ($rows as $row) {
            if (DB::table('event_rates')->where('id', $row->id)->exists()) {
                $bar->advance();
                continue;
            }

            DB::table('event_rates')->insert([
                'id'               => $row->id,
                'event_type_id'    => $row->event_type_id,
                'min_audience'     => $row->min_audience,
                'max_audience'     => $row->max_audience,
                'rate'             => $row->rate,
                'min_limit'        => $row->min_limit,
                'max_limit'        => $row->max_limit,
                'host_liquor'      => (bool) ($row->host_liquor ?? false),
                'liquor'           => (bool) ($row->liquor      ?? false),
                'noha'             => (bool) ($row->noha         ?? false),
                'w_o_s'            => (bool) ($row->w_o_s        ?? false),
                'p_a_n_c_b'        => (bool) ($row->p_a_n_c_b   ?? false),
                'e_a_i'            => (bool) ($row->e_a_i        ?? false),
                'carrier'          => $row->carrier              ?? null,
                'quote_instantly'  => (bool) ($row->quote_instantly ?? true),
                'bind_instantly'   => (bool) ($row->bind_instantly  ?? true),
                'same_day_coverage'=> (bool) ($row->same_day_coverage ?? false),
                'weekend_coverage' => (bool) ($row->weekend_coverage  ?? false),
                'limit_type'       => $row->limit_type   ?? null,
                'additional_people'=> $row->additional_people ?? null,
                'additional_charges'=> $row->additional_charges ?? null,
                'created_at'       => now(),
                'updated_at'       => now(),
            ]);
            $rateInserted++;

            // Migrate state associations
            if (! empty($row->states)) {
                $abbrevs = array_filter(array_map('trim', explode(',', $row->states)));
                foreach ($abbrevs as $abbr) {
                    $stateId = $stateMap[strtoupper($abbr)] ?? null;
                    if ($stateId) {
                        DB::table('event_rate_states')->insertOrIgnore([
                            'event_rate_id' => $row->id,
                            'state_id'      => $stateId,
                        ]);
                        $stateInserted++;
                    }
                }
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("Rates inserted: {$rateInserted}");
        $this->info("State associations inserted: {$stateInserted}");

        return self::SUCCESS;
    }
}
