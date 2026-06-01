<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * GET /api/admin/stats
     *
     * Returns overview metrics for the admin dashboard:
     *  - Lead counts (today / this week / this month / all time)
     *  - Revenue totals (payment_received leads, this month + all time)
     *  - Status breakdown
     *  - Bound + pending manual-quote counts
     *  - Daily chart for the last 30 days
     */
    public function stats(): JsonResponse
    {
        $now        = Carbon::now();
        $todayStart = $now->copy()->startOfDay();
        $weekStart  = $now->copy()->startOfWeek();
        $monthStart = $now->copy()->startOfMonth();

        // ── Lead counts ───────────────────────────────────────────────────────
        $base = Lead::query()->where('status', 1);

        $leadsToday     = (clone $base)->where('created_at', '>=', $todayStart)->count();
        $leadsThisWeek  = (clone $base)->where('created_at', '>=', $weekStart)->count();
        $leadsThisMonth = (clone $base)->where('created_at', '>=', $monthStart)->count();
        $leadsAllTime   = (clone $base)->count();

        // ── Revenue (from lead_offered_plans JSON, payment_received only) ─────
        $paidBase = (clone $base)->where('submission_status', 'payment_received');

        $revenueThisMonth = (clone $paidBase)
            ->where('created_at', '>=', $monthStart)
            ->sum(DB::raw('JSON_EXTRACT(lead_offered_plans, "$.total")'));

        $revenueAllTime = (clone $paidBase)
            ->sum(DB::raw('JSON_EXTRACT(lead_offered_plans, "$.total")'));

        // ── Status breakdown ──────────────────────────────────────────────────
        $statusRows = (clone $base)
            ->select('submission_status', DB::raw('COUNT(*) as count'))
            ->groupBy('submission_status')
            ->pluck('count', 'submission_status')
            ->toArray();

        $allStatuses = [
            'tried', 'saved', 'mq', 'plan_added_manually',
            'payment', 'payment_received', 'finished',
        ];
        $byStatus = array_fill_keys($allStatuses, 0);
        foreach ($statusRows as $status => $count) {
            if (isset($byStatus[$status])) {
                $byStatus[$status] = (int) $count;
            }
        }

        // ── Misc counts ───────────────────────────────────────────────────────
        $boundCount  = (clone $base)->where('bound', true)->count();
        $pendingMq   = (clone $base)->where('submission_status', 'mq')->count();
        $onHoldCount = (clone $base)->where('is_on_hold', true)->count();

        // ── Daily chart — last 30 days ─────────────────────────────────────────
        $chartRows = DB::table('leads')
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('COUNT(*) as count'),
                DB::raw('SUM(CASE WHEN submission_status = "payment_received" THEN JSON_EXTRACT(lead_offered_plans, "$.total") ELSE 0 END) as revenue')
            )
            ->where('status', 1)
            ->whereNull('deleted_at')
            ->where('created_at', '>=', $now->copy()->subDays(29)->startOfDay())
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('date')
            ->get()
            ->keyBy('date');

        // Fill in every calendar day so the chart has no gaps
        $dailyChart = [];
        for ($i = 29; $i >= 0; $i--) {
            $dateStr = $now->copy()->subDays($i)->toDateString();
            $row = $chartRows->get($dateStr);
            $dailyChart[] = [
                'date'    => $dateStr,
                'count'   => $row ? (int) $row->count : 0,
                'revenue' => $row ? round((float) $row->revenue, 2) : 0.00,
            ];
        }

        return response()->json([
            'period' => $now->format('Y-m'),
            'leads'  => [
                'today'      => $leadsToday,
                'this_week'  => $leadsThisWeek,
                'this_month' => $leadsThisMonth,
                'all_time'   => $leadsAllTime,
            ],
            'revenue' => [
                'this_month' => round((float) $revenueThisMonth, 2),
                'all_time'   => round((float) $revenueAllTime, 2),
            ],
            'by_status'   => $byStatus,
            'bound_count' => $boundCount,
            'pending_mq'  => $pendingMq,
            'on_hold'     => $onHoldCount,
            'daily_chart' => $dailyChart,
        ]);
    }

    /**
     * GET /api/admin/stats/custom-report
     *
     * Replicates the legacy "Custom Dashboard Figures" report:
     *   - period=today|week|month|dates   (dates requires start + end)
     *   - returns 8 counts/figures used by the dashboard popup.
     *
     * Broker-fee + business-loss formulas mirror the original ode_new
     * Leads::customeReport_ajax exactly (premium/total from lead_offered_plans).
     */
    public function customReport(Request $request): JsonResponse
    {
        $data = $request->validate([
            'period' => 'required|in:today,week,month,dates',
            'start'  => 'required_if:period,dates|date',
            'end'    => 'required_if:period,dates|date|after_or_equal:start',
        ]);

        $now   = Carbon::now();
        $query = Lead::query()->select('id', 'submission_status', 'status', 'lead_offered_plans');

        match ($data['period']) {
            'today' => $query->whereDate('created_at', $now->toDateString()),
            'week'  => $query->whereBetween('created_at', [
                $now->copy()->startOfWeek(),
                $now->copy()->endOfWeek(),
            ]),
            'month' => $query->whereBetween('created_at', [
                $now->copy()->startOfMonth(),
                $now->copy()->endOfMonth(),
            ]),
            'dates' => $query->whereBetween('created_at', [
                Carbon::parse($data['start'])->startOfDay(),
                Carbon::parse($data['end'])->endOfDay(),
            ]),
        };

        $leads = $query->get();

        $totals = [
            'total_leads'           => $leads->count(),
            'total_payment_leads'   => 0,
            'total_mq_leads'        => 0,
            'total_saved_leads'     => 0,
            'total_tried_leads'     => 0,
            'total_canceled_leads'  => 0,
            'payment_broker_fee'    => 0.0,
            'total_business_loss'   => 0.0,
        ];

        foreach ($leads as $lead) {
            $plans   = $lead->lead_offered_plans ?? [];
            $premium = (float) ($plans['premium'] ?? 0);
            $amount  = (float) ($plans['total']   ?? 0);

            if ((int) $lead->status === 0) {
                $totals['total_canceled_leads']++;
                $totals['total_business_loss'] += $premium + ceil($amount * 0.035) - $amount;
                continue;
            }

            switch ($lead->submission_status) {
                case 'payment':
                case 'payment_received':
                    $totals['total_payment_leads']++;
                    $totals['payment_broker_fee'] += $amount - ($premium + ceil($amount * 0.035));
                    break;
                case 'mq':
                    $totals['total_mq_leads']++;
                    break;
                case 'saved':
                    $totals['total_saved_leads']++;
                    break;
                case 'tried':
                    $totals['total_tried_leads']++;
                    break;
            }
        }

        $totals['payment_broker_fee']  = round($totals['payment_broker_fee'], 2);
        $totals['total_business_loss'] = round($totals['total_business_loss'], 2);

        return response()->json($totals);
    }
}
