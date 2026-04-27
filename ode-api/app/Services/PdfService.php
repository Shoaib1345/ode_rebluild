<?php

namespace App\Services;

use App\Models\Lead;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

/**
 * PDF generation service (§22).
 *
 * Uses DomPDF (barryvdh/laravel-dompdf — already installed) to render
 * Blade templates to PDF bytes, then stores them on the configured disk.
 *
 * All file paths are relative to the disk root.
 *
 * Storage layout (§21):
 *   policies/{leadId}.pdf
 *   receipts/{leadId}-receipt.pdf
 *   cois/filled_claims/{leadId}-coi.pdf
 */
class PdfService
{
    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Generate + store the policy PDF for a lead.
     *
     * @return string  The relative storage path.
     */
    public function generatePolicy(Lead $lead): string
    {
        $path = "policies/{$lead->id}.pdf";
        $this->renderAndStore('pdf.policy', ['lead' => $lead], $path);
        return $path;
    }

    /**
     * Generate + store the payment receipt PDF for a lead.
     *
     * @return string  The relative storage path.
     */
    public function generateReceipt(Lead $lead): string
    {
        $path = "receipts/{$lead->id}-receipt.pdf";
        $this->renderAndStore('pdf.receipt', ['lead' => $lead], $path);
        return $path;
    }

    /**
     * Generate + store the COI PDF for a lead.
     *
     * @return string  The relative storage path.
     */
    public function generateCoi(Lead $lead): string
    {
        $path = "cois/filled_claims/{$lead->id}-coi.pdf";
        $this->renderAndStore('pdf.coi', ['lead' => $lead], $path);
        return $path;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Render a Blade view to PDF bytes and store on the default disk.
     *
     * DomPDF options:
     *   - isRemoteEnabled: false (no external HTTP calls in PDFs)
     *   - defaultFont:     'arial'
     */
    private function renderAndStore(string $view, array $data, string $path): void
    {
        $pdf = Pdf::loadView($view, $data)
            ->setOptions([
                'isRemoteEnabled' => false,
                'defaultFont'     => 'sans-serif',
                'isHtml5ParserEnabled' => true,
            ]);

        Storage::disk($this->disk())->put($path, $pdf->output());
    }

    /** The storage disk to use — 's3' in production, 'local' in dev/test. */
    private function disk(): string
    {
        return config('filesystems.default', 'local');
    }
}
