<?php

namespace App\Services;

use App\Models\CarrierGlLimit;
use App\Models\EventRate;
use App\Models\UsState;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class QuoteService
{
    // Event type IDs that have custom broker fee rules
    const BABY_SHOWER_ID = 66;
    const WEDDING_ID     = 72;
    const VENDOR_ID      = 32;

    // GL limit buckets that define the 4 plan options
    const PLAN_BUCKETS = [
        'firstOption'  => ['min' => 1, 'max' => 2], // mediocre
        'secondOption' => ['min' => 1, 'max' => 5], // recommended
        'thirdOption'  => ['min' => 2, 'max' => 5], // most expensive
        'fourthOption' => ['min' => 5, 'max' => 5], // highest
    ];

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

        // ── 2. Parse dates ─────────────────────────────────────────────────────
        $dates     = array_map('trim', explode(',', $params['event_dates']));
        $timezone  = $params['timezone'] ?? 'America/Los_Angeles';
        $isToday   = $this->isToday($dates[0], $timezone);
        $isWeekend = $this->isWeekend($dates[0], $timezone);

        // ── 3. Query matching rates ────────────────────────────────────────────
        $rates = $this->queryRates($params, $stateCode, $isToday, $isWeekend);

        if ($rates->isEmpty()) {
            return $this->emptyResult();
        }

        // ── 4. Build a priced plan for every matching rate ─────────────────────
        $plans = $rates->map(function (EventRate $rate) use ($params, $dates, $timezone) {
            return $this->buildPlan($rate, $params, $dates, $timezone);
        })->values();

        // ── 5. Bucket into 4 options ───────────────────────────────────────────
        $bucketed = $this->bucketPlans($plans);

        // ── 6. Attach GL limits to each non-null option ────────────────────────
        foreach ($bucketed as $key => $plan) {
            if ($plan !== null) {
                $bucketed[$key]['limits'] = $this->getGlLimits(
                    $plan['carrier'],
                    $plan['min_limit'],
                    $plan['max_limit']
                );
            }
        }

        // ── 7. Mark the recommended plan ──────────────────────────────────────
        $bucketed = $this->markRecommended($bucketed);

        return $bucketed;
    }

    /**
     * Calculate broker fee + processing fee for a given premium.
     * Used by the standalone broker-fee endpoint.
     */
    public function calculateFees(float $premium, string $carrier, int $eventTypeId, int $persons, array $dates, string $timezone): array
    {
        $brokerFee     = $this->calculateBrokerFee($premium, $carrier, $eventTypeId, $persons, $dates, $timezone);
        $processingFee = $this->calculateProcessingFee($premium, $brokerFee);

        return [
            'broker_fee'     => $brokerFee,
            'processing_fee' => $processingFee,
            'total'          => $premium + $brokerFee + $processingFee,
        ];
    }

    // ── Private — Rate Query ───────────────────────────────────────────────────

    private function queryRates(array $p, string $stateCode, bool $isToday, bool $isWeekend): Collection
    {
        return EventRate::query()
            ->where('event_type_id', $p['event_type'])
            ->where('min_audience', '<=', $p['persons'])
            ->where('max_audience', '>=', $p['persons'])
            ->whereHas('states', fn ($q) => $q->where('state_code', $stateCode))
            // Same-day / weekend coverage requirements
            ->when($isToday,              fn ($q) => $q->where('same_day_coverage', true))
            ->when($isToday && $isWeekend, fn ($q) => $q->where('weekend_coverage', true))
            // Carrier restrictions
            ->when($p['private_residence'] ?? false, fn ($q) => $q->where('carrier', '!=', 'ASI'))
            ->when($p['is_venue'] ?? false,           fn ($q) => $q->where('carrier', 'FDEAN'))
            ->when((int) ($p['event_type'] ?? 0) === self::WEDDING_ID, fn ($q) => $q->where('carrier', '!=', 'IH'))
            // Liquor matching
            ->when($p['liquor'] ?? false,     fn ($q) => $q->where('liquor', true))
            ->when(
                !($p['liquor'] ?? false) && ($p['host_liquor'] ?? false),
                fn ($q) => $q->where('host_liquor', true)
            )
            // Add-on availability filtering
            ->when($p['noha'] ?? false,    fn ($q) => $q->whereNotIn('noha',    ['N/A', 'M/Q']))
            ->when($p['w_o_s'] ?? false,   fn ($q) => $q->whereNotIn('w_o_s',   ['N/A', 'M/Q']))
            ->when($p['p_a_n_c_b'] ?? false, fn ($q) => $q->whereNotIn('p_a_n_c_b', ['N/A', 'M/Q']))
            ->orderBy('rate')
            ->get();
    }

    // ── Private — Plan Building ────────────────────────────────────────────────

    private function buildPlan(EventRate $rate, array $params, array $dates, string $timezone): array
    {
        // Premium = base rate + requested add-ons
        $premium = (float) $rate->rate;

        if (($params['noha'] ?? false) && ! in_array($rate->noha, ['N/A', 'M/Q'])) {
            $premium += (float) $rate->noha;
        }
        if (($params['w_o_s'] ?? false) && ! in_array($rate->w_o_s, ['N/A', 'M/Q'])) {
            $premium += (float) $rate->w_o_s;
        }
        if (($params['p_a_n_c_b'] ?? false) && ! in_array($rate->p_a_n_c_b, ['N/A', 'M/Q'])) {
            $premium += (float) $rate->p_a_n_c_b;
        }

        // Additional insureds
        $additionalInsureds = (int) ($params['additional_insureds'] ?? 0);
        if ($additionalInsureds > 0 && $rate->additional_people && $rate->additional_charges) {
            $extraPeople = max(0, $additionalInsureds - (int) $rate->additional_people);
            $premium += $extraPeople * (float) $rate->additional_charges;
        }

        $brokerFee     = $this->calculateBrokerFee(
            $premium,
            $rate->carrier,
            (int) $params['event_type'],
            (int) $params['persons'],
            $dates,
            $timezone
        );
        $processingFee = $this->calculateProcessingFee($premium, $brokerFee);

        // Private residence +$5 extra charge (not baked into broker fee)
        $extraCharge = ($params['private_residence'] ?? false) ? 5.0 : 0.0;

        return [
            'rate_id'        => $rate->id,
            'carrier'        => $rate->carrier,
            'min_limit'      => $rate->min_limit,
            'max_limit'      => $rate->max_limit,
            'premium'        => round($premium, 2),
            'broker_fee'     => round($brokerFee, 2),
            'processing_fee' => round($processingFee, 2),
            'extra_charge'   => round($extraCharge, 2),
            'total'          => round($premium + $brokerFee + $processingFee + $extraCharge, 2),
            'recommended'    => false,
            'limits'         => [],
        ];
    }

    // ── Private — Broker Fee ───────────────────────────────────────────────────

    private function calculateBrokerFee(
        float $premium, string $carrier, int $eventTypeId,
        int $persons, array $dates, string $timezone
    ): float {
        // Base fee by premium tier
        if ($premium <= 60) {
            $fee = 20.0;
        } elseif ($premium <= 150) {
            $fee = 30.0;
        } else {
            $fee = ceil($premium / 100 * 25);
        }

        // Event type overrides (Baby Shower = 66, Wedding = 72)
        if (in_array($eventTypeId, [self::BABY_SHOWER_ID, self::WEDDING_ID])) {
            if ($persons <= 50) {
                $fee = 10.0;
            } elseif ($persons <= 100) {
                $fee = 20.0;
            }
            // else: normal fee calculation above stands
        }

        // Vendor event discount
        if ($eventTypeId === self::VENDOR_ID) {
            $fee -= 10.0;
        }

        // Urgency surcharge (same-day / next-day)
        $fee += $this->getUrgencySurcharge($dates[0], $timezone);

        // ASI carrier surcharge
        if ($carrier === 'ASI') {
            $fee += 5.0;
        }

        return max(0.0, $fee);
    }

    private function getUrgencySurcharge(string $firstDateStr, string $timezone): int
    {
        try {
            $tz        = new \DateTimeZone($timezone);
            $now       = Carbon::now($tz)->startOfDay();
            $eventDate = Carbon::parse($firstDateStr)->setTimezone($tz)->startOfDay();
            $days      = (int) $now->diffInDays($eventDate, false);
            $isWeekend = $eventDate->isWeekend();

            return match (true) {
                $days === 0 => $isWeekend ? 15 : 10,  // same day
                $days === 1 => $isWeekend ? 10 : 5,   // next day
                default     => 0,
            };
        } catch (\Exception) {
            return 0;
        }
    }

    private function calculateProcessingFee(float $premium, float $brokerFee): float
    {
        return (float) ceil(($premium + $brokerFee) / 100 * 3.5);
    }

    // ── Private — Bucketing ────────────────────────────────────────────────────

    private function bucketPlans(Collection $plans): array
    {
        $result    = [];
        $usedRates = [];

        foreach (self::PLAN_BUCKETS as $slot => $range) {
            $match = $plans
                ->filter(fn ($p) =>
                    (int) $p['min_limit'] === $range['min'] &&
                    (int) $p['max_limit'] === $range['max'] &&
                    ! in_array($p['rate_id'], $usedRates)
                )
                ->sortBy('total')
                ->first();

            if ($match) {
                $usedRates[]   = $match['rate_id'];
                $result[$slot] = $match;
            } else {
                $result[$slot] = null;
            }
        }

        // Fill empty slots with cheapest remaining plans (valueLessThanFour logic)
        $result = $this->fillEmptySlots($plans, $result, $usedRates);

        return $result;
    }

    private function fillEmptySlots(Collection $plans, array $result, array $usedRates): array
    {
        $emptySlots = array_keys(array_filter($result, fn ($v) => $v === null));

        if (empty($emptySlots)) {
            return $result;
        }

        // Get remaining cheapest plans not already used
        $remaining = $plans
            ->filter(fn ($p) => ! in_array($p['rate_id'], $usedRates))
            ->sortBy('total')
            ->values();

        foreach ($emptySlots as $i => $slot) {
            $fallback = $remaining->get($i);
            if ($fallback) {
                $result[$slot] = $fallback;
                $usedRates[]   = $fallback['rate_id'];
            }
        }

        return $result;
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

    // ── Private — Recommended ─────────────────────────────────────────────────

    private function markRecommended(array $plans): array
    {
        // Collect non-null plans sorted by total ascending
        $filled = collect($plans)
            ->filter(fn ($p) => $p !== null)
            ->sortBy('total')
            ->values();

        if ($filled->isEmpty()) {
            return $plans;
        }

        if ($filled->count() === 1) {
            $plans = $this->setRecommended($plans, $filled[0]['rate_id']);
            return $plans;
        }

        // Compare second-cheapest against a value threshold of the cheapest
        $cheapest       = $filled[0];
        $secondCheapest = $filled[1];
        $valuePrice     = $cheapest['total'] * (1 + $this->getValueMultiplier($cheapest['total']));

        // If second option costs more than our value threshold → recommend cheapest
        if ($secondCheapest['total'] > $valuePrice) {
            return $this->setRecommended($plans, $cheapest['rate_id']);
        }

        // Otherwise recommend the second-cheapest (the "recommended" bucket)
        return $this->setRecommended($plans, $secondCheapest['rate_id']);
    }

    private function getValueMultiplier(float $total): float
    {
        return match (true) {
            $total <= 200  => 0.40,
            $total <= 400  => 0.30,
            $total <= 600  => 0.25,
            $total <= 1000 => 0.20,
            $total <= 1500 => 0.175,
            default        => 0.15,
        };
    }

    private function setRecommended(array $plans, int $rateId): array
    {
        foreach ($plans as $slot => $plan) {
            if ($plan !== null && $plan['rate_id'] === $rateId) {
                $plans[$slot]['recommended'] = true;
            }
        }
        return $plans;
    }

    // ── Private — Helpers ──────────────────────────────────────────────────────

    private function resolveStateCode(string $state): ?string
    {
        $state = trim($state);

        // Already a 2-char abbreviation
        if (strlen($state) === 2) {
            return strtoupper($state);
        }

        // Look up by full name
        $row = UsState::where('name', $state)->first();
        return $row?->abbreviation;
    }

    private function isToday(string $dateStr, string $timezone): bool
    {
        try {
            return Carbon::parse($dateStr)
                ->setTimezone($timezone)
                ->isToday();
        } catch (\Exception) {
            return false;
        }
    }

    private function isWeekend(string $dateStr, string $timezone): bool
    {
        try {
            return Carbon::parse($dateStr)
                ->setTimezone($timezone)
                ->isWeekend();
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
