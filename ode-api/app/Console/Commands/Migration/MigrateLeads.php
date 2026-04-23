<?php

namespace App\Console\Commands\Migration;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * Migrates crm_leads → leads
 *
 * Key transformations:
 *  - Legacy PK: lead_id (VARCHAR 25, e.g. "L-001234") — discarded, new auto-increment id used
 *  - Legacy int `id` (bigint AI) preserved as new `id`
 *  - event_date: TEXT → date (parse m/d/Y or Y-m-d)
 *  - submission_status: "payment received" → "payment_received"
 *  - isOnHold → is_on_hold, isPriorityLead → is_priority_lead, isEmailBlocked → is_email_blocked
 *  - privateResidence → private_residence
 *  - comission_status typo → commission_status
 *  - contac_at_venue typo → contact_at_venue
 *  - leadOfferedPlans JSON preserved as lead_offered_plans
 *  - affiliate_string preserved as affiliate_string
 *  - referral_string preserved
 *  - event_state resolved to state_id via us_states
 *
 * Run: php artisan migrate:leads --legacy-db=crm_new [--chunk=500]
 */
class MigrateLeads extends Command
{
    protected $signature = 'migrate:leads
        {--legacy-db=crm_new : Name of the legacy database}
        {--chunk=500 : Number of records to process per batch}';

    protected $description = 'Migrate crm_leads → leads';

    /** Map legacy submission_status values to new enum values */
    private array $statusMap = [
        'tried'              => 'tried',
        'saved'              => 'saved',
        'mq'                 => 'mq',
        'plan_added_manually'=> 'plan_added_manually',
        'payment'            => 'payment',
        'payment_received'   => 'payment_received',
        'payment received'   => 'payment_received',  // legacy had space
        'finished'           => 'finished',
    ];

    public function handle(): int
    {
        $legacyDb  = $this->option('legacy-db');
        $chunkSize = (int) $this->option('chunk');

        $this->info("Source: {$legacyDb}.crm_leads (chunk={$chunkSize})");

        $total = DB::connection('legacy')->table('crm_leads')->count();
        $this->info("Total legacy leads: {$total}");

        // Build state abbreviation → id map
        $stateMap = DB::table('us_states')->pluck('id', 'abbreviation')->toArray();

        $bar = $this->output->createProgressBar($total);
        $bar->start();

        $inserted = 0;
        $skipped  = 0;
        $errors   = 0;

        DB::connection('legacy')
            ->table('crm_leads')
            ->orderBy('id')
            ->chunk($chunkSize, function ($rows) use (&$inserted, &$skipped, &$errors, $stateMap, $bar) {
                foreach ($rows as $row) {
                    if (DB::table('leads')->where('id', $row->id)->exists()) {
                        $skipped++;
                        $bar->advance();
                        continue;
                    }

                    try {
                        // Parse event_date
                        $eventDate = null;
                        if (! empty($row->event_date) && $row->event_date !== '0000-00-00') {
                            try {
                                // Try Y-m-d first, then m/d/Y
                                $eventDate = Carbon::parse($row->event_date)->toDateString();
                            } catch (\Exception) {
                                $eventDate = null;
                            }
                        }

                        // Resolve state_id
                        $abbr    = strtoupper(substr(trim($row->event_state ?? ''), 0, 2));
                        $stateId = $stateMap[$abbr] ?? null;

                        // Normalise submission_status
                        $legacyStatus = strtolower(trim($row->submission_status ?? 'tried'));
                        $status       = $this->statusMap[$legacyStatus] ?? 'tried';

                        DB::table('leads')->insert([
                            'id'                     => $row->id,
                            'affiliate_string'       => $row->affiliate_string    ?? null,
                            'referral_string'        => $row->referral_string     ?? null,
                            'user_id'                => $row->user_id             ?? null,
                            'event_type_id'          => $row->event_type          ?? null, // legacy stores event_type_id here
                            'event_type_label'       => null,                              // not in legacy
                            'when_event'             => $row->when_event          ?? null,
                            'event_date'             => $eventDate,
                            'start_time'             => $row->start_time          ?? null,
                            'state_id'               => $stateId,
                            'event_state'            => $abbr ?: null,
                            'event_name'             => $row->event_name          ?? null,
                            'no_of_people'           => $row->no_of_people        ?? null,
                            'event_past_2am'         => (bool) ($row->event_past_2am  ?? false),
                            'have_entry_fee'         => (bool) ($row->have_entry_fee  ?? false),
                            'event_description'      => $row->event_description   ?? null,
                            'alcohol_served'         => $row->alcohol_served      ?? null,
                            'alcohol_served_by'      => $row->alcohol_served_by   ?? null,
                            'alcohol_insurance'      => $row->alcohol_insurance   ?? null,
                            'alcohol_additional_insured' => $row->alcohol_additional_insured ?? null,
                            'is_sold_profitable'     => (bool) ($row->is_sold_profitable ?? false),
                            'special_activities'     => (bool) ($row->special_activities  ?? false),
                            'event_special_act_detail'=> $row->event_special_act_detail ?? null,
                            'bouncehouses'           => (bool) ($row->bouncehouses        ?? false),
                            'is_inflatables_coverage'=> (bool) ($row->is_inflatables_coverage ?? false),
                            'live_musical_performances'=> (bool) ($row->live_musical_performances ?? false),
                            'vendor_activity'        => $row->vendor_activity     ?? null,
                            'product'                => $row->product             ?? null,
                            'carrier'                => $row->carrier             ?? null,
                            'coverage_limit'         => $row->coverage_limit      ?? null,
                            'waiver_sub_status'      => (bool) ($row->waiver_sub_status ?? false),
                            'hired_status'           => (bool) ($row->hired_status       ?? false),
                            'primary_basis'          => (bool) ($row->primary_basis      ?? false),
                            'additional_insured'     => is_numeric($row->additional_insured ?? null) ? $row->additional_insured : null,
                            'lead_offered_plans'     => $row->leadOfferedPlans    ?? null,
                            'email'                  => $row->email               ?? null,
                            'phone'                  => $row->phone               ?? null,
                            'first_name'             => $row->first_name          ?? null,
                            'last_name'              => $row->last_name           ?? null,
                            'street'                 => $row->street              ?? null,
                            'city'                   => $row->city                ?? null,
                            'zip'                    => $row->zip                 ?? null,
                            'ins_first_name'         => $row->ins_first_name      ?? null,
                            'ins_last_name'          => $row->ins_last_name       ?? null,
                            'ins_street'             => $row->ins_street          ?? null,
                            'ins_city'               => $row->ins_city            ?? null,
                            'ins_state'              => strtoupper(substr(trim($row->ins_state ?? ''), 0, 2)) ?: null,
                            'ins_zip'                => $row->ins_zip             ?? null,
                            'venue_name'             => $row->venue_name          ?? null,
                            'contact_at_venue'       => $row->contac_at_venue     ?? null, // fixed typo
                            'venue_address'          => $row->venue_address       ?? null,
                            'venue_street'           => $row->venue_street        ?? null,
                            'venue_state'            => strtoupper(substr(trim($row->venue_state ?? ''), 0, 2)) ?: null,
                            'venue_zip'              => $row->venue_zip           ?? null,
                            'venue_contact_number'   => $row->venue_contact_number ?? null,
                            'venue_contact_email'    => $row->venue_contact_email  ?? null,
                            'private_residence'      => (bool) ($row->privateResidence ?? false),
                            'e_signature'            => $row->e_signature         ?? null,
                            'acknowledge'            => $row->acknowledge         ?? null,
                            'any_claims'             => $row->any_claims          ?? null,
                            'payment_id'             => $row->payment_id          ?? null,
                            'payment_status'         => (int) ($row->payment_status ?? 0),
                            'bound'                  => (bool) ($row->bound        ?? false),
                            'submission_status'      => $status,
                            'status'                 => (int) ($row->status        ?? 1),
                            'closing_reason'         => $row->closing_reason      ?? null,
                            'pending_ode_quote_link_id' => $row->pending_ode_quote_link_id ?? null,
                            'pending_quote_status'   => $row->pending_quote_status ?? null,
                            'pending_json_form_array'=> $row->pending_json_form_array ?? null,
                            'pending_changes'        => $row->pendingChanges      ?? null,
                            'donation_to'            => $row->donation_to         ?? null,
                            'prefilled_state_name'   => $row->prefilled_state_name ?? null,
                            'user_timezone'          => $row->user_timezone       ?? null,
                            'is_email_blocked'       => (bool) ($row->isEmailBlocked    ?? false),
                            'is_on_hold'             => (bool) ($row->isOnHold          ?? false),
                            'is_priority_lead'       => (bool) ($row->isPriorityLead    ?? false),
                            'commission_status'      => (int) ($row->comission_status    ?? 0), // fixed typo
                            'requoted_id'            => $row->requoted_id         ?? null,
                            'type'                   => $row->type                ?? null,
                            'is_charged_ticket'      => $row->isChargedTicket     ?? null,
                            'created_at'             => $row->date_added          ?? now(),
                            'updated_at'             => $row->date_updated        ?? $row->date_added ?? now(),
                        ]);
                        $inserted++;
                    } catch (\Exception $e) {
                        $errors++;
                        $this->warn("\nFailed lead id={$row->id}: " . $e->getMessage());
                    }

                    $bar->advance();
                }
            });

        $bar->finish();
        $this->newLine();
        $this->info("Done. Inserted: {$inserted}, Skipped: {$skipped}, Errors: {$errors}");

        return self::SUCCESS;
    }
}
