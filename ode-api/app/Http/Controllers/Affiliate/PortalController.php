<?php

namespace App\Http\Controllers\Affiliate;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\Sale;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PortalController extends Controller
{
    /**
     * GET /api/affiliate/stats
     *
     * Overview stats for the authenticated affiliate's portal.
     */
    public function stats(Request $request): JsonResponse
    {
        $ref = $request->user()->referral_string;

        $now        = Carbon::now();
        $monthStart = $now->copy()->startOfMonth();

        // ── Referral counts (from leads table) ───────────────────────────────
        $referralBase = Lead::where('referral_string', $ref)->where('status', 1);

        $totalReferrals = (clone $referralBase)->count();
        $paidReferrals  = (clone $referralBase)->where('submission_status', 'payment_received')->count();
        $thisMonthTotal = (clone $referralBase)->where('created_at', '>=', $monthStart)->count();
        $thisMonthPaid  = (clone $referralBase)
            ->where('submission_status', 'payment_received')
            ->where('created_at', '>=', $monthStart)
            ->count();

        // ── Earnings (from sales table) ───────────────────────────────────────
        $salesBase      = Sale::where('referral_string', $ref);
        $earningsTotal  = (clone $salesBase)->sum('price');
        $earningsMonth  = (clone $salesBase)->where('purchase_date', '>=', $monthStart)->sum('price');

        // ── Paid out (from user_payments) ─────────────────────────────────────
        $totalPaidOut   = $request->user()->userPayments()->sum('payment');
        $pendingPayout  = max(0, (float) $earningsTotal - (float) $totalPaidOut);

        // ── Monthly chart — last 6 months ─────────────────────────────────────
        $monthlyChart = [];
        for ($i = 5; $i >= 0; $i--) {
            $start = $now->copy()->subMonths($i)->startOfMonth();
            $end   = $now->copy()->subMonths($i)->endOfMonth();
            $label = $start->format('M Y');

            $monthlyChart[] = [
                'label'     => $label,
                'referrals' => (clone $referralBase)->whereBetween('created_at', [$start, $end])->count(),
                'paid'      => (clone $referralBase)
                    ->where('submission_status', 'payment_received')
                    ->whereBetween('created_at', [$start, $end])
                    ->count(),
                'earnings'  => round((float) (clone $salesBase)->whereBetween('purchase_date', [$start, $end])->sum('price'), 2),
            ];
        }

        return response()->json([
            'referral_string' => $ref,
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

        $ref   = $request->user()->referral_string;
        $leads = Lead::where('referral_string', $ref)
            ->where('status', 1)
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
