# Chunk 14 — Customer Info + Signature

**Status**: Complete  
**Date**: 2026-04-14

## What was built

### New files
| File | Purpose |
|------|---------|
| `src/pages/quote/QuoteInfoPage.tsx` | Step 4 — customer info, venue details, signature, acknowledgement |

### Routes updated
- `src/routes/index.tsx` — `GET /quote/info` → `<QuoteInfoPage />` (lazy-loaded)

## Form sections

### 1 — Contact Information
- First name, last name, email, phone (all required)

### 2 — Named Insured
- "Same as contact info" checkbox auto-fills first/last name from section 1
- First name, last name, street, city, state (abbreviation), zip (5-digit, required)
- Note: states dropdown uses `abbreviation` values (CA, NY…) to match what the lead DB stores

### 3 — Event & Venue Details
- Event name (required)
- Venue name (required)
- Venue address, city, state, zip (required)
- Venue contact person, phone, email (all optional — sent to venue for COI delivery)

### 4 — Signature Pad
- `react-signature-canvas` with navy pen on gray-50 background
- "Clear signature" button
- Captured as base64 PNG via `sigRef.current.toDataURL('image/png')`
- Stored as `signature` key in `customerInfo` (no upload at this step — happens in Chunk 15 at lead creation)

### 5 — Acknowledge
- Checkbox with terms link
- zod: `z.literal(true)` — must be checked to submit

## Store output
On valid submit, writes to `useQuoteStore.setCustomerInfo()`:
```ts
{
  first_name, last_name, email, phone,
  ins_first_name, ins_last_name, ins_street, ins_city, ins_state, ins_zip,
  event_name,
  venue_name, venue_address, venue_city, venue_state, venue_zip,
  venue_contact_person?, venue_contact_email?, venue_contact_number?,
  acknowledge: true,
  signature: 'data:image/png;base64,...'   // empty string if not drawn
}
```
Then navigates to `/quote/payment`.

## Guard
If `selectedPlan` is null on mount, redirects to `/quote/plans`.

## Notes
- State dropdowns use `abbreviation` (CA, TX) not full name — matches ins_state/venue_state columns in leads table
- Signature is stored client-side in Zustand; actual S3 upload deferred to Chunk 15 (lead creation on payment)
- `QuoteInfoPage` lazy-chunk: 27.07 kB / 9.00 kB gzip (includes react-signature-canvas)
