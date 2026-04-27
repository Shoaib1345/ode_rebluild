<?php

namespace App\Jobs;

use App\Models\Lead;
use App\Services\PdfService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

/**
 * Generates and stores the Certificate of Insurance (COI) PDF (§22).
 *
 * Triggered manually by admin or automatically when a lead is bound.
 */
class GenerateCoiPdfJob implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly int $leadId) {}

    public function handle(PdfService $pdf): void
    {
        $lead = Lead::find($this->leadId);

        if (! $lead) {
            Log::warning("GenerateCoiPdfJob: lead #{$this->leadId} not found.");
            return;
        }

        try {
            $path = $pdf->generateCoi($lead);
            $lead->update(['coi_pdf_path' => $path]);
            Log::info("COI PDF generated for lead #{$lead->id} → {$path}");
        } catch (\Throwable $e) {
            Log::error("GenerateCoiPdfJob failed for lead #{$this->leadId}: " . $e->getMessage());
            throw $e;
        }
    }
}
