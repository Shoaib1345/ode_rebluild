# Chunk 25 — Email Queue + Jobs

## Status: ✅ Complete

## Infrastructure
- Queue driver: `database` (already set in `.env`)
- Jobs table: already migrated via `0001_01_01_000002_create_jobs_table.php` (includes `jobs`, `job_batches`, `failed_jobs`)
- `config/app.php`: added `'frontend_url' => env('FRONTEND_URL', 'http://localhost:5173')` for use in email links

## Jobs (`app/Jobs/`)

All jobs implement `ShouldQueue` with `tries = 3`, `backoff = 60s`.

| Job | Trigger | Recipient |
|-----|---------|-----------|
| `SendLeadConfirmationEmail` | Lead created + payment succeeded | Customer (`lead->email`) |
| `SendInvoiceEmail` | Invoice created by admin | Invoice recipient + CC/BCC if set |
| `SendAffiliateWelcomeEmail` | Affiliate signup | New affiliate (`user->email`) |
| `SendPartnerWelcomeEmail` | Partner/agent signup | New partner (`user->email`) |

## Mailables (`app/Mail/`)

| Mailable | Subject |
|----------|---------|
| `LeadConfirmationMail` | "Your Event Insurance Policy Confirmation – One Day Event" |
| `InvoiceMail` | Uses `invoice->email_subject` or fallback "Your Invoice – One Day Event"; builds `$paymentUrl` from `FRONTEND_URL/invoice/{encode_id}` |
| `AffiliateWelcomeMail` | "Welcome to the One Day Event Affiliate Program!"; builds `$referralLink` from `FRONTEND_URL/onedayevent?ref={referral_string}` |
| `PartnerWelcomeMail` | "Welcome to One Day Event – Agent/Partner Account Activated"; receives `$type` param |

## Blade Templates (`resources/views/emails/`)

All templates: table-based HTML, inline styles, responsive up to 600px, blue-800 header matching site brand.

- `lead_confirmation.blade.php` — policy reference number, event details table, 3-step "what happens next"
- `invoice.blade.php` — policy info table, amount due, "Pay Invoice Now" CTA button + plain-text URL fallback
- `affiliate_welcome.blade.php` — referral code display, referral link, 3-step how-it-works
- `partner_welcome.blade.php` — account type (agent vs planner conditional), account info table, 3-step next steps

## Dispatch Points

| File | Where |
|------|-------|
| `app/Services/LeadCreationService.php` | After `Lead::create()` in `createAndCharge()` |
| `app/Http/Controllers/Admin/InvoiceController.php` | After `$invoice->load(...)` in `store()` |
| `app/Http/Controllers/AffiliateController.php` | After `$user->load('role')` in `register()` |
| `app/Http/Controllers/PartnerSignupController.php` | After `$user->load('role')` in `register()` |

## Running the worker
```bash
php artisan queue:work --queue=default --tries=3
```

## Dev/test note
`MAIL_MAILER=log` is set in `.env` — emails are written to `storage/logs/laravel.log` during development. Switch to `smtp` / `ses` / `mailgun` for production.
