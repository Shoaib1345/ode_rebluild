<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Page;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Admin CRUD for CMS pages (§19.2).
 *
 * Routes (under admin middleware):
 *   GET    /admin/pages              → index
 *   POST   /admin/pages              → store
 *   GET    /admin/pages/{id}         → show
 *   PATCH  /admin/pages/{id}         → update
 *   DELETE /admin/pages/{id}         → destroy
 *   POST   /admin/pages/reorder      → reorder (bulk sort_order update)
 */
class PageController extends Controller
{
    // ── Index ─────────────────────────────────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $query = Page::query()->orderBy('sort_order')->orderBy('title');

        if ($request->filled('search')) {
            $q = '%' . $request->search . '%';
            $query->where(fn ($s) => $s->where('title', 'like', $q)
                                       ->orWhere('slug',  'like', $q));
        }

        if ($request->filled('status')) {
            $query->where('status', (int) $request->status);
        }

        return response()->json(
            $query->get(['id', 'title', 'slug', 'navbar_text', 'sort_order', 'add_to_menu', 'status', 'updated_at'])
        );
    }

    // ── Show ─────────────────────────────────────────────────────────────────

    public function show(int $id): JsonResponse
    {
        return response()->json(Page::findOrFail($id));
    }

    // ── Store ─────────────────────────────────────────────────────────────────

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title'            => 'required|string|max:191',
            'slug'             => 'required|string|max:191|unique:pages,slug|regex:/^[a-z0-9\-]+$/',
            'navbar_text'      => 'nullable|string|max:155',
            'meta_keywords'    => 'nullable|string|max:191',
            'meta_description' => 'nullable|string|max:191',
            'editor_content'   => 'nullable|string',
            'header_content'   => 'nullable|string',
            'content_title'    => 'nullable|string|max:155',
            'banner_image'     => 'nullable|string|max:155',
            'content_image'    => 'nullable|string|max:155',
            'tips_heading'     => 'nullable|string|max:191',
            'tip1_text'        => 'nullable|string',
            'tip2_text'        => 'nullable|string',
            'tip3_text'        => 'nullable|string',
            'tip1_image'       => 'nullable|string|max:155',
            'tip2_image'       => 'nullable|string|max:155',
            'tip3_image'       => 'nullable|string|max:155',
            'sort_order'       => 'integer|min:0',
            'add_to_menu'      => 'boolean',
            'status'           => 'integer|in:0,1',
        ]);

        $data['sort_order']  = $data['sort_order']  ?? 0;
        $data['add_to_menu'] = $data['add_to_menu'] ?? false;
        $data['status']      = $data['status']      ?? 1;

        $page = Page::create($data);

        return response()->json($page, 201);
    }

    // ── Update ────────────────────────────────────────────────────────────────

    public function update(Request $request, int $id): JsonResponse
    {
        $page = Page::findOrFail($id);

        $data = $request->validate([
            'title'            => 'sometimes|string|max:191',
            'slug'             => "sometimes|string|max:191|unique:pages,slug,{$id}|regex:/^[a-z0-9\-]+$/",
            'navbar_text'      => 'nullable|string|max:155',
            'meta_keywords'    => 'nullable|string|max:191',
            'meta_description' => 'nullable|string|max:191',
            'editor_content'   => 'nullable|string',
            'header_content'   => 'nullable|string',
            'content_title'    => 'nullable|string|max:155',
            'banner_image'     => 'nullable|string|max:155',
            'content_image'    => 'nullable|string|max:155',
            'tips_heading'     => 'nullable|string|max:191',
            'tip1_text'        => 'nullable|string',
            'tip2_text'        => 'nullable|string',
            'tip3_text'        => 'nullable|string',
            'tip1_image'       => 'nullable|string|max:155',
            'tip2_image'       => 'nullable|string|max:155',
            'tip3_image'       => 'nullable|string|max:155',
            'sort_order'       => 'integer|min:0',
            'add_to_menu'      => 'boolean',
            'status'           => 'integer|in:0,1',
        ]);

        $page->update($data);

        return response()->json($page->fresh());
    }

    // ── Destroy ───────────────────────────────────────────────────────────────

    public function destroy(int $id): JsonResponse
    {
        Page::findOrFail($id)->delete();

        return response()->json(['message' => 'Page deleted.']);
    }

    // ── Reorder ───────────────────────────────────────────────────────────────

    /**
     * Bulk-update sort_order for multiple pages in one request.
     *
     * Body: { "order": [{"id": 1, "sort_order": 0}, {"id": 2, "sort_order": 1}, ...] }
     */
    public function reorder(Request $request): JsonResponse
    {
        $request->validate([
            'order'              => 'required|array',
            'order.*.id'         => 'required|integer|exists:pages,id',
            'order.*.sort_order' => 'required|integer|min:0',
        ]);

        foreach ($request->order as $item) {
            Page::where('id', $item['id'])->update(['sort_order' => $item['sort_order']]);
        }

        return response()->json(['message' => 'Order updated.']);
    }
}
