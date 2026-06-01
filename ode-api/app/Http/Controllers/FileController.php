<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Secure file access for generated PDFs (§21.3).
 *
 * GET /api/files/{category}/{id}
 *
 * Categories:
 *   policies  → leads.policy_pdf_path
 *   receipts  → leads.receipt_pdf_path
 *   cois      → leads.coi_pdf_path
 *
 * On S3 (production): returns a redirect to a 7-day presigned URL.
 * On local disk (dev/test): streams the file directly.
 */
class FileController extends Controller
{
    /** Map URL category → lead column. */
    private const CATEGORY_MAP = [
        'policies' => 'policy_pdf_path',
        'receipts' => 'receipt_pdf_path',
        'cois'     => 'coi_pdf_path',
    ];

    /** Map URL category → download filename template. */
    private const FILENAME_MAP = [
        'policies' => 'policy-{id}.pdf',
        'receipts' => 'receipt-{id}.pdf',
        'cois'     => 'coi-{id}.pdf',
    ];

    public function download(string $category, int $id): Response|RedirectResponse|StreamedResponse|BinaryFileResponse|JsonResponse
    {
        if (! array_key_exists($category, self::CATEGORY_MAP)) {
            return response()->json(['message' => 'Invalid file category.'], 404);
        }

        $lead = Lead::find($id);

        if (! $lead) {
            return response()->json(['message' => 'Lead not found.'], 404);
        }

        $column = self::CATEGORY_MAP[$category];
        $path   = $lead->{$column};

        if (! $path) {
            return response()->json(['message' => 'This document has not been generated yet.'], 404);
        }

        $disk = config('filesystems.default', 'local');

        $filename = str_replace('{id}', $id, self::FILENAME_MAP[$category]);

        // S3 — redirect to presigned URL (7-day expiry)
        if ($disk === 's3') {
            if (! Storage::disk('s3')->exists($path)) {
                return response()->json(['message' => 'File not found in storage.'], 404);
            }
            $url = Storage::disk('s3')->temporaryUrl($path, now()->addDays(7));
            return redirect()->away($url);
        }

        // Local (or any non-s3) disk — stream via the Storage facade so it respects
        // the configured disk root and works with Storage::fake() in tests.
        if (! Storage::disk($disk)->exists($path)) {
            return response()->json(['message' => 'File not found in storage.'], 404);
        }

        return Storage::disk($disk)->download($path, $filename, [
            'Content-Type' => 'application/pdf',
        ]);
    }
}
