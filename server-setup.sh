#!/usr/bin/env bash
# One-time setup script for Ubuntu 22.04 / 24.04 server
# Run as root or with sudo: bash server-setup.sh
set -euo pipefail

echo "──────────────────────────────────────────────"
echo "  Eshtehard — Server Setup"
echo "──────────────────────────────────────────────"

# ── 1. System update ──────────────────────────────
apt-get update && apt-get upgrade -y

# ── 2. Install Docker ─────────────────────────────
if ! command -v docker &>/dev/null; then
  echo "Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
else
  echo "Docker already installed: $(docker --version)"
fi

# ── 3. Add current user to docker group (if not root) ─────────────────────
if [ "$EUID" -ne 0 ]; then
  usermod -aG docker "$USER"
  echo "Added $USER to docker group. Re-login required."
fi

# ── 4. Create app directory ───────────────────────
APP_DIR="/opt/eshtehard"
mkdir -p "$APP_DIR"
echo "App directory: $APP_DIR"

# ── 5. Create .env from template ─────────────────
if [ ! -f "$APP_DIR/.env" ]; then
  echo ""
  echo "⚠  No .env file found at $APP_DIR/.env"
  echo "   Create it before starting the app:"
  echo ""
  echo "   nano $APP_DIR/.env"
  echo ""
  echo "   Required variables (see .env.example):"
  echo "     DB_USER, DB_PASSWORD, DB_NAME"
  echo "     JWT_ACCESS_SECRET, JWT_REFRESH_SECRET"
  echo "     KAVENEGAR_API_KEY"
  echo "     CORS_ORIGIN  (e.g. https://yourdomain.com)"
else
  echo ".env file already exists."
fi

# ── 6. GitHub Container Registry login ───────────
echo ""
echo "To pull images from ghcr.io/logistic-pro/, the server must be authenticated."
echo "Create a GitHub Personal Access Token (read:packages scope) and run:"
echo ""
echo "  docker login ghcr.io -u <github-username> -p <PAT>"
echo ""
echo "Or add a deploy token via the repository package settings."

# ── 7. (Optional) Nginx reverse proxy + SSL ──────
echo ""
echo "──────────────────────────────────────────────"
echo " OPTIONAL: SSL with Certbot"
echo "──────────────────────────────────────────────"
echo " apt-get install -y nginx certbot python3-certbot-nginx"
echo " certbot --nginx -d yourdomain.com"
echo " Then proxy port 80 → this server's Docker port 80"
echo ""

echo "✅ Setup complete. Next steps:"
echo "  1. Fill in $APP_DIR/.env"
echo "  2. docker login ghcr.io"
echo "  3. Push to main branch — CI/CD will deploy automatically"
echo "  4. Or manually: docker compose -f $APP_DIR/docker-compose.prod.yml up -d"
