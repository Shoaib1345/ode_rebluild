<?php

namespace App\Http\Controllers;

use App\Models\ContactSubmission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

/**
 * Public contact form (§19.6).
 *
 * POST /api/contact → stores submission + sends notification email.
 */
class ContactController extends Controller
{
    public function submit(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'    => 'required|string|max:191',
            'email'   => 'required|email|max:191',
            'phone'   => 'nullable|string|max:30',
            'subject' => 'nullable|string|max:191',
            'message' => 'required|string|max:5000',
        ]);

        $submission = ContactSubmission::create($data);

        // Send notification to support (best-effort — never block the response)
        $supportEmail = config('mail.support_address', config('mail.from.address'));
        if ($supportEmail) {
            try {
                Mail::raw(
                    "New contact form submission:\n\nFrom: {$submission->name} <{$submission->email}>\nPhone: {$submission->phone}\nSubject: {$submission->subject}\n\nMessage:\n{$submission->message}",
                    function ($msg) use ($submission, $supportEmail) {
                        $msg->to($supportEmail)
                            ->subject("Contact Form: " . ($submission->subject ?: 'General Inquiry'))
                            ->replyTo($submission->email, $submission->name);
                    }
                );
            } catch (\Throwable) {
                // Swallow — store succeeded, notification is secondary
            }
        }

        return response()->json(['message' => 'Thank you! We\'ll be in touch soon.'], 201);
    }
}
