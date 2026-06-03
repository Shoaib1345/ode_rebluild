<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Lead;
use App\Models\LeadMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Customer self-service portal (FULL-SPEC-V2.md §16).
 *
 * All queries scope strictly to the authenticated user:
 *   - Leads matched by user_id OR email (covers pre-account purchases).
 *   - Invoices matched via those lead IDs.
 *   - Commissions via user_id FK (customer referral commissions).
 *
 * Commission amounts are W9-gated (§14, §25) — hidden until verified_at is set.
 */
class PortalController extends Controller
{
    // ── Dashboard ──────────────────────────────────────────────────────────────

    /**
     * GET /api/customer/dashboard
     *
     * Returns summary counts for the customer's dashboard widgets.
     */
    public function dashboard(Request $request): JsonResponse
    {
        $user  = $request->user();
        $hasW9 = $user->hasVerifiedW9();

        $leadIds = $this->customerLeadIds($user);

        $policiesCount    = Lead::whereIn('id', $leadIds)
                                ->where('submission_status', 'payment_received')
                                ->count();

        $openInvoiceCount = Invoice::whereIn('lead_id', $leadIds)
                                   ->where('invoice_status', Invoice::STATUS_UNPAID)
                                   ->count();

        $commissions       = $user->commissions()->get();
        $commissionsCount  = $commissions->count();
        $pendingCommission = $commissions->where('status', 'accrued')->sum('amount');

        return response()->json([
            'policies_count'      => $policiesCount,
            'open_invoices_count' => $openInvoiceCount,
            'commissions_count'   => $commissionsCount,
            'pending_commission'  => $hasW9 ? round((float) $pendingCommission, 2) : null,
            'w9_verified'         => $hasW9,
        ]);
    }

    // ── Policies (purchased events) ────────────────────────────────────────────

    /**
     * GET /api/customer/events
     *
     * Paginated list of the customer's purchased event policies.
     * Scoped to leads where submission_status = 'payment_received'.
     *
     * COI download URL is a stub — wiring to PDF generation is pending.
     */
    public function events(Request $request): JsonResponse
    {
        $request->validate([
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
            'page'     => ['nullable', 'integer', 'min:1'],
        ]);

        $user    = $request->user();
        $leadIds = $this->customerLeadIds($user);

        $leads = Lead::whereIn('id', $leadIds)
            ->where('submission_status', 'payment_received')
            ->orderBy('event_date', 'desc')
            ->paginate(
                (int) $request->input('per_page', 20),
                [
                    'id', 'event_name', 'event_type_label', 'event_date',
                    'event_state', 'carrier', 'lead_offered_plans',
                    'bound', 'created_at',
                ]
            );

        // Append a certificate_url stub for each lead
        $leads->getCollection()->transform(function ($lead) {
            $plans   = $lead->lead_offered_plans ?? [];
            $premium = $plans['premium'] ?? null;

            return [
                'id'               => $lead->id,
                'event_name'       => $lead->event_name,
                'event_type_label' => $lead->event_type_label,
                'event_date'       => $lead->event_date?->toDateString(),
                'event_state'      => $lead->event_state,
                'carrier'          => $lead->carrier ?? ($plans['carrier'] ?? null),
                'premium'          => $premium ? round((float) $premium, 2) : null,
                'bound'            => (bool) $lead->bound,
                'certificate_url'  => url("/api/customer/events/{$lead->id}/certificate"),
                'purchased_at'     => $lead->created_at->toIso8601String(),
            ];
        });

        return response()->json($leads);
    }

    /**
     * GET /api/customer/events/{id}/certificate
     *
     * Returns the customer's Certificate of Insurance (COI) for a lead.
     *
     * If the COI has already been generated, streams the PDF.
     * If it hasn't been generated yet (e.g. job still queued), returns a 202
     * so the frontend can show a "processing" state and poll later.
     * Access is restricted to the owning customer.
     */
    public function certificate(Request $request, int $id): \Symfony\Component\HttpFoundation\BinaryFileResponse|\Illuminate\Http\Response|JsonResponse
    {
        $user    = $request->user();
        $leadIds = $this->customerLeadIds($user);

        $lead = Lead::whereIn('id', $leadIds)
                    ->where('id', $id)
                    ->where('submission_status', 'payment_received')
                    ->firstOrFail();

        // Look up the most-recent COI file in lead_files (visible to customer)
        $file = $lead->files()
                     ->where('category', 'Certificate')
                     ->where('send_to_customer', true)
                     ->latest()
                     ->first();

        // Also check coi_pdf_path column as a fallback
        $storagePath = $file?->path ?? $lead->coi_pdf_path;

        if (! $storagePath) {
            // COI not ready yet — job may still be queued
            return response()->json([
                'ready'      => false,
                'message'    => 'Your Certificate of Insurance is being generated and will be emailed to you shortly. Please check back in a few minutes.',
                'lead_id'    => $lead->id,
                'event_name' => $lead->event_name,
                'event_date' => $lead->event_date?->toDateString(),
            ], 202);
        }

        $absolutePath = \Illuminate\Support\Facades\Storage::disk('local')->path($storagePath);

        if (! file_exists($absolutePath)) {
            return response()->json([
                'ready'   => false,
                'message' => 'Certificate file not found. Please contact support@onedayevent.com.',
            ], 404);
        }

        return response()->file($absolutePath, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'inline; filename="Certificate_of_Insurance_ODE00' . $lead->id . '.pdf"',
        ]);
    }

    // ── Invoices ───────────────────────────────────────────────────────────────

    /**
     * GET /api/customer/invoices
     *
     * Paginated list of invoices linked to this customer's leads.
     * Includes a pay_url pointing to the public invoice payment page.
     */
    public function invoices(Request $request): JsonResponse
    {
        $request->validate([
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
            'status'   => ['nullable', 'in:open,paid'],
        ]);

        $user    = $request->user();
        $leadIds = $this->customerLeadIds($user);

        $query = Invoice::whereIn('lead_id', $leadIds)
            ->orderBy('created_at', 'desc');

        if ($request->input('status') === 'open') {
            $query->where('invoice_status', Invoice::STATUS_UNPAID);
        } elseif ($request->input('status') === 'paid') {
            $query->where('invoice_status', Invoice::STATUS_PAID);
        }

        $invoices = $query->paginate(
            (int) $request->input('per_page', 20),
            [
                'id', 'encode_id', 'lead_id', 'event_type', 'carrier',
                'effective_date', 'total_payable', 'invoice_status', 'created_at',
            ]
        );

        $invoices->getCollection()->transform(function ($inv) {
            return [
                'id'             => $inv->id,
                'encode_id'      => $inv->encode_id,
                'lead_id'        => $inv->lead_id,
                'event_type'     => $inv->event_type,
                'carrier'        => $inv->carrier,
                'effective_date' => $inv->effective_date?->toDateString(),
                'total_payable'  => $inv->total_payable,
                'status'         => $inv->invoice_status === Invoice::STATUS_PAID ? 'paid' : 'open',
                'pay_url'        => url("/invoice/{$inv->encode_id}"),
                'created_at'     => $inv->created_at->toIso8601String(),
            ];
        });

        return response()->json($invoices);
    }

    // ── Referral link ──────────────────────────────────────────────────────────

    /**
     * GET /api/customer/referral-link
     *
     * Returns this customer's unique referral link and their referral earnings so far.
     * Link format: {app_url}/onedayevent?ref_customer={user_id}  (§16)
     * Referral commission is $5 per completed policy (§25).
     */
    public function referralLink(Request $request): JsonResponse
    {
        $user  = $request->user();
        $hasW9 = $user->hasVerifiedW9();

        $link = rtrim(config('app.url'), '/') . '/onedayevent?ref_customer=' . $user->id;

        $commissions = $user->commissions()
                            ->where('type', 'customer')
                            ->get();

        $totalEarned = $commissions->sum('amount');
        $paidOut     = $commissions->where('status', 'paid')->sum('amount');
        $pendingPay  = $commissions->where('status', 'accrued')->sum('amount');

        return response()->json([
            'referral_link'  => $link,
            'commission_per_referral' => 5.00,
            'referrals_count' => Lead::where('referred_by_customer_id', $user->id)
                                     ->where('submission_status', 'payment_received')
                                     ->count(),
            'earnings' => [
                'total'   => $hasW9 ? round((float) $totalEarned, 2) : null,
                'paid'    => $hasW9 ? round((float) $paidOut, 2)     : null,
                'pending' => $hasW9 ? round((float) $pendingPay, 2)  : null,
            ],
            'w9_verified' => $hasW9,
        ]);
    }

    // ── Support chat ───────────────────────────────────────────────────────────

    /**
     * GET /api/customer/messages
     *
     * The customer's support conversation. Anchored to their most recent lead
     * (or ?lead_id= if they own it). Opening the thread marks every outbound
     * (admin → customer) message read.
     */
    public function messages(Request $request): JsonResponse
    {
        $request->validate([
            'lead_id' => ['nullable', 'integer'],
        ]);

        $lead = $this->resolveChatLead($request);

        if (! $lead) {
            return response()->json([
                'lead_id'    => null,
                'is_blocked' => false,
                'is_closed'  => false,
                'messages'   => [],
            ]);
        }

        // Opening the conversation clears the outbound unread state (visible msgs only).
        $lead->messages()
             ->visibleToCustomer()
             ->where('direction', LeadMessage::DIRECTION_OUT)
             ->whereNull('read_at')
             ->update(['read_at' => now()]);

        // Internal admin notes are never exposed to the customer.
        $messages = $lead->messages()
            ->visibleToCustomer()
            ->orderBy('created_at')
            ->get()
            ->map(fn (LeadMessage $m) => [
                'id'         => $m->id,
                'direction'  => $m->direction,
                'body'       => $m->body,
                'created_at' => $m->created_at->toIso8601String(),
            ]);

        return response()->json([
            'lead_id'    => $lead->id,
            'is_blocked' => (bool) $lead->is_chat_blocked,
            'is_closed'  => $lead->chat_closed_at !== null,
            'messages'   => $messages,
        ]);
    }

    /**
     * POST /api/customer/messages
     *
     * Send an inbound support message. Attaches to the customer's most recent
     * lead (or ?lead_id= if they own it).
     */
    public function sendMessage(Request $request): JsonResponse
    {
        $data = $request->validate([
            'body'    => ['required', 'string', 'max:5000'],
            'lead_id' => ['nullable', 'integer'],
        ]);

        $lead = $this->resolveChatLead($request);

        if (! $lead) {
            return response()->json([
                'message' => 'No event found to attach your message to. Please get a quote first.',
            ], 422);
        }

        // Admin can disable a customer's chat entirely.
        if ($lead->is_chat_blocked) {
            return response()->json([
                'message' => 'Chat is currently unavailable for your account. Please email support@onedayevent.com.',
            ], 403);
        }

        $message = $lead->messages()->create([
            'user_id'   => $request->user()->id,
            'direction' => LeadMessage::DIRECTION_IN,
            'body'      => $data['body'],
        ]);

        // A customer reply reopens a previously closed conversation.
        if ($lead->chat_closed_at !== null) {
            $lead->update(['chat_closed_at' => null]);
        }

        return response()->json([
            'id'         => $message->id,
            'lead_id'    => $lead->id,
            'direction'  => $message->direction,
            'body'       => $message->body,
            'created_at' => $message->created_at->toIso8601String(),
        ], 201);
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    /**
     * Resolve the lead that anchors this customer's support conversation.
     *
     * Honours ?lead_id= when the customer owns that lead; otherwise falls back to
     * their most recent lead. Returns null if the customer has no leads at all.
     */
    private function resolveChatLead(Request $request): ?Lead
    {
        $leadIds = $this->customerLeadIds($request->user());

        if (empty($leadIds)) {
            return null;
        }

        $requested = $request->input('lead_id');

        if ($requested && in_array((int) $requested, array_map('intval', $leadIds), true)) {
            return Lead::find((int) $requested);
        }

        return Lead::whereIn('id', $leadIds)->latest('id')->first();
    }

    /**
     * Collect all lead IDs that belong to this customer.
     *
     * Matches by user_id (if they were logged in when purchasing) OR by email
     * (for leads created before they had an account). Returns a plain array of
     * IDs so downstream queries can use whereIn().
     */
    private function customerLeadIds($user): array
    {
        return Lead::where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                  ->orWhere('email', $user->email);
            })
            ->where('status', 1)
            ->pluck('id')
            ->toArray();
    }
}
