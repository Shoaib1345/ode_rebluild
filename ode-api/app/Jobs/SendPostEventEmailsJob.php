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
 * Sends "post_event" emails to leads whose event date was yesterday.
 *
 * Schedule: daily at 09:00 UTC (FULL-SPEC-V2.md §18.2).
 * Query:    leads WHERE event_date = yesterday AND bound=1
 *                  AND is_email_blocked=0 AND post_event_email_sent=0
 *
 * Template variables: {firstName}, {eventType}
 */
class SendPostEventEmailsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;

    public function handle(EmailService $emailService): void
    {
        $yesterday = Carbon::yesterday()->toDateString();

        Lead::where('event_date', $yesterday)
            ->where('bound', true)
            ->where('is_email_blocked', false)
            ->where('post_event_email_sent', false)
            ->each(function (Lead $lead) use ($emailService) {
                $sent = $emailService->sendToLead($lead, 'post_event', [
                    'firstName' => $lead->first_name ?? '',
                    'eventType' => $lead->event_type_label ?? '',
                ]);

                if ($sent) {
                    $lead->update(['post_event_email_sent' => true]);
                }
            });
    }
}
