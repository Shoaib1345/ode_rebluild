<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DocSignStatus;
use App\Models\Lead;
use App\Models\LeadAction;
use App\Services\DocuSignService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Admin DocuSign actions (§20.3).
 *
 * Routes (under admin middleware):
 *   POST   /admin/leads/{id}/docusign/send    → send (or resend) envelope
 *   GET    /admin/leads/{id}/docusign/status  → current envelope status
 */
class DocuSignController extends Controller
{
    public function __construct(private DocuSignService $docuSign) {}

    // ── Send / resend envelope ────────────────────────────────────────────────

    public function send(Request $request, int $leadId): JsonResponse
    {
        $lead = Lead::findOrFail($leadId);

        // Check for an existing pending envelope — if found, resend it
        $existing = DocSignStatus::where('lead_id', $leadId)
            ->latest()
            ->first();

        try {
            if ($existing && $existing->isPending()) {
                // Resend the existing envelope
                $this->docuSign->resendEnvelope($existing->envelope_id);
                $existing->touch(); // bump updated_at so UI can show "last sent"

                return response()->json([
                    'message'     => 'Envelope resent successfully.',
                    'envelope_id' => $existing->envelope_id,
                    'status'      => $existing->status,
                    'sent_at'     => $existing->sent_at,
                ]);
            }

            // Send a new envelope
            $result  = $this->docuSign->sendEnvelope($lead);
            $envelope = DocSignStatus::create([
                'lead_id'     => $lead->id,
                'envelope_id' => $result['envelope_id'],
                'status'      => $result['status'] ?? 'sent',
                'sent_at'     => now(),
            ]);

            // Log to lead_actions
            LeadAction::create([
                'lead_id' => $lead->id,
                'user_id' => $request->user()->id,
                'message' => "DocuSign envelope sent: {$envelope->envelope_id}",
            ]);

            return response()->json([
                'message'     => 'Envelope sent for signature.',
                'envelope_id' => $envelope->envelope_id,
                'status'      => $envelope->status,
                'sent_at'     => $envelope->sent_at,
            ], 201);

        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to send envelope: ' . $e->getMessage(),
            ], 502);
        }
    }

    // ── Current status ────────────────────────────────────────────────────────

    public function status(int $leadId): JsonResponse
    {
        $envelope = DocSignStatus::where('lead_id', $leadId)
            ->latest()
            ->first();

        if (! $envelope) {
            return response()->json(['status' => null]);
        }

        return response()->json([
            'envelope_id' => $envelope->envelope_id,
            'status'      => $envelope->status,
            'sent_at'     => $envelope->sent_at,
            'signed_at'   => $envelope->signed_at,
        ]);
    }
}
