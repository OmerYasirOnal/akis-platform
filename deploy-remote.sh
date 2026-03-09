#!/bin/bash
set -euo pipefail

# ═══════════════════════════════════════════
# AKIS Remote Deploy (SSH → OCI ARM64)
# Usage: ./deploy-remote.sh [branch]
# ═══════════════════════════════════════════

# ── KONFİGÜRASYON ──
SSH_USER="${AKIS_SSH_USER:-ubuntu}"
SSH_HOST="${AKIS_SSH_HOST:-141.147.25.123}"
SSH_KEY="${AKIS_SSH_KEY:-~/.ssh/id_ed25519}"
REMOTE_DIR="/home/$SSH_USER/akis"
BRANCH="${1:-main}"

# Renkli output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()  { echo -e "${BLUE}[AKIS]${NC} $1"; }
ok()   { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }

SSH_CMD="ssh -i $SSH_KEY $SSH_USER@$SSH_HOST"

# ── Pre-checks ──
log "Testing SSH connection..."
$SSH_CMD "echo 'SSH OK'" || err "SSH connection failed. Check SSH_HOST and SSH_KEY."
ok "SSH connected to $SSH_HOST"

# ── 1. Local: Build frontend ──
log "Building frontend locally..."
cd "$(dirname "$0")/frontend"
npm ci --silent 2>/dev/null || npm install --silent
npm run build
ok "Frontend built"
cd ..

# ── 2. Local: Git push ──
log "Pushing latest code to GitHub..."
git push origin "$BRANCH" 2>/dev/null || warn "Git push skipped (may already be up to date)"

# ── 3. Remote: Pull & Deploy ──
log "Deploying on remote server..."

$SSH_CMD << 'REMOTE_SCRIPT'
set -euo pipefail

cd ~/akis || { echo "Creating project directory..."; mkdir -p ~/akis; cd ~/akis; }

# Pull latest code
if [ -d .git ]; then
  git pull origin main
else
  git clone https://github.com/OmerYasirOnal/akis-platform-devolopment.git .
fi

# Docker compose command
if docker compose version >/dev/null 2>&1; then
  DC="docker compose"
else
  DC="docker-compose"
fi

# Build frontend on server (ARM64 native)
echo "[AKIS] Building frontend on server..."
cd frontend
npm ci --silent 2>/dev/null || npm install --silent
npm run build
cd ..

# Build and restart containers
echo "[AKIS] Building backend Docker image..."
$DC build backend

echo "[AKIS] Restarting services..."
$DC down --remove-orphans
$DC up -d

# Wait and health check
echo "[AKIS] Waiting for services..."
sleep 8

for i in $(seq 1 15); do
  if curl -sf http://localhost:3000/health >/dev/null 2>&1; then
    echo "[✓] Backend healthy"
    break
  fi
  [ "$i" -eq 15 ] && { echo "[✗] Health check failed"; exit 1; }
  sleep 3
done

$DC ps
echo ""
echo "[✓] Deploy complete! https://staging.akisflow.com"
REMOTE_SCRIPT

ok "Remote deploy finished!"
