# Chunk 04 — Leads & Payments DB Migrations ✅

**Status**: DONE  
**Date completed**: 2026-04-14

## What was built

### Migrations created & run (`php artisan migrate`)

| File | Table | Maps from |
|------|-------|-----------|
| `2026_04_14_110005_create_leads_table.php` | `leads` | `crm_leads` |
| `2026_04_14_110006_create_sales_table.php` | `sales` | `crm_sales` |
| `2026_04_14_110007_create_received_payments_table.php` | `received_payments` | `crm_received_payments` |
| `2026_04_14_110008_create_user_payments_table.php` | `user_payments` | `crm_user_payments` |

## Key design decisions

### `leads` table
- **PK**: `crm_leads.lead_id` was `VARCHAR(25)` — changed to bigint `id` auto-increment
- **`event_date`**: was `TEXT` — normalized to `date` column
- **Boolean columns**: `bound`, `isEmailBlocked`, `privateResidence`, `isOnHold`, `isPriorityLead` all converted from `int` → `boolean` with snake_case naming
- **Typos fixed**: `comission_status` → `commission_status`, `contac_at_venue` → `contact_at_venue`
- **`lead_offered_plans`**: stored as JSON (was `longtext` in legacy)
- **`pending_changes`**: stored as JSON (was `longtext`)
- **`submission_status` enum**: `"payment received"` (space) normalized to `"payment_received"` (underscore)
- **`event_type_id` FK**: added proper FK to `event_types`, plus `event_type_label` snapshot for historical accuracy
- **`state_id` FK**: added proper FK to `us_states`, plus `event_state` char(2) snapshot
- **`user_id` FK**: nullable FK to `users`
- **`softDeletes`**: added for safe deletion (replaces `status=2` pattern in legacy)
- **Indexes**: `email`, `affiliate_string`, `referral_string`, `event_date`, `(submission_status, status)`

### `sales` table
- `price` changed from `varchar(100)` → `decimal(8,2)`
- `purchase_date` changed from `varchar(50)` → `timestamp`
- FK to `leads` added

### `received_payments` table
- Fee columns changed from `varchar` → `decimal(8,2)` for amounts
- `_percentage` columns kept as string (can be "3.5%", "25%", etc.)
- `pay_policy_eff_date` / `pay_policy_exp_date` normalized to `date`
- `payment_received_by` added as FK to `users`

### `user_payments` table
- `payment` changed from `varchar(55)` → `decimal(8,2)`
- Added `notes` text column
- FK to `users` added

## Verified working

```
php artisan migrate   # all 4 tables created, no errors
```
