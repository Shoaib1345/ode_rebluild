<?php

namespace App\Services;

use App\Jobs\GenerateCoiPdfJob;
use App\Jobs\SendLeadConfirmationEmail;
use App\Models\Lead;
use App\Models\LeadAction;
use App\Models\UsState;
use App\Services\CommissionService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Stripe\Exception\CardException;
use Stripe\PaymentIntent;
use Stripe\Stripe;

class LeadCreationService
{
    public function __construct(private CommissionService $commissionService) {}

    public function createAndCharge(array $data): array
    {
        // ── 1. Resolve state ID ────────────────────────────────────────────
        $stateRow = UsState::where('abbreviation', strtoupper($data['event_state']))
            ->orWhere('name', $data['event_state'])
            ->first();

        // ── 2. Parse first event date for the lead's date column ───────────
        $firstDateStr = explode(',', $data['event_dates'])[0];
        try {
            $eventDate = Carbon::createFromFormat('m/d/Y', trim($firstDateStr))->toDateString();
        } catch (\Exception) {
            $eventDate = null;
        }

        // ── 3. Determine alcohol fields ────────────────────────────────────
        $alcoholServed = 'none';
        if ($data['liquor']     ?? false) $alcoholServed = 'sold';
        elseif ($data['host_liquor'] ?? false) $alcoholServed = 'hosted';

        // ── 4. Build coverage limit string ─────────────────────────────────
        $coverageLimit = $data['min_limit'] . '/' . $data['max_limit'];

        // ── 5. Build lead payload ──────────────────────────────────────────
        $leadData = [
            'event_type_id'        => $data['event_type_id'],
            'event_type_label'     => $data['event_type_name'],
            'event_date'           => $eventDate,
            'state_id'             => $stateRow?->id,
            'event_state'          => strtoupper(substr($data['event_state'], 0, 2)),
            'event_name'           => $data['event_name'],
            'no_of_people'         => $data['persons'],
            'alcohol_served'       => $alcoholServed,
            'waiver_sub_status'    => $data['w_o_s']     ?? false,
            'hired_status'         => $data['noha']      ?? false,
            'primary_basis'        => $data['p_a_n_c_b'] ?? false,
            'additional_insured'   => $data['additional_insureds'] ?? 0,
            'additional_insured_details' => $data['additional_insured_details'] ?? null,
            'private_residence'    => $data['private_residence']   ?? false,
            'carrier'              => $data['carrier'],
            'coverage_limit'       => $coverageLimit,
            'email'                => $data['email'],
            'phone'                => $data['phone'],
            'first_name'           => $data['first_name'],
            'last_name'            => $data['last_name'],
            'ins_first_name'       => $data['ins_first_name'],
            'ins_last_name'        => $data['ins_last_name'],
            'ins_street'           => $data['ins_street'],
            'ins_city'             => $data['ins_city'],
            'ins_state'            => strtoupper($data['ins_state']),
            'ins_zip'              => $data['ins_zip'],
            'venue_name'           => $data['venue_name'],
            'venue_address'        => $data['venue_address'],
            'venue_state'          => strtoupper($data['venue_state']),
            'venue_zip'            => $data['venue_zip'],
            'contact_at_venue'     => $data['venue_contact_person'] ?? null,
            'venue_contact_email'  => $data['venue_contact_email']  ?? null,
            'venue_contact_number' => $data['venue_contact_number'] ?? null,
            'e_signature'              => $data['signature'] ?? null,
            'acknowledge'              => 'Yes',
            'user_timezone'            => $data['timezone'] ?? null,
            'submission_status'        => 'tried',
            // Referral attribution — set by the frontend from ?ref / ?planner / ?cref query params
            'referred_by_affiliate_id' => $data['referred_by_affiliate_id'] ?? null,
            'referred_by_planner_id'   => $data['referred_by_planner_id']   ?? null,
            'referred_by_customer_id'  => $data['referred_by_customer_id']  ?? null,
            // Legacy string-based affiliate tracking (kept for backward compatibility)
            'affiliate_string'         => $data['affiliate_string'] ?? null,
            // Pass as array — the model's 'array' cast handles JSON encoding.
            // Do NOT pre-encode with json_encode() or it will be double-encoded.
            'lead_offered_plans'   => [
                'rate_id'        => $data['rate_id'],
                'carrier'        => $data['carrier'],
                'premium'        => (float) $data['premium'],
                'broker_fee'     => (float) $data['broker_fee'],
                'processing_fee' => (float) $data['processing_fee'],
                'extra_charge'   => (float) ($data['extra_charge'] ?? 0),
                'total'          => (float) $data['total'],
                'min_limit'      => (int)   $data['min_limit'],
                'max_limit'      => (int)   $data['max_limit'],
            ],
        ];

        // ── 6. Charge via Stripe ───────────────────────────────────────────
        $amountCents = (int) round($data['total'] * 100);

        try {
            Stripe::setApiKey(config('services.stripe.secret'));

            $intent = PaymentIntent::create([
                'amount'               => $amountCents,
                'currency'             => 'usd',
                'payment_method'       => $data['stripe_payment_method_id'],
                'confirm'              => true,
                'automatic_payment_methods' => [
                    'enabled'          => true,
                    'allow_redirects'  => 'never',
                ],
                'description'          => "ODE Policy – {$data['event_type_name']} – {$data['email']}",
                'receipt_email'        => $data['email'],
            ]);

            if ($intent->status !== 'succeeded') {
                return [
                    'success' => false,
                    'message' => 'Payment was not completed. Please try again.',
                ];
            }

            $leadData['payment_id']     = $intent->id;
            $leadData['payment_status'] = 'paid';
            $leadData['submission_status'] = 'payment_received';

        } catch (CardException $e) {
            return [
                'success' => false,
                'message' => $e->getMessage() ?: 'Your card was declined.',
            ];
        } catch (\Exception $e) {
            Log::error('Stripe charge failed', ['error' => $e->getMessage()]);
            return [
                'success' => false,
                'message' => 'Payment processing error. Please try again.',
            ];
        }

        // ── 7. Persist lead ────────────────────────────────────────────────
        $lead = Lead::create($leadData);

        // ── 8. Accrue commissions (idempotent — safe to re-run) ────────────
        $this->commissionService->accrueAll($lead);

        // ── 9. Queue confirmation email ────────────────────────────────────
        SendLeadConfirmationEmail::dispatch($lead);

        // ── 10. Generate COI + email it to the customer ────────────────────
        // Runs as a queued job so it doesn't block the payment response.
        // The job fills the pre-signed PDF template, saves it to storage,
        // records it in lead_files (customer portal), and emails it.
        GenerateCoiPdfJob::dispatch($lead->id);

        return [
            'success'     => true,
            'lead_number' => $lead->id,
        ];
    }

    /**
     * Create a MANUAL-QUOTE lead — an event that can't be auto-bound online and
     * needs human underwriting. No Stripe charge, no plan, no COI. Captures the
     * gathered event + contact details with submission_status = 'mq' so it lands
     * in the admin manual-quote queue, and records why it was routed there.
     *
     * Mirrors legacy ThankQuote → leads/ode_quote_ajax (manual path).
     */
    public function createManualQuote(array $data): array
    {
        $stateRow = UsState::where('abbreviation', strtoupper($data['event_state'] ?? ''))
            ->orWhere('name', $data['event_state'] ?? '')
            ->first();

        $alcoholServed = 'none';
        if ($data['liquor'] ?? false)            $alcoholServed = 'sold';
        elseif ($data['host_liquor'] ?? false)   $alcoholServed = 'hosted';

        $lead = Lead::create([
            'event_type_id'      => $data['event_type_id']   ?? null,
            'event_type_label'   => $data['event_type_name'] ?? null,
            'event_date'         => $this->parseFirstDate($data['event_dates'] ?? ''),
            'state_id'           => $stateRow?->id,
            'event_state'        => strtoupper(substr($data['event_state'] ?? '', 0, 2)),
            'event_name'         => $data['event_name'] ?? null,
            'no_of_people'       => $data['persons'] ?? null,
            'alcohol_served'     => $alcoholServed,
            'waiver_sub_status'  => $data['w_o_s']     ?? false,
            'hired_status'       => $data['noha']      ?? false,
            'primary_basis'      => $data['p_a_n_c_b'] ?? false,
            'additional_insured' => $data['additional_insureds'] ?? 0,
            'private_residence'  => $data['private_residence']   ?? false,
            'email'              => $data['email'],
            'phone'              => $data['phone']      ?? null,
            'first_name'         => $data['first_name'] ?? null,
            'last_name'          => $data['last_name']  ?? null,
            'user_timezone'      => $data['timezone']   ?? null,
            'submission_status'  => 'mq',
            // Referral attribution
            'referred_by_affiliate_id' => $data['referred_by_affiliate_id'] ?? null,
            'referred_by_planner_id'   => $data['referred_by_planner_id']   ?? null,
            'referred_by_customer_id'  => $data['referred_by_customer_id']  ?? null,
            'affiliate_string'         => $data['affiliate_string'] ?? null,
        ]);

        // Audit why this needs underwriting (shown in the admin lead timeline).
        $reasons = $data['manual_quote_reasons'] ?? [];
        $reasonText = is_array($reasons) && $reasons
            ? implode(', ', $reasons)
            : 'requires manual underwriting review';

        LeadAction::create([
            'lead_id'     => $lead->id,
            'user_id'     => null,
            'action_type' => null,
            'message'     => "Manual quote requested — {$reasonText}.",
            'meta'        => ['reasons' => $reasons],
        ]);

        return [
            'success'     => true,
            'lead_number' => $lead->id,
        ];
    }

    /**
     * Create a lead manually from the admin CRM (e.g. a phoned-in / offline
     * quote). No Stripe charge. If a plan/price is supplied the lead is marked
     * 'plan_added_manually' (ready to invoice); otherwise 'mq'. The admin can
     * then raise an invoice against the returned lead for online payment.
     */
    public function createAdminLead(array $data, ?int $adminId = null): Lead
    {
        $stateRow = UsState::where('abbreviation', strtoupper($data['event_state'] ?? ''))
            ->orWhere('name', $data['event_state'] ?? '')
            ->first();

        $alcoholServed = 'none';
        if ($data['liquor'] ?? false)          $alcoholServed = 'sold';
        elseif ($data['host_liquor'] ?? false) $alcoholServed = 'hosted';

        $hasPlan = isset($data['total']) && $data['total'] !== null && $data['total'] !== '';

        $leadData = [
            'event_type_id'      => $data['event_type_id']   ?? null,
            'event_type_label'   => $data['event_type_name'] ?? null,
            'event_date'         => $this->parseFirstDate($data['event_dates'] ?? ''),
            'state_id'           => $stateRow?->id,
            'event_state'        => strtoupper(substr($data['event_state'] ?? '', 0, 2)),
            'event_name'         => $data['event_name'] ?? null,
            'no_of_people'       => $data['persons'] ?? null,
            'alcohol_served'     => $alcoholServed,
            'waiver_sub_status'  => $data['w_o_s']     ?? false,
            'hired_status'       => $data['noha']      ?? false,
            'primary_basis'      => $data['p_a_n_c_b'] ?? false,
            'additional_insured' => $data['additional_insureds'] ?? 0,
            'private_residence'  => $data['private_residence']   ?? false,
            'email'              => $data['email'],
            'phone'              => $data['phone']      ?? null,
            'first_name'         => $data['first_name'] ?? null,
            'last_name'          => $data['last_name']  ?? null,
            'user_timezone'      => $data['timezone']   ?? null,
            'submission_status'  => $hasPlan ? 'plan_added_manually' : 'mq',
        ];

        if ($hasPlan) {
            $leadData['carrier']        = $data['carrier'] ?? null;
            $leadData['coverage_limit'] = ($data['min_limit'] ?? '') . '/' . ($data['max_limit'] ?? '');
            $leadData['lead_offered_plans'] = [
                'carrier'        => $data['carrier'] ?? null,
                'premium'        => (float) ($data['premium'] ?? 0),
                'broker_fee'     => (float) ($data['broker_fee'] ?? 0),
                'processing_fee' => (float) ($data['processing_fee'] ?? 0),
                'total'          => (float) ($data['total'] ?? 0),
                'min_limit'      => (int)   ($data['min_limit'] ?? 0),
                'max_limit'      => (int)   ($data['max_limit'] ?? 0),
            ];
        }

        $lead = Lead::create($leadData);

        LeadAction::create([
            'lead_id'     => $lead->id,
            'user_id'     => $adminId,
            'action_type' => null,
            'message'     => 'Lead created manually from the admin CRM.',
        ]);

        return $lead;
    }

    /**
     * Parse the first event date from a comma list, accepting m/d/Y, Y-m-d, or
     * anything Carbon understands. Returns a Y-m-d string or null.
     */
    private function parseFirstDate(string $eventDates): ?string
    {
        $first = trim(explode(',', $eventDates)[0] ?? '');
        if ($first === '') {
            return null;
        }
        foreach (['m/d/Y', 'Y-m-d'] as $fmt) {
            try {
                return Carbon::createFromFormat($fmt, $first)->toDateString();
            } catch (\Exception) {
                // try next format
            }
        }
        try {
            return Carbon::parse($first)->toDateString();
        } catch (\Exception) {
            return null;
        }
    }
}
