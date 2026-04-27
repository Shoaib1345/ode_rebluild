<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use App\Services\EmailService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Pending-quote save / resume (FULL-SPEC-V2.md §9).
 *
 * POST /api/leads/pending         → save or update a partial quote
 * GET  /api/quotes/pending/{token} → resume a saved quote
 *
 * A lead row with submission_status='saved' is created on first save.
 * Subsequent saves (with pending_quote_id) update the same row.
 * The token is stored in leads.pending_ode_quote_link_id.
 * The wizard state JSON is stored in leads.pending_json_form_array (TEXT).
 */
class PendingQuoteController extends Controller
{
    public function __construct(private EmailService $emailService) {}

    // ── Save (create or update) ───────────────────────────────────────────────

    public function save(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email'           => ['required', 'email', 'max:155'],
            'current_route'   => ['required', 'string', 'max:100'],
            'wizard_state'    => ['required', 'array'],
            'pending_quote_id'=> ['nullable', 'string', 'max:100'],
        ]);

        $existingToken = $data['pending_quote_id'] ?? null;
        $created       = false;

        // ── Payload to persist ─────────────────────────────────────────────────
        $payload = json_encode([
            'current_route' => $data['current_route'],
            'wizard_state'  => $data['wizard_state'],
        ]);

        if ($existingToken) {
            // Update existing pending lead
            $lead = Lead::where('pending_ode_quote_link_id', $existingToken)
                        ->where('submission_status', 'saved')
                        ->first();

            if ($lead) {
                $lead->update([
                    'email'                   => $data['email'],
                    'pending_json_form_array' => $payload,
                ]);

                return response()->json([
                    'pending_quote_id' => $existingToken,
                    'created'          => false,
                ]);
            }
            // Token not found — fall through and create a new one
        }

        // ── Create new pending lead ────────────────────────────────────────────
        $token = Str::random(32);

        // Extract first_name from wizard_state if the user already typed it
        $firstName = $data['wizard_state']['customerInfo']['first_name']
                  ?? $data['wizard_state']['params']['first_name']
                  ?? null;

        $lead = Lead::create([
            'email'                    => $data['email'],
            'first_name'               => $firstName,
            'submission_status'        => 'saved',
            'pending_ode_quote_link_id'=> $token,
            'pending_json_form_array'  => $payload,
            'status'                   => 1,
        ]);

        $created = true;

        // ── Send save-confirmation email (best-effort) ────────────────────────
        $this->sendSavedEmail($lead);

        return response()->json([
            'pending_quote_id' => $token,
            'created'          => true,
        ], 201);
    }

    // ── Resume ────────────────────────────────────────────────────────────────

    public function resume(string $token): JsonResponse
    {
        $lead = Lead::where('pending_ode_quote_link_id', $token)
                    ->where('submission_status', 'saved')
                    ->first();

        if (! $lead || ! $lead->pending_json_form_array) {
            return response()->json(['message' => 'Quote not found or already completed.'], 404);
        }

        $stored = json_decode($lead->pending_json_form_array, true);

        if (! $stored) {
            return response()->json(['message' => 'Quote data is corrupted.'], 422);
        }

        return response()->json([
            'current_route'    => $stored['current_route'] ?? '/quote/details',
            'wizard_state'     => $stored['wizard_state']  ?? [],
            'email'            => $lead->email,
            'pending_quote_id' => $token,
        ]);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function sendSavedEmail(Lead $lead): void
    {
        try {
            $frontendUrl = rtrim(config('app.frontend_url', config('app.url')), '/');
            $resumeLink  = $frontendUrl . '/quote/resume/' . $lead->pending_ode_quote_link_id;

            $this->emailService->sendToLead($lead, 'quote_saved', [
                'firstName' => $lead->first_name ?? 'there',
                'quoteLink' => $resumeLink,
                'eventType' => $lead->event_type_label ?? 'your event',
            ]);
        } catch (\Throwable $e) {
            Log::warning('Could not send quote-saved email', [
                'lead_id' => $lead->id,
                'error'   => $e->getMessage(),
            ]);
        }
    }
}
