# Chunk 21 — Invoice Customer

## Status: ✅ Complete

## What was built

### Backend — `app/Http/Controllers/PublicInvoiceController.php`

**`GET /api/invoice/{encodeId}`** — public, no auth
- Looks up invoice by `encode_id`
- Returns safe public subset (no internal IDs except `encode_id`)
- Includes `line_items` and `coverage_lines` arrays

**`POST /api/invoice/{encodeId}/pay`** — public, no auth
- Guards against double-payment (422 if already paid)
- Validates `stripe_payment_method_id`
- Creates Stripe `PaymentIntent` with `confirm:true, allow_redirects:'never'`
- On `CardException`: returns 422 with card error message
- On success: sets `invoice_status = 1` and stores Stripe intent ID in `paypal_transaction_id` column (reused for legacy compat)
- Returns `{ message, encode_id }`

Both routes added to `routes/api.php` in the public (non-auth) section.

### Frontend

**`src/pages/invoice/InvoicePayPage.tsx`**
- Loads invoice via `useQuery(['public-invoice', encodeId])`
- Three states before showing the form:
  - Loading spinner
  - Not found: error card with contact email
  - Already paid: friendly "already paid" message (no form)
- Payment form (inside `<Elements>` wrapper):
  - Policy details grid (event type, carrier, limits, dates)
  - Coverage display lines table
  - Price breakdown (line items if present, otherwise premium/broker/processing fields)
  - Total due prominently displayed
  - `CardElement` with Stripe styling
  - On submit: `createPaymentMethod` → `POST /api/invoice/:encodeId/pay` → navigate to success
  - Inline error display for card declines

**`src/pages/invoice/InvoiceSuccessPage.tsx`**
- Standalone success page (no store dependency, safe to reload)
- 3-step "What happens next?" list

### Routes (`src/routes/index.tsx`)
```
/invoice/:encodeId         → InvoicePayPage    (public)
/invoice/:encodeId/success → InvoiceSuccessPage (public)
```
No `ProtectedRoute` — fully public pages.

### Admin detail page integration
`InvoiceDetailPage` already shows the `/invoice/:encode_id` link with a copy button, so the flow is:
Admin creates invoice → copies link → sends to customer → customer pays at `/invoice/:encodeId`

## Notes
- `paypal_transaction_id` column is reused for the Stripe PaymentIntent ID on new invoices (legacy PayPal data migrated as-is in Chunk 29)
- The `encode_id` is a 32-char random string generated at invoice creation (Chunk 20)
