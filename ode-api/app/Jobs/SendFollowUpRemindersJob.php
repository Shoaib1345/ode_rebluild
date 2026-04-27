<?php

namespace App\Jobs;

use App\Mail\TemplatedMail;
use App\Models\LeadFollowUp;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

/**
 * Sends follow-up reminder emails to assigned staff members.
 *
 * Schedule: hourly (FULL-SPEC-V2.md §18.2).
 * Query:    lead_follow_ups WHERE status=0 (pending)
 *                             AND reminder_sent_at IS NULL
 *                             AND follow_up_date <= today
 *
 * The email goes to the assigned staff/agent's email address, not the lead.
 * After sending, sets reminder_sent_at = now().
 * Does NOT change status — staff must manually mark the follow-up as completed.
 */
class SendFollowUpRemindersJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;

    public function handle(): void
    {
        LeadFollowUp::with(['lead', 'assignedTo'])
            ->where('status', 0)
            ->whereNull('reminder_sent_at')
            ->whereDate('follow_up_date', '<=', Carbon::today())
            ->each(function (LeadFollowUp $followUp) {
                if (! $followUp->assignedTo || ! $followUp->lead) {
                    return;
                }

                $leadName    = trim(($followUp->lead->first_name ?? '') . ' ' . ($followUp->lead->last_name ?? ''));
                $staffName   = $followUp->assignedTo->first_name ?? 'Team';
                $subject     = "Follow-up Reminder: {$leadName}";
                $body        = "<p>Hi {$staffName},</p>"
                    . "<p>This is a reminder to follow up with <strong>{$leadName}</strong>.</p>"
                    . "<p><strong>Notes:</strong> " . nl2br(htmlspecialchars($followUp->notes)) . "</p>"
                    . "<p>Lead ID: <strong>#{$followUp->lead->id}</strong></p>"
                    . "<p style='color:#94a3b8;font-size:12px;'>One Day Event CRM</p>";

                Mail::to($followUp->assignedTo->email)
                    ->queue(new TemplatedMail($subject, $body));

                $followUp->update(['reminder_sent_at' => now()]);
            });
    }
}
