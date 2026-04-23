<?php

namespace App\Console\Commands\Migration;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * Migrates crm_sales + crm_received_payments + crm_user_payments → new tables
 *
 * crm_sales → sales
 *   - affiliate_string → affiliate_string (affiliate tracking)
 *   - referral_string  → referral_string  (partner/agent tracking)
 *   - purchase_date    → purchase_date
 *
 * crm_received_payments → received_payments
 *   - uid → id
 *   - pay_policy_eff_date / pay_policy_exp_date → date columns
 *   - brocker_fee → broker_fee (fixed typo)
 *
 * crm_user_payments → user_payments
 *   - payment_date → date
 *
 * Run: php artisan migrate:sales-payments --legacy-db=crm_new
 */
class MigrateSalesAndPayments extends Command
{
    protected $signature   = 'migrate:sales-payments {--legacy-db=crm_new : Name of the legacy database}';
    protected $description = 'Migrate crm_sales, crm_received_payments, crm_user_payments';

    public function handle(): int
    {
        $legacyDb = $this->option('legacy-db');

        $this->migrateSales($legacyDb);
        $this->migrateReceivedPayments($legacyDb);
        $this->migrateUserPayments($legacyDb);

        return self::SUCCESS;
    }

    // ── Sales ─────────────────────────────────────────────────────────────────

    private function migrateSales(string $legacyDb): void
    {
        $this->info("\n── crm_sales → sales ──");
        $rows = DB::connection('legacy')->table('crm_sales')->get();
        $this->info("Found {$rows->count()} sales.");

        $inserted = 0;
        $skipped  = 0;

        foreach ($rows as $row) {
            if (DB::table('sales')->where('id', $row->id)->exists()) {
                $skipped++;
                continue;
            }

            // Only insert if the lead exists in new DB
            if (! DB::table('leads')->where('id', $row->lead_id)->exists()) {
                $this->warn("Skipping sale id={$row->id}: lead_id={$row->lead_id} not found.");
                continue;
            }

            DB::table('sales')->insert([
                'id'               => $row->id,
                'lead_id'          => $row->lead_id,
                'first_name'       => $row->first_name       ?? null,
                'last_name'        => $row->last_name        ?? null,
                'quantity'         => $row->quantity         ?? 1,
                'affiliate_string' => $row->affiliate_string ?? null,
                'referral_string'  => $row->referral_string  ?? null,
                'price'            => $row->price            ?? 0,
                'purchase_date'    => $this->parseDate($row->purchase_date),
                'created_at'       => $this->parseDate($row->purchase_date) ?? now(),
                'updated_at'       => now(),
            ]);
            $inserted++;
        }

        $this->info("Sales inserted: {$inserted}, Skipped: {$skipped}");
    }

    // ── Received Payments ─────────────────────────────────────────────────────

    private function migrateReceivedPayments(string $legacyDb): void
    {
        $this->info("\n── crm_received_payments → received_payments ──");
        $rows = DB::connection('legacy')->table('crm_received_payments')->get();
        $this->info("Found {$rows->count()} received payments.");

        $inserted = 0;
        $skipped  = 0;

        foreach ($rows as $row) {
            if (DB::table('received_payments')->where('id', $row->uid)->exists()) {
                $skipped++;
                continue;
            }

            if (! DB::table('leads')->where('id', $row->lead_id)->exists()) {
                $this->warn("Skipping received_payment uid={$row->uid}: lead_id={$row->lead_id} not found.");
                continue;
            }

            DB::table('received_payments')->insert([
                'id'                     => $row->uid,
                'lead_id'                => $row->lead_id,
                'payment_received_by'    => $row->payment_received_by ?? null,
                'payment_mode'           => $row->payment_mode        ?? null,
                'amount_received'        => $row->amount_received     ?? 0,
                'broker_fee'             => $row->brocker_fee         ?? 0,   // fixed typo
                'broker_fee_percentage'  => $row->brocker_fee_percentage ?? 0,
                'paypal_fee'             => $row->paypal_fee          ?? 0,
                'paypal_fee_percentage'  => $row->paypal_fee_percentage ?? 0,
                'tria_fee'               => $row->tria_fee            ?? 0,
                'trai_fee_percentage'    => $row->trai_fee_percentage ?? 0,
                'pay_policy_eff_date'    => $this->parseDate($row->pay_policy_eff_date),
                'pay_policy_exp_date'    => $this->parseDate($row->pay_policy_exp_date),
                'payment_carrier'        => $row->payment_carrier     ?? null,
                'comments'               => $row->comments            ?? null,
                'user_timezone'          => $row->user_timezone       ?? null,
                'created_at'             => $this->parseDate($row->time_stamp) ?? now(),
                'updated_at'             => now(),
            ]);
            $inserted++;
        }

        $this->info("Received payments inserted: {$inserted}, Skipped: {$skipped}");
    }

    // ── User Payments ─────────────────────────────────────────────────────────

    private function migrateUserPayments(string $legacyDb): void
    {
        $this->info("\n── crm_user_payments → user_payments ──");
        $rows = DB::connection('legacy')->table('crm_user_payments')->get();
        $this->info("Found {$rows->count()} user payments.");

        $inserted = 0;
        $skipped  = 0;

        foreach ($rows as $row) {
            if (DB::table('user_payments')->where('id', $row->id)->exists()) {
                $skipped++;
                continue;
            }

            if (! DB::table('users')->where('id', $row->user_id)->exists()) {
                $this->warn("Skipping user_payment id={$row->id}: user_id={$row->user_id} not found.");
                continue;
            }

            DB::table('user_payments')->insert([
                'id'           => $row->id,
                'user_id'      => $row->user_id,
                'payment'      => $row->payment      ?? 0,
                'payment_date' => $this->parseDate($row->payment_date),
                'notes'        => $row->notes        ?? null,
                'created_at'   => $this->parseDate($row->payment_date) ?? now(),
                'updated_at'   => now(),
            ]);
            $inserted++;
        }

        $this->info("User payments inserted: {$inserted}, Skipped: {$skipped}");
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function parseDate(?string $value): ?string
    {
        if (empty($value) || $value === '0000-00-00' || $value === '0000-00-00 00:00:00') {
            return null;
        }
        try {
            return Carbon::parse($value)->toDateString();
        } catch (\Exception) {
            return null;
        }
    }
}
