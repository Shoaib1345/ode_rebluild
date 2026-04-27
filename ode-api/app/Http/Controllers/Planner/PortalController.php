<?php

namespace App\Http\Controllers\Planner;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Event-Planner self-service portal (FULL-SPEC-V2.md §16.2).
 *
 * Planners (role=8) earn $15 per converted lead referred via their
 * referral_string — same referral mechanism as affiliates.
 *
 * Commission amounts are W9-gated (§14, §25) — null until verified_at is set.
 */
class PortalController extends Controller
{
    /** Flat commission per converted lead for planners (§16.2, §25). */
    private const COMMISSION_PER_REFERRAL = 15;

    // ── Dashboard ──────────────────────────────────────────────────────────────

    /**
     * GET /api/planner/dashboard
     *
     * Referral counts + commission summary for the planner's dashboard.
     */
    public function dashboard(Request $request): JsonResponse
    {
        $user  = $request->user();
        $ref   = $user->referral_string;
        $hasW9 = $user->hasVerifiedW9();

        $base = Lead::where('referral_string', $ref)->where('status', 1);

        $totalReferrals  = (clone $base)->count();
        $paidReferrals   = (clone $base)->where('submission_status', 'payment_received')->count();
        $thisMonthTotal  = (clone $base)->where('created_at', '>=', now()->startOfMonth())->count();
        $thisMonthPaid   = (clone $base)
            ->where('submission_status', 'payment_received')
            ->where('created_at', '>=', now()->startOfMonth())
            ->count();

        // Commissions from the commissions table (accrued by CommissionService)
        $commissions      = $user->commissions()->get();
        $pendingAmount    = $commissions->where('status', 'accrued')->sum('amount');
        $paidAmount       = $commissions->where('status', 'paid')->sum('amount');

        return response()->json([
            'referral_string'        => $ref,
            'commission_per_referral'=> self::COMMISSION_PER_REFERRAL,
            'referrals' => [
                'total'      => $totalReferrals,
                'paid'       => $paidReferrals,
                'this_month' => $thisMonthTotal,
                'paid_month' => $thisMonthPaid,
            ],
            'commissions' => [
                'count'   => $commissions->count(),
                'pending' => $hasW9 ? round((float) $pendingAmount, 2) : null,
                'paid'    => $hasW9 ? round((float) $paidAmount, 2)   : null,
            ],
            'w9_verified' => $hasW9,
        ]);
    }

    // ── Referrals ──────────────────────────────────────────────────────────────

    /**
     * GET /api/planner/referrals
     *
     * Paginated list of leads referred by this planner via referral_string.
     */
    public function referrals(Request $request): JsonResponse
    {
        $request->validate([
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'status'   => ['nullable', 'string'],
        ]);

        $ref = $request->user()->referral_string;

        $query = Lead::where('referral_string', $ref)
            ->where('status', 1)
            ->orderBy('created_at', 'desc');

        if ($status = $request->input('status')) {
            $query->where('submission_status', $status);
        }

        $leads = $query->paginate(
            (int) $request->input('per_page', 20),
            [
                'id', 'first_name', 'last_name', 'email',
                'event_type_label', 'event_date', 'event_state',
                'carrier', 'submission_status', 'created_at',
            ]
        );

        return response()->json($leads);
    }

    // ── Commissions ────────────────────────────────────────────────────────────

    /**
     * GET /api/planner/commissions
     *
     * Paginated commission list for this planner.
     * Amounts are W9-gated (§14, §25).
     */
    public function commissions(Request $request): JsonResponse
    {
        $request->validate([
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'status'   => ['nullable', 'in:accrued,paid'],
        ]);

        $user  = $request->user();
        $hasW9 = $user->hasVerifiedW9();

        $query = $user->commissions()
            ->with('lead:id,event_name,event_date,event_type_label,submission_status')
            ->orderBy('accrued_at', 'desc');

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $paginated = $query->paginate((int) $request->input('per_page', 20));

        $paginated->getCollection()->transform(function ($c) use ($hasW9) {
            return [
                'id'         => $c->id,
                'lead_id'    => $c->lead_id,
                'lead'       => $c->lead ? [
                    'event_name'       => $c->lead->event_name,
                    'event_date'       => $c->lead->event_date?->toDateString(),
                    'event_type_label' => $c->lead->event_type_label,
                    'status'           => $c->lead->submission_status,
                ] : null,
                'type'        => $c->type,
                'amount'      => $hasW9 ? $c->amount : null,
                'status'      => $c->status,
                'accrued_at'  => $c->accrued_at?->toIso8601String(),
                'paid_at'     => $c->paid_at?->toIso8601String(),
                'paid_method' => $c->paid_method,
            ];
        });

        return response()->json([
            'w9_verified' => $hasW9,
            'commissions' => $paginated,
        ]);
    }
}
