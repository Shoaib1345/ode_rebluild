<?php

namespace App\Jobs;

use App\Models\DocSignStatus;
use App\Services\DocuSignService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

/**
 * Nightly fallback: re-sync DocuSign envelope statuses (§20.5).
 *
 * Polls the DocuSign Envelopes API for every pending envelope
 * created in the last 30 days. Compensates for missed webhooks.
 *
 * Scheduled: daily (see routes/console.php).
 */
class SyncDocuSignStatusesJob implements ShouldQueue
{
    use Queueable;

    public function handle(DocuSignService $docuSign): void
    {
        $pending = DocSignStatus::whereIn('status', ['sent', 'delivered'])
            ->where('created_at', '>=', now()->subDays(30))
            ->get();

        if ($pending->isEmpty()) {
            return;
        }

        foreach ($pending as $record) {
            try {
                $status = $docuSign->getEnvelopeStatus($record->envelope_id);

                if ($status !== $record->status) {
                    $record->status = $status;

                    if ($status === 'completed') {
                        $record->signed_at = $record->signed_at ?? now();
                    }

                    $record->save();

                    Log::info("SyncDocuSign: envelope {$record->envelope_id} updated to {$status}");
                }
            } catch (\Throwable $e) {
                Log::error("SyncDocuSign: failed for envelope {$record->envelope_id}", [
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }
}
