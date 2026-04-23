<?php

namespace App\Mail;

use App\Models\Invoice;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InvoiceMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $paymentUrl;

    public function __construct(public Invoice $invoice)
    {
        $this->paymentUrl = rtrim(config('app.frontend_url'), '/') . '/invoice/' . $invoice->encode_id;
    }

    public function envelope(): Envelope
    {
        $subject = $this->invoice->email_subject ?: 'Your Invoice – One Day Event';

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.invoice',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
