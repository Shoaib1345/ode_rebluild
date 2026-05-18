<?php

namespace App\Jobs;

use App\Mail\CertificateMail;
use App\Models\Lead;
use App\Services\CertificateService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Generates and delivers the Certificate of Insurance (COI) PDF.
 *
 * Triggered automatically by LeadCreationService after a successful payment,
 * and can also be triggered manually from the admin panel.
 *
 * Responsibilities:
 *   1. Fill the pre-signed COI PDF template with lead data (CertificateService).
 *   2. Save the file path to leads.coi_pdf_path.
 *   3. Save a record to lead_files (visible to the customer portal).
 *   4. Email the COI as an attachment to the customer.
 */
class GenerateCoiPdfJob implements ShouldQueue
{
    use Queueable;

    public int $tries   = 3;
    public int $backoff = 60;

    public function __construct(public readonly int $leadId) {}

    public function handle(CertificateService $certs): void
    {
        $lead = Lead::find($this->leadId);

        if (! $lead) {
            Log::warning("GenerateCoiPdfJob: lead #{$this->leadId} not found.");
            return;
        }

        try {
            // 1. Generate filled PDF
            $storagePath = $certs->generate($lead);

            // 2. Update the lead's coi_pdf_path column
            $lead->update(['coi_pdf_path' => $storagePath]);

            // 3. Record in lead_files (makes it available in customer portal)
            $certs->recordFile($lead, $storagePath);

            // 4. Email COI to the customer
            if ($lead->email) {
                Mail::to($lead->email)->send(new CertificateMail($lead, $storagePath));
            }

            Log::info("COI generated and sent for lead #{$lead->id}");

        } catch (\Throwable $e) {
            Log::error("GenerateCoiPdfJob failed for lead #{$this->leadId}: " . $e->getMessage());
            throw $e;
        }
    }
}
