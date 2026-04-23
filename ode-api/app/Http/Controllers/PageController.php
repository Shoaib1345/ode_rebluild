<?php

namespace App\Http\Controllers;

use App\Models\Page;
use Illuminate\Http\JsonResponse;

class PageController extends Controller
{
    /**
     * GET /api/pages/nav
     *
     * Returns active pages marked for navigation, ordered by sort_order.
     * Used to build the public site nav dynamically.
     */
    public function nav(): JsonResponse
    {
        $pages = Page::where('status', 1)
            ->where('add_to_menu', true)
            ->orderBy('sort_order')
            ->get(['id', 'title', 'navbar_text', 'slug']);

        return response()->json($pages);
    }

    /**
     * GET /api/pages/{slug}
     *
     * Returns full page data for CMS rendering. 404 if not found or inactive.
     */
    public function show(string $slug): JsonResponse
    {
        $page = Page::where('slug', $slug)
            ->where('status', 1)
            ->firstOrFail();

        return response()->json($page);
    }
}
