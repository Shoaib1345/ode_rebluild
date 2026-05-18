# ODE Rebuild — Build Status & Remaining Work

> Snapshot: **2026-05-18**
> Compares `ode-rebuild/` (Laravel 12 + React 18) against legacy reference `C:\wamp64\www\ode_new\` (CodeIgniter 3 + React 16).
> Supersedes the stale "All chunks complete" claim in `PROJECT_MEMORY.md` (last touched 2026-04-24). The quote wizard has been substantially rewritten since then.

---

## 1. High-level state

| Area | Built | Notes |
|------|------:|------|
| Auth (Sanctum)                          | ✅ | login / register / me / logout |
| Public site (Home, About, Contact, FAQ, Privacy, Terms, Blog, CMS pages) | ✅ | All static pages + dynamic `/pages/:slug` |
| Quote wizard (16 routed pages, see §2)  | 🟡 | Functional end-to-end; gaps listed in §3 |
| Public invoice pay flow                 | ✅ | `/invoice/:encodeId` → success |
| Stripe payment                          | ✅ | Stripe Elements in `QuotePaymentPage` |
| PayPal                                  | ❌ | Not started — ode_new offered it; we currently only ship Stripe |
| Save / resume quote (email-link)        | ✅ | `/quote/resume/:token` + pending-quote API |
| Admin portal (16 screens)               | ✅ | Leads, lead detail, invoices, blog, users, payroll, W9, email templates, CMS pages, subscribers, rate import |
| Lead assignments (admin → agent)        | ✅ | |
| DocuSign integration                    | ✅ | Send / status / webhook + nightly sync job |
| PDF generation (Policy / Receipt / COI) | ✅ | DomPDF + queued jobs |
| Email templates + scheduled jobs        | ✅ | Post-event, 7-day reminder, follow-up reminders |
| Commissions + W9 gating                 | ✅ | Affiliate / Agent / Planner / Customer accruals; amounts gated until W9 verified |
| Customer portal                         | ✅ | Dashboard / policies / invoices / referral / commissions |
| Agent portal                            | ✅ | Dashboard / my-leads / lead detail / commissions |
| Planner portal                          | ✅ | Dashboard / referrals / commissions |
| Affiliate portal                        | ✅ | Tabbed dashboard (stats / referrals / payouts / commissions) |
| Partner / Venue / Planner signup pages  | 🟡 | Unified `/partner-signup`; ode_new had **separate** 3-step flows for Partner, Venue, and a 2-step Planner signup — those distinct flows are not ported |
| Backend test suite                      | ✅ | ~270 tests, all green at last run |

---

## 2. Quote wizard — current routed flow (rebuild)

Source: `ode-frontend/src/routes/index.tsx`

| # | Route | Component | ode_new equivalent |
|--:|-------|-----------|--------------------|
| 1 | `/onedayevent` | `EventTypePage` | ODE EventTypes |
| 1b | `/quote/vendor-or-host` | `VendorOrHostPage` | Vendor branch entry |
| 1c | `/quote/vendor-activity` | `VendorActivityPage` | `ODEActivity` |
| 2 | `/quote/dates` | `QuoteDatesPage` | ODE2 |
| 3 | `/quote/location` | `QuoteLocationPage` | ODE3 |
| 4 | `/quote/alcohol` | `QuoteAlcoholPage` | ODE4 |
| 5 | `/quote/guests` | `QuoteGuestsPage` | (number_of_persons — was inline in ode_new) |
| 6 | `/quote/activities` | `QuoteActivitiesPage` | ODE5 |
| 7 | `/quote/addons` | `QuoteAddonsPage` | ODE6 (additional_insured count) |
| 8 | `/quote/description` | `QuoteDescriptionPage` | ODEventDescription |
| 9 | `/quote/plans` | `QuotePlansPage` | ODE7 |
| 10 | `/quote/insured` | `QuoteInsuredPage` | Named-insured fields (was inline in ODEPayment) |
| 11 | `/quote/venue` | `QuoteVenuePage` | ODE8 venue block |
| 12 | `/quote/info` | `QuoteInfoPage` | ODEPayment contact + signature |
| 13 | `/quote/payment` | `QuotePaymentPage` | ODEPayment card section |
| 14 | `/quote/confirmation/:leadNumber` | `QuoteConfirmationPage` | ODEConfirmation / ThankQuote |
| — | `/quote/resume/:token` | `QuoteResumePage` | (new — save/resume) |

**Layout**: `QuoteStepLayout` (wide / narrow / titled variants) is the single wrapper for every step. Progress bar switches between a 10-pill wizard mode and a 3-segment checkout mode (Insured → Venue → Info → Payment).

**Dead code present in repo (not routed, candidate for deletion)**:
- `ode-frontend/src/pages/quote/QuoteDetailsPage.tsx` (666 lines) — old combined page, replaced by the split-step pages above.
- `ode-frontend/src/pages/quote/QuoteLayout.tsx` — superseded by `QuoteStepLayout` (verify before deleting).

---

## 3. What is still to build

### A. Wizard gaps (priority order)

1. **Manual-quote / underwriter path (ode_new ODE9)** — *Missing*
   ode_new's `toManualQuote()` triggered a dedicated form when the quote couldn't be auto-bound (hired status, alcohol-profitable, special activities, non-consecutive dates, or coverage above carrier cap). The rebuild currently does not show a "we need to review this manually" page; the wizard proceeds straight to payment. Decide: do we want the same human-underwriting handoff, or do we always auto-bind? If keeping the handoff, build a `QuoteManualReviewPage` and a corresponding lead status (`needs_underwriting` or similar).

2. **Additional-insured venue details (ode_new ODE10A)** — *Partial*
   `QuoteVenuePage` collects **one** venue. ode_new collected venue info per additional-insured entity (when `additional_insured > 0`). If the business rule still requires that, the page needs to iterate `additional_insured` times or accept a repeatable block.

3. **Visual / copy parity sweep** — *Ongoing*
   Recent commits (cc59f51, 1094a19, 8ade3ff, 64b78e1) are mid-flight on aligning rebuild wizard pages to ode_new layouts. Pages last touched and confirmed visually matched: `QuotePaymentPage`, `QuoteVenuePage`, `QuoteDescriptionPage`. Remaining pages to audit against ode_new screens: `EventTypePage`, `QuoteDatesPage`, `QuoteLocationPage`, `QuoteAlcoholPage`, `QuoteGuestsPage`, `QuoteActivitiesPage`, `QuoteAddonsPage`, `QuotePlansPage`, `QuoteInsuredPage`, `QuoteInfoPage`, `QuoteConfirmationPage`.

4. **PayPal payment option** — *Missing*
   ode_new offered PayPal alongside Stripe; rebuild is Stripe-only. Add PayPal SDK + `PaymentController::paypal()` branch + UI toggle if business wants parity.

### B. Signup flow gaps

5. **Multi-step Partner / Venue / Planner signups** — *Partial*
   ode_new had three distinct signup wizards:
   - `partner_signup/` (3 steps)
   - `venue_signup/` (3 steps)
   - `planner_signup/` (2 steps)
   The rebuild collapsed these into a single `/partner-signup` page + a role choice on `/register`. Verify with the business whether the multi-step flows (with their different copy / fields) are required, or whether the unified form is the intended new UX.

### C. Cleanup / hygiene

6. **Delete orphaned `QuoteDetailsPage.tsx`** — confirm nothing imports it, then remove.
7. **Verify `QuoteLayout.tsx` vs `QuoteStepLayout.tsx`** — keep one.
8. **Update `PROJECT_MEMORY.md`** — its "What's been built" and "Frontend route map" sections are out of date (it lists a 6-step wizard at routes that no longer exist: `/quote/details`). Easiest fix: refresh from this doc once gaps above are closed.
9. **Re-run `tsc --noEmit`** on `ode-frontend` and `phpunit` on `ode-api` after the recent QuoteVenuePage/QuotePaymentPage rewrites to confirm nothing regressed.

### D. Things that *look* missing but are actually fine

- **Vendor flow** — present at `/quote/vendor-or-host` → `/quote/vendor-activity` → `/quote/dates` (skipping alcohol).
- **Certificate of insurance display** — backend generates COI PDF; frontend exposes it in the Customer portal events page and via admin lead-detail "Documents" panel.
- **Save / resume** — wired end-to-end (`POST /api/leads/pending`, `GET /api/quotes/pending/:token`, `/quote/resume/:token`).
- **Conditional skip rules** — handled in each step's `useEffect` redirect guards (e.g. `QuoteGuestsPage` redirects vendors to `/quote/location` if state missing). No central state machine.

---

## 4. Suggested next session focus

In order of business value:

1. Decide on manual-quote path (§3.A.1) — biggest functional gap.
2. Confirm whether multi-venue additional-insured (§3.A.2) is still a requirement.
3. Visual parity sweep of remaining wizard pages (§3.A.3) — quick, mostly mechanical.
4. PayPal (§3.A.4) — only if business confirms it's required for launch.
5. Clean up dead pages (§3.C.6–7).
6. Refresh `PROJECT_MEMORY.md` once 1–3 are done.

---

## 5. Reference paths

- Legacy ode_new React pages: `C:\wamp64\www\ode_new\src\pages\`
- Legacy ode_new CI3 controllers: `C:\wamp64\www\ode_new\application\controllers\`
- Authoritative spec: `C:\wamp64\www\ode_new\FULL-SPEC-V2.md`
- Rebuild frontend routes: `ode-frontend/src/routes/index.tsx`
- Rebuild API routes: `ode-api/routes/api.php`
- Rebuild quote store: `ode-frontend/src/stores/quoteStore.ts`
- Rebuild test suite: `ode-api/tests/Feature/`
