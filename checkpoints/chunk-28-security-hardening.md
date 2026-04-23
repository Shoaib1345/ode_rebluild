# Chunk 28 — Security Hardening

## Status: ✅ Complete

## What was built / changed

---

### 1. Rate Limiting — `app/Providers/AppServiceProvider.php`

Five named rate limiters defined in `configureRateLimiting()`:

| Limiter | Limit | Applied to |
|---------|-------|-----------|
| `auth` | 10 req/min per IP | `POST /auth/login`, `POST /auth/register` |
| `payment` | 5 req/min per IP | `POST /leads`, `POST /invoice/:id/pay` |
| `signup` | 10 req/hour per IP | `POST /affiliate/register`, `POST /partner/register` |
| `quote` | 30 req/min per IP | All quote engine endpoints (event-types, us-states, quote, broker-fee) |
| `api` | 120 req/min (auth user) / 60 req/min (guest) | General API limiter (available as fallback) |

Applied via `->middleware('throttle:xxx')` directly on routes in `routes/api.php`.

---

### 2. CORS — `config/cors.php` (new file)

- `paths`: `['api/*', 'sanctum/csrf-cookie']`
- `allowed_methods`: GET, POST, PUT, PATCH, DELETE, OPTIONS
- `allowed_origins`: parsed from `CORS_ALLOWED_ORIGINS` env var (comma-separated, trimmed)
- `allowed_headers`: Content-Type, X-Requested-With, Authorization, Accept, X-Timezone
- `max_age`: 7200 in production (caches preflight), 0 in dev
- `supports_credentials`: true (required for Sanctum cookie auth)
- `.env` updated: `CORS_ALLOWED_ORIGINS=http://localhost:5173`
- `HandleCors::class` middleware added to API stack in `bootstrap/app.php`

---

### 3. Sanctum Token Expiration — `config/sanctum.php`

Changed `expiration` from `null` (non-expiring) to:
```php
'expiration' => env('SANCTUM_TOKEN_EXPIRY', 10080),  // 7 days default
```
`.env` updated: `SANCTUM_TOKEN_EXPIRY=10080`

---

### 4. Security Headers — `app/Http/Middleware/SecurityHeaders.php` (new file)

Applied to every API response via `bootstrap/app.php`:

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Content-Type-Options` | `nosniff` | Prevent MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Prevent URL leakage |
| `X-Frame-Options` | `DENY` | Prevent framing |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=()` | Lock browser APIs |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | Production only — force HTTPS |
| `X-Powered-By` | *(removed)* | Prevent PHP fingerprinting |

---

### 5. `bootstrap/app.php` — middleware stack

Added to `$middleware->api(prepend: [...])`:
```php
\Illuminate\Http\Middleware\HandleCors::class,
\App\Http\Middleware\SecurityHeaders::class,
```
Both applied before all other API middleware.

---

### 6. `.env.example` — production template

Full rewrite with:
- All required env vars documented
- Secure defaults for production (`APP_DEBUG=false`, `SESSION_ENCRYPT=true`, `SESSION_SECURE_COOKIE=true`, `LOG_LEVEL=warning`)
- Production checklist at bottom (16 items)
- `CORS_ALLOWED_ORIGINS`, `SANCTUM_TOKEN_EXPIRY` added
- Note to remove `LEGACY_DB_*` vars after migration

---

## What was intentionally NOT done

| Item | Reason |
|------|--------|
| SQL injection protection | Laravel's query builder/Eloquent parameterises all queries by default |
| XSS protection on API | API returns JSON, not HTML; React frontend handles output escaping |
| Input sanitisation beyond validation | Laravel validation already strips unexpected fields; `strip_tags` would corrupt legitimate data |
| Password reset / forgot password flow | Not in scope for Chunk 28; add in a future chunk |
| 2FA | Not in scope |
| WAF / DDoS protection | Infrastructure concern, not application code |
| Content-Security-Policy | Belongs on the React frontend (nginx/CloudFront), not the JSON API |
