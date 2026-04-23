# Chunk 26 — Public Pages

## Status: ✅ Complete

## What was built

### Backend

**`app/Models/Page.php`** — already existed with full fillable/casts/relations

**`app/Http/Controllers/PageController.php`**
- `GET /api/pages/nav` — active pages with `add_to_menu = true`, ordered by `sort_order`, returns `id/title/navbar_text/slug`
- `GET /api/pages/{slug}` — full page by slug, 404 if inactive or not found

**`routes/api.php`**
- `Route::get('/pages/nav', ...)` — IMPORTANT: defined before `{slug}` wildcard to prevent routing conflict
- `Route::get('/pages/{slug}', ...)`

**`config/app.php`** — added `'frontend_url' => env('FRONTEND_URL', 'http://localhost:5173')` (for Chunk 25 emails)

### Frontend

**`src/components/layout/PublicLayout.tsx`**
- Sticky blue-800 nav with brand, CMS-fetched nav items, static About/Contact links, Sign in + Get a Quote CTA
- Mobile hamburger menu with overlay nav
- CMS nav data via `useQuery(['public-nav'], GET /api/pages/nav)`, `staleTime: 10min`
- Footer: 4-column grid (brand, Get Covered, Company, Legal) + copyright bar

**`src/pages/home/HomePage.tsx`** — rebuilt with `PublicLayout`
- Hero section with gradient background and prominent CTA
- Event type grid (6 icons, each links to `/onedayevent`)
- "How It Works" 3-step cards
- "Why One Day Event?" 4-feature grid
- Partner CTA strip

**`src/pages/public/PublicPage.tsx`** — CMS page renderer at `/pages/:slug`
- Loading skeleton, 404 error state, full page render
- Banner image (background) or solid blue header
- `header_content` (HTML), `editor_content` (HTML via `dangerouslySetInnerHTML` — admin-controlled content), `content_image`
- Tips section (3 tips, conditional render)
- "Get a Quote" CTA footer

**`src/pages/public/AboutPage.tsx`** — static about page
- Mission statement, company values grid (4 cards), partner program CTAs, quote CTA strip

**`src/pages/public/ContactPage.tsx`** — static contact page
- 3 contact email cards (support, partners, affiliates)
- 4-item FAQ accordion-style list

**`src/pages/public/TermsPage.tsx`** — Terms of Service (12 sections)

**`src/pages/public/PrivacyPage.tsx`** — Privacy Policy (11 sections)

**`src/routes/index.tsx`**
- Added lazy imports for all 5 new pages
- Routes: `/about`, `/contact`, `/terms`, `/privacy`, `/pages/:slug`

## Routes summary

| URL | Component |
|-----|-----------|
| `/` | `HomePage` (uses PublicLayout) |
| `/about` | `AboutPage` |
| `/contact` | `ContactPage` |
| `/terms` | `TermsPage` |
| `/privacy` | `PrivacyPage` |
| `/pages/:slug` | `PublicPage` (CMS-driven) |

## CMS page data flow
Admin creates a `Page` record (via future admin UI or direct DB) → `add_to_menu = true` to surface in nav → renders at `/pages/{slug}` via `PublicPage` component.

Fields rendered: `content_title/title` (header), `header_content` (intro HTML), `editor_content` (body HTML), `content_image`, `banner_image`, tip 1–3 section.
