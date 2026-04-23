# Chunk 27 — Blog System

## Status: ✅ Complete

## What was built

### Backend

**`app/Models/Blog.php`** — already existed with `published()` + `ordered()` scopes

**`app/Http/Controllers/BlogController.php`**

Public endpoints (no auth):
- `GET /api/blog` — paginated published posts (12/page), list columns only (`id/title/slug/description/img_path/created_at`)
- `GET /api/blog/{slug}` — full post by slug, 404 if draft or not found

Admin endpoints (`auth:sanctum` + `admin` middleware):
- `GET /api/admin/blog` — all posts (published + draft), searchable, filterable by status, sortable, paginated
- `POST /api/admin/blog` — create post; auto-generates unique slug from title via `Str::slug()` if blank
- `GET /api/admin/blog/{id}` — full post for edit form
- `PATCH /api/admin/blog/{id}` — update any field; slug uniqueness ignores current post
- `DELETE /api/admin/blog/{id}` — hard delete, 204

**`routes/api.php`** — public routes added after pages section; admin routes added inside admin middleware group

### Frontend — Public

**`src/pages/public/BlogIndexPage.tsx`**
- URL-driven pagination via `useSearchParams` (`?page=N`)
- 3-column card grid (responsive: 1→2→3 cols)
- `PostCard`: image (or blue placeholder), date, title, description excerpt, "Read more →"
- 6-skeleton loading state, empty state with icon
- Prev/Next paginator

**`src/pages/public/BlogPostPage.tsx`**
- Loading skeleton (6 rows), 404 error state with back link
- Hero: banner image (full-width bg) or blue stripe if no image
- Breadcrumb: Home / Blog / Post title
- Title + date header
- `description` rendered as blockquote-style lead text
- `content` rendered as HTML via `dangerouslySetInnerHTML` (admin-controlled)
- `keywords` rendered as tag chips (comma-split)
- Back to Blog + "Get an Instant Quote →" CTA footer

### Frontend — Admin

**`src/pages/admin/BlogPage.tsx`** at `/admin/blog`
- Sortable columns: title, sort_order, status, created_at
- Status filter (All / Published / Draft), search by title/description
- URL-driven state (useSearchParams), placeholderData for smooth transitions
- Row actions: View (opens `/blog/slug` in new tab), Edit, Delete (window.confirm)
- Delete via `useMutation` + `invalidateQueries`
- "New Post" button → `/admin/blog/new`
- Skeleton rows during load, empty state with create link

**`src/pages/admin/BlogEditPage.tsx`** at `/admin/blog/new` and `/admin/blog/:id/edit`
- Shared create/edit component — `isNew` derived from `useParams`
- `useQuery` fetches existing post when editing; `useEffect` populates form via `reset()`
- zod schema + react-hook-form; `zodResolver`
- Fields: title*, slug (auto-hint), status (Published/Draft), sort_order, meta description, keywords, image URL, content (HTML textarea, monospace)
- Empty strings → `undefined` before submit so backend treats as nullable
- On success → `invalidateQueries` + `navigate('/admin/blog')`
- "Save Changes" disabled when form is not dirty (edit mode)

### AdminLayout update
- Added `PencilIcon` SVG component
- Added `{ label: 'Blog', to: '/admin/blog', icon: <PencilIcon /> }` to `NAV_ITEMS`

### PublicLayout update
- Added `{ to: '/blog', label: 'Blog' }` to `staticLinks` (appears in desktop nav + mobile menu)
- Added Blog link to footer Company column

### `src/routes/index.tsx`
- Lazy imports: `BlogIndexPage`, `BlogPostPage`, `AdminBlogPage`, `AdminBlogEditPage`
- Public: `/blog`, `/blog/:slug`
- Admin (maxLevel=2): `/admin/blog`, `/admin/blog/new`, `/admin/blog/:id/edit`

## TypeScript
`npx tsc --noEmit` — clean, no errors.

## Data flow
1. Admin creates post via `/admin/blog/new` (status=0 for draft, status=1 to publish)
2. Public `/blog` lists only `status=1` posts
3. `/blog/:slug` renders full post HTML
4. Slug auto-generated from title on create if not provided (collision-safe via loop)
