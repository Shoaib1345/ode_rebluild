# Chunk 19 — Lead Detail

## Status: ✅ Complete

## What was built

### Backend — `LeadController` additions

**`PATCH /api/admin/leads/{id}`** (auth:sanctum + admin)

Patchable fields:
- `submission_status` — enum validated
- `bound` — boolean
- `is_on_hold` — boolean
- `is_priority_lead` — boolean
- `closing_reason` — nullable string max 255

Returns the full updated lead row.

**`POST /api/admin/leads/{id}/notes`** (auth:sanctum + admin)

- `message` — required, max 5000 chars
- Sets `added_by` from `$request->user()->id`
- Loads `author:id,first_name,last_name` relation before returning
- Returns 201 with the new note

### Frontend — `src/pages/admin/LeadDetailPage.tsx`

Two-column layout (2/3 + 1/3 on lg screens):

**Left column:**
- Contact information (name, email mailto link, phone, timezone)
- Named insured (name, address)
- Event & venue (all event details, alcohol, add'l insured flags, venue info)
- Plan & payment (carrier, coverage, premium breakdown, Stripe ID) — only shown if `lead_offered_plans` is non-null
- Notes (add-note textarea form + ordered note list with author + timestamp)

**Right column (CRM controls):**
- Status dropdown (PATCH on change)
- Bound / On hold / Priority lead toggles (PATCH on change, individual requests)
- Closing reason textarea (PATCH on blur if value changed)
- Quick info summary card

**State management:**
- `useQuery` fetches lead on mount
- `useMutation` (patch) — uses `queryClient.setQueryData` for optimistic-style instant update, invalidates `admin-leads` list cache
- `useMutation` (addNote) — prepends new note to cached data without refetch
- Loading: skeleton placeholder; Error: inline message with back link

### `routes/index.tsx`
- `LeadDetailPage` lazy import active
- `/admin/leads/:id` route active behind `ProtectedRoute maxLevel={2}`
