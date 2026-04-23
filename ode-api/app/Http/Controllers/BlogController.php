<?php

namespace App\Http\Controllers;

use App\Models\Blog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class BlogController extends Controller
{
    // ── Public ───────────────────────────────────────────────────────────────

    /**
     * GET /api/blog
     *
     * Paginated list of published posts for the public blog index.
     * Returns safe subset (no internal fields).
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
            'page'     => ['nullable', 'integer', 'min:1'],
        ]);

        $perPage = (int) $request->input('per_page', 12);

        $posts = Blog::published()
            ->ordered()
            ->paginate($perPage, ['id', 'title', 'slug', 'description', 'img_path', 'created_at']);

        return response()->json($posts);
    }

    /**
     * GET /api/blog/{slug}
     *
     * Single published post by slug. 404 if draft or not found.
     */
    public function show(string $slug): JsonResponse
    {
        $post = Blog::published()->where('slug', $slug)->firstOrFail();

        return response()->json($post);
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    /**
     * GET /api/admin/blog
     *
     * All posts (published + draft) for admin list.
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $request->validate([
            'search'   => ['nullable', 'string', 'max:100'],
            'status'   => ['nullable', Rule::in(['0', '1'])],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'sort'     => ['nullable', Rule::in(['id', 'title', 'sort_order', 'created_at', 'status'])],
            'dir'      => ['nullable', Rule::in(['asc', 'desc'])],
        ]);

        $query = Blog::query();

        if ($search = $request->input('search')) {
            $like = '%' . $search . '%';
            $query->where(function ($q) use ($like) {
                $q->where('title', 'like', $like)
                  ->orWhere('description', 'like', $like);
            });
        }

        if ($request->has('status') && $request->input('status') !== null) {
            $query->where('status', (int) $request->input('status'));
        }

        $sort = $request->input('sort', 'sort_order');
        $dir  = $request->input('dir', 'asc');
        $query->orderBy($sort, $dir)->orderBy('created_at', 'desc');

        $perPage = (int) $request->input('per_page', 25);
        $posts = $query->paginate($perPage, ['id', 'title', 'slug', 'status', 'sort_order', 'created_at']);

        return response()->json($posts);
    }

    /**
     * GET /api/admin/blog/{id}
     *
     * Full post detail for admin edit form.
     */
    public function adminShow(int $id): JsonResponse
    {
        return response()->json(Blog::findOrFail($id));
    }

    /**
     * POST /api/admin/blog
     *
     * Creates a new blog post. Slug is auto-generated from title if not provided.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title'       => ['required', 'string', 'max:191'],
            'slug'        => ['nullable', 'string', 'max:191', 'unique:blogs,slug'],
            'keywords'    => ['nullable', 'string', 'max:191'],
            'description' => ['nullable', 'string'],
            'img_path'    => ['nullable', 'string', 'max:191'],
            'content'     => ['nullable', 'string'],
            'sort_order'  => ['nullable', 'integer', 'min:0'],
            'status'      => ['nullable', Rule::in([0, 1])],
        ]);

        // Auto-generate unique slug from title if not provided
        if (empty($data['slug'])) {
            $base = Str::slug($data['title']);
            $slug = $base;
            $i    = 2;
            while (Blog::where('slug', $slug)->exists()) {
                $slug = $base . '-' . $i++;
            }
            $data['slug'] = $slug;
        }

        $post = Blog::create($data);

        return response()->json($post, 201);
    }

    /**
     * PATCH /api/admin/blog/{id}
     *
     * Updates any fields on a post.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $post = Blog::findOrFail($id);

        $data = $request->validate([
            'title'       => ['sometimes', 'string', 'max:191'],
            'slug'        => ['sometimes', 'string', 'max:191', Rule::unique('blogs', 'slug')->ignore($post->id)],
            'keywords'    => ['sometimes', 'nullable', 'string', 'max:191'],
            'description' => ['sometimes', 'nullable', 'string'],
            'img_path'    => ['sometimes', 'nullable', 'string', 'max:191'],
            'content'     => ['sometimes', 'nullable', 'string'],
            'sort_order'  => ['sometimes', 'integer', 'min:0'],
            'status'      => ['sometimes', Rule::in([0, 1])],
        ]);

        $post->update($data);

        return response()->json($post->fresh());
    }

    /**
     * DELETE /api/admin/blog/{id}
     *
     * Hard-deletes a blog post.
     */
    public function destroy(int $id): JsonResponse
    {
        Blog::findOrFail($id)->delete();

        return response()->json(null, 204);
    }
}
