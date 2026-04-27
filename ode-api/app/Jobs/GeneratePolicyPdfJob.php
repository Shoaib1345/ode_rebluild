<?php

namespace App\Jobs;

use App\Models\Lead;
use App\Services\PdfService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

/**
 * Generates and stores the policy PDF for a lead (§22.3).
 *
 * Flow:
 *   render policy.blade.php → PDF bytes → storage:policies/{leadId}.pdf
 *   → update leads.policy_pdf_path
 *   → dispatch GenerateReceiptPdfJob (receipt follows policy)
 */
class GeneratePolicyPdfJob implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly int $leadId) {}

    public function handle(PdfService $pdf): void
    {
        $lead = Lead::find($this->leadId);

        if (! $lead) {
            Log::warning("GeneratePolicyPdfJob: lead #{$this->leadId} not found.");
            return;
        }

        try {
            $path = $pdf->generatePolicy($lead);
            $lead->update(['policy_pdf_path' => $path]);

            // Chain receipt generation
            GenerateReceiptPdfJob::dispatch($this->leadId);

            Log::info("Policy PDF generated for lead #{$lead->id} → {$path}");
        } catch (\Throwable $e) {
            Log::error("GeneratePolicyPdfJob failed for lead #{$this->leadId}: " . $e->getMessage());
            throw $e; // let the queue retry
        }
    }
}
