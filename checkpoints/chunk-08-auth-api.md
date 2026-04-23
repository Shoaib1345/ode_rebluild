# Chunk 08 — Auth API ✅

**Status**: DONE  
**Date completed**: 2026-04-14

## Endpoints built

| Method | Route | Controller | Auth required |
|--------|-------|------------|---------------|
| POST | `/api/auth/register` | `AuthController@register` | No |
| POST | `/api/auth/login` | `AuthController@login` | No |
| POST | `/api/auth/logout` | `AuthController@logout` | Yes (Sanctum) |
| GET | `/api/auth/me` | `AuthController@me` | Yes (Sanctum) |

## Files created

- `app/Http/Requests/Auth/LoginRequest.php` — validates `email`, `password`
- `app/Http/Requests/Auth/RegisterRequest.php` — validates `first_name`, `last_name`, `email` (unique), `password` (confirmed, min 8), `phone` (optional)
- `app/Http\Controllers/Auth/AuthController.php` — register, login, logout, me

## Behaviour

- **register**: creates user with `role_id` = customer (access_level 5), issues Sanctum token, returns `{ user, token }`
- **login**: verifies credentials + `status === 1`, revokes all existing tokens (single-session), issues new token
- **logout**: deletes current token only
- **me**: returns user payload with role embedded

## Fixes applied

Two changes to `bootstrap/app.php`:

1. `$middleware->redirectGuestsTo(fn () => null)` — prevents `Authenticate` middleware from calling `route('login')` before the exception handler fires; lets `AuthenticationException` propagate cleanly
2. `$exceptions->render(AuthenticationException)` — returns `{"message":"Unauthenticated."}` with HTTP 401 for all `api/*` routes

## Verified working (live curl tests)

```
POST /api/auth/register    → 201 { user, token }
POST /api/auth/login       → 200 { user, token }
GET  /api/auth/me          → 200 { user }
POST /api/auth/logout      → 200 { message: "Logged out." }
GET  /api/auth/me (no tok) → 401 { message: "Unauthenticated." }
GET  /api/auth/me (revoked)→ 401 { message: "Unauthenticated." }
POST /api/auth/login (bad) → 401 { message: "Invalid credentials." }
POST /api/auth/login (empty)→ 422 { errors: { email: [...], password: [...] } }
```
