<?php

namespace App\Http\Controllers;

use App\Models\DocSignStatus;
use App\Models\LeadAction;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

/**
 * DocuSign Connect webhook receiver (§20.4).
 *
 * DocuSign POSTs JSON to POST /api/webhooks/docusign on:
 *   envelope-sent, delivered, completed, declined, voided
 *
 * This endpoint must be publicly accessible (no auth:sanctum).
 * DocuSign does not support pre-shared secrets in the connect config,
 * so we verify by matching envelope_id against our local records.
 */
class DocuSignWebhookController extends Controller
{
    public function handle(Request $request): Response
    {
        $payload = $request->json()->all();

        // DocuSign Connect JSON payload structure:
        // { "event": "envelope-completed", "envelopeId": "...", "status": "completed", ... }
        $envelopeId = $payload['envelopeId'] ?? $payload['data']['envelopeId'] ?? null;
        $status     = $payload['status']     ?? $payload['data']['envelopeSummary']['status'] ?? null;

        if (! $envelopeId) {
            Log::warning('DocuSign webhook: missing envelopeId', $payload);
            return response('ok', 200); // always 200 so DocuSign doesn't retry
        }

        $record = DocSignStatus::where('envelope_id', $envelopeId)->first();

        if (! $record) {
            // Unknown envelope — could be from a different environment; ignore silently
            return response('ok', 200);
        }

        $normalised = $this->normaliseStatus($status);
        $record->status = $normalised;

        if ($normalised === 'completed') {
            $record->signed_at = now();

            // Log completion action
            LeadAction::create([
                'lead_id' => $record->lead_id,
                'user_id' => null,
                'message' => "DocuSign envelope completed (signed): {$envelopeId}",
            ]);

            // TODO: trigger "fully executed policy" email via EmailService
        }

        $record->save();

        return response('ok', 200);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /** Normalise various DocuSign status strings to our accepted values. */
    private function normaliseStatus(?string $status): string
    {
        return match (strtolower((string) $status)) {
            'sent'      => 'sent',
            'delivered' => 'delivered',
            'completed' => 'completed',
            'declined'  => 'declined',
            'voided'    => 'voided',
            default     => 'sent',
        };
    }
}
