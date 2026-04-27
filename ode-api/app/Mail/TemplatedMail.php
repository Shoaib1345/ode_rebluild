<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Generic Mailable for DB-stored email templates.
 *
 * The subject and HTML body have already been rendered by EmailService::render()
 * before this class is constructed. This class simply packages them for delivery.
 */
class TemplatedMail extends Mailable
{
    use Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 60;

    public function __construct(
        private readonly string $emailSubject,
        private readonly string $emailBody,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->emailSubject);
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.templated',
            with: ['body' => $this->emailBody],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
