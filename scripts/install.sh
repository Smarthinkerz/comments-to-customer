#!/usr/bin/env bash
###############################################################################
# CommentCustomer.ai — One-shot VPS installer
###############################################################################
# Tested on Ubuntu 22.04 LTS and 24.04 LTS.
#
# WHAT THIS DOES:
#   1. Installs Node 20, nginx, certbot, ufw, fail2ban, git, build tools
#   2. (Optional) installs PostgreSQL 17 locally and creates the app database
#   3. Creates a non-root `commentcustomer` system user to run the app
#   4. Copies the project to /opt/commentcustomer and runs `npm install`
#   5. Installs the systemd unit (auto-restart, auto-start on boot)
#   6. Configures nginx as a reverse proxy with TLS (Let's Encrypt)
#   7. Hardens with ufw + fail2ban
#
# USAGE:
#   1. SSH to your VPS as root (or a sudoer)
#   2. git clone https://github.com/Dazoman76/Comments.-Capture.git /opt/commentcustomer-src
#   3. cd /opt/commentcustomer-src
#   4. sudo bash scripts/install.sh
#   5. Follow the prompts (domain name, email for TLS, etc.)
#   6. Edit /opt/commentcustomer/.env with your real DATABASE_URL + SESSION_SECRET
#   7. sudo systemctl restart commentcustomer
#
# Re-running this script is safe (idempotent).
###############################################################################
set -euo pipefail

APP_USER="commentcustomer"
APP_DIR="/opt/commentcustomer"
SRC_DIR="$(cd "$(dirname "$0")/.." && pwd)"
NODE_MAJOR="20"

# ---------- helpers ----------------------------------------------------------
log()  { printf "\033[1;36m[install]\033[0m %s\n" "$*"; }
warn() { printf "\033[1;33m[warn]\033[0m %s\n" "$*"; }
err()  { printf "\033[1;31m[err]\033[0m %s\n" "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || err "Run with sudo: sudo bash scripts/install.sh"

# ---------- prompts ----------------------------------------------------------
read -rp "Domain name (e.g. commentcustomer.ai), or 'skip' to configure later: " DOMAIN
read -rp "Email for Let's Encrypt notifications (or 'skip'): " LE_EMAIL
read -rp "Install PostgreSQL locally on this server? [y/N]: " INSTALL_PG
INSTALL_PG="${INSTALL_PG:-N}"

# ---------- 1. system packages ----------------------------------------------
log "Updating apt..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq curl ca-certificates gnupg lsb-release \
  build-essential git ufw fail2ban nginx certbot python3-certbot-nginx

# ---------- 2. Node 20 (NodeSource) ------------------------------------------
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt "$NODE_MAJOR" ]; then
  log "Installing Node ${NODE_MAJOR}..."
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  apt-get install -y -qq nodejs
else
  log "Node $(node -v) already installed."
fi

# ---------- 3. PostgreSQL (optional) -----------------------------------------
if [[ "$INSTALL_PG" =~ ^[Yy]$ ]]; then
  if ! command -v psql >/dev/null 2>&1; then
    log "Installing PostgreSQL..."
    apt-get install -y -qq postgresql postgresql-contrib
    systemctl enable --now postgresql
  fi
  PG_PASS="$(openssl rand -hex 16)"
  sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='${APP_USER}'" \
    | grep -q 1 || sudo -u postgres createuser "$APP_USER"
  # Use stdin (heredoc) so the password is NOT visible in `ps aux` or /proc
  sudo -u postgres psql -q >/dev/null <<SQL
ALTER USER ${APP_USER} WITH PASSWORD '${PG_PASS}';
SQL
  sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${APP_USER}'" \
    | grep -q 1 || sudo -u postgres createdb -O "$APP_USER" "$APP_USER"
  LOCAL_DB_URL="postgresql://${APP_USER}:${PG_PASS}@127.0.0.1:5432/${APP_USER}"
  log "Local Postgres ready. DATABASE_URL = ${LOCAL_DB_URL}"
fi

# ---------- 4. app user ------------------------------------------------------
# Home dir is /home/commentcustomer (not $APP_DIR) so that npm cache, .config,
# and shell history don't pollute the application root.
if ! id "$APP_USER" >/dev/null 2>&1; then
  log "Creating user '${APP_USER}'..."
  useradd --system --create-home --home-dir "/home/${APP_USER}" --shell /bin/bash "$APP_USER"
fi

# ---------- 5. copy source ---------------------------------------------------
log "Syncing source to ${APP_DIR}..."
mkdir -p "$APP_DIR"
rsync -a --delete \
  --exclude='.git' --exclude='node_modules' --exclude='.env' --exclude='.local' \
  --exclude='.vercel' --exclude='attached_assets' \
  "${SRC_DIR}/" "${APP_DIR}/"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

# ---------- 6. .env ----------------------------------------------------------
if [ ! -f "${APP_DIR}/.env" ]; then
  log "Creating starter .env (you must edit this)..."
  SESSION_SECRET="$(openssl rand -hex 32)"
  cat > "${APP_DIR}/.env" <<EOF
DATABASE_URL=${LOCAL_DB_URL:-postgresql://user:password@host:5432/dbname?sslmode=require}
SESSION_SECRET=${SESSION_SECRET}
NODE_ENV=production
PORT=5000
PUBLIC_URL=https://${DOMAIN:-yourdomain.com}
EOF
  chown "$APP_USER:$APP_USER" "${APP_DIR}/.env"
  chmod 600 "${APP_DIR}/.env"
fi

# ---------- 7. npm install ---------------------------------------------------
log "Installing Node dependencies (this takes a minute)..."
sudo -u "$APP_USER" -H bash -c "cd '${APP_DIR}' && npm install --omit=dev --no-audit --no-fund"

# ---------- 8. systemd unit --------------------------------------------------
log "Installing systemd service..."
install -m 644 "${SRC_DIR}/scripts/commentcustomer.service" /etc/systemd/system/commentcustomer.service
systemctl daemon-reload
systemctl enable commentcustomer
systemctl restart commentcustomer
sleep 2
systemctl --no-pager --lines=5 status commentcustomer || true

# ---------- 9. nginx + TLS ---------------------------------------------------
if [ "$DOMAIN" != "skip" ] && [ -n "$DOMAIN" ]; then
  log "Configuring nginx for ${DOMAIN}..."
  sed "s/__DOMAIN__/${DOMAIN}/g" "${SRC_DIR}/scripts/nginx.conf.example" \
    > "/etc/nginx/sites-available/commentcustomer"
  ln -sf /etc/nginx/sites-available/commentcustomer /etc/nginx/sites-enabled/commentcustomer
  rm -f /etc/nginx/sites-enabled/default
  nginx -t && systemctl reload nginx

  if [ "$LE_EMAIL" != "skip" ] && [ -n "$LE_EMAIL" ]; then
    log "Requesting Let's Encrypt cert for ${DOMAIN}..."
    certbot --nginx --non-interactive --agree-tos --redirect \
      --email "$LE_EMAIL" -d "$DOMAIN" -d "www.${DOMAIN}" || \
      warn "certbot failed — check DNS A record for ${DOMAIN} points to this server."
  fi
fi

# ---------- 10. firewall -----------------------------------------------------
log "Configuring ufw..."
ufw --force reset >/dev/null
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw --force enable

systemctl enable --now fail2ban

# ---------- done -------------------------------------------------------------
cat <<EOF

\033[1;32m✓ Install complete.\033[0m

Next steps:
  1. Edit secrets:    sudo nano ${APP_DIR}/.env
  2. Restart app:     sudo systemctl restart commentcustomer
  3. Tail logs:       sudo journalctl -u commentcustomer -f
  4. Health check:    curl https://${DOMAIN:-localhost}/healthz

Default admin login (change immediately):
  email:    admin@commentcustomer.ai
  password: Admin@2025!Demo

EOF
