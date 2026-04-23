<?php

namespace App\Mail;

use App\Models\Lead;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class LeadConfirmationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Lead $lead) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your Event Insurance Policy Confirmation – One Day Event',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.lead_confirmation',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
