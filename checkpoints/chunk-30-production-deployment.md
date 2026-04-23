# Chunk 30 — Production Deployment

## Status: ✅ Complete

## What was built / changed

---

### 1. `deploy/nginx/api.conf` (new file)

nginx server config for the Laravel API (`api.onedayevent.com`):

- HTTP → HTTPS redirect (301)
- TLS via Let's Encrypt / Certbot (`include /etc/letsencrypt/options-ssl-nginx.conf`)
- PHP-FPM via Unix socket (`/run/php/php8.3-fpm.sock`)
- Laravel front-controller: `try_files $uri $uri/ /index.php?$query_string`
- Security headers at nginx layer (defence-in-depth over Laravel middleware):
  - X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, HSTS
  - `fastcgi_hide_header X-Powered-By`
- Gzip for `application/json`, `text/plain`, `application/javascript`
- `location ~ /\.` — blocks all dotfile access (`.env`, `.git`, etc.)
- `location ~* ^/(app|bootstrap|config|...)` — blocks directory traversal above `public/`
- nginx-level rate limiting via `limit_req zone=api burst=20 nodelay` (backs up Laravel throttle)
- Requires `limit_req_zone` added to nginx http block (done by `first-deploy.sh`)

---

### 2. `deploy/nginx/frontend.conf` (new file)

nginx server config for the React SPA (`www.onedayevent.com`):

- HTTP → HTTPS redirect; non-www → www canonical redirect
- SPA catch-all: `try_files $uri $uri/ /index.html`
- `/assets/` — `Cache-Control: public, immutable` with 1-year expiry (safe because Vite uses content-hash filenames)
- `= /index.html` — `Cache-Control: no-store` (always serve fresh entry point)
- Content-Security-Policy header (tighten per actual CDN/font/analytics sources):
  - `connect-src` allows `api.onedayevent.com` and `js.stripe.com`
  - `frame-src` allows `js.stripe.com` only
- Block dotfiles, gzip for CSS/JS/JSON/SVG

---

### 3. `deploy/supervisor/ode-worker.conf` (new file)

Supervisor config for Laravel queue workers:

- Command: `php artisan queue:work database --sleep=3 --tries=3 --backoff=60 --max-time=3600`
- `numprocs=2` — 2 parallel workers
- Runs as `www-data` (not root)
- `--max-time=3600` — worker restarts hourly to prevent memory leaks
- `--tries=3`, `--backoff=60` — matches `ShouldQueue` settings on Mail jobs (Chunk 25)
- Log rotation: 10 MB max, 5 backups for both stdout and stderr
- After deploy: `sudo supervisorctl restart ode-worker:*` to pick up new code

---

### 4. `deploy/scripts/deploy.sh` (new file)

Rolling deploy script — safe to run on every push to main:

```
./deploy/scripts/deploy.sh              # deploy both API and frontend
./deploy/scripts/deploy.sh --api-only
./deploy/scripts/deploy.sh --frontend-only
./deploy/scripts/deploy.sh --skip-migrate
```

API steps:
1. `git fetch && git reset --hard origin/main`
2. `composer install --no-dev --optimize-autoloader`
3. `config:clear`, `route:clear`, `view:clear`, `event:clear`
4. `php artisan migrate --force`
5. `config:cache`, `route:cache`, `view:cache`
6. `sudo supervisorctl restart ode-worker:*`

Frontend steps:
1. `git fetch && git reset --hard origin/main`
2. `npm ci`
3. `npm run build`
(nginx serves new `dist/` immediately — no reload needed)

---

### 5. `deploy/scripts/first-deploy.sh` (new file)

Interactive setup script for a fresh Ubuntu 22.04/24.04 server:

1. Installs: nginx, PHP 8.3 FPM + extensions, MySQL client, Redis, Node 20, Supervisor, Certbot
2. Clones API + frontend repos to `/var/www/`
3. Pauses to let operator fill in `.env` → generates `APP_KEY`
4. `composer install`, sets storage permissions, runs migrations + seeders
5. Pauses to let operator fill in `.env.production` for frontend → `npm run build`
6. Installs nginx configs, adds `limit_req_zone` rate-limit directive, tests config, reloads nginx
7. Runs Certbot for `api.onedayevent.com` and `www.onedayevent.com`
8. Installs Supervisor config, starts `ode-worker:*`
9. Adds `* * * * * www-data php artisan schedule:run` to `/etc/cron.d/ode-scheduler`

---

### 6. `ode-frontend/.env.example` (new file)

Production frontend env template:
- `VITE_API_URL=https://api.onedayevent.com/api`
- `VITE_STRIPE_PK=pk_live_`
- `VITE_GOOGLE_PLACES_API_KEY=`

---

## Post-deploy verification checklist

After first deploy, verify:

```
curl https://api.onedayevent.com/api/health
# → {"status":"ok","app":"OneDayEvent","env":"production"}

curl -I https://api.onedayevent.com/api/health
# → Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
# → X-Content-Type-Options: nosniff
# → X-Frame-Options: DENY

sudo supervisorctl status ode-worker:*
# → ode-worker:ode-worker_00   RUNNING   pid xxxx, uptime 0:00:xx
# → ode-worker:ode-worker_01   RUNNING   pid xxxx, uptime 0:00:xx

# Test rate limiting (should 429 after 10 rapid POSTs to /api/auth/login)
# Test CORS (preflight OPTIONS to /api/leads should 200 with correct headers)
# Confirm .env is NOT accessible: curl https://api.onedayevent.com/.env → 403/404
```

---

## What was intentionally NOT included

| Item | Reason |
|------|--------|
| CloudFront / CDN config | Highly org-specific; document in team runbook |
| MySQL server installation | Typically managed database (RDS/PlanetScale) in production |
| Redis installation | `redis-server` installed but config not tuned — default is fine for queue/cache |
| GitHub Actions CI/CD pipeline | Out of scope; deploy.sh can be called from any CI runner |
| Rollback procedure | `git reset --hard <previous-sha>` + re-run deploy steps; too org-specific to script |
| Zero-downtime PHP-FPM reload | `php-fpm reload` handles graceful; nginx + FPM pool config is default single-pool |
