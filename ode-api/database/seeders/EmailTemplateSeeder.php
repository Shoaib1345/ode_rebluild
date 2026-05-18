<?php

namespace Database\Seeders;

use App\Models\EmailTemplate;
use Illuminate\Database\Seeder;

/**
 * Seeds all system email templates.
 *
 * Templates use {variableName} placeholders rendered by EmailService::render().
 * Run: php artisan db:seed --class=EmailTemplateSeeder
 *
 * Keys (per FULL-SPEC-V2.md §18.4 plus the quote_saved template):
 *   quote_submitted     — sent when wizard completes + payment received
 *   quote_saved         — sent when customer saves quote (auto-save on email blur)
 *   payment_receipt     — payment confirmation with policy details
 *   follow_up_reminder  — staff reminder for untouched leads
 *   post_event          — day after event congratulations
 *   7day_saved          — nudge 7 days before a saved lead expires
 *   7day_invoice        — 7 days before MQ lead with pending invoice
 *   invoice_sent        — manual invoice email from admin
 *   docusign_reminder   — reminder to sign documents
 */
class EmailTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $templates = [

            // ── Quote saved ─────────────────────────────────────────────────────
            [
                'key'       => 'quote_saved',
                'subject'   => 'Your One Day Event quote has been saved',
                'body'      => <<<'HTML'
<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#333;">
  <div style="background:#105778;padding:24px 32px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:22px;letter-spacing:-0.5px;">One Day Event</h1>
    <p style="color:#a8d4ea;margin:6px 0 0;font-size:13px;">Special Event Insurance</p>
  </div>
  <div style="padding:32px;">
    <p style="font-size:16px;">Hi {firstName},</p>
    <p>Great news — your quote has been saved! You can pick up right where you left off whenever you're ready.</p>
    <div style="background:#f0f7fc;border-left:4px solid #105778;padding:16px 20px;margin:24px 0;border-radius:4px;">
      <p style="margin:0;font-size:14px;color:#105778;font-weight:bold;">Your quote is waiting for you</p>
      <p style="margin:8px 0 0;font-size:13px;color:#555;">Click the button below to resume where you left off. Your selections and pricing have been preserved.</p>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="{resumeLink}" style="background:#105778;color:#fff;padding:12px 32px;text-decoration:none;border-radius:4px;font-size:15px;font-weight:bold;display:inline-block;">
        Resume My Quote →
      </a>
    </div>
    <p style="font-size:13px;color:#777;">If the button doesn't work, paste this link into your browser:<br>
      <a href="{resumeLink}" style="color:#105778;">{resumeLink}</a>
    </p>
    <p style="font-size:13px;color:#999;">This link will take you directly to your saved quote. No sign-in required.</p>
  </div>
  <div style="background:#f5f5f5;padding:16px 32px;text-align:center;font-size:11px;color:#999;border-top:1px solid #e8e8e8;">
    <p>One Day Event · Special Event Insurance · <a href="https://onedayevent.com" style="color:#105778;">onedayevent.com</a></p>
    <p>If you didn't request this, you can safely ignore this email.</p>
  </div>
</div>
HTML,
                'variables' => ['firstName', 'resumeLink'],
                'is_active' => true,
            ],

            // ── Quote submitted / policy purchased ──────────────────────────────
            [
                'key'       => 'quote_submitted',
                'subject'   => 'Your event insurance policy is confirmed — Policy #{policyNumber}',
                'body'      => <<<'HTML'
<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#333;">
  <div style="background:#105778;padding:24px 32px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:22px;">One Day Event</h1>
    <p style="color:#a8d4ea;margin:6px 0 0;font-size:13px;">Special Event Insurance</p>
  </div>
  <div style="padding:32px;">
    <div style="background:#e6f4ea;border:1px solid #a8d5ae;border-radius:4px;padding:16px 20px;margin-bottom:24px;text-align:center;">
      <p style="margin:0;font-size:18px;color:#2d7a4f;font-weight:bold;">✓ You're covered!</p>
      <p style="margin:8px 0 0;font-size:13px;color:#555;">Your event insurance policy has been issued successfully.</p>
    </div>
    <p>Hi {firstName},</p>
    <p>Thank you for choosing One Day Event. Your policy is now active and attached to this email.</p>
    <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:13px;">
      <tr style="background:#f0f7fc;">
        <td style="padding:8px 12px;color:#666;width:40%;">Policy Number</td>
        <td style="padding:8px 12px;font-weight:bold;">{policyNumber}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;color:#666;">Event Date</td>
        <td style="padding:8px 12px;">{eventDate}</td>
      </tr>
      <tr style="background:#f0f7fc;">
        <td style="padding:8px 12px;color:#666;">Event Type</td>
        <td style="padding:8px 12px;">{eventType}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;color:#666;">Coverage Limit</td>
        <td style="padding:8px 12px;">{coverageLimit}</td>
      </tr>
      <tr style="background:#f0f7fc;">
        <td style="padding:8px 12px;color:#666;">Total Paid</td>
        <td style="padding:8px 12px;font-weight:bold;color:#2d7a4f;">{totalPaid}</td>
      </tr>
    </table>
    <p style="font-size:13px;color:#555;">Your Certificate of Insurance (COI) and policy documents will be emailed to you separately within 24 hours, or you can download them from your customer portal.</p>
    <p>Have questions? Reply to this email or visit <a href="https://onedayevent.com" style="color:#105778;">onedayevent.com</a>.</p>
  </div>
  <div style="background:#f5f5f5;padding:16px 32px;text-align:center;font-size:11px;color:#999;border-top:1px solid #e8e8e8;">
    <p>One Day Event · Special Event Insurance · onedayevent.com</p>
  </div>
</div>
HTML,
                'variables' => ['firstName', 'policyNumber', 'eventDate', 'eventType', 'coverageLimit', 'totalPaid'],
                'is_active' => true,
            ],

            // ── Payment receipt ─────────────────────────────────────────────────
            [
                'key'       => 'payment_receipt',
                'subject'   => 'Payment receipt — One Day Event #{policyNumber}',
                'body'      => <<<'HTML'
<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#333;">
  <div style="background:#105778;padding:24px 32px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:22px;">One Day Event</h1>
    <p style="color:#a8d4ea;margin:6px 0 0;font-size:13px;">Payment Receipt</p>
  </div>
  <div style="padding:32px;">
    <p>Hi {firstName},</p>
    <p>This email confirms your payment of <strong>{totalPaid}</strong> for event insurance policy <strong>{policyNumber}</strong>.</p>
    <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:13px;">
      <tr style="background:#f0f7fc;">
        <td style="padding:8px 12px;color:#666;width:40%;">Transaction ID</td>
        <td style="padding:8px 12px;font-family:monospace;">{transactionId}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;color:#666;">Payment Date</td>
        <td style="padding:8px 12px;">{paymentDate}</td>
      </tr>
      <tr style="background:#f0f7fc;">
        <td style="padding:8px 12px;color:#666;">Amount</td>
        <td style="padding:8px 12px;font-weight:bold;color:#2d7a4f;">{totalPaid}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;color:#666;">Status</td>
        <td style="padding:8px 12px;color:#2d7a4f;font-weight:bold;">Paid in Full</td>
      </tr>
    </table>
    <p style="font-size:13px;color:#555;">Please keep this email for your records.</p>
  </div>
  <div style="background:#f5f5f5;padding:16px 32px;text-align:center;font-size:11px;color:#999;border-top:1px solid #e8e8e8;">
    <p>One Day Event · Special Event Insurance · onedayevent.com</p>
  </div>
</div>
HTML,
                'variables' => ['firstName', 'policyNumber', 'transactionId', 'paymentDate', 'totalPaid'],
                'is_active' => true,
            ],

            // ── Follow-up reminder (for staff) ──────────────────────────────────
            [
                'key'       => 'follow_up_reminder',
                'subject'   => 'Follow-up reminder: {leadName} — {eventDate}',
                'body'      => <<<'HTML'
<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#333;">
  <div style="background:#105778;padding:20px 32px;">
    <h2 style="color:#fff;margin:0;font-size:18px;">One Day Event — Follow-Up Reminder</h2>
  </div>
  <div style="padding:28px;">
    <p>Hi {agentName},</p>
    <p>This is a reminder to follow up with the lead below.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:13px;">
      <tr style="background:#fff3cd;">
        <td style="padding:8px 12px;color:#856404;width:40%;font-weight:bold;">Lead</td>
        <td style="padding:8px 12px;font-weight:bold;">{leadName}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;color:#666;">Email</td>
        <td style="padding:8px 12px;">{leadEmail}</td>
      </tr>
      <tr style="background:#f0f7fc;">
        <td style="padding:8px 12px;color:#666;">Event Date</td>
        <td style="padding:8px 12px;">{eventDate}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;color:#666;">Note</td>
        <td style="padding:8px 12px;">{followUpNote}</td>
      </tr>
    </table>
    <p><a href="{leadLink}" style="background:#105778;color:#fff;padding:10px 24px;text-decoration:none;border-radius:4px;font-size:13px;display:inline-block;">Open Lead in CRM →</a></p>
  </div>
</div>
HTML,
                'variables' => ['agentName', 'leadName', 'leadEmail', 'eventDate', 'followUpNote', 'leadLink'],
                'is_active' => true,
            ],

            // ── Post-event ──────────────────────────────────────────────────────
            [
                'key'       => 'post_event',
                'subject'   => 'Thank you — How was your event?',
                'body'      => <<<'HTML'
<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#333;">
  <div style="background:#105778;padding:24px 32px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:22px;">One Day Event</h1>
    <p style="color:#a8d4ea;margin:6px 0 0;font-size:13px;">Special Event Insurance</p>
  </div>
  <div style="padding:32px;text-align:center;">
    <h2 style="color:#105778;">We hope your event was a success! 🎉</h2>
    <p>Hi {firstName},</p>
    <p style="font-size:15px;">Your event on <strong>{eventDate}</strong> has passed. We hope everything went smoothly!</p>
    <p style="color:#555;font-size:13px;">If you need to file a claim or have any questions about your coverage, our team is here to help.</p>
    <div style="margin:24px 0;">
      <a href="https://onedayevent.com/contact" style="background:#105778;color:#fff;padding:12px 28px;text-decoration:none;border-radius:4px;font-size:14px;display:inline-block;">Contact Us</a>
    </div>
    <p style="font-size:13px;color:#777;">Planning another event soon? Use your customer portal to get a new quote in minutes.</p>
  </div>
  <div style="background:#f5f5f5;padding:16px 32px;text-align:center;font-size:11px;color:#999;border-top:1px solid #e8e8e8;">
    <p>One Day Event · Special Event Insurance · onedayevent.com</p>
  </div>
</div>
HTML,
                'variables' => ['firstName', 'eventDate'],
                'is_active' => true,
            ],

            // ── 7-day saved nudge ───────────────────────────────────────────────
            [
                'key'       => '7day_saved',
                'subject'   => 'Your quote is still waiting — complete your coverage today',
                'body'      => <<<'HTML'
<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#333;">
  <div style="background:#105778;padding:24px 32px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:22px;">One Day Event</h1>
  </div>
  <div style="padding:32px;">
    <p>Hi {firstName},</p>
    <p>You saved a quote with us — and your event is coming up on <strong>{eventDate}</strong>. Don't leave your event unprotected!</p>
    <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:4px;padding:16px 20px;margin:20px 0;">
      <p style="margin:0;font-size:14px;color:#856404;font-weight:bold;">⏰ Your quote is still valid</p>
      <p style="margin:8px 0 0;font-size:13px;color:#555;">Complete your purchase in just a few minutes — your event details and pricing are preserved.</p>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="{resumeLink}" style="background:#105778;color:#fff;padding:12px 32px;text-decoration:none;border-radius:4px;font-size:15px;font-weight:bold;display:inline-block;">
        Complete My Coverage →
      </a>
    </div>
    <p style="font-size:13px;color:#777;">Link: <a href="{resumeLink}" style="color:#105778;">{resumeLink}</a></p>
  </div>
  <div style="background:#f5f5f5;padding:16px 32px;text-align:center;font-size:11px;color:#999;border-top:1px solid #e8e8e8;">
    <p>One Day Event · Special Event Insurance · onedayevent.com</p>
  </div>
</div>
HTML,
                'variables' => ['firstName', 'eventDate', 'resumeLink'],
                'is_active' => true,
            ],

            // ── 7-day invoice nudge ─────────────────────────────────────────────
            [
                'key'       => '7day_invoice',
                'subject'   => 'Invoice reminder — your event is one week away',
                'body'      => <<<'HTML'
<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#333;">
  <div style="background:#105778;padding:24px 32px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:22px;">One Day Event</h1>
  </div>
  <div style="padding:32px;">
    <p>Hi {firstName},</p>
    <p>Your event is just <strong>7 days away</strong> on {eventDate}, and we noticed your invoice is still outstanding.</p>
    <p>To ensure your coverage is active, please complete payment as soon as possible.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="{invoiceLink}" style="background:#e74c3c;color:#fff;padding:12px 32px;text-decoration:none;border-radius:4px;font-size:15px;font-weight:bold;display:inline-block;">
        Pay Invoice Now →
      </a>
    </div>
    <p style="font-size:13px;color:#777;">Invoice link: <a href="{invoiceLink}" style="color:#105778;">{invoiceLink}</a></p>
    <p style="font-size:13px;color:#999;">Questions? Reply to this email and our team will help you right away.</p>
  </div>
  <div style="background:#f5f5f5;padding:16px 32px;text-align:center;font-size:11px;color:#999;border-top:1px solid #e8e8e8;">
    <p>One Day Event · Special Event Insurance · onedayevent.com</p>
  </div>
</div>
HTML,
                'variables' => ['firstName', 'eventDate', 'invoiceLink'],
                'is_active' => true,
            ],

            // ── Invoice sent ────────────────────────────────────────────────────
            [
                'key'       => 'invoice_sent',
                'subject'   => 'Invoice from One Day Event — {invoiceNumber}',
                'body'      => <<<'HTML'
<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#333;">
  <div style="background:#105778;padding:24px 32px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:22px;">One Day Event</h1>
    <p style="color:#a8d4ea;margin:6px 0 0;font-size:13px;">Invoice</p>
  </div>
  <div style="padding:32px;">
    <p>Hi {firstName},</p>
    <p>Please find your invoice attached. You can pay securely online using the link below.</p>
    <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:13px;">
      <tr style="background:#f0f7fc;">
        <td style="padding:8px 12px;color:#666;width:40%;">Invoice #</td>
        <td style="padding:8px 12px;font-weight:bold;">{invoiceNumber}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;color:#666;">Amount Due</td>
        <td style="padding:8px 12px;font-weight:bold;font-size:16px;color:#105778;">{amountDue}</td>
      </tr>
      <tr style="background:#f0f7fc;">
        <td style="padding:8px 12px;color:#666;">Due Date</td>
        <td style="padding:8px 12px;">{dueDate}</td>
      </tr>
    </table>
    <div style="text-align:center;margin:28px 0;">
      <a href="{paymentLink}" style="background:#105778;color:#fff;padding:12px 32px;text-decoration:none;border-radius:4px;font-size:15px;font-weight:bold;display:inline-block;">
        Pay Now →
      </a>
    </div>
    <p style="font-size:13px;color:#777;">Payment link: <a href="{paymentLink}" style="color:#105778;">{paymentLink}</a></p>
  </div>
  <div style="background:#f5f5f5;padding:16px 32px;text-align:center;font-size:11px;color:#999;border-top:1px solid #e8e8e8;">
    <p>One Day Event · Special Event Insurance · onedayevent.com</p>
  </div>
</div>
HTML,
                'variables' => ['firstName', 'invoiceNumber', 'amountDue', 'dueDate', 'paymentLink'],
                'is_active' => true,
            ],

            // ── DocuSign reminder ───────────────────────────────────────────────
            [
                'key'       => 'docusign_reminder',
                'subject'   => 'Action required: Please sign your insurance documents',
                'body'      => <<<'HTML'
<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;color:#333;">
  <div style="background:#105778;padding:24px 32px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:22px;">One Day Event</h1>
  </div>
  <div style="padding:32px;">
    <p>Hi {firstName},</p>
    <p>We noticed that your event insurance policy documents for <strong>{eventDate}</strong> are still waiting for your signature.</p>
    <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:4px;padding:16px 20px;margin:20px 0;">
      <p style="margin:0;font-size:14px;color:#856404;font-weight:bold;">⚠️ Signature required to activate coverage</p>
      <p style="margin:8px 0 0;font-size:13px;color:#555;">Your coverage will not be fully active until documents are signed. Please complete this step as soon as possible.</p>
    </div>
    <p style="font-size:13px;color:#555;">Check your email from DocuSign for the signature link, or contact us if you need it resent.</p>
    <p style="font-size:13px;color:#555;">Questions? Reply to this email and we'll assist you right away.</p>
  </div>
  <div style="background:#f5f5f5;padding:16px 32px;text-align:center;font-size:11px;color:#999;border-top:1px solid #e8e8e8;">
    <p>One Day Event · Special Event Insurance · onedayevent.com</p>
  </div>
</div>
HTML,
                'variables' => ['firstName', 'eventDate'],
                'is_active' => true,
            ],

        ];

        foreach ($templates as $data) {
            EmailTemplate::updateOrCreate(
                ['key' => $data['key']],
                $data
            );
        }

        $this->command->info('Email templates seeded: ' . count($templates) . ' templates.');
    }
}
