# Chunk 13 — Quote Plans Page

**Status**: Complete  
**Date**: 2026-04-14

## What was built

### New files
| File | Purpose |
|------|---------|
| `src/pages/quote/QuotePlansPage.tsx` | Step 3 — displays up to 4 plan cards, handles selection |

### Types updated
- `src/types/index.ts` — `QuotePlan` aligned to actual API response:
  - Renamed `id` → `rate_id`
  - Added `processing_fee`
  - Removed unused `noha`, `w_o_s`, `p_a_n_c_b` fields (these are input params, not plan output)

### Routes updated
- `src/routes/index.tsx` — `GET /quote/plans` → `<QuotePlansPage />` (lazy-loaded)

## Page behaviour

### Data flow
1. On mount: verifies `params.eventType` and `params.eventDates` exist in Zustand — redirects to `/onedayevent` if missing
2. Builds API query params from the full Zustand params object
3. Calls `GET /api/quote` via `useQuery` (staleTime=Infinity — params don't change while on this page)
4. Persists returned plans to `useQuoteStore.setPlans()`

### Plan cards
- Up to 4 cards: Basic (1M/2M), Standard (1M/5M), Enhanced (2M/5M), Premium (5M/5M)
- Sorted: recommended plan first, then ascending by total
- Each card shows: tier label, limit badge, GL limits table, carrier, price breakdown (premium + broker fee + processing fee + private residence surcharge), total
- "★ Recommended" ring on the recommended plan
- "Select Plan" CTA → saves to `useQuoteStore.setSelectedPlan()`, navigates to `/quote/info`

### States handled
| State | UI |
|-------|----|
| Loading | 4 animated skeleton cards |
| API error | Red box with retry button |
| No plans returned | Amber box with phone number and "Adjust Details" back link |
| Plans loaded | Grid of 1–4 plan cards |

### Price breakdown shown per card
```
Premium:          $XX.XX
Broker fee:       $XX.XX
Processing fee:   $XX.XX
Private residence: $5.00   (if applicable)
────────────────────────
Total:            $XX.XX
```

## Notes
- `staleTime: Infinity` prevents re-fetching on window focus since params are frozen once you reach this page
- Grid is `sm:grid-cols-2` regardless of plan count to keep cards readable on desktop
- `QuotePlansPage` lazy-chunk: 7.58 kB / 2.62 kB gzip (very lean — no heavy deps)
