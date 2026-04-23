<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AffiliateWelcomeMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $referralLink;

    public function __construct(public User $user)
    {
        $this->referralLink = rtrim(config('app.frontend_url'), '/') . '/onedayevent?ref=' . $user->referral_string;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Welcome to the One Day Event Affiliate Program!',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.affiliate_welcome',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
