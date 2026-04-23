<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PartnerWelcomeMail extends Mailable
{
    use Queueable, SerializesModels;

    /** 'agent' or 'planner' */
    public string $partnerType;

    public function __construct(public User $user, string $type)
    {
        $this->partnerType = $type;
    }

    public function envelope(): Envelope
    {
        $label = $this->partnerType === 'agent' ? 'Agent' : 'Partner';

        return new Envelope(
            subject: "Welcome to One Day Event – {$label} Account Activated",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.partner_welcome',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
