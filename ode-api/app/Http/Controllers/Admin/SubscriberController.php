<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Subscriber;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * Admin subscriber management (§19.7).
 *
 * GET    /admin/subscribers         → paginated list (filter: active/inactive, search)
 * GET    /admin/subscribers/export  → CSV download
 * DELETE /admin/subscribers/{id}    → remove (unsubscribe)
 */
class SubscriberController extends Controller
{
    // ── Index ─────────────────────────────────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $query = Subscriber::query()->orderByDesc('subscribed_at');

        if ($request->filled('search')) {
            $q = '%' . $request->search . '%';
            $query->where(fn ($s) => $s->where('email', 'like', $q)
                                       ->orWhere('name',  'like', $q));
        }

        if ($request->filled('status')) {
            $query->where('is_active', $request->status === 'active');
        }

        return response()->json($query->paginate(50));
    }

    // ── Export CSV ────────────────────────────────────────────────────────────

    public function export(Request $request): Response
    {
        $subscribers = Subscriber::where('is_active', true)
            ->orderByDesc('subscribed_at')
            ->get(['email', 'name', 'subscribed_at']);

        $csv = "email,name,subscribed_at\n";
        foreach ($subscribers as $sub) {
            $csv .= implode(',', [
                '"' . str_replace('"', '""', $sub->email) . '"',
                '"' . str_replace('"', '""', (string) $sub->name) . '"',
                '"' . $sub->subscribed_at?->toDateTimeString() . '"',
            ]) . "\n";
        }

        return response($csv, 200, [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => 'attachment; filename="subscribers-' . now()->format('Y-m-d') . '.csv"',
        ]);
    }

    // ── Destroy ───────────────────────────────────────────────────────────────

    public function destroy(int $id): JsonResponse
    {
        Subscriber::findOrFail($id)->delete();

        return response()->json(['message' => 'Subscriber removed.']);
    }
}
