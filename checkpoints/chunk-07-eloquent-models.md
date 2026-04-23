# Chunk 07 — Eloquent Models & Relationships ✅

**Status**: DONE  
**Date completed**: 2026-04-14

## Models created

| Model | Table | Key traits / notes |
|-------|-------|--------------------|
| `Agency` | `agencies` | `modules_setup` cast as array |
| `UserRole` | `user_roles` | `access_level` cast as integer |
| `User` | `users` | `HasApiTokens`, `SoftDeletes`, role helpers (`isAdmin()`, `isCustomer()`, etc.), `full_name` accessor |
| `EventType` | `event_types` | `scopePublic()` excludes client-added types |
| `EventRate` | `event_rates` | `scopeForAudience()`, `scopeForState()`, `scopeCarrier()` |
| `EventRateState` | `event_rate_states` | `$timestamps = false` |
| `UsState` | `us_states` | — |
| `Lead` | `leads` | `SoftDeletes`, JSON casts for `lead_offered_plans`/`pending_changes`, all boolean flags, `scopeActive()`, `scopeByStatus()`, `scopeFinished()` |
| `Sale` | `sales` | — |
| `ReceivedPayment` | `received_payments` | Payment mode constants (`MODE_CREDIT_CARD` etc.), date casts |
| `UserPayment` | `user_payments` | — |
| `LeadNote` | `lead_notes` | `author()` relation to `User` via `added_by` |
| `LeadEmail` | `lead_emails` | `scopeVisible()` |
| `LeadFile` | `lead_files` | `scopeForCustomer()` |
| `LeadFollowUp` | `lead_follow_ups` | Two user FKs (`assignedTo`, `createdBy`), `scopePending()`, `scopeCompleted()`, `scopeUpcoming()` |
| `LeadAction` | `lead_actions` | — |
| `LeadChange` | `lead_changes` | `changedBy()` relation to `User` via `changes_made_by` |
| `Invoice` | `invoices` | `STATUS_UNPAID`/`STATUS_PAID` constants, `plans` as array, date casts |
| `InvoiceLineItem` | `invoice_line_items` | — |
| `InvoiceCoverageLine` | `invoice_coverage_lines` | — |
| `InvoiceTemplate` | `invoice_templates` | Two user FKs (`addedBy`, `updatedBy`) |
| `InvoiceSenderProfile` | `invoice_sender_profiles` | `scopeActive()` |
| `CarrierGlLimit` | `carrier_gl_limits` | `scopeForCarrier()`, `scopeForLimitRange()` |
| `Blog` | `blogs` | `scopePublished()`, `scopeOrdered()` |
| `Page` | `pages` | Self-referential `parent`/`children`, `scopeActive()`, `scopeInMenu()` |

## Key patterns applied

- **`$fillable`**: every model lists all writable columns — mass assignment protected
- **`$casts`**: booleans, decimals, dates, arrays/JSON all explicitly cast
- **Named relation methods**: semantically named (e.g. `receivedBy()`, `changedBy()`, `assignedTo()`, `createdBy()`) rather than generic `user()`
- **Scopes**: common query patterns extracted as named scopes for reuse in controllers
- **`HasApiTokens`** on User: required for Sanctum token-based auth
- **`SoftDeletes`** on User + Lead: safe deletion pattern

## Verified working

```
php artisan model:show User   # resolves all attributes + relations
php artisan model:show Lead   # resolves all attributes + relations
```
