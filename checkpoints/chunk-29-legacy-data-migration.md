# Chunk 29 — Legacy Data Migration

## Status: ✅ Complete

## Overview

All migration commands live in `app/Console/Commands/Migration/`.
Laravel 11 auto-discovers them — no manual registration needed.
Source database: `crm_new` (legacy CodeIgniter CRM).
Connection alias: `legacy` (already configured in `config/database.php` + `.env`).

## .env variables (already set)
```
LEGACY_DB_HOST=127.0.0.1
LEGACY_DB_PORT=3306
LEGACY_DB_DATABASE=crm_new
LEGACY_DB_USERNAME=root
LEGACY_DB_PASSWORD=
```

## Commands

### Run everything at once
```bash
php artisan migrate:all --legacy-db=crm_new

# Dry run (lists commands, writes nothing):
php artisan migrate:all --dry-run

# Custom chunk size for large lead tables:
php artisan migrate:all --legacy-db=crm_new --chunk=1000
```

### Run individually (dependency order)
```bash
php artisan migrate:us-states
php artisan migrate:event-types
php artisan migrate:event-rates        # depends on us_states + event_types
php artisan migrate:users              # depends on user_roles (seeded)
php artisan migrate:leads --chunk=500  # depends on users + event_types + us_states
php artisan migrate:lead-notes         # depends on leads + users
php artisan migrate:sales-payments     # depends on leads + users
php artisan migrate:blog-pages         # depends on event_types
```

All commands are **idempotent** — re-running skips already-migrated rows by checking `id` existence.

## Command files

| File | Source → Target | Key Transformations |
|------|----------------|---------------------|
| `MigrateUsStates.php` | `crm_us_states` → `us_states` | Adds timestamps |
| `MigrateEventTypes.php` | `crm_event_types` → `event_types` | `uid` → `id`, adds timestamps |
| `MigrateEventRates.php` | `crm_event_rates` → `event_rates` + `event_rate_states` | `states` CSV → join table rows via `us_states` map |
| `MigrateUsers.php` | `crm_users` + `crm_user_profile` → `users` | MD5 passwords → random bcrypt; email dedup; `user_name` → `email`; `W9` → `w9_status`; profile JOIN for name/phone |
| `MigrateLeads.php` | `crm_leads` → `leads` | Chunked (500/batch); VARCHAR lead_id discarded, int `id` preserved; `submission_status` space→underscore; typo fixes (`contac_at_venue`, `comission_status`, `isPriorityLead`); event_state → state_id lookup; date parsing |
| `MigrateLeadNotes.php` | `crm_lead_notes` → `lead_notes` | Orphan skip; `added_by` FK validated |
| `MigrateSalesAndPayments.php` | `crm_sales` + `crm_received_payments` + `crm_user_payments` → 3 tables | Orphan lead/user checks; `brocker_fee` → `broker_fee` typo fix; date parsing |
| `MigrateBlogAndPages.php` | `crm_create_blog` + `crm_create_page` → `blogs` + `pages` | `editor` → `content`/`editor_content`; `blog_order`/`page_order` → `sort_order`; slug auto-generated from title (not in legacy); `event_type` int → `event_type_id` FK |
| `RunAllMigrations.php` | Orchestrator | Runs all 8 commands in dependency order; reports per-step pass/fail |

## Key migration decisions

### Passwords
Legacy passwords are **MD5** hashes — they cannot be reversed or safely converted to bcrypt.
All migrated users receive a random bcrypt token as their password.
**Users must reset via "Forgot Password" on first login.**
The migration prints a reminder after completion.

### Lead IDs
Legacy `crm_leads` has two ID columns:
- `lead_id` VARCHAR(25) — the primary key used in the old system (e.g. "L-001234")
- `id` bigint — the auto-increment column

The new schema uses `id` (bigint) as the PK. The VARCHAR `lead_id` is discarded — it's not referenced anywhere in the new system.

### Referral strings
If a legacy `referral_string` collides with an already-migrated user, a new 8-char random string is generated. Collisions should be rare since the legacy system also enforced uniqueness.

### State abbreviations
`crm_event_rates.states` is a comma-separated string of 2-letter abbreviations (e.g. "CA,NY,TX"). Each entry is split and looked up in `us_states` to create rows in `event_rate_states`.

### Slugs for blog/pages
Legacy `crm_create_blog` and `crm_create_page` had no slug column. Slugs are auto-generated from `title` via `Str::slug()` with collision-safe incrementing suffixes.

## Tables NOT migrated (intentionally)
These legacy tables contain data that is either irrelevant, replaced by new architecture, or should be built fresh:

| Table | Reason |
|-------|--------|
| `crm_invoice_*` (6 tables) | Invoice system rebuilt from scratch in Chunk 20; legacy invoice format incompatible |
| `crm_lead_emails` | Email log; new system uses queued jobs |
| `crm_lead_actions` / `crm_lead_changes` | Audit trail; can migrate later if needed |
| `crm_lead_follow_up` | CRM follow-ups; can migrate if needed |
| `crm_agency` | Only relevant if multi-agency is being rebuilt |
| `crm_carriers` / `crm_carriers_contact` | Carrier data embedded in event_rates; no separate carrier table in new schema |
| `crm_direct_payment_details` | PayPal legacy data |
| `crm_doc_sign_status` | DocuSign; not in new system |
| `crm_email_templates` | Replaced by Blade mailables (Chunk 25) |
| `crm_notifications` | Not yet implemented |
| `crm_subscribers` | Not yet implemented |
