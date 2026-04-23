<?php

namespace App\Console\Commands\Migration;

use Illuminate\Console\Command;

/**
 * Runs all legacy data migration commands in the correct dependency order.
 *
 * Order matters:
 *   1. us_states        — no deps
 *   2. event_types      — no deps
 *   3. event_rates      — depends on event_types + us_states
 *   4. users            — depends on user_roles (seeded, not migrated)
 *   5. leads            — depends on users, event_types, us_states
 *   6. lead_notes       — depends on leads + users
 *   7. sales_payments   — depends on leads + users
 *   8. blog_pages       — depends on event_types
 *
 * Run: php artisan migrate:all --legacy-db=crm_new
 * Dry run: php artisan migrate:all --dry-run
 */
class RunAllMigrations extends Command
{
    protected $signature = 'migrate:all
        {--legacy-db=crm_new : Name of the legacy database}
        {--dry-run : List commands that would run without executing them}
        {--chunk=500 : Chunk size for large table migrations}';

    protected $description = 'Run all legacy data migrations in dependency order';

    private array $commands = [
        ['migrate:us-states',       'US States'],
        ['migrate:event-types',     'Event Types'],
        ['migrate:event-rates',     'Event Rates + State Associations'],
        ['migrate:users',           'Users (from crm_users + crm_user_profile)'],
        ['migrate:leads',           'Leads'],
        ['migrate:lead-notes',      'Lead Notes'],
        ['migrate:sales-payments',  'Sales + Received Payments + User Payments'],
        ['migrate:blog-pages',      'Blog Posts + CMS Pages'],
    ];

    public function handle(): int
    {
        $legacyDb = $this->option('legacy-db');
        $dryRun   = $this->option('dry-run');
        $chunk    = $this->option('chunk');

        $this->info('═══════════════════════════════════════════════════');
        $this->info('  One Day Event — Legacy Data Migration');
        $this->info('  Source DB: ' . $legacyDb);
        $this->info($dryRun ? '  MODE: DRY RUN (no data written)' : '  MODE: LIVE');
        $this->info('═══════════════════════════════════════════════════');

        if ($dryRun) {
            $this->warn('Commands that would run:');
            foreach ($this->commands as [$cmd, $label]) {
                $this->line("  php artisan {$cmd} --legacy-db={$legacyDb}");
            }
            return self::SUCCESS;
        }

        $failed = [];

        foreach ($this->commands as [$cmd, $label]) {
            $this->newLine();
            $this->info("▶ {$label}");
            $this->line("  Running: {$cmd}");

            $args = ['--legacy-db' => $legacyDb];
            if (str_contains($cmd, 'leads') && ! str_contains($cmd, 'notes')) {
                $args['--chunk'] = $chunk;
            }

            $result = $this->call($cmd, $args);

            if ($result !== self::SUCCESS) {
                $this->error("  ✗ {$label} FAILED (exit code {$result})");
                $failed[] = $cmd;
            } else {
                $this->info("  ✓ {$label} complete");
            }
        }

        $this->newLine();
        $this->info('═══════════════════════════════════════════════════');

        if (empty($failed)) {
            $this->info('  ✓ All migrations completed successfully.');
        } else {
            $this->error('  ✗ ' . count($failed) . ' migration(s) failed:');
            foreach ($failed as $cmd) {
                $this->error("    - {$cmd}");
            }
            $this->info('═══════════════════════════════════════════════════');
            return self::FAILURE;
        }

        $this->info('═══════════════════════════════════════════════════');
        $this->warn('REMINDER: All migrated users have randomised passwords.');
        $this->warn('They must reset via Forgot Password on first login.');

        return self::SUCCESS;
    }
}
