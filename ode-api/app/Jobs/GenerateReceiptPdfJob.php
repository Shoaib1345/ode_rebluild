<?php

namespace App\Jobs;

use App\Models\Lead;
use App\Services\PdfService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

/**
 * Generates and stores the payment receipt PDF for a lead (§22).
 *
 * Typically dispatched by GeneratePolicyPdfJob after policy PDF succeeds.
 */
class GenerateReceiptPdfJob implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly int $leadId) {}

    public function handle(PdfService $pdf): void
    {
        $lead = Lead::find($this->leadId);

        if (! $lead) {
            Log::warning("GenerateReceiptPdfJob: lead #{$this->leadId} not found.");
            return;
        }

        try {
            $path = $pdf->generateReceipt($lead);
            $lead->update(['receipt_pdf_path' => $path]);
            Log::info("Receipt PDF generated for lead #{$lead->id} → {$path}");
        } catch (\Throwable $e) {
            Log::error("GenerateReceiptPdfJob failed for lead #{$this->leadId}: " . $e->getMessage());
            throw $e;
        }
    }
}
