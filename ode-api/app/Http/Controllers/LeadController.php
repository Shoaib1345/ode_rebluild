<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use App\Models\UsState;
use App\Services\LeadCreationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class LeadController extends Controller
{
    public function __construct(private LeadCreationService $leadService) {}

    /**
     * GET /api/admin/leads
     * Paginated, filterable list of leads for the admin CRM.
     *
     * Query params:
     *   search   — partial match on name / email / phone
     *   status   — submission_status enum value
     *   state    — 2-letter state abbreviation
     *   bound    — 1 / 0
     *   per_page — default 25, max 100
     *   page     — default 1
     *   sort     — column name (default: created_at)
     *   dir      — asc | desc (default: desc)
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'search'   => ['nullable', 'string', 'max:100'],
            'status'   => ['nullable', Rule::in([
                'tried', 'saved', 'mq', 'plan_added_manually',
                'payment', 'payment_received', 'finished',
            ])],
            'state'    => ['nullable', 'string', 'size:2'],
            'bound'    => ['nullable', 'boolean'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'sort'     => ['nullable', Rule::in([
                'id', 'first_name', 'last_name', 'email',
                'event_date', 'created_at', 'submission_status',
            ])],
            'dir'      => ['nullable', Rule::in(['asc', 'desc'])],
        ]);

        $query = Lead::query()
            ->where('status', 1)
            ->with(['eventType:id,event_type']);

        // ── Filters ────────────────────────────────────────────────────────
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

        if ($state = $request->input('state')) {
            $query->where('event_state', strtoupper($state));
        }

        if ($request->has('bound')) {
            $query->where('bound', (bool) $request->input('bound'));
        }

        // ── Sort ───────────────────────────────────────────────────────────
        $sort = $request->input('sort', 'created_at');
        $dir  = $request->input('dir',  'desc');
        $query->orderBy($sort, $dir);

        // ── Paginate ───────────────────────────────────────────────────────
        $perPage = (int) $request->input('per_page', 25);
        $leads   = $query->paginate($perPage, [
            'id', 'first_name', 'last_name', 'email', 'phone',
            'event_type_id', 'event_type_label', 'event_date',
            'event_state', 'carrier', 'coverage_limit',
            'submission_status', 'bound', 'payment_status',
            'is_on_hold', 'is_priority_lead', 'created_at',
        ]);

        return response()->json($leads);
    }

    /**
     * GET /api/admin/leads/{id}
     * Full lead detail for the admin CRM.
     */
    public function show(int $id): JsonResponse
    {
        $lead = Lead::where('status', 1)
            ->with(['eventType:id,event_type', 'state:id,name,abbreviation', 'notes', 'followUps'])
            ->findOrFail($id);

        return response()->json($lead);
    }

    /**
     * PATCH /api/admin/leads/{id}
     * Updates CRM-managed fields on a lead.
     * Does not allow re-editing customer/payment data.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $lead = Lead::where('status', 1)->findOrFail($id);

        $data = $request->validate([
            'submission_status' => ['sometimes', Rule::in([
                'tried', 'saved', 'mq', 'plan_added_manually',
                'payment', 'payment_received', 'finished',
            ])],
            'bound'             => ['sometimes', 'boolean'],
            'is_on_hold'        => ['sometimes', 'boolean'],
            'is_priority_lead'  => ['sometimes', 'boolean'],
            'closing_reason'    => ['sometimes', 'nullable', 'string', 'max:255'],
        ]);

        $lead->update($data);

        return response()->json($lead->fresh());
    }

    /**
     * POST /api/admin/leads/{id}/notes
     * Adds a staff note to a lead.
     */
    public function storeNote(Request $request, int $id): JsonResponse
    {
        $lead = Lead::where('status', 1)->findOrFail($id);

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

    /**
     * POST /api/leads
     * Creates a lead, charges the card via Stripe, returns lead_number + confirmation.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            // Plan
            'rate_id'            => ['required', 'integer', 'exists:event_rates,id'],
            'carrier'            => ['required', 'string'],
            'premium'            => ['required', 'numeric', 'min:0'],
            'broker_fee'         => ['required', 'numeric', 'min:0'],
            'processing_fee'     => ['required', 'numeric', 'min:0'],
            'extra_charge'       => ['nullable', 'numeric', 'min:0'],
            'total'              => ['required', 'numeric', 'min:0'],
            'min_limit'          => ['required', 'integer'],
            'max_limit'          => ['required', 'integer'],
            // Quote params
            'event_type_id'      => ['required', 'integer', 'exists:event_types,id'],
            'event_type_name'    => ['required', 'string'],
            'event_dates'        => ['required', 'string'],
            'event_state'        => ['required', 'string'],
            'persons'            => ['required', 'integer', 'min:1'],
            'noha'               => ['nullable', 'boolean'],
            'w_o_s'              => ['nullable', 'boolean'],
            'p_a_n_c_b'          => ['nullable', 'boolean'],
            'host_liquor'        => ['nullable', 'boolean'],
            'liquor'             => ['nullable', 'boolean'],
            'additional_insureds'=> ['nullable', 'integer', 'min:0'],
            'private_residence'  => ['nullable', 'boolean'],
            'is_venue'           => ['nullable', 'boolean'],
            'timezone'           => ['nullable', 'string'],
            // Customer info
            'first_name'         => ['required', 'string'],
            'last_name'          => ['required', 'string'],
            'email'              => ['required', 'email'],
            'phone'              => ['required', 'string'],
            'ins_first_name'     => ['required', 'string'],
            'ins_last_name'      => ['required', 'string'],
            'ins_street'         => ['required', 'string'],
            'ins_city'           => ['required', 'string'],
            'ins_state'          => ['required', 'string', 'max:2'],
            'ins_zip'            => ['required', 'string', 'regex:/^\d{5}$/'],
            // Event / venue
            'event_name'         => ['required', 'string'],
            'venue_name'         => ['required', 'string'],
            'venue_address'      => ['required', 'string'],
            'venue_city'         => ['required', 'string'],
            'venue_state'        => ['required', 'string', 'max:2'],
            'venue_zip'          => ['required', 'string', 'regex:/^\d{5}$/'],
            'venue_contact_person'=> ['nullable', 'string'],
            'venue_contact_email' => ['nullable', 'email'],
            'venue_contact_number'=> ['nullable', 'string'],
            // Payment
            'stripe_payment_method_id' => ['required', 'string'],
            // Signature
            'signature'               => ['nullable', 'string'],
            // Referral attribution (set by frontend from ?ref / ?planner / ?cref params)
            'referred_by_affiliate_id' => ['nullable', 'integer', 'exists:users,id'],
            'referred_by_planner_id'   => ['nullable', 'integer', 'exists:users,id'],
            'referred_by_customer_id'  => ['nullable', 'integer', 'exists:users,id'],
            'affiliate_string'         => ['nullable', 'string', 'max:50'],
        ]);

        $result = $this->leadService->createAndCharge($request->all());

        if (! $result['success']) {
            return response()->json([
                'message' => $result['message'],
            ], 422);
        }

        return response()->json([
            'lead_number' => $result['lead_number'],
            'message'     => 'Payment successful. Your policy is being processed.',
        ], 201);
    }
}
