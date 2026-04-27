<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Commission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Admin Payroll module (FULL-SPEC-V2.md §17.3).
 *
 * Surfaces the `commissions` table to admins with full filter/search,
 * per-record mark-paid, and bulk mark-paid operations.
 *
 * Routes:
 *   GET  /api/admin/payroll              — paginated commission list
 *   GET  /api/admin/payroll/summary      — aggregate totals
 *   PATCH /api/admin/payroll/{id}/pay    — mark one commission paid
 *   POST  /api/admin/payroll/bulk-pay    — mark many commissions paid
 */
class PayrollController extends Controller
{
    // ── Index ──────────────────────────────────────────────────────────────────

    /**
     * GET /api/admin/payroll
     *
     * Supports:
     *   ?type=      affiliate | agent | planner | customer
     *   ?status=    accrued | paid
     *   ?user_id=   integer — filter by specific earner
     *   ?from=      ISO date — accrued_at >=
     *   ?to=        ISO date — accrued_at <=
     *   ?per_page=  default 25
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'type'     => ['nullable', Rule::in(['affiliate', 'agent', 'planner', 'customer'])],
            'status'   => ['nullable', Rule::in(['accrued', 'paid'])],
            'user_id'  => ['nullable', 'integer', 'exists:users,id'],
            'from'     => ['nullable', 'date'],
            'to'       => ['nullable', 'date'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = Commission::with([
            'user:id,first_name,last_name,email',
            'lead:id,first_name,last_name,event_type_label,event_date',
        ]);

        if ($type = $request->input('type')) {
            $query->where('type', $type);
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($userId = $request->input('user_id')) {
            $query->where('user_id', (int) $userId);
        }

        if ($from = $request->input('from')) {
            $query->whereDate('accrued_at', '>=', $from);
        }

        if ($to = $request->input('to')) {
            $query->whereDate('accrued_at', '<=', $to);
        }

        $commissions = $query
            ->orderBy('accrued_at', 'desc')
            ->paginate((int) $request->input('per_page', 25));

        return response()->json($commissions);
    }

    // ── Summary ────────────────────────────────────────────────────────────────

    /**
     * GET /api/admin/payroll/summary
     *
     * Returns aggregate totals for the header cards.
     */
    public function summary(): JsonResponse
    {
        $byTypeStatus = Commission::selectRaw(
            'type, status, SUM(amount) as total, COUNT(*) as count'
        )
            ->groupBy('type', 'status')
            ->get();

        $totalAccrued = Commission::where('status', 'accrued')->sum('amount');
        $totalPaid    = Commission::where('status', 'paid')->sum('amount');

        return response()->json([
            'total_accrued' => number_format((float) $totalAccrued, 2, '.', ''),
            'total_paid'    => number_format((float) $totalPaid, 2, '.', ''),
            'by_type'       => $byTypeStatus->map(fn ($row) => [
                'type'   => $row->type,
                'status' => $row->status,
                'total'  => number_format((float) $row->total, 2, '.', ''),
                'count'  => $row->count,
            ])->values(),
        ]);
    }

    // ── Mark single paid ───────────────────────────────────────────────────────

    /**
     * PATCH /api/admin/payroll/{id}/pay
     *
     * Marks a single commission as paid.
     * Returns 422 if already paid.
     */
    public function markPaid(Request $request, int $id): JsonResponse
    {
        $commission = Commission::with(['user:id,first_name,last_name,email', 'lead:id,first_name,last_name,event_type_label,event_date'])
            ->findOrFail($id);

        if ($commission->isPaid()) {
            return response()->json(['message' => 'Commission is already paid.'], 422);
        }

        $data = $request->validate([
            'paid_method' => ['required', Rule::in(['Zelle', 'Check', 'ACH', 'Wire'])],
            'paid_note'   => ['nullable', 'string', 'max:500'],
        ]);

        $commission->markPaid($data['paid_method'], $data['paid_note'] ?? null);

        return response()->json($this->formatCommission($commission->fresh(['user', 'lead'])));
    }

    // ── Bulk mark paid ─────────────────────────────────────────────────────────

    /**
     * POST /api/admin/payroll/bulk-pay
     *
     * Marks an array of commission IDs as paid in one call.
     * Already-paid commissions are silently skipped.
     */
    public function bulkMarkPaid(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ids'         => ['required', 'array', 'min:1', 'max:200'],
            'ids.*'       => ['integer'],
            'paid_method' => ['required', Rule::in(['Zelle', 'Check', 'ACH', 'Wire'])],
            'paid_note'   => ['nullable', 'string', 'max:500'],
        ]);

        $commissions = Commission::whereIn('id', $data['ids'])
            ->where('status', 'accrued')
            ->get();

        $commissions->each(
            fn ($c) => $c->markPaid($data['paid_method'], $data['paid_note'] ?? null)
        );

        $count = $commissions->count();

        return response()->json([
            'paid_count' => $count,
            'message'    => "Marked {$count} commission(s) as paid.",
        ]);
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    private function formatCommission(Commission $c): array
    {
        return [
            'id'          => $c->id,
            'user'        => $c->user ? [
                'id'         => $c->user->id,
                'first_name' => $c->user->first_name,
                'last_name'  => $c->user->last_name,
                'email'      => $c->user->email,
            ] : null,
            'lead'        => $c->lead ? [
                'id'               => $c->lead->id,
                'first_name'       => $c->lead->first_name,
                'last_name'        => $c->lead->last_name,
                'event_type_label' => $c->lead->event_type_label,
                'event_date'       => $c->lead->event_date,
            ] : null,
            'amount'      => $c->amount,
            'type'        => $c->type,
            'status'      => $c->status,
            'accrued_at'  => $c->accrued_at?->toIso8601String(),
            'paid_at'     => $c->paid_at?->toIso8601String(),
            'paid_method' => $c->paid_method,
            'paid_note'   => $c->paid_note,
        ];
    }
}
