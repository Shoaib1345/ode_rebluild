<?php

use App\Jobs\Send7DayReminderJob;
use App\Jobs\SendFollowUpRemindersJob;
use App\Jobs\SendPostEventEmailsJob;
use App\Jobs\SyncDocuSignStatusesJob;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

// ── Artisan helper ────────────────────────────────────────────────────────────

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// ── Automated email jobs (FULL-SPEC-V2.md §18.2) ─────────────────────────────

// Post-event "thank you" email — day after event_date for bound leads
Schedule::job(new SendPostEventEmailsJob)->dailyAt('09:00')->timezone('UTC')
    ->name('post-event-emails')
    ->withoutOverlapping();

// 7-day reminder — saved leads (resume quote) and MQ leads (pay invoice)
Schedule::job(new Send7DayReminderJob)->dailyAt('09:00')->timezone('UTC')
    ->name('7day-reminder')
    ->withoutOverlapping();

// Follow-up reminders to staff — fires hourly, skips already-sent follow-ups
Schedule::job(new SendFollowUpRemindersJob)->hourly()
    ->name('follow-up-reminders')
    ->withoutOverlapping();

// DocuSign status sync — nightly fallback for missed webhooks (§20.5)
Schedule::job(new SyncDocuSignStatusesJob)->dailyAt('02:00')->timezone('UTC')
    ->name('docusign-sync')
    ->withoutOverlapping();
