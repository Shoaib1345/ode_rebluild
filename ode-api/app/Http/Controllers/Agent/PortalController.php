<?php

namespace App\Http\Controllers\Agent;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Agent self-service portal (FULL-SPEC-V2.md §15, §25).
 *
 * All lead queries scope strictly to leads where the authenticated agent
 * appears in the lead_assignment pivot table.
 *
 * Permitted write operations (§15):
 *   - submission_status updates
 *   - is_on_hold toggle
 *   - Adding notes
 *
 * Commission amounts are W9-gated (§14, §25).
 */
class PortalController extends Controller
{
    // ── Dashboard ──────────────────────────────────────────────────────────────

    /**
     * GET /api/agent/dashboard
     *
     * Returns KPI counts + commission summary for the agent's dashboard.
     */
    public function dashboard(Request $request): JsonResponse
    {
        $user  = $request->user();
        $hasW9 = $user->hasVerifiedW9();

        // Leads assigned to this agent
        $base = Lead::whereHas('assignedUsers', fn ($q) => $q->where('users.id', $user->id))
                    ->where('status', 1);

        $totalAssigned   = (clone $base)->count();
        $paymentReceived = (clone $base)->where('submission_status', 'payment_received')->count();
        $finished        = (clone $base)->where('submission_status', 'finished')->count();
        $onHold          = (clone $base)->where('is_on_hold', true)->count();

        // Status breakdown
        $byStatus = (clone $base)
            ->selectRaw('submission_status, COUNT(*) as count')
            ->groupBy('submission_status')
            ->pluck('count', 'submission_status')
            ->toArray();

        // Commissions
        $commissions      = $user->commissions()->get();
        $pendingCommission = $commissions->where('status', 'accrued')->sum('amount');
        $paidCommission    = $commissions->where('status', 'paid')->sum('amount');

        return response()->json([
            'leads' => [
                'total'            => $totalAssigned,
                'payment_received' => $paymentReceived,
                'finished'         => $finished,
                'on_hold'          => $onHold,
                'by_status'        => $byStatus,
            ],
            'commissions' => [
                'count'   => $commissions->count(),
                'pending' => $hasW9 ? round((float) $pendingCommission, 2) : null,
                'paid'    => $hasW9 ? round((float) $paidCommission, 2)   : null,
            ],
            'w9_verified' => $hasW9,
        ]);
    }

    // ── Leads list ─────────────────────────────────────────────────────────────

    /**
     * GET /api/agent/leads
     *
     * Paginated, filterable list of leads assigned to this agent.
     * Mirrors admin leads list filters (§15).
     */
    public function leads(Request $request): JsonResponse
    {
        $request->validate([
            'search'   => ['nullable', 'string', 'max:100'],
            'status'   => ['nullable', Rule::in([
                'tried', 'saved', 'mq', 'plan_added_manually',
                'payment', 'payment_received', 'finished',
            ])],
            'on_hold'  => ['nullable', 'boolean'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'sort'     => ['nullable', Rule::in([
                'id', 'first_name', 'last_name', 'email',
                'event_date', 'created_at', 'submission_status',
            ])],
            'dir'      => ['nullable', Rule::in(['asc', 'desc'])],
        ]);

        $user  = $request->user();

        $query = Lead::whereHas('assignedUsers', fn ($q) => $q->where('users.id', $user->id))
            ->where('status', 1)
            ->with(['eventType:id,event_type']);

        if ($search = $request->input('search')) {
            $like = '%' . $search . '%';
            $query->where(function ($q) use ($like) {
                $q->where('first_name', 'like', $like)
                  ->orWhere('last_name',  'like', $like)
                  ->orWhere('email',      'like', $like)
                  ->orWhere('phone',      'like', $like);
            });
        }

        if ($status = $request->input('status')) {
            $query->where('submission_status', $status);
        }

        if ($request->has('on_hold')) {
            $query->where('is_on_hold', (bool) $request->input('on_hold'));
        }

        $sort  = $request->input('sort', 'created_at');
        $dir   = $request->input('dir',  'desc');
        $query->orderBy($sort, $dir);

        $leads = $query->paginate((int) $request->input('per_page', 25), [
            'id', 'first_name', 'last_name', 'email', 'phone',
            'event_type_id', 'event_type_label', 'event_date',
            'event_state', 'carrier', 'submission_status',
            'bound', 'is_on_hold', 'is_priority_lead', 'created_at',
        ]);

        return response()->json($leads);
    }

    // ── Lead detail ────────────────────────────────────────────────────────────

    /**
     * GET /api/agent/leads/{id}
     *
     * Full lead detail. Agent must be assigned to this lead.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $lead = $this->agentLead($request->user(), $id);

        $lead->load([
            'eventType:id,event_type',
            'state:id,name,abbreviation',
            'notes.author:id,first_name,last_name',
            'followUps',
        ]);

        return response()->json($lead);
    }

    // ── Lead update ────────────────────────────────────────────────────────────

    /**
     * PATCH /api/agent/leads/{id}
     *
     * Agents may only update submission_status and is_on_hold (§15).
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $lead = $this->agentLead($request->user(), $id);

        $data = $request->validate([
            'submission_status' => ['sometimes', Rule::in([
                'tried', 'saved', 'mq', 'plan_added_manually',
                'payment', 'payment_received', 'finished',
            ])],
            'is_on_hold' => ['sometimes', 'boolean'],
        ]);

        $lead->update($data);

        return response()->json($lead->fresh());
    }

    // ── Notes ──────────────────────────────────────────────────────────────────

    /**
     * POST /api/agent/leads/{id}/notes
     *
     * Agent adds a note to an assigned lead.
     */
    public function storeNote(Request $request, int $id): JsonResponse
    {
        $lead = $this->agentLead($request->user(), $id);

        $data = $request->validate([
            'message' => ['required', 'string', 'max:5000'],
        ]);

        $note = $lead->notes()->create([
            'added_by'      => $request->user()->id,
            'message'       => $data['message'],
            'user_timezone' => $request->header('X-Timezone'),
        ]);

        $note->load('author:id,first_name,last_name');

        return response()->json($note, 201);
    }

    // ── Commissions ────────────────────────────────────────────────────────────

    /**
     * GET /api/agent/commissions
     *
     * Paginated commission list for this agent.
     * Amounts are W9-gated (§14, §25) — null until verified_at is set.
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
                'id'        => $c->id,
                'lead_id'   => $c->lead_id,
                'lead'      => $c->lead ? [
                    'event_name'       => $c->lead->event_name,
                    'event_date'       => $c->lead->event_date?->toDateString(),
                    'event_type_label' => $c->lead->event_type_label,
                    'status'           => $c->lead->submission_status,
                ] : null,
                'type'       => $c->type,
                'amount'     => $hasW9 ? $c->amount : null,
                'status'     => $c->status,
                'accrued_at' => $c->accrued_at?->toIso8601String(),
                'paid_at'    => $c->paid_at?->toIso8601String(),
                'paid_method'=> $c->paid_method,
            ];
        });

        return response()->json([
            'w9_verified' => $hasW9,
            'commissions' => $paginated,
        ]);
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    /**
     * Fetch a lead that the given agent is assigned to.
     * Returns 404 if the lead doesn't exist or the agent isn't assigned.
     */
    private function agentLead($user, int $leadId): Lead
    {
        return Lead::whereHas('assignedUsers', fn ($q) => $q->where('users.id', $user->id))
                   ->where('status', 1)
                   ->findOrFail($leadId);
    }
}
