<?php

namespace App\Services;

use App\Models\Commission;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Support\Facades\Log;

/**
 * Accrues commissions for all referrer types when a lead converts.
 *
 * All four methods are IDEMPOTENT — they use firstOrCreate keyed on
 * (lead_id, type), so calling the same method twice is always safe.
 *
 * Commission rules:
 * ┌───────────┬─────────────────────────────────────────────────────────────┐
 * │ Type      │ Formula                                                     │
 * ├───────────┼─────────────────────────────────────────────────────────────┤
 * │ affiliate │ per-user (premium × pct/100 + flat), else $10 flat default  │
 * │ agent     │ (premium × pct / 100) + flat                                │
 * │ planner   │ per-user (premium × pct/100 + flat), else $15 flat default  │
 * │ customer  │ per-user (premium × pct/100 + flat), else $5 flat default   │
 * └───────────┴─────────────────────────────────────────────────────────────┘
 *
 * Affiliate / planner / customer use the referrer's configured commission_pct /
 * commission_flat when either is set; otherwise they fall back to the flat
 * default. This lets admins negotiate per-affiliate rates while preserving the
 * default amounts for everyone else.
 *
 * W9 requirement: commissions accrue regardless of W9 status.
 * The W9 gate only controls *visibility* in portal UIs.
 */
class CommissionService
{
    // Fixed amounts per spec §25
    private const AFFILIATE_AMOUNT = 10.00;
    private const PLANNER_AMOUNT   = 15.00;
    private const CUSTOMER_AMOUNT  = 5.00;

    /**
     * Accrue a $10 commission for the affiliate who referred this lead.
     *
     * Referrer is resolved via leads.referred_by_affiliate_id (FK, preferred)
     * or by matching leads.affiliate_string → users.referral_string (legacy fallback).
     */
    public function accrueAffiliate(Lead $lead): ?Commission
    {
        $user = $this->resolveAffiliate($lead);

        if (! $user) {
            return null;
        }

        $amount = $this->referrerAmount($user, self::AFFILIATE_AMOUNT, $lead);

        [$commission, $created] = $this->firstOrCreate($lead, $user, 'affiliate', $amount);

        if ($created) {
            Log::info('Commission accrued', [
                'type'    => 'affiliate',
                'user_id' => $user->id,
                'lead_id' => $lead->id,
                'amount'  => $amount,
            ]);
        }

        return $commission;
    }

    /**
     * Accrue an agent commission based on the lead's premium and the agent's rates.
     *
     * Formula: (premium × agent.commission_pct / 100) + agent.commission_flat
     *
     * The agent must be directly assigned to the lead via the lead_assignment
     * pivot table. If multiple agents are assigned, each earns independently.
     */
    public function accrueAgent(Lead $lead): array
    {
        $agents = $lead->assignedUsers()
            ->whereHas('role', fn ($q) => $q->where('access_level', 7))
            ->get();

        if ($agents->isEmpty()) {
            return [];
        }

        $accrued = [];

        foreach ($agents as $agent) {
            $amount = $this->calculateAgentAmount($lead, $agent);

            if ($amount <= 0) {
                continue;
            }

            [$commission, $created] = $this->firstOrCreate(
                $lead,
                $agent,
                'agent',
                $amount
            );

            if ($created) {
                Log::info('Commission accrued', [
                    'type'    => 'agent',
                    'user_id' => $agent->id,
                    'lead_id' => $lead->id,
                    'amount'  => $amount,
                ]);
            }

            $accrued[] = $commission;
        }

        return $accrued;
    }

    /**
     * Accrue a $15 commission for the planner/venue who referred this lead.
     *
     * Resolved via leads.referred_by_planner_id.
     */
    public function accruePlanner(Lead $lead): ?Commission
    {
        if (! $lead->referred_by_planner_id) {
            return null;
        }

        $user = User::find($lead->referred_by_planner_id);

        if (! $user) {
            return null;
        }

        $amount = $this->referrerAmount($user, self::PLANNER_AMOUNT, $lead);

        [$commission, $created] = $this->firstOrCreate($lead, $user, 'planner', $amount);

        if ($created) {
            Log::info('Commission accrued', [
                'type'    => 'planner',
                'user_id' => $user->id,
                'lead_id' => $lead->id,
                'amount'  => $amount,
            ]);
        }

        return $commission;
    }

    /**
     * Accrue a $5 commission for the customer who referred this lead.
     *
     * Resolved via leads.referred_by_customer_id.
     */
    public function accrueCustomer(Lead $lead): ?Commission
    {
        if (! $lead->referred_by_customer_id) {
            return null;
        }

        $user = User::find($lead->referred_by_customer_id);

        if (! $user) {
            return null;
        }

        $amount = $this->referrerAmount($user, self::CUSTOMER_AMOUNT, $lead);

        [$commission, $created] = $this->firstOrCreate($lead, $user, 'customer', $amount);

        if ($created) {
            Log::info('Commission accrued', [
                'type'    => 'customer',
                'user_id' => $user->id,
                'lead_id' => $lead->id,
                'amount'  => $amount,
            ]);
        }

        return $commission;
    }

    /**
     * Fire all four accrual methods in one call.
     * Used by LeadCreationService after a successful payment.
     */
    public function accrueAll(Lead $lead): void
    {
        $this->accrueAffiliate($lead);
        $this->accrueAgent($lead);
        $this->accruePlanner($lead);
        $this->accrueCustomer($lead);
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    /**
     * Resolve the affiliate user from a lead.
     * Priority: FK column > referral_string text match.
     */
    private function resolveAffiliate(Lead $lead): ?User
    {
        // 1. Preferred: direct FK set at lead creation
        if ($lead->referred_by_affiliate_id) {
            return User::find($lead->referred_by_affiliate_id);
        }

        // 2. Legacy fallback: match the text string to users.referral_string
        if ($lead->affiliate_string) {
            return User::where('referral_string', $lead->affiliate_string)->first();
        }

        return null;
    }

    /**
     * Calculate agent commission: (premium × pct / 100) + flat
     */
    private function calculateAgentAmount(Lead $lead, User $agent): float
    {
        return round(
            ($this->premiumOf($lead) * (float) $agent->commission_pct / 100)
                + (float) $agent->commission_flat,
            2
        );
    }

    /**
     * Amount for affiliate / planner / customer referrers: use the user's
     * configured rate when set, otherwise fall back to the flat default.
     */
    private function referrerAmount(User $user, float $defaultFlat, Lead $lead): float
    {
        $pct  = (float) $user->commission_pct;
        $flat = (float) $user->commission_flat;

        if ($pct > 0.0 || $flat > 0.0) {
            return round(($this->premiumOf($lead) * $pct / 100) + $flat, 2);
        }

        return $defaultFlat;
    }

    /** Premium from the lead's saved plan snapshot. */
    private function premiumOf(Lead $lead): float
    {
        return is_array($lead->lead_offered_plans)
            ? (float) ($lead->lead_offered_plans['premium'] ?? 0)
            : 0.0;
    }

    /**
     * Idempotent insert: returns [Commission, bool $wasCreated].
     *
     * Uses firstOrCreate keyed on (lead_id, type) so re-running after
     * a duplicate call never creates a second row.
     *
     * Note: agent commissions technically allow one row per (lead_id, agent_user_id).
     * The unique index is on (lead_id, type). For multiple agents on one lead,
     * only the FIRST agent's commission is created (current spec has single-agent
     * assignment). If multi-agent support is needed later, add user_id to the key.
     */
    private function firstOrCreate(
        Lead $lead,
        User $user,
        string $type,
        float $amount
    ): array {
        $existing = Commission::where('lead_id', $lead->id)
            ->where('type', $type)
            ->first();

        if ($existing) {
            return [$existing, false];
        }

        $commission = Commission::create([
            'user_id'    => $user->id,
            'lead_id'    => $lead->id,
            'amount'     => $amount,
            'type'       => $type,
            'status'     => 'accrued',
            'accrued_at' => now(),
        ]);

        return [$commission, true];
    }
}
