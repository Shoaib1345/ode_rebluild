<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use App\Models\LeadAction;
use App\Models\LeadFollowUp;
use App\Models\UsState;
use App\Services\LeadCreationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class LeadController extends Controller
{
    public function __construct(private LeadCreationService $leadService) {}

    /**
     * GET /api/admin/leads
     * Paginated, filterable list of leads for the admin CRM.
     *
     * Query params (basic):
     *   search        — partial match on name / email / phone
     *   status        — submission_status enum value
     *   state         — 2-letter state abbreviation
     *   bound         — 1 / 0
     *   per_page      — default 25, max 100
     *   page          — default 1
     *   sort          — column name (default: created_at)
     *   dir           — asc | desc (default: desc)
     *
     * View filter params (mutually exclusive — one at a time):
     *   priority      — 1 → is_priority_lead = true
     *   sold          — 1 → payment_received or finished
     *   past_events   — 1 → event_date < today
     *   future_events — 1 → event_date >= today
     *   follow_up     — 1 → has at least one pending follow-up task
     *   untouched     — 1 → tried + no post-event emails sent
     *   cancelled     — 1 → has a closing_reason set
     *   untouch       — 1 → submission_status = tried (broad)
     *   my_leads      — 1 → assigned to / owned by the authed user
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'search'        => ['nullable', 'string', 'max:100'],
            'status'        => ['nullable', Rule::in([
                'tried', 'saved', 'mq', 'plan_added_manually',
                'payment', 'payment_received', 'finished',
            ])],
            'state'         => ['nullable', 'string', 'size:2'],
            'bound'         => ['nullable', 'boolean'],
            // view-filter flags
            'priority'      => ['nullable', 'boolean'],
            'sold'          => ['nullable', 'boolean'],
            'past_events'   => ['nullable', 'boolean'],
            'future_events' => ['nullable', 'boolean'],
            'follow_up'     => ['nullable', 'boolean'],
            'untouched'     => ['nullable', 'boolean'],
            'cancelled'     => ['nullable', 'boolean'],
            'untouch'       => ['nullable', 'boolean'],
            'hold'          => ['nullable', 'boolean'],
            'my_leads'      => ['nullable', 'boolean'],
            // pagination / sort
            'per_page'      => ['nullable', 'integer', 'min:1', 'max:100'],
            'sort'          => ['nullable', Rule::in([
                'id', 'first_name', 'last_name', 'email',
                'event_date', 'created_at', 'submission_status',
            ])],
            'dir'           => ['nullable', Rule::in(['asc', 'desc'])],
        ]);

        $query = Lead::query()
            ->where('status', 1)
            ->with(['eventType:id,event_type']);

        // ── Basic filters ──────────────────────────────────────────────────
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

        // ── View-filter flags ──────────────────────────────────────────────

        // Priority leads — flagged by staff
        if ($request->boolean('priority')) {
            $query->where('is_priority_lead', true);
        }

        // Sold leads — payment collected (payment_received or finished)
        if ($request->boolean('sold')) {
            $query->whereIn('submission_status', ['payment_received', 'finished']);
        }

        // Bound leads — filters by bound column; works as view filter (bound=1)
        // or as a generic boolean filter (bound=0)
        if ($request->has('bound')) {
            $query->where('bound', $request->boolean('bound'));
        }

        // Past events — event date is in the past
        if ($request->boolean('past_events')) {
            $query->whereNotNull('event_date')
                  ->whereDate('event_date', '<', now()->toDateString());
        }

        // Future events — event date is today or in the future
        if ($request->boolean('future_events')) {
            $query->whereNotNull('event_date')
                  ->whereDate('event_date', '>=', now()->toDateString());
        }

        // Follow-up — has at least one pending follow-up task (status = 0)
        if ($request->boolean('follow_up')) {
            $query->whereHas('followUps', fn ($q) => $q->where('status', 0));
        }

        // Untouched — tried status AND no automated emails have been sent
        if ($request->boolean('untouched')) {
            $query->where('submission_status', 'tried')
                  ->where('post_event_email_sent', false)
                  ->where('seven_day_reminder_sent', false);
        }

        // Cancelled — closing_reason has been set (lead was closed/cancelled)
        if ($request->boolean('cancelled')) {
            $query->whereNotNull('closing_reason')
                  ->where('closing_reason', '!=', '');
        }

        // Untouch — submission_status = tried (broader "untouched" without email checks)
        if ($request->boolean('untouch')) {
            $query->where('submission_status', 'tried');
        }

        // On hold — flagged by staff
        if ($request->boolean('hold')) {
            $query->where('is_on_hold', true);
        }

        // My leads — leads assigned to the currently authenticated user
        if ($request->boolean('my_leads')) {
            $authId = $request->user()->id;
            $query->where(function ($q) use ($authId) {
                $q->where('user_id', $authId)
                  ->orWhereHas('assignedUsers', fn ($q2) => $q2->where('users.id', $authId));
            });
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
            'is_on_hold', 'is_priority_lead', 'closing_reason', 'created_at',
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
            ->with([
                'eventType:id,event_type',
                'state:id,name,abbreviation',
                'notes'    => fn ($q) => $q->orderBy('created_at', 'desc')
                                           ->with('author:id,first_name,last_name'),
                'followUps',
                'actions'  => fn ($q) => $q->orderBy('created_at', 'desc')
                                           ->with('user:id,first_name,last_name'),
                'invoices' => fn ($q) => $q->orderBy('created_at', 'desc'),
                'referredByAffiliate:id,first_name,last_name,email',
                'referredByPlanner:id,first_name,last_name,email',
                'referredByCustomer:id,first_name,last_name,email',
            ])
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
            // ── Status / flags ────────────────────────────────────────────────
            'submission_status' => ['sometimes', Rule::in([
                'tried', 'saved', 'mq', 'plan_added_manually',
                'payment', 'payment_received', 'finished',
            ])],
            'bound'             => ['sometimes', 'boolean'],
            'is_on_hold'        => ['sometimes', 'boolean'],
            'is_priority_lead'  => ['sometimes', 'boolean'],
            'is_email_blocked'  => ['sometimes', 'boolean'],
            'closing_reason'    => ['sometimes', 'nullable', 'string', 'max:255'],

            // ── Billing / contact ─────────────────────────────────────────────
            'first_name'  => ['sometimes', 'nullable', 'string', 'max:100'],
            'last_name'   => ['sometimes', 'nullable', 'string', 'max:100'],
            'email'       => ['sometimes', 'nullable', 'email', 'max:255'],
            'phone'       => ['sometimes', 'nullable', 'string', 'max:30'],
            'street'      => ['sometimes', 'nullable', 'string', 'max:255'],
            'city'        => ['sometimes', 'nullable', 'string', 'max:100'],
            'zip'         => ['sometimes', 'nullable', 'string', 'max:20'],

            // ── Event ─────────────────────────────────────────────────────────
            'event_name'              => ['sometimes', 'nullable', 'string', 'max:255'],
            'event_date'              => ['sometimes', 'nullable', 'date'],
            'event_state'             => ['sometimes', 'nullable', 'string', 'max:2'],
            'no_of_people'            => ['sometimes', 'nullable', 'integer', 'min:1'],
            'alcohol_served'          => ['sometimes', 'nullable', 'string', 'max:50'],
            'event_description'       => ['sometimes', 'nullable', 'string', 'max:5000'],
            'special_activities'      => ['sometimes', 'boolean'],
            'event_special_act_detail'=> ['sometimes', 'nullable', 'string', 'max:1000'],
            'bouncehouses'            => ['sometimes', 'boolean'],
            'vendor_activity'         => ['sometimes', 'boolean'],
            'private_residence'       => ['sometimes', 'boolean'],
            'any_claims'              => ['sometimes', 'nullable', 'string', 'max:1000'],

            // ── Insured ───────────────────────────────────────────────────────
            'ins_first_name' => ['sometimes', 'nullable', 'string', 'max:100'],
            'ins_last_name'  => ['sometimes', 'nullable', 'string', 'max:100'],
            'ins_street'     => ['sometimes', 'nullable', 'string', 'max:255'],
            'ins_city'       => ['sometimes', 'nullable', 'string', 'max:100'],
            'ins_state'      => ['sometimes', 'nullable', 'string', 'max:2'],
            'ins_zip'        => ['sometimes', 'nullable', 'string', 'max:20'],

            // ── Venue ─────────────────────────────────────────────────────────
            'venue_name'           => ['sometimes', 'nullable', 'string', 'max:255'],
            'venue_address'        => ['sometimes', 'nullable', 'string', 'max:255'],
            'venue_state'          => ['sometimes', 'nullable', 'string', 'max:2'],
            'venue_zip'            => ['sometimes', 'nullable', 'string', 'max:20'],
            'contact_at_venue'     => ['sometimes', 'nullable', 'string', 'max:100'],
            'venue_contact_email'  => ['sometimes', 'nullable', 'email', 'max:255'],
            'venue_contact_number' => ['sometimes', 'nullable', 'string', 'max:30'],

            // ── Coverage ──────────────────────────────────────────────────────
            'carrier'            => ['sometimes', 'nullable', 'string', 'max:50'],
            'coverage_limit'     => ['sometimes', 'nullable', 'string', 'max:50'],
            'additional_insured' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'waiver_sub_status'  => ['sometimes', 'boolean'],
            'hired_status'       => ['sometimes', 'boolean'],
            'primary_basis'      => ['sometimes', 'boolean'],
        ]);

        $lead->update($data);

        return response()->json($lead->fresh());
    }

    /**
     * DELETE /api/admin/leads/{id}
     * Soft-deletes the lead via Laravel's SoftDeletes trait.
     */
    public function destroy(int $id): JsonResponse
    {
        $lead = Lead::where('status', 1)->findOrFail($id);
        $lead->delete();

        return response()->json(['message' => 'Lead deleted.']);
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

        LeadAction::log(
            $lead->id,
            LeadAction::NOTE_ADDED,
            "Note added by {$request->user()->first_name} {$request->user()->last_name}",
            $request->user()->id,
            ['note_preview' => mb_substr($data['message'], 0, 120)]
        );

        return response()->json($note, 201);
    }

    /**
     * POST /api/admin/leads/{id}/files
     * Uploads a file and attaches it to a lead.
     */
    public function storeFile(Request $request, int $id): JsonResponse
    {
        $lead = Lead::where('status', 1)->findOrFail($id);

        $data = $request->validate([
            'name'             => ['required', 'string', 'max:155'],
            'category'         => ['required', Rule::in([
                'Quote', 'Policy', 'Certificate', 'Signed Acceptance',
                'Questionnaire', 'Application', 'QR Form', 'LR Report', 'Other',
            ])],
            'file'             => ['required', 'file', 'max:20480'], // 20 MB
            'comments'         => ['nullable', 'string', 'max:1000'],
            'send_to_customer' => ['nullable', 'boolean'],
        ]);

        $file      = $request->file('file');
        $filename  = time() . '_' . $file->getClientOriginalName();
        $path      = $file->storeAs("lead_files/{$id}", $filename);

        $record = $lead->files()->create([
            'name'             => $data['name'],
            'category'         => $data['category'],
            'path'             => $path,
            'comments'         => $data['comments'] ?? null,
            'send_to_customer' => $data['send_to_customer'] ?? false,
            'user_timezone'    => $request->header('X-Timezone'),
        ]);

        return response()->json($record, 201);
    }

    /**
     * GET /api/admin/leads/{id}/files
     * Lists all files attached to a lead.
     */
    public function listFiles(int $id): JsonResponse
    {
        $lead  = Lead::where('status', 1)->findOrFail($id);
        $files = $lead->files()->latest()->get();
        return response()->json($files);
    }

    /**
     * POST /api/admin/leads/{id}/follow-ups
     * Creates a follow-up task for a lead.
     */
    public function storeFollowUp(Request $request, int $id): JsonResponse
    {
        $lead = Lead::where('status', 1)->findOrFail($id);

        $data = $request->validate([
            'follow_up_date' => ['required', 'date'],
            'notes'          => ['required', 'string', 'max:2000'],
            'user_id'        => ['required', 'integer', 'exists:users,id'],
        ]);

        $followUp = $lead->followUps()->create([
            'user_id'        => $data['user_id'],
            'created_by'     => $request->user()->id,
            'follow_up_date' => $data['follow_up_date'],
            'notes'          => $data['notes'],
            'status'         => 0,
        ]);

        $followUp->load('assignedTo:id,first_name,last_name');

        $assignedName = $followUp->assignedTo
            ? "{$followUp->assignedTo->first_name} {$followUp->assignedTo->last_name}"
            : 'Unknown';

        LeadAction::log(
            $lead->id,
            LeadAction::FOLLOW_UP_ADDED,
            "Follow-up scheduled for {$data['follow_up_date']} — assigned to {$assignedName}",
            $request->user()->id,
            [
                'follow_up_date' => $data['follow_up_date'],
                'assigned_to'    => $assignedName,
                'notes_preview'  => mb_substr($data['notes'], 0, 120),
            ]
        );

        return response()->json($followUp, 201);
    }

    /**
     * POST /api/admin/leads/{id}/email
     * Sends a custom email to the lead's email address.
     */
    public function sendEmail(Request $request, int $id): JsonResponse
    {
        $lead = Lead::where('status', 1)->findOrFail($id);

        $data = $request->validate([
            'to'      => ['required', 'email'],
            'cc'      => ['nullable', 'string'],
            'bcc'     => ['nullable', 'string'],
            'subject' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:10000'],
        ]);

        $sender = $request->user();

        Mail::html($data['message'], function ($msg) use ($data, $sender, $lead) {
            $msg->to($data['to'])
                ->subject($data['subject'])
                ->from(config('mail.from.address'), config('mail.from.name'))
                ->replyTo($sender->email ?? config('mail.from.address'), $sender->first_name . ' ' . $sender->last_name);

            if (! empty($data['cc'])) {
                foreach (array_map('trim', explode(',', $data['cc'])) as $cc) {
                    if ($cc) $msg->cc($cc);
                }
            }
            if (! empty($data['bcc'])) {
                foreach (array_map('trim', explode(',', $data['bcc'])) as $bcc) {
                    if ($bcc) $msg->bcc($bcc);
                }
            }
        });

        // Log as a structured lead action
        LeadAction::log(
            $lead->id,
            LeadAction::EMAIL_SENT,
            "Email sent to {$data['to']} — Subject: {$data['subject']}",
            $sender->id,
            [
                'to'      => $data['to'],
                'subject' => $data['subject'],
                'cc'      => $data['cc']  ?? null,
                'bcc'     => $data['bcc'] ?? null,
            ]
        );

        return response()->json(['message' => 'Email sent successfully.']);
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
            'additional_insured_details'             => ['nullable', 'array'],
            'additional_insured_details.*.name'      => ['nullable', 'string', 'max:150'],
            'additional_insured_details.*.relation'  => ['nullable', 'string', 'max:100'],
            'additional_insured_details.*.street'    => ['nullable', 'string', 'max:200'],
            'additional_insured_details.*.city'      => ['nullable', 'string', 'max:100'],
            'additional_insured_details.*.state'     => ['nullable', 'string', 'max:2'],
            'additional_insured_details.*.zip'       => ['nullable', 'string', 'max:10'],
            'additional_insured_details.*.email'     => ['nullable', 'email', 'max:150'],
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

    /**
     * POST /api/admin/leads
     * Admin-only: create a lead manually (phoned-in / offline quote), no payment.
     * If a plan/price is supplied the lead is 'plan_added_manually' (invoiceable);
     * otherwise 'mq'.
     */
    public function storeAdmin(Request $request): JsonResponse
    {
        $data = $request->validate([
            // Event
            'event_type_id'   => ['nullable', 'integer', 'exists:event_types,id'],
            'event_type_name' => ['nullable', 'string'],
            'event_dates'     => ['nullable', 'string'],
            'event_state'     => ['required', 'string'],
            'persons'         => ['nullable', 'integer', 'min:1'],
            'event_name'      => ['nullable', 'string'],
            'noha'            => ['nullable', 'boolean'],
            'w_o_s'           => ['nullable', 'boolean'],
            'p_a_n_c_b'       => ['nullable', 'boolean'],
            'host_liquor'     => ['nullable', 'boolean'],
            'liquor'          => ['nullable', 'boolean'],
            'additional_insureds' => ['nullable', 'integer', 'min:0'],
            'private_residence'   => ['nullable', 'boolean'],
            'timezone'        => ['nullable', 'string'],
            // Contact
            'first_name'      => ['required', 'string', 'max:100'],
            'last_name'       => ['required', 'string', 'max:100'],
            'email'           => ['required', 'email'],
            'phone'           => ['required', 'string', 'max:30'],
            // Optional chosen plan
            'carrier'         => ['nullable', 'string'],
            'premium'         => ['nullable', 'numeric', 'min:0'],
            'broker_fee'      => ['nullable', 'numeric', 'min:0'],
            'processing_fee'  => ['nullable', 'numeric', 'min:0'],
            'total'           => ['nullable', 'numeric', 'min:0'],
            'min_limit'       => ['nullable', 'integer'],
            'max_limit'       => ['nullable', 'integer'],
        ]);

        $lead = $this->leadService->createAdminLead($data, $request->user()->id);

        return response()->json([
            'lead'    => $lead,
            'message' => 'Lead created.',
        ], 201);
    }

    /**
     * POST /api/leads/manual-quote
     * Creates a manual-quote lead (no payment) for events that need underwriting.
     */
    public function storeManualQuote(Request $request): JsonResponse
    {
        $data = $request->validate([
            // Quote params (all optional except contact essentials)
            'event_type_id'       => ['nullable', 'integer', 'exists:event_types,id'],
            'event_type_name'     => ['nullable', 'string'],
            'event_dates'         => ['nullable', 'string'],
            'event_state'         => ['required', 'string'],
            'persons'             => ['nullable', 'integer', 'min:1'],
            'noha'                => ['nullable', 'boolean'],
            'w_o_s'               => ['nullable', 'boolean'],
            'p_a_n_c_b'           => ['nullable', 'boolean'],
            'host_liquor'         => ['nullable', 'boolean'],
            'liquor'              => ['nullable', 'boolean'],
            'additional_insureds' => ['nullable', 'integer', 'min:0'],
            'private_residence'   => ['nullable', 'boolean'],
            'timezone'            => ['nullable', 'string'],
            'event_name'          => ['nullable', 'string'],
            // Contact
            'first_name'          => ['required', 'string', 'max:100'],
            'last_name'           => ['required', 'string', 'max:100'],
            'email'               => ['required', 'email'],
            'phone'               => ['required', 'string', 'max:30'],
            // Why it was routed to manual review (for the underwriter)
            'manual_quote_reasons'=> ['nullable', 'array'],
            'manual_quote_reasons.*' => ['string', 'max:120'],
            // Referral attribution
            'referred_by_affiliate_id' => ['nullable', 'integer', 'exists:users,id'],
            'referred_by_planner_id'   => ['nullable', 'integer', 'exists:users,id'],
            'referred_by_customer_id'  => ['nullable', 'integer', 'exists:users,id'],
            'affiliate_string'         => ['nullable', 'string', 'max:50'],
        ]);

        $result = $this->leadService->createManualQuote($data);

        return response()->json([
            'lead_number' => $result['lead_number'],
            'message'     => 'Thanks! Our team is reviewing your event and will be in touch shortly.',
        ], 201);
    }
}
