# Chunk 16 — Dashboard API

## Status: ✅ Complete

## What was built

### `app/Http/Middleware/RequireAdminAccess.php`
- Checks `$user->role->access_level <= 2` (super-admin=0, admin=1, staff=2)
- Returns `403 Forbidden` JSON if check fails
- Registered as `'admin'` alias in `bootstrap/app.php`

### `app/Http/Controllers/Admin/DashboardController.php`

**`GET /api/admin/stats`** — requires `auth:sanctum` + `admin` middleware

Response shape:
```json
{
  "period": "2026-04",
  "leads": {
    "today": 5,
    "this_week": 23,
    "this_month": 87,
    "all_time": 1240
  },
  "revenue": {
    "this_month": 12450.50,
    "all_time": 180320.00
  },
  "by_status": {
    "tried": 450,
    "saved": 120,
    "mq": 45,
    "plan_added_manually": 12,
    "payment": 8,
    "payment_received": 520,
    "finished": 85
  },
  "bound_count": 85,
  "pending_mq": 45,
  "on_hold": 3,
  "daily_chart": [
    { "date": "2026-03-15", "count": 3, "revenue": 450.00 },
    ...
  ]
}
```

**Implementation details:**
- Lead counts filtered to `status=1` (active, non-deleted)
- Revenue uses `JSON_EXTRACT(lead_offered_plans, "$.total")` with SUM — only counts `payment_received` leads
- `by_status` always returns all 7 enum values (zeroed if none)
- `daily_chart` returns exactly 30 days with no gaps — missing days filled with `{ count:0, revenue:0 }`

### `bootstrap/app.php`
- Added `'admin' => RequireAdminAccess::class` middleware alias

### `routes/api.php`
- Added `Route::middleware('admin')->prefix('admin')` group inside `auth:sanctum` group
- `GET /api/admin/stats` active
- Leads list/detail routes stubbed with comments for Chunks 18–19
