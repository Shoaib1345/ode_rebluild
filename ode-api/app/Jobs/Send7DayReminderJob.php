<?php

namespace App\Jobs;

use App\Models\Lead;
use App\Services\EmailService;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Sends 7-day reminder emails to leads whose event date is exactly 7 days away.
 *
 * Schedule: daily at 09:00 UTC (FULL-SPEC-V2.md §18.2).
 *
 * Two paths:
 *   - submission_status='saved'  → "7day_saved"   template (resume quote link)
 *   - submission_status='mq'     → "7day_invoice"  template (pay invoice link)
 *     (only if the lead has a pending unpaid invoice)
 *
 * Template variables:
 *   7day_saved:    {firstName}, {quoteResumeLink}
 *   7day_invoice:  {firstName}, {invoiceLink}
 */
class Send7DayReminderJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;

    public function handle(EmailService $emailService): void
    {
        $targetDate  = Carbon::today()->addDays(7)->toDateString();
        $frontendUrl = rtrim(config('app.frontend_url', config('app.url')), '/');

        // ── Saved leads ────────────────────────────────────────────────────────
        Lead::where('event_date', $targetDate)
            ->where('submission_status', 'saved')
            ->where('is_email_blocked', false)
            ->where('seven_day_reminder_sent', false)
            ->each(function (Lead $lead) use ($emailService, $frontendUrl) {
                $sent = $emailService->sendToLead($lead, '7day_saved', [
                    'firstName'       => $lead->first_name ?? '',
                    'quoteResumeLink' => $frontendUrl . '/quote/resume/' . ($lead->pending_ode_quote_link_id ?? ''),
                ]);

                if ($sent) {
                    $lead->update(['seven_day_reminder_sent' => true]);
                }
            });

        // ── Manual-quote (MQ) leads with a pending invoice ────────────────────
        Lead::where('event_date', $targetDate)
            ->where('submission_status', 'mq')
            ->where('is_email_blocked', false)
            ->where('seven_day_reminder_sent', false)
            ->whereHas('invoices', fn ($q) => $q->where('invoice_status', 0))
            ->each(function (Lead $lead) use ($emailService, $frontendUrl) {
                $invoice = $lead->invoices()->where('invoice_status', 0)->first();

                $sent = $emailService->sendToLead($lead, '7day_invoice', [
                    'firstName'   => $lead->first_name ?? '',
                    'invoiceLink' => $frontendUrl . '/invoice/' . ($invoice?->encode_id ?? ''),
                ]);

                if ($sent) {
                    $lead->update(['seven_day_reminder_sent' => true]);
                }
            });
    }
}
