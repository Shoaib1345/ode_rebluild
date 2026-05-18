<?php

namespace App\Http\Controllers\Affiliate;

use App\Http\Controllers\Controller;
use App\Models\Commission;
use App\Models\Lead;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PortalController extends Controller
{
    /**
     * GET /api/affiliate/stats
     *
     * Overview stats for the authenticated affiliate's portal.
     */
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();
        $now  = Carbon::now();
        $monthStart = $now->copy()->startOfMonth();

        // ── Base query — leads attributed to this affiliate ──────────────────
        // Preferred: referred_by_affiliate_id FK (set by LeadCreationService)
        // Fallback:  affiliate_string text match (legacy / test leads)
        $leadBase = Lead::where('status', 1)
            ->where(function ($q) use ($user) {
                $q->where('referred_by_affiliate_id', $user->id)
                  ->orWhere('affiliate_string', $user->referral_string);
            });

        $totalReferrals = (clone $leadBase)->count();
        $paidReferrals  = (clone $leadBase)->where('submission_status', 'payment_received')->count();
        $thisMonthTotal = (clone $leadBase)->where('created_at', '>=', $monthStart)->count();
        $thisMonthPaid  = (clone $leadBase)
            ->where('submission_status', 'payment_received')
            ->where('created_at', '>=', $monthStart)
            ->count();

        // ── Earnings — from commissions table (type = 'affiliate') ───────────
        $commBase     = Commission::where('user_id', $user->id)->where('type', 'affiliate');
        $earningsTotal = (clone $commBase)->sum('amount');
        $earningsMonth = (clone $commBase)->where('accrued_at', '>=', $monthStart)->sum('amount');

        // ── Paid out — from user_payments ────────────────────────────────────
        $totalPaidOut  = $user->userPayments()->sum('payment');
        $pendingPayout = max(0, (float) $earningsTotal - (float) $totalPaidOut);

        // ── Monthly chart — last 6 months ─────────────────────────────────────
        $monthlyChart = [];
        for ($i = 5; $i >= 0; $i--) {
            $start = $now->copy()->subMonths($i)->startOfMonth();
            $end   = $now->copy()->subMonths($i)->endOfMonth();
            $label = $start->format('M Y');

            $monthlyChart[] = [
                'label'     => $label,
                'referrals' => (clone $leadBase)->whereBetween('created_at', [$start, $end])->count(),
                'paid'      => (clone $leadBase)
                    ->where('submission_status', 'payment_received')
                    ->whereBetween('created_at', [$start, $end])
                    ->count(),
                'earnings'  => round(
                    (float) (clone $commBase)->whereBetween('accrued_at', [$start, $end])->sum('amount'),
                    2
                ),
            ];
        }

        return response()->json([
            'referral_string' => $user->referral_string,
            'referrals' => [
                'total'        => $totalReferrals,
                'paid'         => $paidReferrals,
                'this_month'   => $thisMonthTotal,
                'paid_month'   => $thisMonthPaid,
            ],
            'earnings' => [
                'total'         => round((float) $earningsTotal, 2),
                'this_month'    => round((float) $earningsMonth, 2),
                'total_paid_out'=> round((float) $totalPaidOut, 2),
                'pending_payout'=> round($pendingPayout, 2),
            ],
            'monthly_chart' => $monthlyChart,
        ]);
    }

    /**
     * GET /api/affiliate/referrals
     *
     * Paginated list of leads referred by this affiliate.
     */
    public function referrals(Request $request): JsonResponse
    {
        $request->validate([
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
            'page'     => ['nullable', 'integer', 'min:1'],
        ]);

        $user = $request->user();

        $leads = Lead::where('status', 1)
            ->where(function ($q) use ($user) {
                $q->where('referred_by_affiliate_id', $user->id)
                  ->orWhere('affiliate_string', $user->referral_string);
            })
            ->orderBy('created_at', 'desc')
            ->paginate(
                (int) $request->input('per_page', 20),
                [
                    'id', 'first_name', 'last_name',
                    'event_type_label', 'event_date', 'event_state',
                    'submission_status', 'created_at',
                ]
            );

        return response()->json($leads);
    }

    /**
     * GET /api/affiliate/payouts
     *
     * Payout history for the authenticated affiliate.
     */
    public function payouts(Request $request): JsonResponse
    {
        $payouts = $request->user()
            ->userPayments()
            ->orderBy('payment_date', 'desc')
            ->get(['id', 'payment', 'payment_date', 'notes']);

        return response()->json($payouts);
    }
}
