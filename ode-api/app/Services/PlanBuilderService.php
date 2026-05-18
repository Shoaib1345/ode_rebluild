<?php

namespace App\Services;

use App\Models\CarrierGlLimit;
use App\Models\EventRate;
use Illuminate\Support\Collection;

/**
 * Replicates the production ode_new plan-generation logic exactly:
 *   Events::get_quote_ajax()          — entry + tier assignment
 *   common_helper::broker_fee()       — fee tiers + event-type overrides
 *   common_helper::processFee()       — 3.5% ceiled processing fee
 *   Events::get_recommended()         — inflation-threshold recommendation
 *   Events::valueLessThanFour()       — empty-slot fill + re-sort
 *
 * Produces four named plan tiers (firstOption → fourthOption).
 * Each tier selects the cheapest rate that satisfies its GL-limit pair.
 */
class PlanBuilderService
{
    /**
     * GL-limit pairs that define each plan tier (priority-ordered fallbacks).
     * Mirrors the firstOption/secondOption/thirdOption/fourthOption functions
     * in ode_new Events.php.
     */
    private const TIER_LIMITS = [
        'firstOption'  => [[1, 2]],
        'secondOption' => [[1, 5], [1, 4], [1, 3]],
        'thirdOption'  => [[2, 5], [2, 4], [2, 3]],
        'fourthOption' => [[5, 5], [4, 5], [3, 5]],
    ];

    /**
     * Build the four plan options for the given parameters.
     *
     * @param  array{
     *   event_type_id?: int|string,
     *   no_of_people?:  int|string,
     *   state?:         string,
     *   carrier?:       string,
     *   host_liquor?:   bool|int,
     *   noha?:          bool|int,
     *   w_o_s?:         bool|int,
     *   p_a_n_c_b?:     bool|int,
     * }  $params
     *
     * @return array{
     *   firstOption:  array|null,
     *   secondOption: array|null,
     *   thirdOption:  array|null,
     *   fourthOption: array|null,
     * }
     */
    public function buildPlans(array $params): array
    {
        $eventTypeId  = (int)  ($params['event_type_id'] ?? 0);
        $persons      = (int)  ($params['no_of_people']  ?? 0);
        $state        = $params['state']    ?? null;
        $carrier      = $params['carrier']  ?? null;
        $wantsLiquor  = (bool) ($params['host_liquor'] ?? false);
        $wantsNoha    = (bool) ($params['noha']        ?? false);
        $wantsWos     = (bool) ($params['w_o_s']       ?? false);
        $wantsPancb   = (bool) ($params['p_a_n_c_b']   ?? false);

        // ── 1. Fetch matching event_rate rows ─────────────────────────────────
        $rates = $this->fetchRates(
            $eventTypeId, $persons, $state, $carrier,
            $wantsLiquor, $wantsNoha, $wantsWos, $wantsPancb
        );

        // ── 2. Price every row (skip IH for event_type 72, per production) ────
        $priced = $rates
            ->reject(fn(EventRate $r) => $r->carrier === 'IH' && $eventTypeId === 72)
            ->map(fn(EventRate $r) => $this->pricePlan(
                $r, $eventTypeId, $persons, $wantsNoha, $wantsWos, $wantsPancb
            ))
            ->values();

        // ── 3. Assign to four tiers ───────────────────────────────────────────
        $options = $this->assignTiers($priced);

        // ── 4. Mark recommended ───────────────────────────────────────────────
        $this->markRecommended($options);

        return $options;
    }

    // ─── Data fetching ────────────────────────────────────────────────────────

    private function fetchRates(
        int    $eventTypeId,
        int    $persons,
        ?string $state,
        ?string $carrier,
        bool   $wantsLiquor,
        bool   $wantsNoha,
        bool   $wantsWos,
        bool   $wantsPancb
    ): Collection {
        $query = EventRate::query();

        if ($eventTypeId) {
            $query->where('event_type_id', $eventTypeId);
        }

        if ($persons > 0) {
            $query->where('min_audience', '<=', $persons)
                  ->where('max_audience', '>=', $persons);
        }

        if ($state) {
            // Uses EventRate::scopeForState (whereHas event_rate_states)
            $query->forState($state);
        }

        if ($carrier) {
            $query->where('carrier', $carrier);
        }

        // Host liquor: if requested, only return rows that include it
        if ($wantsLiquor) {
            $query->where('host_liquor', 1);
        }

        // Add-on availability: exclude 'N/A' and 'M/Q' rows
        if ($wantsNoha) {
            $query->whereNotIn('noha', ['N/A', 'M/Q'])
                  ->whereNotNull('noha');
        }
        if ($wantsWos) {
            $query->whereNotIn('w_o_s', ['N/A', 'M/Q'])
                  ->whereNotNull('w_o_s');
        }
        if ($wantsPancb) {
            $query->whereNotIn('p_a_n_c_b', ['N/A', 'M/Q'])
                  ->whereNotNull('p_a_n_c_b');
        }

        return $query->get();
    }

    // ─── Pricing ──────────────────────────────────────────────────────────────

    /**
     * Compute the full price for a single EventRate row.
     * Mirrors the per-row loop inside get_quote_ajax().
     */
    private function pricePlan(
        EventRate $rate,
        int  $eventTypeId,
        int  $persons,
        bool $wantsNoha,
        bool $wantsWos,
        bool $wantsPancb
    ): array {
        $premium = (float) $rate->rate;

        // ── Add-ons ──────────────────────────────────────────────────────────
        $addons = 0.0;
        if ($wantsNoha   && $this->addonAvailable($rate->noha))    $addons += (float) $rate->noha;
        if ($wantsWos    && $this->addonAvailable($rate->w_o_s))   $addons += (float) $rate->w_o_s;
        if ($wantsPancb  && $this->addonAvailable($rate->p_a_n_c_b)) $addons += (float) $rate->p_a_n_c_b;
        // Note: e_a_i is stored but intentionally NOT added to total (mirrors production)

        // ── Additional audience charge ────────────────────────────────────────
        $addAudience = 0.0;
        $addPpl      = (int) $rate->additional_people;
        $addCharge   = (float) $rate->additional_charges;
        if ($addPpl > 0 && $persons > $addPpl) {
            $addAudience = ($persons - $addPpl) * $addCharge;
        }

        $subtotal = $premium + $addons + $addAudience;

        // ── Fees ─────────────────────────────────────────────────────────────
        $brokerFee     = $this->calcBrokerFee($subtotal, $eventTypeId, $rate->carrier, $persons);
        $processingFee = (float) ceil(($subtotal + $brokerFee) * 3.5 / 100);
        $total         = (float) ceil($subtotal + $brokerFee + $processingFee);

        // ── GL limits from carriers_gl_limits table ───────────────────────────
        $limits = $this->getGlLimits(
            (int) $rate->min_limit,
            (int) $rate->max_limit,
            $rate->carrier
        );

        return [
            'rate_id'             => $rate->id,
            'carrier'             => $rate->carrier,
            'event_type_id'       => $rate->event_type_id,
            'min_audience'        => (int) $rate->min_audience,
            'max_audience'        => (int) $rate->max_audience,
            'min_limit'           => (int) $rate->min_limit,
            'max_limit'           => (int) $rate->max_limit,
            'premium'             => $premium,
            'addons'              => $addons,
            'additional_audience' => $addAudience,
            'subtotal'            => $subtotal,
            'broker_fee'          => $brokerFee,
            'processing_fee'      => $processingFee,
            'total'               => $total,
            'limits'              => $limits,
            'host_liquor'         => (bool) $rate->host_liquor,
            'recommended'         => false,
        ];
    }

    private function addonAvailable(mixed $value): bool
    {
        return $value !== null
            && $value !== 'N/A'
            && $value !== 'M/Q'
            && (float) $value > 0;
    }

    /**
     * Broker fee — exact mirror of common_helper::broker_fee() in ode_new.
     *
     *  Base tiers (by premium subtotal):
     *    ≤ $60          → $20
     *    $61 – $150     → $30
     *    > $150         → ceil(subtotal / 100 × 25)   (25%)
     *
     *  Event-type overrides:
     *    66 / 72 (Baby Shower variants) — tiered by persons:
     *        ≤ 50 ppl → $10 | 51-100 ppl → $20 | > 100 → base tier
     *    32  (Vendor at Event) — subtract $10 from result
     *
     *  Carrier surcharge:
     *    ASI → +$5
     */
    private function calcBrokerFee(
        float  $subtotal,
        int    $eventTypeId,
        string $carrier,
        int    $persons
    ): float {
        // Baby shower overrides
        if (in_array($eventTypeId, [66, 72], true)) {
            $fee = match (true) {
                $persons <= 50  => 10.0,
                $persons <= 100 => 20.0,
                default         => $this->baseBrokerFee($subtotal),
            };
        } else {
            $fee = $this->baseBrokerFee($subtotal);
        }

        // Vendor event discount
        if ($eventTypeId === 32) {
            $fee -= 10.0;
        }

        // ASI surcharge
        if ($carrier === 'ASI') {
            $fee += 5.0;
        }

        return max(0.0, $fee);
    }

    private function baseBrokerFee(float $subtotal): float
    {
        if ($subtotal <= 60)  return 20.0;
        if ($subtotal <= 150) return 30.0;
        return (float) ceil($subtotal / 100 * 25);
    }

    private function getGlLimits(int $minLimit, int $maxLimit, string $carrier): array
    {
        return CarrierGlLimit::where('carrier', $carrier)
            ->where('min_limit', $minLimit)
            ->where('max_limit', $maxLimit)
            ->get(['gl_limit', 'gl_limit_type'])
            ->map(fn($l) => [
                'gl_limit'      => $l->gl_limit,
                'gl_limit_type' => $l->gl_limit_type,
            ])
            ->toArray();
    }

    // ─── Tier assignment ──────────────────────────────────────────────────────

    /**
     * Assign priced plans to the four named slots.
     * Mirrors the firstOption/secondOption/thirdOption/fourthOption functions
     * plus valueLessThanFour() re-sorting from ode_new Events.php.
     */
    private function assignTiers(Collection $priced): array
    {
        $used    = collect();   // track assigned plans to avoid duplicates
        $options = [];

        foreach (self::TIER_LIMITS as $slot => $tierPairs) {
            $options[$slot] = $this->pickLowest($priced, $tierPairs, $used);
        }

        // ── valueLessThanFour: fill remaining null slots ──────────────────────
        $remaining = $priced
            ->filter(fn($p) => !$used->contains('rate_id', $p['rate_id']))
            ->sortBy('total')
            ->values();

        $slots = ['firstOption', 'secondOption', 'thirdOption', 'fourthOption'];

        foreach ($slots as $slot) {
            if ($options[$slot] === null && $remaining->isNotEmpty()) {
                $options[$slot] = $remaining->shift();
            }
        }

        // Re-sort all non-null options by min_limit ASC, max_limit ASC
        // then re-assign positionally (mirrors production re-bucketing)
        $filled = collect(array_filter($options))
            ->sortBy([['min_limit', 'asc'], ['max_limit', 'asc']])
            ->values();

        $i = 0;
        foreach ($slots as $slot) {
            $options[$slot] = $i < $filled->count() ? $filled[$i++] : null;
        }

        return $options;
    }

    /**
     * Pick the cheapest plan (by total) that matches one of the tier pairs.
     * Tries pairs in priority order, skips already-used plans.
     */
    private function pickLowest(Collection $priced, array $tierPairs, Collection $used): ?array
    {
        foreach ($tierPairs as [$minL, $maxL]) {
            $match = $priced
                ->filter(fn($p) =>
                    (int) $p['min_limit'] === $minL &&
                    (int) $p['max_limit'] === $maxL &&
                    !$used->contains('rate_id', $p['rate_id'])
                )
                ->sortBy('total')
                ->first();

            if ($match !== null) {
                $used->push($match);
                return $match;
            }
        }
        return null;
    }

    // ─── Recommended ─────────────────────────────────────────────────────────

    /**
     * Mark the first plan (starting from firstOption) where the price gap to
     * every higher-tier plan exceeds an inflation threshold.
     *
     * Logic mirrors get_recommended() in ode_new Events.php:
     *   A plan is recommended when: plan_total × (1 + X%) < ALL_higher_plan_totals
     *
     * Inflation thresholds by total:
     *   ≤ $200  → 40%  |  ≤ $400  → 30%  |  ≤ $600  → 25%
     *   ≤ $1000 → 20%  |  ≤ $1500 → 17.5% | > $1500 → 15%
     */
    private function markRecommended(array &$options): void
    {
        $slots = ['firstOption', 'secondOption', 'thirdOption', 'fourthOption'];

        foreach ($slots as $i => $slot) {
            if ($options[$slot] === null) continue;

            $total    = (float) $options[$slot]['total'];
            $inflated = $total * $this->inflationFactor($total);

            // Check that all higher-tier plans cost more than the inflated price
            $recommended = true;
            foreach ($slots as $j => $other) {
                if ($j <= $i)                  continue; // only higher plans
                if ($options[$other] === null)  continue;
                if ((float) $options[$other]['total'] <= $inflated) {
                    $recommended = false;
                    break;
                }
            }

            if ($recommended) {
                $options[$slot]['recommended'] = true;
                return; // only one plan is ever recommended
            }
        }

        // Fallback: if no plan qualifies, mark the most expensive non-null plan
        foreach (array_reverse($slots) as $slot) {
            if ($options[$slot] !== null) {
                $options[$slot]['recommended'] = true;
                return;
            }
        }
    }

    private function inflationFactor(float $total): float
    {
        if ($total <= 200)  return 1.40;
        if ($total <= 400)  return 1.30;
        if ($total <= 600)  return 1.25;
        if ($total <= 1000) return 1.20;
        if ($total <= 1500) return 1.175;
        return 1.15;
    }
}
