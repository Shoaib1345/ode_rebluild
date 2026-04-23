# Chunk 15 — Payment + Lead Creation

## Status: ✅ Complete

## What was built

### Backend (`ode-api`)

**`app/Http/Controllers/LeadController.php`**
- `POST /api/leads` — public route (no Sanctum, customers don't have accounts at purchase time)
- Validates all 40+ fields: plan data, quote params, customer info, `stripe_payment_method_id`, optional signature
- Delegates to `LeadCreationService::createAndCharge()`
- Returns `{ lead_number, message }` 201 on success or `{ message }` 422 on failure

**`app/Services/LeadCreationService.php`**
- Resolves `state_id` from abbreviation or full state name via `UsState` model
- Parses first date from comma-separated `event_dates` string (MM/DD/YYYY → YYYY-MM-DD)
- Maps alcohol request params → `alcohol_served` enum (`none`/`hosted`/`sold`)
- Builds `coverage_limit` as `"min/max"` string
- Creates Stripe `PaymentIntent` with `confirm:true, allow_redirects:'never'`
- On `CardException`: returns `success:false, message` (shown inline to user)
- On other exceptions: logs error, returns generic message
- On success: saves `payment_id`, `payment_status='paid'`, `submission_status='payment_received'`
- Calls `Lead::create($leadData)`, returns `['success'=>true, 'lead_number'=>$lead->id]`

**`routes/api.php`**
- Added `Route::post('/leads', [LeadController::class, 'store'])` (public group)

**`config/services.php`**
- Added `'stripe' => ['key' => env('STRIPE_KEY'), 'secret' => env('STRIPE_SECRET')]`

**Composer**
- `stripe/stripe-php` installed

### Frontend (`ode-frontend`)

**`@stripe/react-stripe-js` + `@stripe/stripe-js`** — installed

**`src/pages/quote/QuotePaymentPage.tsx`** (NEW — step 5)
- `loadStripe(VITE_STRIPE_PK)` initialised outside component to avoid re-creation
- Wrapped in `<Elements stripe={stripePromise}>` provider
- Order summary sidebar (plan details, price breakdown, total)
- `<CardElement>` with custom styling
- On submit:
  1. `stripe.createPaymentMethod({ type:'card', card:cardEl, billing_details })` — billing details from `customerInfo` in Zustand store
  2. `POST /api/leads` — full payload assembled from `params` + `customerInfo` + plan + `paymentMethod.id`
  3. On success: calls `reset()` to clear Zustand store, navigates to `/quote/confirmation/:leadNumber`
  4. On error: displays error inline (card declines, network errors, validation failures)
- Guard: redirects to `/quote/plans` if no `selectedPlan`

**`src/pages/quote/QuoteConfirmationPage.tsx`** (NEW)
- Reads `:leadNumber` from URL params
- Displays confirmation number, 3-step "What happens next?" list
- "Back to Home" CTA
- No store dependency — safe to reload

**`src/routes/index.tsx`**
- Uncommented `QuotePaymentPage` and `QuoteConfirmationPage` lazy imports
- Activated `/quote/payment` and `/quote/confirmation/:leadNumber` routes

## Environment variables needed

```
# .env (backend)
STRIPE_KEY=pk_test_...
STRIPE_SECRET=sk_test_...

# .env (frontend)
VITE_STRIPE_PK=pk_test_...
```

## Quote wizard — complete flow

| Step | Route | Page |
|------|-------|------|
| 1 | `/onedayevent` | `EventTypePage` |
| 2 | `/quote/details` | `QuoteDetailsPage` |
| 3 | `/quote/plans` | `QuotePlansPage` |
| 4 | `/quote/info` | `QuoteInfoPage` |
| 5 | `/quote/payment` | `QuotePaymentPage` |
| — | `/quote/confirmation/:id` | `QuoteConfirmationPage` |
