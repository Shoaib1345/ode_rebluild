<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Sent to a newly-created staff/affiliate/agent/planner user with the temporary
 * password an admin generated for them, so they can log in and change it.
 */
class NewUserCredentialsMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $loginUrl;
    public string $roleName;

    public function __construct(public User $user, public string $temporaryPassword)
    {
        $this->loginUrl = rtrim((string) config('app.frontend_url'), '/') . '/login';
        $this->roleName = $user->role?->role_name ?? 'User';
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your One Day Event account is ready',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.new_user_credentials',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
