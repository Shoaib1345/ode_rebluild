<?php

namespace App\Mail;

use App\Models\Lead;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

/**
 * Certificate of Insurance email — sent automatically after payment success.
 *
 * Attaches the filled COI PDF and renders the HTML template.
 */
class CertificateMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * @param  Lead   $lead         The lead the COI belongs to.
     * @param  string $storagePath  Relative path in local storage, e.g. "cois/filled_claims/42-coi.pdf".
     */
    public function __construct(
        public readonly Lead   $lead,
        public readonly string $storagePath,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your Certificate of Insurance – One Day Event',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.certificate',
            with: [
                'firstName' => $this->lead->first_name ?? $this->lead->ins_first_name ?? 'Valued Customer',
                'eventType' => $this->lead->event_type_label ?? 'your event',
                'eventDate' => $this->lead->event_date
                    ? Carbon::parse($this->lead->event_date)->format('F j, Y')
                    : null,
                'eventName' => $this->lead->event_name,
            ],
        );
    }

    /** @return Attachment[] */
    public function attachments(): array
    {
        $absolutePath = Storage::disk('local')->path($this->storagePath);

        if (! file_exists($absolutePath)) {
            return [];
        }

        return [
            Attachment::fromPath($absolutePath)
                ->as("Certificate_of_Insurance_ODE00{$this->lead->id}.pdf")
                ->withMime('application/pdf'),
        ];
    }
}
