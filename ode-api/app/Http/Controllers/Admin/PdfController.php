<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\GenerateCoiPdfJob;
use App\Jobs\GeneratePolicyPdfJob;
use App\Models\Lead;
use App\Models\LeadAction;
use App\Services\CertificateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Admin PDF generation triggers (§22.3).
 *
 * POST /admin/leads/{id}/generate-pdf        → queues policy + receipt chain
 * POST /admin/leads/{id}/generate-pdf/coi    → queues COI only
 * GET  /admin/leads/{id}/pdf-status          → returns current PDF paths
 */
class PdfController extends Controller
{
    // ── Generate policy + receipt ─────────────────────────────────────────────

    public function generate(Request $request, int $leadId): JsonResponse
    {
        $lead = Lead::findOrFail($leadId);

        // Dispatch policy job — receipt is chained inside it
        GeneratePolicyPdfJob::dispatch($lead->id);

        LeadAction::log(
            $lead->id,
            LeadAction::PDF_GENERATED,
            'Policy & receipt PDF generation queued',
            $request->user()?->id
        );

        return response()->json([
            'message' => 'PDF generation queued. Policy and receipt will be ready shortly.',
        ]);
    }

    // ── Generate COI only ─────────────────────────────────────────────────────

    /**
     * POST /admin/leads/{id}/generate-pdf/coi
     *
     * Two modes:
     *   1. With `fields` body → wizard submission; generates synchronously and
     *      returns immediately with the stored file path.
     *   2. Without `fields`   → queues auto-generation job (e.g. from action bar).
     */
    public function generateCoi(Request $request, int $leadId): JsonResponse
    {
        $lead = Lead::findOrFail($leadId);

        if ($request->has('fields')) {
            $fields = $request->input('fields', []);

            try {
                /** @var CertificateService $svc */
                $svc  = app(CertificateService::class);
                $path = $svc->generateFromFields($lead, $fields);
                $svc->recordFile(
                    $lead,
                    $path,
                    $fields['coi_name']     ?? null,
                    $fields['coi_category'] ?? 'Certificate'
                );
                $lead->update(['coi_pdf_path' => $path]);

                // Log the action with structured type
                LeadAction::log(
                    $lead->id,
                    LeadAction::COI_GENERATED,
                    'Certificate of Insurance generated via wizard',
                    $request->user()?->id,
                    [
                        'filename'    => $fields['coi_name']     ?? null,
                        'category'   => $fields['coi_category'] ?? 'Certificate',
                        'insured'    => $fields['insured_name']  ?? null,
                    ]
                );

                return response()->json(['message' => 'COI generated successfully.', 'path' => $path]);
            } catch (\RuntimeException $e) {
                return response()->json(['message' => $e->getMessage()], 500);
            }
        }

        // Auto-generate via queued job
        GenerateCoiPdfJob::dispatch($lead->id);

        LeadAction::log(
            $lead->id,
            LeadAction::COI_GENERATED,
            'COI auto-generation queued',
            $request->user()?->id
        );

        return response()->json([
            'message' => 'COI generation queued.',
        ]);
    }

    // ── PDF status (which paths exist) ───────────────────────────────────────

    public function status(int $leadId): JsonResponse
    {
        $lead = Lead::findOrFail($leadId);

        return response()->json([
            'policy_pdf_path'  => $lead->policy_pdf_path,
            'receipt_pdf_path' => $lead->receipt_pdf_path,
            'coi_pdf_path'     => $lead->coi_pdf_path,
        ]);
    }
}
