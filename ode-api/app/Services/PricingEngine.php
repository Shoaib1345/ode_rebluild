<?php

namespace App\Services;

use Illuminate\Support\Collection;

/**
 * Shared insurance-pricing core used by BOTH the customer-facing QuoteService
 * and the admin PlanBuilderService, so the two can never drift apart.
 *
 * Faithfully mirrors the legacy ode_new engine:
 *   - common_helper::broker_fee()  — premium-tier fee + event-type/carrier rules
 *   - common_helper::processFee()  — 3.5% ceiled processing fee
 *   - Events::firstOption()..fourthOption() + valueLessThanFour() — tier buckets
 *   - Events::get_recommended()    — inflation-threshold recommendation
 *
 * IMPORTANT (parity with legacy get_quote_ajax):
 *   - The per-row broker fee does NOT include the urgency surcharge. Legacy calls
 *     broker_fee($total,'','',$carrier) with empty dates, so urgency never enters
 *     the broker fee or the plan total. Urgency + private-residence are a SEPARATE
 *     `extra_charge` the checkout adds later — never baked into `total`.
 *   - total = ceil(subtotal + broker_fee + processing_fee).
 */
class PricingEngine
{
    /**
     * GL-limit pairs that define each plan tier, in priority-ordered fallback
     * cascades. Mirrors firstOption/secondOption/thirdOption/fourthOption.
     */
    public const TIER_LIMITS = [
        'firstOption'  => [[1, 2]],
        'secondOption' => [[1, 5], [1, 4], [1, 3]],
        'thirdOption'  => [[2, 5], [2, 4], [2, 3]],
        'fourthOption' => [[5, 5], [4, 5], [3, 5]],
    ];

    // ── Fees ───────────────────────────────────────────────────────────────────

    /**
     * Base broker fee by premium-subtotal tier (legacy common_helper::broker_fee).
     *   ≤ 60        → 20
     *   61 – 150    → 30
     *   ≥ 151       → ceil(subtotal / 100 × 25)   (25%)
     */
    public function baseBrokerFee(float $subtotal): float
    {
        if ($subtotal <= 60)  return 20.0;
        if ($subtotal <= 150) return 30.0;
        return (float) ceil($subtotal / 100 * 25);
    }

    /**
     * Full per-row broker fee including event-type overrides + carrier surcharge.
     * Does NOT include urgency (kept out of broker fee, per legacy get_quote_ajax).
     *
     * @param string $role  'baby_shower' | 'wedding' | 'vendor' | 'standard'
     */
    public function brokerFee(float $subtotal, string $role, string $carrier, int $persons): float
    {
        // Baby Shower / Wedding: small-event flat fee tiers by head-count.
        if ($role === 'baby_shower' || $role === 'wedding') {
            $fee = match (true) {
                $persons > 0  && $persons <= 50  => 10.0,
                $persons > 50 && $persons <= 100 => 20.0,
                default                          => $this->baseBrokerFee($subtotal),
            };
        } else {
            $fee = $this->baseBrokerFee($subtotal);
        }

        // Vendor at Event: $10 discount.
        if ($role === 'vendor') {
            $fee -= 10.0;
        }

        // ASI carrier surcharge.
        if ($carrier === 'ASI') {
            $fee += 5.0;
        }

        return max(0.0, $fee);
    }

    /**
     * Processing fee — legacy common_helper::processFee(subtotal + brokerFee).
     */
    public function processingFee(float $subtotal, float $brokerFee): float
    {
        return (float) ceil(($subtotal + $brokerFee) / 100 * 3.5);
    }

    // ── Tier assignment (firstOption..fourthOption + valueLessThanFour) ─────────

    /**
     * Assign priced plan rows to the four named slots using the limit-pair
     * cascades, then fill any empty slots with the cheapest remaining plans and
     * re-sort/re-bucket all four by (min_limit, max_limit) — exactly as legacy
     * valueLessThanFour() does.
     *
     * Each $priced row must contain at least: rate_id, min_limit, max_limit, total.
     *
     * @return array{firstOption: array|null, secondOption: array|null, thirdOption: array|null, fourthOption: array|null}
     */
    public function assignTiers(Collection $priced): array
    {
        // De-duplicate by coverage limits — keep the cheapest plan per
        // (min_limit, max_limit) pair so we never surface two cards with
        // identical limits (which also skews the recommendation).
        $priced = $priced
            ->sortBy('total')
            ->unique(fn ($p) => ((int) $p['min_limit']) . '/' . ((int) $p['max_limit']))
            ->values();

        $used    = collect();
        $options = [];

        foreach (self::TIER_LIMITS as $slot => $tierPairs) {
            $options[$slot] = $this->pickLowest($priced, $tierPairs, $used);
        }

        $slots = ['firstOption', 'secondOption', 'thirdOption', 'fourthOption'];

        // valueLessThanFour: back-fill empty slots with cheapest remaining plans.
        $needsFill = collect($options)->contains(fn ($o) => $o === null);

        if ($needsFill) {
            $remaining = $priced
                ->reject(fn ($p) => $used->contains('rate_id', $p['rate_id']))
                ->sortBy('total')
                ->values();

            foreach ($slots as $slot) {
                if ($options[$slot] === null && $remaining->isNotEmpty()) {
                    $options[$slot] = $remaining->shift();
                }
            }

            // Re-sort ALL non-null plans by limit pair, then re-bucket positionally.
            $filled = collect(array_filter($options, fn ($o) => $o !== null))
                ->sortBy([['min_limit', 'asc'], ['max_limit', 'asc']])
                ->values();

            $i = 0;
            foreach ($slots as $slot) {
                $options[$slot] = $i < $filled->count() ? $filled[$i++] : null;
            }
        }

        return $options;
    }

    /**
     * Cheapest plan (by total) matching one of the tier's limit pairs, tried in
     * priority order, skipping already-used plans.
     */
    private function pickLowest(Collection $priced, array $tierPairs, Collection $used): ?array
    {
        foreach ($tierPairs as [$minL, $maxL]) {
            $match = $priced
                ->filter(fn ($p) =>
                    (int) $p['min_limit'] === $minL &&
                    (int) $p['max_limit'] === $maxL &&
                    ! $used->contains('rate_id', $p['rate_id'])
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

    // ── Recommendation (Events::get_recommended) ───────────────────────────────

    /**
     * Mark the first plan (firstOption → fourthOption) whose inflated total is
     * still cheaper than every higher-tier plan. Falls back to the most
     * expensive plan if none qualifies. Mutates the options array in place.
     */
    public function markRecommended(array &$options): void
    {
        $slots = ['firstOption', 'secondOption', 'thirdOption', 'fourthOption'];

        foreach ($slots as $i => $slot) {
            if ($options[$slot] === null) {
                continue;
            }

            $inflated    = (float) $options[$slot]['total'] * $this->inflationFactor((float) $options[$slot]['total']);
            $recommended = true;

            foreach ($slots as $j => $other) {
                if ($j <= $i || $options[$other] === null) {
                    continue;
                }
                if ((float) $options[$other]['total'] <= $inflated) {
                    $recommended = false;
                    break;
                }
            }

            if ($recommended) {
                $options[$slot]['recommended'] = true;
                return;
            }
        }

        // Fallback: most expensive non-null plan.
        foreach (array_reverse($slots) as $slot) {
            if ($options[$slot] !== null) {
                $options[$slot]['recommended'] = true;
                return;
            }
        }
    }

    /**
     * Inflation multiplier by plan total (legacy get_recommended thresholds).
     */
    public function inflationFactor(float $total): float
    {
        if ($total <= 200)  return 1.40;
        if ($total <= 400)  return 1.30;
        if ($total <= 600)  return 1.25;
        if ($total <= 1000) return 1.20;
        if ($total <= 1500) return 1.175;
        return 1.15;
    }
}
