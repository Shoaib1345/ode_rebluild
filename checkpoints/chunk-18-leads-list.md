# Chunk 18 — Leads List

## Status: ✅ Complete

## What was built

### Backend — `LeadController` additions

**`GET /api/admin/leads`** (auth:sanctum + admin)

Filters (all optional query params):
- `search` — LIKE match across first_name, last_name, email, phone
- `status` — submission_status enum value
- `state` — 2-letter abbreviation
- `bound` — 1/0
- `per_page` — default 25, max 100
- `sort` — id | first_name | last_name | email | event_date | created_at | submission_status
- `dir` — asc | desc (default: desc)

Returns Laravel paginator JSON with `data`, `current_page`, `last_page`, `total`, `from`, `to`.
Only selects columns needed for the list view (not the full lead blob).
Eager-loads `eventType:id,event_type`.

**`GET /api/admin/leads/{id}`** (auth:sanctum + admin)

Returns full lead with `eventType`, `state`, `notes`, `followUps` relationships.

### Frontend — `src/pages/admin/LeadsPage.tsx`

- URL-driven state — filters/sort/page synced to search params (shareable + back-button safe)
- Search form (name/email/phone), status dropdown filter
- Sortable columns: #, Name, Email, Event Date, Status, Created
- `placeholderData: (prev) => prev` keeps old data visible while fetching next page
- Row click → navigates to `/admin/leads/:id` (Chunk 19)
- Priority ★ and on-hold ⏸ icons in the ID cell
- Bound badge alongside status badge
- Loading: skeleton rows (8 rows × 9 cols)
- Empty state message
- Pagination: prev/next + numbered pages with ellipsis collapse

### `routes/index.tsx`
- `LeadsPage` lazy import active
- `/admin/leads` route active behind `ProtectedRoute maxLevel={2}`
