# Chunk 11 — Event Type Selector

**Status**: Complete  
**Date**: 2026-04-14

## What was built

### New files
| File | Purpose |
|------|---------|
| `src/pages/quote/QuoteLayout.tsx` | Shared wizard shell: header, 5-step progress bar, content area |
| `src/pages/quote/EventTypePage.tsx` | Step 1 of the quote wizard |

### Routes updated
- `src/routes/index.tsx` — `GET /onedayevent` → `<EventTypePage />` (lazy-loaded)

## EventTypePage behaviour
1. On mount, calls `reset()` on the quote store to clear any previous wizard session
2. Fetches event types from `GET /api/event-types` via `useQuery` (5-min stale time)
3. Shows 3 quick-pick buttons: **Wedding Reception**, **Birthday Party**, **Vendor at Event**
   - Clicking one immediately saves to `quoteStore` and navigates to `/quote/details`
4. Below a divider: searchable autocomplete input filtering the full event type list
   - Quick-pick event types are excluded from the default (empty-query) list to avoid duplication
   - Dropdown closes on outside click
5. **Next** button enabled only after a selection from the autocomplete; quick-picks bypass it
6. Saves `{ eventType: id, eventTypeName: name }` to `useQuoteStore.setParams()`

## QuoteLayout behaviour
- 5-step progress indicator (Event Type / Details / Plans / Your Info / Payment)
- Active step: blue underline + blue text
- Completed steps: muted blue underline
- Responsive: step names on sm+, step numbers on mobile
- `step` prop is `1 | 2 | 3 | 4 | 5`

## Notes
- `ProtectedRoute` import removed from routes until Chunk 17; re-add it then
- `@tanstack/react-query` `QueryClientProvider` was already configured in `App.tsx`
- Build verified clean: `EventTypePage` lazy-chunked at 15.62 kB (5.65 kB gzip)
