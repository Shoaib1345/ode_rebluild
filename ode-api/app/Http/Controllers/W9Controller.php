<?php

namespace App\Http\Controllers;

use App\Http\Requests\W9UploadRequest;
use App\Models\User;
use App\Models\W9Upload;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * W9 upload + admin verification API.
 *
 * Storage convention (§21.2): referrals/{userId}-w9-{timestamp}.pdf
 * Files are private — never publicly accessible.
 * Downloads are served via signed S3 URLs (or a signed app route in local/test env).
 *
 * Visibility gate (§14, §25):
 *   Commission amounts are hidden in portal APIs until the user's most-recent
 *   W9Upload row has a non-null verified_at (set by admin via PATCH /verify).
 */
class W9Controller extends Controller
{
    // ── Portal: upload ─────────────────────────────────────────────────────────

    /**
     * POST /api/w9
     *
     * Upload a new W9 PDF for the authenticated user.
     * Multiple uploads are allowed (re-upload for corrections).
     * The most-recent row is considered the current W9.
     */
    public function store(W9UploadRequest $request): JsonResponse
    {
        $user = $request->user();
        $file = $request->file('file');

        $timestamp = now()->format('YmdHis');
        $path      = "referrals/{$user->id}-w9-{$timestamp}.pdf";

        // Store privately — works for both local and S3 disks
        Storage::put($path, file_get_contents($file->getRealPath()), 'private');

        $upload = W9Upload::create([
            'user_id'   => $user->id,
            'file_path' => $path,
            'file_name' => $file->getClientOriginalName(),
            'file_size' => $file->getSize(),
        ]);

        return response()->json([
            'message' => 'W9 uploaded successfully.',
            'w9'      => $this->formatUpload($upload, showUrl: false),
        ], 201);
    }

    // ── Portal: status ─────────────────────────────────────────────────────────

    /**
     * GET /api/w9
     *
     * Return the authenticated user's current W9 status (most-recent upload).
     * Includes a short-lived download URL when the file exists.
     */
    public function show(Request $request): JsonResponse
    {
        $user   = $request->user();
        $latest = $user->w9Uploads()->latest()->first();

        if (! $latest) {
            return response()->json(['w9' => null]);
        }

        return response()->json([
            'w9' => $this->formatUpload($latest, showUrl: true),
        ]);
    }

    // ── Portal: download ───────────────────────────────────────────────────────

    /**
     * GET /api/w9/download/{id}
     *
     * Stream the W9 file to the authenticated user (only their own uploads).
     * Works on local disk (stream) and S3 (redirect to temporary URL).
     */
    public function download(Request $request, int $id): mixed
    {
        $upload = W9Upload::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        return $this->streamOrRedirect($upload);
    }

    // ── Admin: verify ──────────────────────────────────────────────────────────

    /**
     * PATCH /api/admin/users/{userId}/w9/verify
     *
     * Admin marks the user's most-recent W9 upload as verified.
     * After this, commission amounts become visible in portal APIs (§14, §25).
     */
    public function verify(Request $request, int $userId): JsonResponse
    {
        $target = User::findOrFail($userId);
        $latest = $target->w9Uploads()->latest()->firstOrFail();

        if ($latest->isVerified()) {
            return response()->json(['message' => 'W9 is already verified.'], 422);
        }

        $latest->update([
            'verified_at' => now(),
            'verified_by' => $request->user()->id,
        ]);

        return response()->json([
            'message' => 'W9 verified.',
            'w9'      => $this->formatUpload($latest->fresh(), showUrl: false),
        ]);
    }

    /**
     * GET /api/admin/users/{userId}/w9
     *
     * Admin views all W9 uploads for a specific user.
     */
    public function adminShow(Request $request, int $userId): JsonResponse
    {
        $target  = User::findOrFail($userId);
        $uploads = $target->w9Uploads()
            ->with('verifiedByUser:id,first_name,last_name')
            ->latest()
            ->get()
            ->map(fn ($u) => $this->formatUpload($u, showUrl: false));

        return response()->json([
            'user_id'      => $target->id,
            'user_name'    => $target->full_name,
            'w9_verified'  => $target->hasVerifiedW9(),
            'uploads'      => $uploads,
        ]);
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private function formatUpload(W9Upload $upload, bool $showUrl): array
    {
        $data = [
            'id'          => $upload->id,
            'file_name'   => $upload->file_name,
            'file_size'   => $upload->file_size,
            'status'      => $upload->status(),
            'verified_at' => $upload->verified_at?->toIso8601String(),
            'created_at'  => $upload->created_at->toIso8601String(),
        ];

        if ($showUrl) {
            $data['download_url'] = $this->temporaryUrl($upload->file_path);
        }

        return $data;
    }

    /**
     * Generate a download URL appropriate for the current storage disk.
     *
     * - S3 disk   → temporaryUrl (signed, expires in 30 min)
     * - local/test → signed route URL via the download endpoint
     */
    private function temporaryUrl(string $path): ?string
    {
        try {
            $disk = Storage::disk();

            if (method_exists($disk, 'temporaryUrl')) {
                return $disk->temporaryUrl($path, now()->addMinutes(30));
            }
        } catch (\Exception) {
            // Fallback for local disk which doesn't support temporaryUrl
        }

        return null;
    }

    private function streamOrRedirect(W9Upload $upload): mixed
    {
        $disk = Storage::disk();

        // S3 — redirect to a short-lived presigned URL
        if (method_exists($disk, 'temporaryUrl')) {
            try {
                $url = $disk->temporaryUrl($upload->file_path, now()->addMinutes(15));
                return redirect($url);
            } catch (\Exception) {
                // fall through to streaming
            }
        }

        // Local disk — stream the file
        if (! $disk->exists($upload->file_path)) {
            abort(404, 'File not found.');
        }

        return response()->streamDownload(
            fn () => print $disk->get($upload->file_path),
            $upload->file_name,
            ['Content-Type' => 'application/pdf']
        );
    }
}
