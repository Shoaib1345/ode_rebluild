<?php

namespace App\Services;

use App\Models\CarrierGlLimit;
use App\Models\EventRate;
use App\Models\EventType;
use Illuminate\Support\Collection;

/**
 * Admin invoice-builder plan lookup. Shares the pricing CORE
 * ({@see PricingEngine}) and the event-type role resolution with the
 * customer-facing QuoteService, so admin re-pricing can never disagree with the
 * price the customer was originally quoted.
 *
 * Produces four named plan tiers (firstOption → fourthOption); each tier selects
 * the cheapest rate satisfying its GL-limit pair (with fallback cascades).
 */
class PlanBuilderService
{
    public function __construct(private PricingEngine $engine) {}

    /**
     * Build the four plan options for the given parameters.
     *
     * @param array{
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
     * @return array{firstOption: array|null, secondOption: array|null, thirdOption: array|null, fourthOption: array|null}
     */
    public function buildPlans(array $params): array
    {
        $eventTypeId = (int)  ($params['event_type_id'] ?? 0);
        $persons     = (int)  ($params['no_of_people']  ?? 0);
        $state       = $params['state']    ?? null;
        $carrier     = $params['carrier']  ?? null;
        $wantsLiquor = (bool) ($params['host_liquor'] ?? false);
        $wantsNoha   = (bool) ($params['noha']        ?? false);
        $wantsWos    = (bool) ($params['w_o_s']       ?? false);
        $wantsPancb  = (bool) ($params['p_a_n_c_b']   ?? false);

        $role = EventType::find($eventTypeId)?->pricingRole() ?? 'standard';

        // ── 1. Fetch matching event_rate rows ─────────────────────────────────
        $rates = $this->fetchRates(
            $eventTypeId, $persons, $state, $carrier,
            $wantsLiquor, $wantsNoha, $wantsWos, $wantsPancb
        );

        // ── 2. Price every row (skip IH for Wedding, per legacy) ──────────────
        $priced = $rates
            ->reject(fn (EventRate $r) => $r->carrier === 'IH' && $role === 'wedding')
            ->map(fn (EventRate $r) => $this->pricePlan(
                $r, $role, $persons, $wantsNoha, $wantsWos, $wantsPancb
            ))
            ->values();

        // ── 3. Assign to four tiers + mark recommended (shared engine) ────────
        $options = $this->engine->assignTiers($priced);
        $this->engine->markRecommended($options);

        return $options;
    }

    // ─── Data fetching ────────────────────────────────────────────────────────

    private function fetchRates(
        int $eventTypeId, int $persons, ?string $state, ?string $carrier,
        bool $wantsLiquor, bool $wantsNoha, bool $wantsWos, bool $wantsPancb
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
            $query->forState($state);
        }
        if ($carrier) {
            $query->where('carrier', $carrier);
        }
        if ($wantsLiquor) {
            $query->where('host_liquor', 1);
        }
        if ($wantsNoha) {
            $query->whereNotIn('noha', ['N/A', 'M/Q'])->whereNotNull('noha');
        }
        if ($wantsWos) {
            $query->whereNotIn('w_o_s', ['N/A', 'M/Q'])->whereNotNull('w_o_s');
        }
        if ($wantsPancb) {
            $query->whereNotIn('p_a_n_c_b', ['N/A', 'M/Q'])->whereNotNull('p_a_n_c_b');
        }

        return $query->get();
    }

    // ─── Pricing (per-row) ────────────────────────────────────────────────────

    private function pricePlan(
        EventRate $rate, string $role, int $persons,
        bool $wantsNoha, bool $wantsWos, bool $wantsPancb
    ): array {
        $subtotal = (float) $rate->rate;

        // Add-ons
        if ($wantsNoha  && $this->addonAvailable($rate->noha))      $subtotal += (float) $rate->noha;
        if ($wantsWos   && $this->addonAvailable($rate->w_o_s))     $subtotal += (float) $rate->w_o_s;
        if ($wantsPancb && $this->addonAvailable($rate->p_a_n_c_b)) $subtotal += (float) $rate->p_a_n_c_b;
        // e_a_i intentionally NOT added (mirrors legacy).

        // Additional-audience charge (per-person over the included headcount).
        $addPpl    = (int) $rate->additional_people;
        $addCharge = (float) $rate->additional_charges;
        if ($addPpl > 0 && $persons > $addPpl) {
            $subtotal += ($persons - $addPpl) * $addCharge;
        }

        $brokerFee     = $this->engine->brokerFee($subtotal, $role, $rate->carrier, $persons);
        $processingFee = $this->engine->processingFee($subtotal, $brokerFee);
        $total         = (float) ceil($subtotal + $brokerFee + $processingFee);

        return [
            'rate_id'        => $rate->id,
            'carrier'        => $rate->carrier,
            'event_type_id'  => $rate->event_type_id,
            'min_audience'   => (int) $rate->min_audience,
            'max_audience'   => (int) $rate->max_audience,
            'min_limit'      => (int) $rate->min_limit,
            'max_limit'      => (int) $rate->max_limit,
            'premium'        => round($subtotal, 2),
            'broker_fee'     => round($brokerFee, 2),
            'processing_fee' => round($processingFee, 2),
            'total'          => $total,
            'limits'         => $this->getGlLimits((int) $rate->min_limit, (int) $rate->max_limit, $rate->carrier),
            'host_liquor'    => (bool) $rate->host_liquor,
            'recommended'    => false,
        ];
    }

    private function addonAvailable(mixed $value): bool
    {
        return $value !== null
            && $value !== 'N/A'
            && $value !== 'M/Q'
            && (float) $value > 0;
    }

    private function getGlLimits(int $minLimit, int $maxLimit, string $carrier): array
    {
        return CarrierGlLimit::where('carrier', $carrier)
            ->where('min_limit', $minLimit)
            ->where('max_limit', $maxLimit)
            ->get(['gl_limit', 'gl_limit_type'])
            ->map(fn ($l) => [
                'gl_limit'      => $l->gl_limit,
                'gl_limit_type' => $l->gl_limit_type,
            ])
            ->toArray();
    }
}
