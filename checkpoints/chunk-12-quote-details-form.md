# Chunk 12 — Quote Details Form

**Status**: Complete  
**Date**: 2026-04-14

## What was built

### New files
| File | Purpose |
|------|---------|
| `src/pages/quote/QuoteDetailsPage.tsx` | Step 2 of the quote wizard — all event detail questions |

### Routes updated
- `src/routes/index.tsx` — `GET /quote/details` → `<QuoteDetailsPage />` (lazy-loaded)

## What the form collects (5 sections)

### 1 — Event Dates
- Primary date (required, `react-datepicker`, min = today)
- "Add more dates" toggle reveals 2 optional additional date pickers
- Validation: max 3 dates total; must all be consecutive (else → manual quote)

### 2 — Location
- State dropdown (from `GET /api/us-states`, cached 10 min)
- Private residence Yes/No (shown after state selected, hidden for Vendor events)
- Is at set venue? Yes/No

### 3 — Guests
- Number input, min 1

### 4 — Alcohol
4-button grid:
| Option | Maps to API |
|--------|-------------|
| No Alcohol | `host_liquor=0, liquor=0` |
| Hosted Bar | `host_liquor=1` |
| BYOB | `host_liquor=1` |
| Cash Bar | follow-up questions |

Cash Bar follow-ups:
- "Will you profit?" → Yes → `liquor=1`; No → show ticket question
- "Ticket charge?" → Yes → **manual quote**; No → `host_liquor=1`

Hosted Bar also triggers ticket charge follow-up (ticket=Yes → manual quote).

### 5 — Policy Add-ons
- Waiver of Subrogation (`w_o_s`)
- Primary/Non-contributory (`p_a_n_c_b`)
- Hired/Non-owned Auto (`noha`)
- Additional Insureds (number)

## Manual quote triggers
If any condition is met, the form shows an inline alert with contact details instead of navigating to plans:
1. Alcohol sold for profit (Cash Bar + profit=Yes)
2. Ticket/admission charge
3. More than 3 event dates
4. Non-consecutive event dates

## Store output
On valid submit, writes to `useQuoteStore.setParams()`:
```ts
{
  eventDates,          // "MM/DD/YYYY" or "MM/DD/YYYY,MM/DD/YYYY,..."
  event_state,         // full state name
  number_of_persons,
  noha, w_o_s, p_a_n_c_b,  // 0 | 1
  host_liquor, liquor,      // 0 | 1
  additional_insureds,
  privateResidence, isSetVenue, // 0 | 1
  timezone,            // from Intl.DateTimeFormat().resolvedOptions().timeZone
}
```
Then navigates to `/quote/plans`.

## Notes
- zod v4 `.default()` causes input/output type mismatch with `zodResolver` — removed `.default()` from schema and used `useForm defaultValues` instead
- `react-datepicker` v9 bundles its own TS types
- `QuoteDetailsPage` lazy-chunk: 195.9 kB / 50.5 kB gzip (includes react-datepicker)
- If `stored.eventType` is missing on mount, redirects back to `/onedayevent`
