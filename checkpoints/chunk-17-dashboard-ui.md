# Chunk 17 — Dashboard UI

## Status: ✅ Complete

## What was built

### `src/pages/admin/AdminLayout.tsx`
- Fixed left sidebar (blue-800, `w-56`, `hidden lg:flex`)
- Mobile overlay sidebar with backdrop dismiss
- `NavLink` items with active state (blue-700 bg + white text): Dashboard, Leads, Invoices
- Bottom user card: email, full name, sign-out button
- Sticky top bar: mobile menu toggle, "View public site" link, user name + role badge
- `handleLogout`: calls `POST /auth/logout`, then `logout()` from `useAuthStore`, navigates to `/login`

### `src/pages/admin/DashboardPage.tsx`
- Fetches `GET /api/admin/stats` via `useQuery` (`staleTime: 2min`)
- Loading: 4 skeleton cards
- Error: inline error banner with Retry
- Loaded state:
  - **Row 1 stat cards**: Leads today, this week, this month (accent blue), all-time
  - **Row 2 stat cards**: Revenue this month (accent blue), all-time revenue, bound policies, pending MQ (with on-hold sub-label)
  - **30-day SVG bar chart**: responsive, fills container, x-axis labels every ~6 bars, grid lines at 0/25/50/75/100%
  - **Status breakdown**: horizontal progress bars for all 7 statuses with % fill, colour-coded
- "Refresh" button top-right re-triggers the query

### `src/routes/index.tsx`
- Re-imported `ProtectedRoute` (was commented out since Chunk 14)
- Activated `<Route path="/admin" element={<ProtectedRoute maxLevel={2}><DashboardPage /></ProtectedRoute>} />`
- `maxLevel={2}` matches backend `RequireAdminAccess` (`access_level <= 2`)

## Access levels reminder
| Level | Role |
|-------|------|
| 0 | Super-admin |
| 1 | Admin |
| 2 | Staff |
| 5 | Customer |
| 6 | Affiliate |
| 7 | Agent |
| 8 | Planner |
