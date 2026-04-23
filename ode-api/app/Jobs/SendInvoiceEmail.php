<?php

namespace App\Jobs;

use App\Mail\InvoiceMail;
use App\Models\Invoice;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendInvoiceEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 60;

    public function __construct(public Invoice $invoice) {}

    public function handle(): void
    {
        $mailable = new InvoiceMail($this->invoice);

        $mailer = Mail::to($this->invoice->email);

        if ($this->invoice->email_cc) {
            $mailer->cc($this->invoice->email_cc);
        }

        if ($this->invoice->email_bcc) {
            $mailer->bcc($this->invoice->email_bcc);
        }

        $mailer->send($mailable);
    }
}
