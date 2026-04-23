# Chunk 05 — CRM Supporting Tables ✅

**Status**: DONE  
**Date completed**: 2026-04-14

## What was built

### Migrations created & run (`php artisan migrate`)

| File | Table | Maps from |
|------|-------|-----------|
| `2026_04_14_110009_create_lead_notes_table.php` | `lead_notes` | `crm_lead_notes` |
| `2026_04_14_110010_create_lead_emails_table.php` | `lead_emails` | `crm_lead_emails` |
| `2026_04_14_110011_create_lead_files_table.php` | `lead_files` | `crm_lead_files` |
| `2026_04_14_110012_create_lead_follow_ups_table.php` | `lead_follow_ups` | `crm_lead_follow_up` |
| `2026_04_14_110013_create_lead_actions_table.php` | `lead_actions` | `crm_lead_actions` |
| `2026_04_14_110014_create_lead_assignment_table.php` | `lead_assignment` | `crm_lead_assignment` |
| `2026_04_14_110015_create_lead_changes_table.php` | `lead_changes` | `crm_lead_changes` |

## Key design decisions

- **All tables FK to `leads`** with `cascadeOnDelete` — if a lead is deleted all its supporting records go with it
- **`lead_notes.added_for`**: legacy stored CSV of user IDs (e.g. "29,18") — kept as string; these are notification targets, not a formal relationship
- **`lead_actions.user_id` nullable**: legacy had `user_id = 0` for system-generated actions; replaced with `null`
- **`lead_follow_ups.follow_up_date`**: legacy stored as `varchar "12/04/2020"` — normalized to `date`
- **`lead_follow_ups`** has two FK constraints on `users`: `user_id` (assigned to) and `created_by` (who scheduled it)
- **`lead_assignment`** unique constraint on `(lead_id, user_id)` prevents duplicate assignments
- **`lead_changes.changes`**: HTML diff strings — kept as `text`, not parsed/normalized

## Verified working

```
php artisan migrate   # all 7 tables created, no errors
```
