#!/usr/bin/env bash
##############################################################################
# One Day Event — First-Time Server Setup Script
#
# Run ONCE on a fresh Ubuntu 22.04 / 24.04 server.
# After this script, use deploy.sh for all subsequent deployments.
#
# Run as root or a sudo-capable user:
#   sudo bash deploy/scripts/first-deploy.sh
##############################################################################

set -euo pipefail

GREEN='\033[0;32m'; RESET='\033[0m'
info() { echo -e "${GREEN}[setup]${RESET} $*"; }

# ── 1. System packages ────────────────────────────────────────────────────────
info "Updating packages..."
apt-get update -qq
apt-get upgrade -y -qq

info "Installing nginx, PHP 8.3, MySQL client, Node 20, Supervisor, Certbot..."
apt-get install -y -qq \
    nginx \
    php8.3-fpm php8.3-cli php8.3-mbstring php8.3-xml php8.3-bcmath \
    php8.3-curl php8.3-zip php8.3-mysql php8.3-redis \
    mysql-client \
    redis-server \
    supervisor \
    certbot python3-certbot-nginx \
    git curl unzip

# Node 20 via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Composer
if ! command -v composer &>/dev/null; then
    info "Installing Composer..."
    curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
fi

# ── 2. Directory structure ────────────────────────────────────────────────────
info "Creating web directories..."
mkdir -p /var/www/ode-api
mkdir -p /var/www/ode-frontend
chown -R www-data:www-data /var/www

# ── 3. Clone repositories ────────────────────────────────────────────────────
# Replace with your actual git remote URLs
info "Cloning API repository..."
git clone https://github.com/YOUR_ORG/ode-api.git /var/www/ode-api

info "Cloning frontend repository..."
git clone https://github.com/YOUR_ORG/ode-frontend.git /var/www/ode-frontend

# ── 4. API: .env and storage ──────────────────────────────────────────────────
info "Setting up API .env..."
cp /var/www/ode-api/.env.example /var/www/ode-api/.env
echo ""
echo "  !! ACTION REQUIRED: Edit /var/www/ode-api/.env with real values before continuing."
echo "  !! Minimum: DB_PASSWORD, STRIPE_SECRET, APP_KEY (generated below), MAIL_PASSWORD"
echo ""
read -rp "Press ENTER after editing .env to continue..."

info "Generating app key..."
cd /var/www/ode-api
php artisan key:generate

info "Installing PHP dependencies..."
composer install --no-dev --optimize-autoloader --no-interaction --quiet

info "Setting storage permissions..."
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

info "Running migrations and seeders..."
php artisan migrate --force
php artisan db:seed --force

info "Caching config / routes / views..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# ── 5. Frontend: build ────────────────────────────────────────────────────────
info "Building frontend..."
cd /var/www/ode-frontend
# Copy frontend env — set VITE_API_URL to your API domain
cp .env.example .env.production 2>/dev/null || true
echo ""
echo "  !! ACTION REQUIRED: Edit /var/www/ode-frontend/.env.production"
echo "  !! Set VITE_API_URL=https://api.onedayevent.com"
echo ""
read -rp "Press ENTER after editing .env.production to continue..."

npm ci --prefer-offline
npm run build

chown -R www-data:www-data /var/www/ode-frontend/dist

# ── 6. nginx ─────────────────────────────────────────────────────────────────
info "Installing nginx configs..."
cp /var/www/ode-api/deploy/nginx/api.conf      /etc/nginx/sites-available/api.onedayevent.com
cp /var/www/ode-api/deploy/nginx/frontend.conf /etc/nginx/sites-available/onedayevent.com

ln -sf /etc/nginx/sites-available/api.onedayevent.com  /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/onedayevent.com      /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Add nginx rate-limiting zone to http block
NGINX_HTTP_CONF="/etc/nginx/conf.d/rate-limit.conf"
if [ ! -f "$NGINX_HTTP_CONF" ]; then
    echo 'limit_req_zone $binary_remote_addr zone=api:10m rate=60r/m;' > "$NGINX_HTTP_CONF"
fi

nginx -t
systemctl reload nginx

# ── 7. SSL certificates ───────────────────────────────────────────────────────
info "Obtaining SSL certificates..."
certbot --nginx \
    -d api.onedayevent.com \
    --non-interactive --agree-tos \
    -m support@onedayevent.com \
    --redirect

certbot --nginx \
    -d onedayevent.com \
    -d www.onedayevent.com \
    --non-interactive --agree-tos \
    -m support@onedayevent.com \
    --redirect

# ── 8. Supervisor ─────────────────────────────────────────────────────────────
info "Installing Supervisor config..."
cp /var/www/ode-api/deploy/supervisor/ode-worker.conf /etc/supervisor/conf.d/ode-worker.conf

supervisorctl reread
supervisorctl update
supervisorctl start ode-worker:*

# ── 9. Cron for Laravel scheduler ────────────────────────────────────────────
info "Adding Laravel scheduler cron..."
CRON_JOB="* * * * * www-data php /var/www/ode-api/artisan schedule:run >> /dev/null 2>&1"
CRON_FILE="/etc/cron.d/ode-scheduler"
if [ ! -f "$CRON_FILE" ]; then
    echo "$CRON_JOB" > "$CRON_FILE"
    chmod 644 "$CRON_FILE"
fi

# ── Done ──────────────────────────────────────────────────────────────────────
info "==================================================================="
info "First-time setup complete."
info ""
info "  API:      https://api.onedayevent.com/api/health"
info "  Frontend: https://www.onedayevent.com"
info ""
info "  Queue workers: sudo supervisorctl status ode-worker:*"
info "  Logs:          /var/log/supervisor/ode-worker.log"
info "                 /var/log/nginx/api.onedayevent.com.error.log"
info "==================================================================="
