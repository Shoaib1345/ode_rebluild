# Chunk 09 — React Login & Register Pages ✅

**Status**: DONE  
**Date completed**: 2026-04-14

## Files created / modified

| File | Action |
|------|--------|
| `src/pages/auth/AuthLayout.tsx` | Created — shared card wrapper (logo, gradient bg, white card) |
| `src/pages/auth/LoginPage.tsx` | Created |
| `src/pages/auth/RegisterPage.tsx` | Created |
| `src/routes/index.tsx` | Updated — `LoginPage`, `RegisterPage` imported + routes active, `ProtectedRoute` uncommented |
| `src/types/index.ts` | Updated — `User` type extended with `phone`, `status`, `is_agency`, `created_at` |

## Features

### LoginPage (`/login`)
- react-hook-form + zod validation (`email` required/valid, `password` required)
- On success: `setAuth(user, token)` → redirect based on role:
  - `access_level <= 2` → `/admin`
  - `access_level === 6` → `/affiliate`
  - all others → `/` (or `location.state.from` if redirected by ProtectedRoute)
- On 422: API field errors mapped to form fields via `setError`
- On 401: "Invalid email or password." under password field
- On 403: `toast.error` (inactive account)

### RegisterPage (`/register`)
- Same form stack — zod schema with `refine` for password confirmation match
- Fields: first_name, last_name, email, phone (optional), password, password_confirmation
- On success: `setAuth` → navigate to `/`
- On 422: API field errors mapped back to form fields

### AuthLayout
- Full-screen gradient background (`blue-50 → indigo-100`)
- Centered white card, `max-w-md`
- "OneDayEvent" branding + tagline

## Verified

```
npx tsc --noEmit   # 0 errors
```
