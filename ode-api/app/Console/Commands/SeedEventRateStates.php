<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SeedEventRateStates extends Command
{
    protected $signature   = 'ode:seed-rate-states';
    protected $description = 'Populate event_rate_states pivot from the legacy CSV states column in event_rates';

    public function handle(): int
    {
        $this->info('Reading event_rates.states CSV column...');

        $rates = DB::table('event_rates')
            ->whereNotNull('states')
            ->where('states', '!=', '')
            ->select('id', 'states')
            ->get();

        $this->info("Processing {$rates->count()} rate rows...");

        $inserted = 0;

        // Process in chunks to avoid memory exhaustion
        DB::table('event_rates')
            ->whereNotNull('states')
            ->where('states', '!=', '')
            ->select('id', 'states')
            ->orderBy('id')
            ->chunk(200, function ($chunk) use (&$inserted) {
                $rows = [];
                foreach ($chunk as $rate) {
                    $abbrevs = array_filter(
                        array_map('trim', explode(',', $rate->states))
                    );
                    foreach ($abbrevs as $abbrev) {
                        $code = strtoupper(substr($abbrev, 0, 2));
                        if (strlen($code) !== 2) {
                            continue;
                        }
                        $rows[] = [
                            'event_rate_id' => $rate->id,
                            'state_code'    => $code,
                        ];
                    }
                }
                if ($rows) {
                    DB::table('event_rate_states')->insertOrIgnore($rows);
                    $inserted += count($rows);
                }
            });

        $this->info("Done. Inserted {$inserted} state pivot rows.");

        return self::SUCCESS;
    }
}
