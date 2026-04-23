# Chunk 06 — Invoice & Content Tables ✅

**Status**: DONE  
**Date completed**: 2026-04-14

## What was built

### Migrations created & run (`php artisan migrate`)

| File | Table | Maps from |
|------|-------|-----------|
| `2026_04_14_110016_create_carrier_gl_limits_table.php` | `carrier_gl_limits` | `crm_carriers_gl_limits` |
| `2026_04_14_110017_create_invoices_table.php` | `invoices` | `crm_sent_invoices` + `crm_multiple_plan_invoice` |
| `2026_04_14_110018_create_invoice_line_items_table.php` | `invoice_line_items` | `crm_invoice_additional_fee` |
| `2026_04_14_110019_create_invoice_coverage_lines_table.php` | `invoice_coverage_lines` | `crm_invoice_benefits` |
| `2026_04_14_110020_create_invoice_templates_table.php` | `invoice_templates` | `crm_invoice_templates` |
| `2026_04_14_110021_create_invoice_sender_profiles_table.php` | `invoice_sender_profiles` | `crm_send_invoice_address_details` + `crm_send_invoice_companyname` + `crm_send_invoice_phone_details` |
| `2026_04_14_110022_create_blogs_table.php` | `blogs` | `crm_create_blog` |
| `2026_04_14_110023_create_pages_table.php` | `pages` | `crm_create_page` |

## Key design decisions

### `invoices`
- **Consolidates two legacy tables**: `crm_sent_invoices` (single-plan) and `crm_multiple_plan_invoice` (multi-plan quote bundles) into one table with a `type` enum: `'single'` or `'multi_plan'`
- **`encode_id`**: unique string token for public payment URL (replaces legacy insecure MD5 hash with a proper unique constraint)
- **Typos fixed**: `brocker_fee` → `broker_fee`, `total_permium` → `total_premium`
- **Date columns normalized**: `effective_date` / `expiration_date` changed from `varchar(15)` → `date`
- **`plans` JSON column**: stores multi-plan quote JSON for type=`multi_plan` invoices (was `longtext` in legacy)

### `invoice_sender_profiles`
- **Consolidates 3 legacy tables** (`address_details`, `companyname`, `phone_details`) into one row per sender profile — avoids scattered joins

### `blogs`
- **`slug` added**: SEO-friendly URL segment (not in legacy — would have needed to derive from title anyway)
- **`content` renamed**: `editor` → `content` (clearer naming)

### `pages`
- **`slug` added**: same SEO rationale as blogs
- **Self-referential FK**: `parent_page_id → pages.id` with `nullOnDelete` for nested page hierarchy
- **`event_type_id` FK**: proper FK to `event_types` (legacy stored as bare int)

### `carrier_gl_limits`
- `max_limit` changed from `varchar(3)` → `unsignedInteger` (legacy stored "2", "3", "5" as strings — normalizing to int matches `event_rates.max_limit`)

## Verified working

```
php artisan migrate   # all 8 tables created, no errors
```
