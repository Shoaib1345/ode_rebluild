<?php

namespace App\Services;

use App\Mail\TemplatedMail;
use App\Models\EmailTemplate;
use App\Models\Lead;
use App\Models\LeadEmail;
use Illuminate\Support\Facades\Mail;

/**
 * Central email dispatch service (FULL-SPEC-V2.md §18.3).
 *
 * All automated outbound emails must route through this service so that:
 *   1. The is_email_blocked flag on the lead is always honoured.
 *   2. Every sent email is recorded in lead_emails for the CRM email tab.
 *   3. Template rendering (variable substitution) is centralised.
 */
class EmailService
{
    // ── Public API ─────────────────────────────────────────────────────────────

    /**
     * Send a DB-templated email to a lead's address.
     *
     * @param  Lead    $lead        The lead to email (is_email_blocked is checked).
     * @param  string  $templateKey Template key (e.g. 'post_event', '7day_saved').
     * @param  array   $vars        Replacement variables, e.g. ['firstName' => 'Jane'].
     * @return bool                 True if sent, false if blocked or template not found.
     */
    public function sendToLead(Lead $lead, string $templateKey, array $vars = []): bool
    {
        if ($lead->is_email_blocked) {
            return false;
        }

        $template = EmailTemplate::findActive($templateKey);

        if (! $template) {
            return false;
        }

        [$subject, $body] = $this->render($template, $vars);

        Mail::to($lead->email)->queue(new TemplatedMail($subject, $body));

        // Record in CRM email log
        LeadEmail::create([
            'lead_id'            => $lead->id,
            'email_from'         => config('mail.from.name', 'One Day Event'),
            'from_email_address' => config('mail.from.address', 'support@onedayevent.com'),
            'subject'            => $subject,
            'message'            => $body,
            'mail_to'            => $lead->email,
            'status'             => 0,
        ]);

        return true;
    }

    /**
     * Send a raw (non-lead) email, e.g. follow-up reminders to staff.
     * Does not record to lead_emails and does not check is_email_blocked.
     */
    public function sendRaw(string $toEmail, string $subject, string $body): void
    {
        Mail::to($toEmail)->queue(new TemplatedMail($subject, $body));
    }

    /**
     * Send a template email directly (synchronously) — for "Send Test" admin action.
     * Does NOT queue. Does NOT record.
     */
    public function sendTestToAdmin(EmailTemplate $template, string $adminEmail): void
    {
        $vars    = $this->buildSampleVars($template);
        [$subject, $body] = $this->render($template, $vars);
        Mail::to($adminEmail)->send(new TemplatedMail($subject, $body));
    }

    /**
     * Render a template's subject and body by replacing {variableName} placeholders.
     *
     * @return array{string, string}  [$renderedSubject, $renderedBody]
     */
    public function render(EmailTemplate $template, array $vars): array
    {
        $replace = fn (string $text) => preg_replace_callback(
            '/\{(\w+)\}/',
            fn ($m) => array_key_exists($m[1], $vars) ? $vars[$m[1]] : $m[0],
            $text
        );

        return [$replace($template->subject), $replace($template->body)];
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    /**
     * Build sample variable values from the template's `variables` metadata.
     * Used by sendTestToAdmin() so the preview is readable.
     */
    private function buildSampleVars(EmailTemplate $template): array
    {
        $vars = [];

        foreach ($template->variables ?? [] as $var) {
            $name = is_array($var) ? ($var['name'] ?? '') : $var;
            if ($name) {
                $vars[$name] = "[{$name}]"; // placeholder text
            }
        }

        return $vars;
    }
}
