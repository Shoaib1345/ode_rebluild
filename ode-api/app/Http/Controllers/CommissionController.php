<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Commission listing for portal users (affiliates, agents, planners, customers).
 *
 * Visibility gate (§14, §25):
 *   Commission dollar amounts are returned as null until the user has an
 *   admin-verified W9 Upload row (W9Upload.verified_at is non-null).
 *   Commission rows themselves are always visible so users know commissions
 *   exist and are prompted to upload their W9.
 */
class CommissionController extends Controller
{
    /**
     * GET /api/commissions
     *
     * Paginated list of commissions for the authenticated user.
     * `amount` is null when the user's W9 is not yet verified.
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'status'   => ['nullable', 'string', 'in:accrued,paid'],
        ]);

        $user    = $request->user();
        $hasW9   = $user->hasVerifiedW9();

        $query = $user->commissions()
            ->with('lead:id,event_name,event_date,event_type_label,submission_status')
            ->orderBy('accrued_at', 'desc');

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $paginated = $query->paginate((int) $request->input('per_page', 20));

        // Gate amounts — transform without breaking pagination structure
        $paginated->getCollection()->transform(function ($commission) use ($hasW9) {
            return [
                'id'          => $commission->id,
                'lead_id'     => $commission->lead_id,
                'lead'        => $commission->lead ? [
                    'event_name'       => $commission->lead->event_name,
                    'event_date'       => $commission->lead->event_date?->toDateString(),
                    'event_type_label' => $commission->lead->event_type_label,
                    'status'           => $commission->lead->submission_status,
                ] : null,
                'type'        => $commission->type,
                'amount'      => $hasW9 ? $commission->amount : null,  // hidden until W9 verified
                'status'      => $commission->status,
                'accrued_at'  => $commission->accrued_at?->toIso8601String(),
                'paid_at'     => $commission->paid_at?->toIso8601String(),
                'paid_method' => $commission->paid_method,
            ];
        });

        return response()->json([
            'w9_verified' => $hasW9,
            'commissions' => $paginated,
        ]);
    }

    /**
     * GET /api/commissions/summary
     *
     * Totals for the authenticated user's commissions dashboard widget.
     * Amounts are null until W9 is verified.
     */
    public function summary(Request $request): JsonResponse
    {
        $user  = $request->user();
        $hasW9 = $user->hasVerifiedW9();

        $commissions = $user->commissions()->get();

        $totalAccrued = $commissions->where('status', 'accrued')->sum('amount');
        $totalPaid    = $commissions->where('status', 'paid')->sum('amount');
        $totalEarned  = $commissions->sum('amount');

        return response()->json([
            'w9_verified'   => $hasW9,
            'total_earned'  => $hasW9 ? round((float) $totalEarned, 2)  : null,
            'total_accrued' => $hasW9 ? round((float) $totalAccrued, 2) : null,
            'total_paid'    => $hasW9 ? round((float) $totalPaid, 2)    : null,
            'count'         => $commissions->count(),
        ]);
    }
}
