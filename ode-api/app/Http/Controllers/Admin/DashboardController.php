<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
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
}
