<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\GenerateCoiPdfJob;
use App\Jobs\GeneratePolicyPdfJob;
use App\Models\Lead;
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

    public function generate(int $leadId): JsonResponse
    {
        $lead = Lead::findOrFail($leadId);

        // Dispatch policy job — receipt is chained inside it
        GeneratePolicyPdfJob::dispatch($lead->id);

        return response()->json([
            'message' => 'PDF generation queued. Policy and receipt will be ready shortly.',
        ]);
    }

    // ── Generate COI only ─────────────────────────────────────────────────────

    public function generateCoi(int $leadId): JsonResponse
    {
        $lead = Lead::findOrFail($leadId);

        GenerateCoiPdfJob::dispatch($lead->id);

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
