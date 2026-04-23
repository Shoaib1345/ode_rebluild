#!/usr/bin/env bash
##############################################################################
# One Day Event — Rolling Deploy Script (API + Frontend)
#
# Usage:
#   ./deploy/scripts/deploy.sh [--api-only] [--frontend-only] [--skip-migrate]
#
# Prerequisites:
#   - Run first-deploy.sh once on a fresh server before using this script
#   - SSH access to the server as a deploy user with sudo rights on:
#       supervisorctl, nginx reload, php artisan
#   - Git remote 'origin' set on the server checkouts
#   - .env already in place at /var/www/ode-api/.env
##############################################################################

set -euo pipefail

# ── Colour helpers ────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; RESET='\033[0m'
info()    { echo -e "${GREEN}[deploy]${RESET} $*"; }
warning() { echo -e "${YELLOW}[deploy]${RESET} $*"; }
fail()    { echo -e "${RED}[deploy] FAILED:${RESET} $*" >&2; exit 1; }

# ── Parse flags ───────────────────────────────────────────────────────────────
DEPLOY_API=true
DEPLOY_FRONTEND=true
SKIP_MIGRATE=false

for arg in "$@"; do
    case $arg in
        --api-only)       DEPLOY_FRONTEND=false ;;
        --frontend-only)  DEPLOY_API=false ;;
        --skip-migrate)   SKIP_MIGRATE=true ;;
        *) fail "Unknown argument: $arg" ;;
    esac
done

API_DIR="/var/www/ode-api"
FRONTEND_DIR="/var/www/ode-frontend"

# ─────────────────────────────────────────────────────────────────────────────
# API DEPLOY
# ─────────────────────────────────────────────────────────────────────────────
if $DEPLOY_API; then
    info "=== API Deploy ==="

    cd "$API_DIR"

    info "Pulling latest code..."
    git fetch origin main
    git reset --hard origin/main

    info "Installing Composer dependencies (no dev)..."
    composer install \
        --no-dev \
        --optimize-autoloader \
        --no-interaction \
        --quiet

    info "Clearing and rebuilding caches..."
    php artisan config:clear
    php artisan route:clear
    php artisan view:clear
    php artisan event:clear

    if ! $SKIP_MIGRATE; then
        info "Running database migrations..."
        php artisan migrate --force
    else
        warning "Skipping migrations (--skip-migrate passed)"
    fi

    info "Caching config / routes / views..."
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache

    info "Restarting queue workers..."
    sudo supervisorctl restart ode-worker:*

    info "API deploy complete."
fi

# ─────────────────────────────────────────────────────────────────────────────
# FRONTEND DEPLOY
# ─────────────────────────────────────────────────────────────────────────────
if $DEPLOY_FRONTEND; then
    info "=== Frontend Deploy ==="

    cd "$FRONTEND_DIR"

    info "Pulling latest code..."
    git fetch origin main
    git reset --hard origin/main

    info "Installing npm dependencies..."
    npm ci --prefer-offline --silent

    info "Building production bundle..."
    npm run build

    info "Frontend deploy complete."
    info "New dist/ is live — nginx serves static files directly, no reload needed."
fi

# ─────────────────────────────────────────────────────────────────────────────
# Done
# ─────────────────────────────────────────────────────────────────────────────
info "=== Deploy finished successfully ==="
