<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EmailTemplate;
use App\Services\EmailService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Admin email template management (FULL-SPEC-V2.md §18.5).
 *
 * Routes (all under admin middleware):
 *   GET    /api/admin/email-templates
 *   POST   /api/admin/email-templates
 *   GET    /api/admin/email-templates/{id}
 *   PATCH  /api/admin/email-templates/{id}
 *   DELETE /api/admin/email-templates/{id}
 *   POST   /api/admin/email-templates/{id}/send-test
 */
class EmailTemplateController extends Controller
{
    public function __construct(private readonly EmailService $emailService) {}

    // ── Index ──────────────────────────────────────────────────────────────────

    /**
     * GET /api/admin/email-templates
     */
    public function index(): JsonResponse
    {
        $templates = EmailTemplate::orderBy('key')
            ->get(['id', 'key', 'subject', 'is_active', 'updated_at']);

        return response()->json($templates);
    }

    // ── Show ───────────────────────────────────────────────────────────────────

    /**
     * GET /api/admin/email-templates/{id}
     */
    public function show(int $id): JsonResponse
    {
        return response()->json(EmailTemplate::findOrFail($id));
    }

    // ── Store ──────────────────────────────────────────────────────────────────

    /**
     * POST /api/admin/email-templates
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'key'       => ['required', 'string', 'max:50', 'unique:email_templates,key', 'regex:/^[a-z0-9_]+$/'],
            'subject'   => ['required', 'string', 'max:255'],
            'body'      => ['required', 'string'],
            'variables' => ['nullable', 'array'],
            'variables.*.name'        => ['required_with:variables', 'string', 'max:50'],
            'variables.*.description' => ['nullable', 'string', 'max:150'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $template = EmailTemplate::create([
            'key'       => $data['key'],
            'subject'   => $data['subject'],
            'body'      => $data['body'],
            'variables' => $data['variables'] ?? null,
            'is_active' => $data['is_active'] ?? true,
        ]);

        return response()->json($template, 201);
    }

    // ── Update ─────────────────────────────────────────────────────────────────

    /**
     * PATCH /api/admin/email-templates/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $template = EmailTemplate::findOrFail($id);

        $data = $request->validate([
            'key'       => ['sometimes', 'string', 'max:50', "unique:email_templates,key,{$id}", 'regex:/^[a-z0-9_]+$/'],
            'subject'   => ['sometimes', 'string', 'max:255'],
            'body'      => ['sometimes', 'string'],
            'variables' => ['nullable', 'array'],
            'variables.*.name'        => ['required_with:variables', 'string', 'max:50'],
            'variables.*.description' => ['nullable', 'string', 'max:150'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $template->update($data);

        return response()->json($template->fresh());
    }

    // ── Destroy ────────────────────────────────────────────────────────────────

    /**
     * DELETE /api/admin/email-templates/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        EmailTemplate::findOrFail($id)->delete();

        return response()->json(['message' => 'Template deleted.']);
    }

    // ── Send test ──────────────────────────────────────────────────────────────

    /**
     * POST /api/admin/email-templates/{id}/send-test
     *
     * Sends the template (with sample variable values) to the logged-in admin's email.
     * Synchronous — not queued — so the admin gets immediate feedback.
     */
    public function sendTest(Request $request, int $id): JsonResponse
    {
        $template = EmailTemplate::findOrFail($id);
        $admin    = $request->user();

        $this->emailService->sendTestToAdmin($template, $admin->email);

        return response()->json(['message' => "Test email sent to {$admin->email}."]);
    }
}
