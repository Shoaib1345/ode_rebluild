# Chunk 23 — Affiliate Portal

## Status: ✅ Complete

## What was built

### Backend

**`app/Http/Middleware/RequireAffiliateAccess.php`**
- Checks `access_level === 6` exactly
- Registered as `'affiliate'` alias in `bootstrap/app.php`

**`app/Http/Controllers/Affiliate/PortalController.php`**

All three endpoints require `auth:sanctum` + `affiliate` middleware. Scoped to `$request->user()->referral_string`.

**`GET /api/affiliate/stats`**
- Referral counts: total, paid (payment_received), this month, paid this month
- Earnings: total (SUM of `sales.price`), this month, total paid out (`SUM user_payments.payment`), pending payout (difference)
- 6-month chart: per-month referral count, paid count, earnings

**`GET /api/affiliate/referrals`**
- Paginated (default 20/page, max 50)
- Scoped to `referral_string`, ordered by `created_at desc`
- Returns list columns only (no PII beyond name)

**`GET /api/affiliate/payouts`**
- Full payout history from `user_payments` table, ordered by `payment_date desc`

### Frontend — `src/pages/affiliate/AffiliateDashboard.tsx`

Single-page portal with 3 tabs (no page navigation):

**Header**: site name, user name, sign-out button

**Referral link card**: shows full URL with `?ref=REFERRAL_STRING`, copy-to-clipboard button, referral code displayed below

**Overview tab**:
- 4 stat cards: total referrals (with paid sub-label), this month (accent), total earned (with month sub-label), pending payout (accent when > 0)
- 6-month bar chart (SVG-free; uses div heights + flex)
- Earnings breakdown table (only months with earnings shown)

**Referrals tab**:
- Lazy-fetched (only on tab switch)
- Table: #, name, event type, event date, state, status badge, referred-on date
- Prev/next pagination
- Empty state: "Share your link to get started!"

**Payouts tab**:
- Lazy-fetched (only on tab switch)
- Table: date, amount (green), notes
- Empty state with explanation about payout threshold

### `routes/index.tsx`
- `AffiliateDashboard` lazy import active
- `/affiliate` route: `<ProtectedRoute exactLevel={6}><AffiliateDashboard /></ProtectedRoute>`

## Data model notes
- Affiliate commission is tracked via `leads.referral_string` + `sales.referral_string`
- `sales` table is populated when a lead reaches `payment_received` (admin flow, Chunk 29 migration)
- `user_payments` records manual payouts issued by admin staff
- The `referral_link` includes `?ref=REFERRAL_STRING` as a query param — the quote wizard should read this and attach it to the lead (can be wired in Chunk 15 re-test or Chunk 29)
