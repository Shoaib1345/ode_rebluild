<?php

namespace App\Services;

use App\Models\CarrierGlLimit;
use App\Models\EventRate;
use App\Models\EventType;
use App\Models\UsState;
use Carbon\Carbon;
use Illuminate\Support\Collection;

/**
 * Customer-facing quote engine. Mirrors legacy ode_new Events::get_quote_ajax().
 *
 * The pricing CORE (broker-fee tiers, processing fee, tier buckets, and
 * recommendation) lives in {@see PricingEngine} and is shared with the admin
 * PlanBuilderService so customer and admin quotes can never drift apart.
 *
 * Parity notes:
 *   - Urgency (same/next-day) + private-residence ($5) are a SEPARATE
 *     `extra_charge`. They are NOT baked into the broker fee or the plan total —
 *     exactly as legacy get_quote_ajax keeps them out of `total`.
 *   - total = ceil(subtotal + broker_fee + processing_fee).
 */
class QuoteService
{
    public function __construct(private PricingEngine $engine) {}

    /**
     * Run the full quote engine and return the 4 plan options.
     *
     * @return array{ firstOption: array|null, secondOption: array|null, thirdOption: array|null, fourthOption: array|null }
     */
    public function getQuote(array $params): array
    {
        // ── 1. Resolve state abbreviation ──────────────────────────────────────
        $stateCode = $this->resolveStateCode($params['event_state']);
        if (! $stateCode) {
            return $this->emptyResult();
        }

        // ── 2. Resolve event-type pricing role (by name, re-seed safe) ─────────
        $role = EventType::find($params['event_type'])?->pricingRole() ?? 'standard';

        // ── 3. Parse dates + compute the separate extra charge ─────────────────
        $dates     = array_map('trim', explode(',', $params['event_dates']));
        $timezone  = $params['timezone'] ?? 'America/Los_Angeles';
        $isToday   = $this->isToday($dates[0], $timezone);
        $isWeekend = $this->isWeekend($dates[0], $timezone);

        // Urgency + private residence — kept OUT of the plan total (legacy parity).
        $extraCharge = $this->computeUrgency($dates, $timezone)
            + (($params['private_residence'] ?? false) ? 5.0 : 0.0);

        // ── 4. Query matching rates ────────────────────────────────────────────
        $rates = $this->queryRates($params, $stateCode, $role, $isToday, $isWeekend);

        if ($rates->isEmpty()) {
            return $this->emptyResult();
        }

        // ── 5. Build a priced plan for every matching rate ─────────────────────
        $plans = $rates->map(
            fn (EventRate $rate) => $this->buildPlan($rate, $params, $role, $extraCharge)
        )->values();

        // ── 6. Bucket into 4 options (cascades + valueLessThanFour re-sort) ────
        $bucketed = $this->engine->assignTiers($plans);

        // ── 7. Attach GL limits to each non-null option ────────────────────────
        foreach ($bucketed as $key => $plan) {
            if ($plan !== null) {
                $bucketed[$key]['limits'] = $this->getGlLimits(
                    $plan['carrier'],
                    $plan['min_limit'],
                    $plan['max_limit']
                );
            }
        }

        // ── 8. Mark the recommended plan ───────────────────────────────────────
        $this->engine->markRecommended($bucketed);

        return $bucketed;
    }

    /**
     * Broker + processing fee for a given premium (standalone broker-fee endpoint).
     * Uses the same engine as the quote path so numbers stay consistent.
     */
    public function calculateFees(float $premium, string $carrier, int $eventTypeId, int $persons, array $dates, string $timezone): array
    {
        $role          = EventType::find($eventTypeId)?->pricingRole() ?? 'standard';
        $brokerFee     = $this->engine->brokerFee($premium, $role, $carrier, $persons);
        $processingFee = $this->engine->processingFee($premium, $brokerFee);

        return [
            'broker_fee'     => $brokerFee,
            'processing_fee' => $processingFee,
            'total'          => (float) ceil($premium + $brokerFee + $processingFee),
        ];
    }

    // ── Private — Rate Query ───────────────────────────────────────────────────

    private function queryRates(array $p, string $stateCode, string $role, bool $isToday, bool $isWeekend): Collection
    {
        return EventRate::query()
            ->where('event_type_id', $p['event_type'])
            ->where('min_audience', '<=', $p['persons'])
            ->where('max_audience', '>=', $p['persons'])
            ->whereHas('states', fn ($q) => $q->where('state_code', $stateCode))
            // Same-day / weekend coverage requirements
            ->when($isToday,               fn ($q) => $q->where('same_day_coverage', true))
            ->when($isToday && $isWeekend, fn ($q) => $q->where('weekend_coverage', true))
            // Carrier restrictions
            ->when($p['private_residence'] ?? false, fn ($q) => $q->where('carrier', '!=', 'ASI'))
            ->when($p['is_venue'] ?? false,          fn ($q) => $q->where('carrier', 'FDEAN'))
            // Legacy skips IH rows for Wedding (legacy event_type 72) in the pricing loop.
            ->when($role === 'wedding', fn ($q) => $q->where('carrier', '!=', 'IH'))
            // Liquor matching
            ->when($p['liquor'] ?? false, fn ($q) => $q->where('liquor', true))
            ->when(
                !($p['liquor'] ?? false) && ($p['host_liquor'] ?? false),
                fn ($q) => $q->where('host_liquor', true)
            )
            // Add-on availability filtering
            ->when($p['noha'] ?? false,      fn ($q) => $q->whereNotIn('noha',      ['N/A', 'M/Q']))
            ->when($p['w_o_s'] ?? false,     fn ($q) => $q->whereNotIn('w_o_s',     ['N/A', 'M/Q']))
            ->when($p['p_a_n_c_b'] ?? false, fn ($q) => $q->whereNotIn('p_a_n_c_b', ['N/A', 'M/Q']))
            ->orderBy('rate')
            ->get();
    }

    // ── Private — Plan Building ────────────────────────────────────────────────

    private function buildPlan(EventRate $rate, array $params, string $role, float $extraCharge): array
    {
        // Subtotal = base rate + requested add-ons + additional-insured uplift.
        $subtotal = (float) $rate->rate;

        if (($params['noha'] ?? false) && ! in_array($rate->noha, ['N/A', 'M/Q'])) {
            $subtotal += (float) $rate->noha;
        }
        if (($params['w_o_s'] ?? false) && ! in_array($rate->w_o_s, ['N/A', 'M/Q'])) {
            $subtotal += (float) $rate->w_o_s;
        }
        if (($params['p_a_n_c_b'] ?? false) && ! in_array($rate->p_a_n_c_b, ['N/A', 'M/Q'])) {
            $subtotal += (float) $rate->p_a_n_c_b;
        }
        // e_a_i is intentionally NOT added (mirrors legacy commented-out behaviour).

        // Additional-insured audience uplift (legacy get_additional_charges).
        $additionalInsureds = (int) ($params['additional_insureds'] ?? 0);
        $addPpl             = (int) $rate->additional_people;
        $addCharge          = (float) $rate->additional_charges;
        if ($addPpl > 0 && $additionalInsureds > $addPpl) {
            $subtotal += ($additionalInsureds - $addPpl) * $addCharge;
        }

        $brokerFee     = $this->engine->brokerFee($subtotal, $role, $rate->carrier, (int) $params['persons']);
        $processingFee = $this->engine->processingFee($subtotal, $brokerFee);

        return [
            'rate_id'        => $rate->id,
            'carrier'        => $rate->carrier,
            'min_limit'      => (int) $rate->min_limit,
            'max_limit'      => (int) $rate->max_limit,
            'premium'        => round($subtotal, 2),
            'broker_fee'     => round($brokerFee, 2),
            'processing_fee' => round($processingFee, 2),
            'extra_charge'   => round($extraCharge, 2),                      // separate — NOT in total
            'total'          => (float) ceil($subtotal + $brokerFee + $processingFee),
            'recommended'    => false,
            'limits'         => [],
        ];
    }

    // ── Private — Urgency (legacy common_helper::extraFee) ─────────────────────

    /**
     * Same-day / next-day urgency surcharge. Checks every event date (legacy
     * searched the whole comma-separated string for today/tomorrow):
     *   today    → 15 (weekend) / 10 (weekday)
     *   tomorrow → 10 (weekend) /  5 (weekday)
     */
    private function computeUrgency(array $dates, string $timezone): float
    {
        try {
            $tz       = new \DateTimeZone($timezone);
            $today    = Carbon::now($tz)->startOfDay();
            $tomorrow = $today->copy()->addDay();

            $eventDates = collect($dates)
                ->map(fn ($d) => $this->safeDate($d, $tz))
                ->filter();

            if ($eventDates->contains(fn (Carbon $d) => $d->isSameDay($today))) {
                return $today->isWeekend() ? 15.0 : 10.0;
            }
            if ($eventDates->contains(fn (Carbon $d) => $d->isSameDay($tomorrow))) {
                return $tomorrow->isWeekend() ? 10.0 : 5.0;
            }
        } catch (\Exception) {
            // fall through
        }

        return 0.0;
    }

    private function safeDate(string $d, \DateTimeZone $tz): ?Carbon
    {
        try {
            return Carbon::parse($d, $tz)->startOfDay();
        } catch (\Exception) {
            return null;
        }
    }

    // ── Private — GL Limits ────────────────────────────────────────────────────

    private function getGlLimits(string $carrier, int $minLimit, int $maxLimit): array
    {
        return CarrierGlLimit::where('carrier', $carrier)
            ->where('min_limit', $minLimit)
            ->where('max_limit', $maxLimit)
            ->whereNotIn('gl_limit_type', [
                'Product/Completed Operations',
                'Personal/Advertising Injury',
            ])
            ->get(['gl_limit', 'gl_limit_type'])
            ->toArray();
    }

    // ── Private — Helpers ──────────────────────────────────────────────────────

    private function resolveStateCode(string $state): ?string
    {
        $state = trim($state);

        if (strlen($state) === 2) {
            return strtoupper($state);
        }

        return UsState::where('name', $state)->first()?->abbreviation;
    }

    private function isToday(string $dateStr, string $timezone): bool
    {
        try {
            return Carbon::parse($dateStr)->setTimezone($timezone)->isToday();
        } catch (\Exception) {
            return false;
        }
    }

    private function isWeekend(string $dateStr, string $timezone): bool
    {
        try {
            return Carbon::parse($dateStr)->setTimezone($timezone)->isWeekend();
        } catch (\Exception) {
            return false;
        }
    }

    private function emptyResult(): array
    {
        return [
            'firstOption'  => null,
            'secondOption' => null,
            'thirdOption'  => null,
            'fourthOption' => null,
        ];
    }
}
