<?php

namespace App\Console\Commands\Migration;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Migrates crm_users → users
 *
 * Key transformations:
 *  - user_name (email) → email
 *  - password: legacy is MD5 — replaced with a secure random bcrypt token.
 *    Users must reset their password via "Forgot Password" on first login.
 *  - user_role_id maps directly to role_id (same IDs used in new user_roles table)
 *  - crm_user_profile.first_name/last_name/phone pulled via JOIN
 *  - referral_string preserved
 *  - W9 → w9_status, W9_file → w9_file
 *  - is_agency preserved
 *  - isOnPayroll → is_on_payroll
 *
 * Run: php artisan migrate:users --legacy-db=crm_new
 */
class MigrateUsers extends Command
{
    protected $signature   = 'migrate:users {--legacy-db=crm_new : Name of the legacy database}';
    protected $description = 'Migrate crm_users + crm_user_profile → users';

    public function handle(): int
    {
        $legacyDb = $this->option('legacy-db');
        $this->info("Source: {$legacyDb}.crm_users + crm_user_profile");

        $users = DB::connection('legacy')
            ->table('crm_users as u')
            ->leftJoin('crm_user_profile as p', 'p.user_id', '=', 'u.id')
            ->select(
                'u.id',
                'u.agency_id',
                'u.user_name',       // email
                'u.user_role_id',
                'u.status',
                'u.referral_string',
                'u.W9',
                'u.W9_file',
                'u.is_agency',
                'u.isOnPayroll',
                'u.date_added',
                'p.first_name',
                'p.last_name',
                'p.phone',
            )
            ->get();

        $this->info("Found {$users->count()} users.");

        $bar = $this->output->createProgressBar($users->count());
        $bar->start();

        $inserted = 0;
        $skipped  = 0;

        foreach ($users as $u) {
            if (DB::table('users')->where('id', $u->id)->exists()) {
                $skipped++;
                $bar->advance();
                continue;
            }

            // Ensure email is present and unique
            $email = trim($u->user_name ?? '');
            if (empty($email)) {
                $this->warn("Skipping user id={$u->id}: no email.");
                $bar->advance();
                continue;
            }

            // Deduplicate email if already taken by a previously imported user
            $emailToUse = $email;
            if (DB::table('users')->where('email', $emailToUse)->exists()) {
                $emailToUse = 'legacy_' . $u->id . '_' . $email;
                $this->warn("Email collision for id={$u->id}, renamed to {$emailToUse}");
            }

            // Legacy passwords are MD5 — we cannot convert them.
            // Generate a random bcrypt password; user must reset via Forgot Password.
            $tempPassword = Hash::make(Str::random(32));

            // Ensure referral_string uniqueness
            $referralString = $u->referral_string ?? null;
            if ($referralString && DB::table('users')->where('referral_string', $referralString)->exists()) {
                $referralString = strtoupper(Str::random(8));
            }

            DB::table('users')->insert([
                'id'               => $u->id,
                'agency_id'        => $u->agency_id   ?? null,
                'role_id'          => $u->user_role_id ?? 5, // default customer
                'email'            => $emailToUse,
                'password'         => $tempPassword,
                'first_name'       => $u->first_name  ?? null,
                'last_name'        => $u->last_name   ?? null,
                'phone'            => $u->phone        ?? null,
                'status'           => (int) ($u->status ?? 1),
                'referral_string'  => $referralString,
                'w9_status'        => (bool) ($u->W9 ?? false),
                'w9_file'          => $u->W9_file ?? null,
                'is_agency'        => (bool) ($u->is_agency ?? false),
                'is_on_payroll'    => (bool) ($u->isOnPayroll ?? false),
                'created_at'       => $u->date_added ?? now(),
                'updated_at'       => $u->date_added ?? now(),
            ]);

            $inserted++;
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("Done. Inserted: {$inserted}, Skipped: {$skipped}");
        $this->warn('NOTE: All migrated user passwords have been randomised. Users must reset via Forgot Password.');

        return self::SUCCESS;
    }
}
