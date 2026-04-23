# Chunk 20 — Invoice Admin

## Status: ✅ Complete

## Completion status

- [x] Backend API (list, create, show, update, destroy)
- [x] Frontend List page (`InvoicesPage`)
- [x] Frontend Create page (`InvoiceCreatePage`)
- [x] Frontend Detail page (`InvoiceDetailPage`)
- [x] Routes wired (`/admin/invoices`, `/admin/invoices/new`, `/admin/invoices/:id`)
- [x] Navigation link in admin layout (`AdminLayout` had Invoices nav item from Chunk 17)

---

## Backend — `app/Http/Controllers/Admin/InvoiceController.php`

### `GET /api/admin/invoices` (auth:sanctum + admin)
- Filters: `search` (name/email LIKE), `status` (0=unpaid / 1=paid), `lead_id`
- Sorts: `id`, `email`, `created_at`, `total_payable`, `invoice_status`
- Eager-loads `lead:id,event_name` and `createdBy:id,first_name,last_name`
- Paginates, selects list-view columns only

### `POST /api/admin/invoices` (auth:sanctum + admin)
- Creates invoice with optional nested `line_items[]` and `coverage_lines[]`
- Auto-generates unique `encode_id` (32-char random string, collision-checked)
- Sets `created_by` from authenticated user
- Returns 201 with full invoice including all relations

### `GET /api/admin/invoices/{id}`
- Full invoice with `lineItems`, `coverageLines`, `lead`, `createdBy`

### `PATCH /api/admin/invoices/{id}`
- Patchable: `invoice_status` (0/1), `email_subject`, `email_cc`, `email_bcc`

### `DELETE /api/admin/invoices/{id}`
- Hard-delete; returns 422 if `invoice_status = 1` (paid invoices cannot be deleted)

---

## Frontend

### `src/pages/admin/InvoicesPage.tsx`
- Paginated table: recipient, event type, coverage limits, total, type badge, status badge
- Filters: search (name/email), status dropdown
- URL-driven state (shareable/back-button safe)
- "+ New invoice" CTA → `/admin/invoices/new`
- Row click → `/admin/invoices/:id`

### `src/pages/admin/InvoiceCreatePage.tsx`
- Full creation form with react-hook-form + zod
- Sections: meta (lead ID, type), recipient (name, email, CC, BCC, subject), coverage (event type, carrier, dates, limits), pricing (premium, broker fee, processing fee, total payable with auto-sum hint), insured address
- Dynamic `line_items` array (`useFieldArray`): fee type, amount, qty, policy
- Dynamic `coverage_lines` array: benefit type + value
- Pre-fills `lead_id` from `?lead_id=` query param (deep link from Lead Detail)
- On success: navigates to new invoice's detail page

### `src/pages/admin/InvoiceDetailPage.tsx`
- 2-column layout (2/3 + 1/3)
- Left: recipient, coverage details, line items table with totals, coverage display lines
- Right: pricing summary (premium → broker fee → processing → **total payable**), public payment link display + copy button, linked lead card
- "Mark as paid / Mark unpaid" toggle button (PATCH on click)
- Delete button (only shown for unpaid invoices, with confirm dialog)
- Mutations update query cache immediately; invalidate invoice list

### `src/routes/index.tsx`
```
/admin/invoices         → InvoicesPage
/admin/invoices/new     → InvoiceCreatePage   (must come before /:id)
/admin/invoices/:id     → InvoiceDetailPage
```
All behind `ProtectedRoute maxLevel={2}`.

---

## Notes
- `encode_id` is the public token for the customer-facing payment page (Chunk 21 will add `/invoice/:encode_id`)
- Invoice delete is hard-delete (no soft delete on this table per migration design)
- PayPal transaction fields exist in the DB for legacy data migration — new invoices use Stripe (Chunk 21)
