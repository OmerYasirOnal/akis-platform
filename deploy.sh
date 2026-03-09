#!/bin/bash
set -euo pipefail

# ═══════════════════════════════════════════
# AKIS Deploy Script
# Usage: ./deploy.sh [staging|local]
# ═══════════════════════════════════════════

ENV="${1:-local}"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

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

# ── Pre-checks ──
log "Checking prerequisites..."
command -v docker >/dev/null 2>&1 || err "Docker not found"
command -v docker compose >/dev/null 2>&1 || command -v docker-compose >/dev/null 2>&1 || err "Docker Compose not found"

# Docker compose command detection
if docker compose version >/dev/null 2>&1; then
  DC="docker compose"
else
  DC="docker-compose"
fi

# ── .env check ──
if [ ! -f "$PROJECT_DIR/backend/.env" ]; then
  err "backend/.env not found! Copy from backend/.env.example and fill in values."
fi

# ── Frontend build ──
log "Building frontend..."
cd "$PROJECT_DIR/frontend"
npm ci --silent 2>/dev/null || npm install --silent
npm run build
ok "Frontend built → frontend/dist/"

# ── Docker operations ──
cd "$PROJECT_DIR"

if [ "$ENV" = "staging" ]; then
  log "Deploying to STAGING..."

  # Build backend image
  log "Building backend Docker image..."
  $DC build backend
  ok "Backend image built"

  # Stop old containers, start new
  log "Restarting services..."
  $DC down --remove-orphans
  $DC up -d db

  # Wait for DB
  log "Waiting for PostgreSQL..."
  sleep 5
  until $DC exec db pg_isready -U postgres >/dev/null 2>&1; do
    sleep 2
  done
  ok "PostgreSQL ready"

  # Run migrations (if applicable)
  log "Running database migrations..."
  $DC run --rm backend npx drizzle-kit push 2>/dev/null || warn "Migration skipped (may not be needed)"

  # Start all services
  $DC up -d
  ok "All services started"

  # Health check
  log "Running health checks..."
  sleep 5
  for i in $(seq 1 10); do
    if curl -sf http://localhost:3000/health >/dev/null 2>&1; then
      ok "Backend healthy"
      break
    fi
    [ "$i" -eq 10 ] && err "Backend health check failed after 10 attempts"
    sleep 3
  done

  # Show status
  log "Container status:"
  $DC ps

  echo ""
  ok "Deploy complete! Site: https://staging.akisflow.com"

elif [ "$ENV" = "local" ]; then
  log "Starting LOCAL development..."

  # Start only DB
  $DC -f docker-compose.dev.yml up -d

  log "Waiting for PostgreSQL..."
  sleep 3
  until $DC -f docker-compose.dev.yml exec db pg_isready -U postgres >/dev/null 2>&1; do
    sleep 2
  done
  ok "PostgreSQL ready on localhost:5433"

  echo ""
  ok "DB running. Start backend and frontend manually:"
  echo "  Backend:  cd backend && DATABASE_URL=postgresql://postgres:postgres@localhost:5433/akis_v2 DEV_MODE=true npx tsx watch src/server.ts"
  echo "  Frontend: cd frontend && npm run dev"

else
  err "Unknown environment: $ENV (use 'staging' or 'local')"
fi
