# ODE Replication Audit — Deep Parity Review

> Date: **2026-05-19**
> Compares the rebuild (`ode-rebuild/` — Laravel 12 + React 18) against the legacy original
> (`C:\wamp64\www\ode_new\` — CodeIgniter 3 + React 16).
> Scope: full-site replica (new DB, new URL). Focus: **quote wizard** and **plans/pricing logic**, plus affiliate + lead management.
> Method: three parallel deep-dive code audits (quote flow, pricing engine, backend parity).

---

## 0. Executive summary

| Area | Replication | One-line verdict |
|------|:-----------:|------------------|
| Public pages, auth, blog, CMS | ~95% | Solid. |
| Quote wizard **UI / steps** | ~80% | Looks right, screens present, but routing is linear. |
| Quote wizard **branching logic** | ~40% | The legacy "manual-quote / underwriting" fork is **entirely missing**. |
| **Pricing / plans engine** | ~60% | **Materially diverges — customers would be quoted different prices.** ⚠️ |
| Admin CRM | ~75% | Core CRUD present; many ops actions missing. |
| Affiliate management | ~50% | No approval workflow, no rate config, commission model changed. |
| Lead lifecycle | ~70% | Capture solid; named pipelines, chat, requote, portal actions missing. |
| Payments | ~70% | Stripe faithful & modernized; PayPal dropped (likely intentional). |

**The single most important finding:** the customer price is produced by `QuoteService`, and it diverges from the legacy `Events::get_quote_ajax` in at least four ways that change the **dollar amount charged**, plus several that change **which plans / recommendation** are shown. This must be fixed before launch or the replica will quote differently from the original. Details in §2.

---

## 1. Quote wizard — flow & UI parity

### 1.1 The legacy is a dynamic state machine; the rebuild is a linear chain
Legacy routing lives in `ode_new/src/.../component/questions/QuestionLayout.js`. The **same URL** renders **different components** based on three runtime predicates:
- `checkEventType()` — hides the Event-Description step for event types 66/67/72.
- `toManualQuote()` — diverts the user **out of the online-purchase path** into a manual-underwriting / thank-you branch.
- `toCheckAdditionalInsured()` — inserts a per-additional-insured details step and reshuffles the tail.

The rebuild instead uses per-page `useEffect` redirect guards, each hard-coding a single `next` route. It faithfully reproduces exactly **one** branch (the vendor skip path) and **none** of the three legacy decision predicates.

### 1.2 Manual-quote / underwriting fork — **MISSING (highest-priority wizard gap)**
Legacy diverts to manual underwriting when ANY of these is true (`QuestionLayout.js:49-72`):
- Hired / Non-owned Auto = Yes (`hired_status === '1'`)
- Alcohol **Sold for profit** (`is_sold_profitable === 'Yes'`)
- Special activities = Yes (non-Wedding)
- Ticket charge = Yes (`Tstatus`)
- **Non-consecutive event dates** (`is_consectiveDate === 'No'`)
- A free-typed "Other" event

The rebuild lets all of these proceed straight to plans + online payment. **Risk: binding online for events that legally require manual underwriting.** Worse, two of the inputs that drive the decision aren't even captured:
- `is_consectiveDate` — never computed (the date-gap logic in legacy `ODE3.js` is absent from `QuoteLocationPage`).
- `noha` rank / `selcted_noha_type` (e.g. Bartender = `M/Q`) — dropped at EventType and VendorActivity.
(The other triggers — hired, sold-profitable, special activities, ticket charge — *are* captured, so they're recoverable.)

### 1.3 Per-step status
| Step | Rebuild page | Status | Notes |
|------|--------------|:------:|-------|
| Event type | `EventTypePage` | 🟡 partial | drops `noha` rank, `referral_string`, `other_event_code`, email-link resume |
| Host vs Vendor | `VendorOrHostPage` | ✅ (reordered) | vendor sequencing differs but data equivalent |
| Vendor activity | `VendorActivityPage` | 🟡 partial | "Other Vendor Type" free-text not rendered; Food&Drink gate keys off different string; drops `noha` |
| Dates | `QuoteDatesPage` | 🟡 partial | drops disabled-day logic, venue-prefill readonly, **`is_consectiveDate`** |
| State / private residence | `QuoteLocationPage` | 🟡 partial | **drops `is_consectiveDate`**; hard-coded 51-state list vs API |
| Alcohol | `QuoteAlcoholPage` | ✅ faithful | conditional follow-ups + liquor/host_liquor match exactly |
| Guests | `QuoteGuestsPage` | ✅ faithful | adds quick-pick chips |
| Special activities | `QuoteActivitiesPage` | 🟡 logic dropped | answer no longer routes to manual quote |
| Policy add-ons | `QuoteAddonsPage` | 🟡 logic dropped | NOHA warning faithful, but `noha=Yes` no longer triggers manual quote |
| Event description | `QuoteDescriptionPage` | 🟡 partial | conditional gating dropped (always shown) |
| **Plans** | `QuotePlansPage` | 🟡 divergent | 4 cards + recommended badge look right; no-plans case differs; pricing diverges (see §2) |
| Named insured | `QuoteInsuredPage` | ✅ faithful | all 6 fields |
| Venue / additional insured | `QuoteVenuePage` | ❌ divergent | collects **venue** data; legacy `ODE10A` collected **per-additional-insured parties** — different data, AI details never captured |
| Contact + signature | `QuoteInfoPage` | ✅+ | adds pending-quote autosave (enhancement) |
| Payment | `QuotePaymentPage` | ✅ modernized | Stripe Elements vs legacy Stripe v2 + jQuery |
| Confirmation | `QuoteConfirmationPage` | ✅ likely | route present |
| Thank-you (manual branch) | — | ❌ missing | no terminal screen for manual-quote path |
| Donate (post-purchase) | — | ❌ missing | not ported |
| Certificate (in-wizard) | — | ❌ missing | no `/quote/certificate` route |

**Dead code:** `QuoteDetailsPage.tsx` (664 lines) is unrouted — safe to delete. `QuoteLayout.tsx` IS used (Plans + Info pages) — keep.

---

## 2. Pricing / plans engine — **the critical section** ⚠️

### 2.1 Framing: there are TWO pricing services and they disagree
| Service | File | Wired to | Audience |
|---------|------|----------|----------|
| `QuoteService` | `app/Services/QuoteService.php` | `/api/quote` via `QuoteController` | **Customers** |
| `PlanBuilderService` | `app/Services/PlanBuilderService.php` | `/api/admin/rates/plans` only | Admin invoice builder |

`PlanBuilderService` is the more faithful port (it has the fallback cascades, re-sort, etc.). But **the customer price comes from `QuoteService`**, which is the *less* faithful one. Because the two implement tiering, fallback, recommendation, and additional-insured math differently, **an admin re-pricing a policy can get a different number than the customer was quoted.** They should ultimately share one engine.

### 2.2 Discrepancies that change the **dollar amount charged** (fix first)
1. **Event-type ID remap with a self-contradicting comment.** Legacy keys broker-fee overrides on event-type IDs **66 (Baby Shower) / 72 (Wedding) / 32 (Vendor)**. The rebuild uses constants `BABY_SHOWER_ID=5 / WEDDING_ID=1 / VENDOR_ID=3` (`QuoteService.php:15-17,191-204`) — and the inline comment literally says "Baby Shower = 66, Wedding = 72" while the code uses 5 and 1. If the new DB's event_type IDs aren't exactly 5/1/3 (the seeder is fragile auto-increment), the small-event broker overrides and vendor discount fire on the **wrong event types**, mispricing every Baby Shower / Wedding / Vendor quote.
2. **Urgency surcharge folded into the total.** Rebuild adds the same-day/next-day surcharge into the broker fee and the plan total (`QuoteService.php:207,170`). Legacy `get_quote_ajax` keeps urgency in a **separate `extraCharge` that is NOT added to `total`** (`Events.php:391`). Every same-day/next-day quote is **$5–$15 higher** than legacy, compounded by 3.5% processing.
3. **Private-residence +$5 folded into the total.** Rebuild adds it to the plan total (`QuoteService.php:159,170`); legacy keeps it in `extraCharge`, out of `total`. Every private-residence quote is **$5 higher**.
4. **Rate-import boolean coercion (data bug).** `additional_people` and `additional_charges` are integer rate columns, but `RateImportController` lists them in `BOOLEAN_FIELDS` and runs them through `parseBool()` on import (`:46-51,125-127`). This **coerces real per-person rates to 0/1**, breaking the additional-insured uplift for everyone who adds insureds.

### 2.3 Discrepancies that change **which plans / recommendation** are shown
5. **Missing plan-bucket fallback cascades.** Legacy second/third/fourth options fall back to alternate limit pairs (`(1,5)→(1,4)→(1,3)`, etc.). `QuoteService` uses only the first pair (`:20-25`), so slots go empty and get back-filled by raw cheapest-remaining → different coverage limits surface. (`PlanBuilderService` has the cascades; the customer service doesn't.)
6. **Recommendation rewritten.** Legacy `get_recommended()` is a 4-plan, asymmetric, position-aware pairwise cascade (`Events.php:822-1714`). `QuoteService::markRecommended()` only ever compares the **two cheapest** plans (`:314-343`). For any quote with ≥3 distinct totals the "RECOMMENDED" badge can land on a different plan.
7. **Missing final re-sort / re-bucket.** Legacy `valueLessThanFour()` re-sorts all four plans by `(min_limit, max_limit)` and re-positions them; `QuoteService::fillEmptySlots()` doesn't (`:272-295`). Cards can render in a different order / under different slot names when a fill occurred.
8. **IH carrier exclusion on wrong event-type + wrong stage.** Rebuild filters `carrier!='IH'` when `event_type==1` in the query (`:109`); legacy skipped IH only for event_type 72 in the pricing loop.

### 2.4 What DOES match (good news)
Per-row math for a plain quote is faithful: broker tiers (≤60→20, ≤150→30, else 25%), processing fee `ceil((premium+broker)/100 × 3.5)`, ASI +5, FDEAN venue lock, ASI-excluded-for-private-residence, the `e_a_i` add-on correctly omitted, and the additional-insured uplift formula. So once §2.2/§2.3 are corrected, the engine should line up.

### 2.5 Constants quick-reference
| Constant | Legacy | Rebuild | Match |
|----------|--------|---------|:-----:|
| Broker ≤60 / ≤150 / else | 20 / 30 / ceil(t/100·25) | 20 / 30 / ceil(t/100·25) | ✅ (minor fractional-gap diff) |
| Processing fee | ceil((prem+broker)/100·3.5) | same | ✅ |
| ASI surcharge | +5 | +5 | ✅ |
| Baby/Wedding/Vendor IDs | 66 / 72 / 32 | 5 / 1 / 3 | ❌ |
| Urgency same/next day | 15·10 / 10·5, separate from total | same values, **in total** | ❌ attachment |
| Private residence +5 | separate from total | **in total** | ❌ |
| Plan buckets | with fallback cascades | first pair only | ❌ |
| Recommendation | 4-plan asymmetric cascade | 2-plan compare | ❌ |
| add'l-insured uplift | (ins − ppl)·charges | same formula | ✅ math / ❌ import coercion |

---

## 3. Backend / affiliate / lead parity

### 3.1 Affiliate management — ~50%
- ✅ Self-signup with unique referral string, Sanctum auth, welcome email, read-only portal (stats/referrals/payouts).
- ❌ **No approval workflow.** Legacy affiliates start `status=0` and an admin approves; rebuild auto-activates `status=1` on register.
- ❌ **No per-affiliate rate config.** Legacy stores `affiliate_percentage` + `agent_commision` and exposes an update endpoint; rebuild has none.
- 🟡 **Commission model changed.** Legacy = `(premium × pct/100) + (agent_commision × #sales)`; rebuild = **flat $10 / $15 / $5** (affiliate/planner/customer). Cited as a deliberate spec change — **confirm with business**, since migrated partners with negotiated percentages would be mis-paid.
- ✅ Referral attribution wiring is correct (FK first, then `affiliate_string → referral_string`).

### 3.2 Lead lifecycle — ~70%
- ✅ Quote → lead → Stripe charge → commission accrual → confirmation/COI queue.
- ✅ Assignment to agents, notes, follow-ups, file upload/download.
- 🟡 **Statuses simplified.** Legacy had named pipelines (untouched/sold/bound/future/past/cancelled/amended/hold/priority); rebuild has a single filterable list on `submission_status` + `status`.
- ❌ **No admin "create lead manually" (MQ) endpoint** surfaced — only the public `store`. Core to "capture the leads"; verify.
- ❌ Missing: click in/out tracking, per-lead chat/messaging, file-history workflow.

### 3.3 Portals — ~70% (read-only)
Legacy portals (Affiliate/Agent/Planner/Customer) each had ~30 **action** methods (requote, edit-quote, policy add-ons, send-invoice, claims, certificate email). The rebuild's portals are thin read-only controllers. Missing portal **actions**: requote, edit-quote, policy add-ons, "send invoice", claims forms.

### 3.4 At parity (no action)
Quote engine endpoint, Stripe lead payment + commission accrual, lead assignment/notes/follow-ups, DocuSign (send/status/webhook/sync), COI/policy/receipt PDFs, email templates + 4 cron automations, public invoice pay, rate import, pages/blog, W9 upload+verify gating. Rebuild *adds* subscribers + structured contact form.

### 3.5 Likely-intentional omissions (confirm)
PayPal (Stripe-only now), granular per-module permission ACL (replaced by 5 role middlewares), IMAP inbox, CMS login impersonation.

---

## 4. Prioritized action list

### P0 — pricing correctness (do before any real quoting)
1. **Unify on one pricing engine** — make `/api/quote` and `/api/admin/rates/plans` share the faithful logic (port `PlanBuilderService`'s cascades/re-sort/recommendation into the customer path, or merge the two).
2. **Fix event-type ID mapping** (§2.2.1) — map by event_type *meaning*, not fragile numeric IDs; reconcile the contradicting comment.
3. **Move urgency + private-residence charges out of `total`** to match legacy `extraCharge` handling (§2.2.2–3).
4. **Fix rate-import coercion** — remove `additional_people`/`additional_charges` from `BOOLEAN_FIELDS` (§2.2.4).
5. **Restore plan fallback cascades, final re-sort, and the real recommendation algorithm** (§2.3.5–7).
6. Add a regression harness: feed N representative input sets through both legacy and rebuild and assert identical premium/broker/processing/total/recommended.

### P1 — wizard branching correctness
7. **Build the manual-quote / underwriting fork** (§1.2) + capture its missing inputs (`is_consectiveDate`, `noha` rank). Add a terminal "we'll review this" page.
8. **Add the per-additional-insured details step** (legacy ODE10A) so certificates can name additional insureds.
9. Restore the Event-Description conditional gating and the "Other Vendor Type" free-text input.

### P2 — affiliate & lead management ("manage affiliates / capture leads")
10. Affiliate **approval workflow** + admin **rate configuration** endpoints.
11. Decide commission model (flat vs percentage) with the business; implement accordingly.
12. Admin **manual lead creation** + named lead pipelines / status filters.
13. Portal **actions**: requote, edit-quote, policy add-ons, send-invoice.

### P3 — cleanup & confirm-intentional
14. Delete dead `QuoteDetailsPage.tsx`; refresh `PROJECT_MEMORY.md` / supersede stale `BUILD-STATUS.md`.
15. Confirm intentional drops: PayPal, per-module ACL, IMAP inbox, impersonation, donate step, in-wizard certificate.

---

## 5. Reference paths
- Legacy quote frontend: `ode_new/src/pages/business/pages/ode/component/`
- Legacy router (state machine): `…/component/questions/QuestionLayout.js`
- Legacy pricing: `ode_new/portal/application/controllers/Events.php` + `helpers/common_helper.php` + `models/Events_model.php`
- Rebuild customer pricing: `ode-api/app/Services/QuoteService.php` (+ `QuoteController.php`)
- Rebuild admin pricing: `ode-api/app/Services/PlanBuilderService.php`
- Rebuild wizard: `ode-frontend/src/pages/quote/` + `stores/quoteStore.ts` + `routes/index.tsx`
- Rebuild API surface: `ode-api/routes/api.php`
</content>
</invoke>
