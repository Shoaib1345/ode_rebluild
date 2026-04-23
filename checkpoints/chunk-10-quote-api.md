# Chunk 10 — Quote Engine API

**Status**: Complete  
**Date**: 2026-04-14

## What was built

### New files
| File | Purpose |
|------|---------|
| `app/Services/QuoteService.php` | Core pricing engine |
| `app/Http/Controllers/QuoteController.php` | Thin controller delegating to QuoteService |
| `app/Http/Requests/QuoteRequest.php` | Validated request for GET /api/quote |

### Routes added to `routes/api.php`
```
GET /api/event-types    → QuoteController@eventTypes
GET /api/us-states      → QuoteController@usStates
GET /api/quote          → QuoteController@getQuote
GET /api/broker-fee     → QuoteController@getBrokerFee
```

## Pricing logic

### Broker fee tiers
| Premium | Fee |
|---------|-----|
| ≤ $60 | $20 flat |
| $61–$150 | $30 flat |
| > $150 | `ceil(premium / 100 * 25)` |

**Event type overrides** (Baby Shower id=66, Wedding id=72):
- ≤ 50 persons → $10
- ≤ 100 persons → $20
- > 100 persons → normal tiers above

**Vendor (id=32)**: −$10 from calculated fee

**Urgency surcharges** (added to broker fee):
| Scenario | Surcharge |
|----------|-----------|
| Same-day weekday | +$10 |
| Same-day weekend | +$15 |
| Next-day weekday | +$5 |
| Next-day weekend | +$10 |

**ASI carrier**: +$5 always

### Processing fee
`ceil((premium + broker_fee) / 100 * 3.5)`

### Private residence
+$5 extra_charge (not in broker fee, separate line item)

## Plan bucketing
| Slot | min_limit | max_limit |
|------|-----------|-----------|
| firstOption | 1 | 2 |
| secondOption | 1 | 5 |
| thirdOption | 2 | 5 |
| fourthOption | 5 | 5 |

Empty slots are back-filled with cheapest remaining plans.

## Recommended plan selection
- Single plan → mark it
- Multiple plans: if `second.total > cheapest.total * (1 + valueMultiplier)` → recommend cheapest; else recommend second-cheapest

**Value multiplier by cheapest total:**
≤$200→40%, ≤$400→30%, ≤$600→25%, ≤$1000→20%, ≤$1500→17.5%, else 15%

## Carrier restrictions
- `private_residence=true` → exclude ASI
- `is_venue=true` → FDEAN only
- Wedding event type → exclude IH

## Verification
All 4 endpoints tested and confirmed:
- `GET /api/event-types` → returns event type list
- `GET /api/us-states` → returns all 51 rows (50 states + DC)
- `GET /api/quote?event_type=1&event_state=CA&persons=50&event_dates=12/25/2026` → correct plan with premium=$98, broker_fee=$35, processing_fee=$5, total=$138
- `GET /api/broker-fee?premium=98&carrier=ASI&...` → broker_fee=$35, processing_fee=$5, total=$138

## Notes
- `event_rate_states` pivot table replaces the legacy CSV `states` column in `crm_event_rates`
- GL limits attach from `carrier_gl_limits` table (empty in dev seed; will populate with real data in Chunk 29 migration)
- The tinker `Model::create()` silently failed on `event_rate_states` due to a unique constraint conflict; fixed by using `DB::table()->insert()` for seeding
