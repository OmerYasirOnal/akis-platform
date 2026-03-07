#!/bin/bash
# =============================================================================
# AKIS Manual Staging Deployment
# =============================================================================
# Deploys current local git HEAD to OCI staging via SSH (no GitHub Actions).
#
# Usage:
#   ./scripts/staging_deploy_manual.sh --host IP --user USER --key PATH [options]
#
# Required Parameters:
#   --host IP       OCI VM IP address or domain
#   --user USER     SSH username (e.g., ubuntu, opc)
#   --key PATH      Path to SSH private key file
#
# Optional Parameters:
#   --ghcr-user USER     GHCR username for faster image pulls
#   --ghcr-token TOKEN   GHCR PAT with read:packages scope
#   --skip-tests         Skip typecheck/lint (emergency deploy)
#   --skip-backup        Skip pre-deploy database backup
#   --force              Continue on test failures
#   --confirm            Execute deployment (dry-run without this)
#   --help               Show this help message
#
# Exit Codes:
#   0 - Success
#   1 - Preflight failure
#   2 - Build/test failure
#   3 - Deploy failure
#   4 - Verification failure
#
# Examples:
#   # Dry-run (preview commands)
#   ./scripts/staging_deploy_manual.sh --host 141.147.25.123 --user ubuntu --key ~/.ssh/akis-oci
#
#   # Full deploy with GHCR
#   ./scripts/staging_deploy_manual.sh --host 141.147.25.123 --user ubuntu --key ~/.ssh/akis-oci \
#     --ghcr-user USERNAME --ghcr-token TOKEN --confirm
#
#   # Emergency deploy (skip tests & backup)
#   ./scripts/staging_deploy_manual.sh --host 141.147.25.123 --user ubuntu --key ~/.ssh/akis-oci \
#     --skip-tests --skip-backup --confirm
# =============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
SSH_HOST=""
SSH_USER=""
SSH_KEY=""
GHCR_USER=""
GHCR_TOKEN=""
SKIP_TESTS=false
SKIP_BACKUP=false
FORCE=false
CONFIRM=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --host)
      SSH_HOST="$2"
      shift 2
      ;;
    --user)
      SSH_USER="$2"
      shift 2
      ;;
    --key)
      SSH_KEY="$2"
      shift 2
      ;;
    --ghcr-user)
      GHCR_USER="$2"
      shift 2
      ;;
    --ghcr-token)
      GHCR_TOKEN="$2"
      shift 2
      ;;
    --skip-tests)
      SKIP_TESTS=true
      shift
      ;;
    --skip-backup)
      SKIP_BACKUP=true
      shift
      ;;
    --force)
      FORCE=true
      shift
      ;;
    --confirm)
      CONFIRM=true
      shift
      ;;
    --help)
      head -n 49 "$0" | tail -n 45 | sed 's/^# //'
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Run with --help for usage information"
      exit 1
      ;;
  esac
done

# Dry-run helper
dry_run() {
  if [ "$CONFIRM" = false ]; then
    echo -e "${BLUE}[DRY-RUN]${NC} Would execute: $*"
    return 0
  else
    eval "$@"
  fi
}

# Error handler
error_exit() {
  echo -e "${RED}ERROR: $1${NC}"
  echo ""
  if [ -n "${2:-}" ]; then
    echo "WHAT TO DO NEXT:"
    echo "$2"
  fi
  exit "${3:-1}"
}

# =============================================================================
# Banner
# =============================================================================
echo "=============================================="
echo "AKIS Manual Staging Deployment"
echo "=============================================="

# =============================================================================
# Phase 1: Preflight Checks
# =============================================================================
echo ""
echo "Phase 1: Preflight checks"
echo "-------------------------------------------"

# Validate required arguments
if [ -z "$SSH_HOST" ]; then
  error_exit "Missing required argument: --host" \
    "Specify the OCI VM IP address or domain with --host" 1
fi

if [ -z "$SSH_USER" ]; then
  error_exit "Missing required argument: --user" \
    "Specify the SSH username with --user" 1
fi

if [ -z "$SSH_KEY" ]; then
  error_exit "Missing required argument: --key" \
    "Specify the path to SSH private key with --key" 1
fi

# Expand tilde in SSH_KEY path
SSH_KEY="${SSH_KEY/#\~/$HOME}"

# Validate SSH key exists
if [ ! -f "$SSH_KEY" ]; then
  error_exit "SSH key file not found: $SSH_KEY" \
    "Verify the key path is correct" 1
fi

# Determine expected commit
if ! EXPECTED_FULL=$(git rev-parse HEAD 2>/dev/null); then
  error_exit "Failed to determine git HEAD" \
    "Ensure you are in the devagents repository root" 1
fi

EXPECTED_SHORT=$(echo "$EXPECTED_FULL" | cut -c1-7)

echo "Target commit: ${EXPECTED_SHORT} (full: ${EXPECTED_FULL})"
echo "SSH target: ${SSH_USER}@${SSH_HOST}"
echo "SSH key: ${SSH_KEY}"

if [ -n "$GHCR_USER" ] && [ -n "$GHCR_TOKEN" ]; then
  echo "GHCR credentials: Provided (faster deploys)"
else
  echo "GHCR credentials: Not provided (will use server-side build)"
fi

if [ "$CONFIRM" = false ]; then
  echo -e "${YELLOW}Deployment mode: DRY-RUN (use --confirm to execute)${NC}"
else
  echo -e "${GREEN}Deployment mode: CONFIRMED${NC}"
fi

# Check git working tree
if ! git diff-index --quiet HEAD -- 2>/dev/null; then
  if [ "$CONFIRM" = true ]; then
    echo -e "${YELLOW}⚠️  Warning: Git working tree is dirty (uncommitted changes)${NC}"
    if [ "$FORCE" = false ]; then
      error_exit "Refusing to deploy dirty working tree" \
        "Commit your changes or use --force to override" 1
    fi
    echo -e "${YELLOW}Continuing anyway (--force specified)${NC}"
  else
    echo -e "${YELLOW}⚠️  Warning: Git working tree is dirty${NC}"
  fi
else
  echo "✅ Git working tree clean"
fi

# Verify required files exist
REQUIRED_FILES=(
  "deploy/oci/staging/deploy.sh"
  "deploy/oci/staging/docker-compose.yml"
  "deploy/oci/staging/Caddyfile"
  "Dockerfile.backend"
  "backend/package.json"
  "backend/tsconfig.json"
  "pipeline/backend/agents/scribe/ScribeAgent.ts"
)

for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    error_exit "Required file not found: $file" \
      "Ensure you are in the devagents repository root" 1
  fi
done

echo "✅ Required files present"

# Test SSH connectivity
echo "Testing SSH connectivity..."
if [ "$CONFIRM" = true ]; then
  if ! ssh -i "$SSH_KEY" -o ConnectTimeout=10 -o StrictHostKeyChecking=no \
    "${SSH_USER}@${SSH_HOST}" "echo ok" &>/dev/null; then
    error_exit "SSH connection failed" \
      "1. Verify host is reachable: ping ${SSH_HOST}
   2. Verify SSH key has correct permissions: chmod 600 ${SSH_KEY}
   3. Verify key is authorized on server" 1
  fi
  echo "✅ SSH connectivity verified"
else
  echo "[DRY-RUN] Would test SSH connectivity"
fi

# =============================================================================
# Phase 2: Quality Gates (Optional)
# =============================================================================
echo ""
echo "Phase 2: Quality gates (typecheck/lint)"
echo "-------------------------------------------"

if [ "$SKIP_TESTS" = true ]; then
  echo "⏭️  Skipped (--skip-tests specified)"
else
  # Backend typecheck
  echo "Running backend typecheck..."
  if [ "$CONFIRM" = true ]; then
    if ! pnpm -C backend typecheck; then
      if [ "$FORCE" = false ]; then
        error_exit "Backend typecheck failed" \
          "Fix type errors or use --force to continue" 2
      fi
      echo -e "${YELLOW}⚠️  Backend typecheck failed but continuing (--force)${NC}"
    else
      echo "✅ Backend typecheck passed"
    fi
  else
    echo "[DRY-RUN] Would run: pnpm -C backend typecheck"
  fi

  # Backend lint
  echo "Running backend lint..."
  if [ "$CONFIRM" = true ]; then
    if ! pnpm -C backend lint; then
      if [ "$FORCE" = false ]; then
        error_exit "Backend lint failed" \
          "Fix lint errors or use --force to continue" 2
      fi
      echo -e "${YELLOW}⚠️  Backend lint failed but continuing (--force)${NC}"
    else
      echo "✅ Backend lint passed"
    fi
  else
    echo "[DRY-RUN] Would run: pnpm -C backend lint"
  fi

  # Frontend typecheck
  echo "Running frontend typecheck..."
  if [ "$CONFIRM" = true ]; then
    if ! pnpm -C frontend typecheck; then
      if [ "$FORCE" = false ]; then
        error_exit "Frontend typecheck failed" \
          "Fix type errors or use --force to continue" 2
      fi
      echo -e "${YELLOW}⚠️  Frontend typecheck failed but continuing (--force)${NC}"
    else
      echo "✅ Frontend typecheck passed"
    fi
  else
    echo "[DRY-RUN] Would run: pnpm -C frontend typecheck"
  fi

  # Frontend lint
  echo "Running frontend lint..."
  if [ "$CONFIRM" = true ]; then
    if ! pnpm -C frontend lint; then
      if [ "$FORCE" = false ]; then
        error_exit "Frontend lint failed" \
          "Fix lint errors or use --force to continue" 2
      fi
      echo -e "${YELLOW}⚠️  Frontend lint failed but continuing (--force)${NC}"
    else
      echo "✅ Frontend lint passed"
    fi
  else
    echo "[DRY-RUN] Would run: pnpm -C frontend lint"
  fi
fi

# =============================================================================
# Phase 3: Frontend Build
# =============================================================================
echo ""
echo "Phase 3: Frontend build"
echo "-------------------------------------------"

# Check if frontend/dist exists and is up-to-date
NEEDS_BUILD=false

if [ ! -d "frontend/dist" ]; then
  echo "frontend/dist not found - build required"
  NEEDS_BUILD=true
elif [ ! -f "frontend/dist/index.html" ]; then
  echo "frontend/dist/index.html missing - build required"
  NEEDS_BUILD=true
else
  # Check if dist is stale (src newer than dist)
  if [ -n "$(find frontend/src -newer frontend/dist/index.html -print -quit 2>/dev/null)" ]; then
    echo "frontend/src has changes newer than dist - rebuild required"
    NEEDS_BUILD=true
  else
    echo "✅ frontend/dist up-to-date (skipping rebuild)"
  fi
fi

if [ "$NEEDS_BUILD" = true ]; then
  echo "Building frontend..."
  if [ "$CONFIRM" = true ]; then
    if ! pnpm -C frontend build; then
      error_exit "Frontend build failed" \
        "Check build errors above" 2
    fi
    echo "✅ Frontend build completed"
  else
    echo "[DRY-RUN] Would run: pnpm -C frontend build"
  fi
fi

# Verify dist is not empty
if [ "$CONFIRM" = true ]; then
  if [ ! -f "frontend/dist/index.html" ]; then
    error_exit "frontend/dist/index.html not found after build" \
      "Frontend build may have failed silently" 2
  fi
fi

# =============================================================================
# Phase 4: Pre-Deploy Backup (on server)
# =============================================================================
echo ""
echo "Phase 4: Pre-deploy backup"
echo "-------------------------------------------"

if [ "$SKIP_BACKUP" = true ]; then
  echo "⏭️  Skipped (--skip-backup specified)"
else
  BACKUP_FILENAME="manual-$(date +%Y%m%d-%H%M%S).sql"

  if [ "$CONFIRM" = true ]; then
    echo "Creating database backup: ${BACKUP_FILENAME}"

    # Create backup directory if needed
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "${SSH_USER}@${SSH_HOST}" \
      "mkdir -p /opt/akis/backups" || true

    # Create backup (non-blocking on failure)
    if ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "${SSH_USER}@${SSH_HOST}" \
      "docker exec akis-staging-db pg_dump -U akis akis_staging > /opt/akis/backups/${BACKUP_FILENAME} 2>/dev/null"; then
      echo "✅ Database backup created: ${BACKUP_FILENAME}"
    else
      echo -e "${YELLOW}⚠️  Database backup failed (non-critical, continuing)${NC}"
    fi

    # Cleanup old backups (>7 days)
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "${SSH_USER}@${SSH_HOST}" \
      "find /opt/akis/backups -name '*.sql' -mtime +7 -delete 2>/dev/null" || true
  else
    echo "[DRY-RUN] Would create backup: ${BACKUP_FILENAME}"
    echo "[DRY-RUN] Would cleanup backups older than 7 days"
  fi
fi

# =============================================================================
# Phase 5: File Transfer
# =============================================================================
echo ""
echo "Phase 5: File transfer"
echo "-------------------------------------------"

if [ "$CONFIRM" = true ]; then
  # Create tarballs for efficient transfer
  echo "Creating tarballs..."

  # Repo source tarball (backend + pipeline + Dockerfile.backend)
  # deploy.sh on server uses /opt/akis/repo-src/ as Docker build context
  # Dockerfile.backend needs: backend/ + pipeline/backend/ at repo root
  tar -czf /tmp/repo-src-$$.tar.gz \
    Dockerfile.backend \
    backend/package.json backend/pnpm-lock.yaml backend/tsconfig.json \
    backend/drizzle.config.ts backend/src backend/migrations \
    pipeline/backend

  # Frontend dist tarball
  tar -czf /tmp/frontend-dist-$$.tar.gz -C frontend/dist .

  echo "✅ Tarballs created"

  # Transfer deploy script
  echo "Copying deploy.sh..."
  scp -i "$SSH_KEY" -o StrictHostKeyChecking=no \
    deploy/oci/staging/deploy.sh "${SSH_USER}@${SSH_HOST}:/opt/akis/deploy.sh"

  ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "${SSH_USER}@${SSH_HOST}" \
    "chmod +x /opt/akis/deploy.sh"

  echo "✅ Copied deploy.sh"

  # Transfer docker-compose.yml
  echo "Copying docker-compose.yml..."
  scp -i "$SSH_KEY" -o StrictHostKeyChecking=no \
    deploy/oci/staging/docker-compose.yml "${SSH_USER}@${SSH_HOST}:/opt/akis/docker-compose.yml"

  echo "✅ Copied docker-compose.yml"

  # Transfer Caddyfile
  echo "Copying Caddyfile..."
  scp -i "$SSH_KEY" -o StrictHostKeyChecking=no \
    deploy/oci/staging/Caddyfile "${SSH_USER}@${SSH_HOST}:/opt/akis/Caddyfile"

  echo "✅ Copied Caddyfile"

  # Transfer and extract repo source (replaces old backend-src approach)
  echo "Copying repo source (backend + pipeline)..."
  scp -i "$SSH_KEY" -o StrictHostKeyChecking=no \
    /tmp/repo-src-$$.tar.gz "${SSH_USER}@${SSH_HOST}:/tmp/repo-src.tar.gz"

  ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "${SSH_USER}@${SSH_HOST}" \
    "rm -rf /opt/akis/repo-src && \
     mkdir -p /opt/akis/repo-src && \
     tar -xzf /tmp/repo-src.tar.gz -C /opt/akis/repo-src && \
     rm /tmp/repo-src.tar.gz"

  rm /tmp/repo-src-$$.tar.gz

  echo "✅ Copied repo source (backend + pipeline + Dockerfile.backend)"

  # Transfer and extract frontend dist
  echo "Copying frontend dist..."
  scp -i "$SSH_KEY" -o StrictHostKeyChecking=no \
    /tmp/frontend-dist-$$.tar.gz "${SSH_USER}@${SSH_HOST}:/tmp/frontend-dist.tar.gz"

  ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "${SSH_USER}@${SSH_HOST}" \
    "mkdir -p /opt/akis/frontend && \
     rm -rf /opt/akis/frontend/* && \
     tar -xzf /tmp/frontend-dist.tar.gz -C /opt/akis/frontend && \
     rm /tmp/frontend-dist.tar.gz"

  rm /tmp/frontend-dist-$$.tar.gz

  echo "✅ Copied frontend dist"
else
  echo "[DRY-RUN] Would create tarball: repo-src.tar.gz (backend + pipeline + Dockerfile.backend)"
  echo "[DRY-RUN] Would create tarball: frontend-dist.tar.gz"
  echo "[DRY-RUN] Would copy: deploy.sh → /opt/akis/deploy.sh"
  echo "[DRY-RUN] Would copy: docker-compose.yml → /opt/akis/docker-compose.yml"
  echo "[DRY-RUN] Would copy: Caddyfile → /opt/akis/Caddyfile"
  echo "[DRY-RUN] Would copy: repo source → /opt/akis/repo-src/ (backend + pipeline)"
  echo "[DRY-RUN] Would copy: frontend dist → /opt/akis/frontend/"
fi

# =============================================================================
# Phase 6: Remote Execution
# =============================================================================
echo ""
echo "Phase 6: Remote execution"
echo "-------------------------------------------"

if [ "$CONFIRM" = true ]; then
  echo ">>> Executing /opt/akis/deploy.sh ${EXPECTED_SHORT}"
  echo ""

  # Build SSH command with optional GHCR credentials
  SSH_CMD="cd /opt/akis && "

  if [ -n "$GHCR_USER" ] && [ -n "$GHCR_TOKEN" ]; then
    SSH_CMD+="GHCR_USERNAME='${GHCR_USER}' GHCR_READ_TOKEN='${GHCR_TOKEN}' "
  fi

  SSH_CMD+="/opt/akis/deploy.sh '${EXPECTED_SHORT}'"

  # Execute deploy script on server with secret redaction
  if ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "${SSH_USER}@${SSH_HOST}" \
    "$SSH_CMD" 2>&1 | grep -v -E '(PASSWORD|SECRET|KEY|TOKEN)='; then
    echo ""
    echo "✅ Deploy script completed successfully"
  else
    DEPLOY_EXIT=${PIPESTATUS[0]}
    echo ""
    echo -e "${RED}❌ Deploy script failed with exit code: ${DEPLOY_EXIT}${NC}"
    echo ""
    echo "WHAT TO DO NEXT:"
    echo "  1. Check container status: ssh -i ${SSH_KEY} ${SSH_USER}@${SSH_HOST} 'cd /opt/akis && docker compose ps'"
    echo "  2. Check backend logs: ssh -i ${SSH_KEY} ${SSH_USER}@${SSH_HOST} 'cd /opt/akis && docker compose logs --tail=100 backend'"
    echo "  3. Check deploy script logs above for error details"
    exit 3
  fi
else
  echo "[DRY-RUN] Would execute on server:"
  echo "  cd /opt/akis"
  if [ -n "$GHCR_USER" ] && [ -n "$GHCR_TOKEN" ]; then
    echo "  GHCR_USERNAME='...' GHCR_READ_TOKEN='...' /opt/akis/deploy.sh '${EXPECTED_SHORT}'"
  else
    echo "  /opt/akis/deploy.sh '${EXPECTED_SHORT}'"
  fi
fi

# =============================================================================
# Phase 7: Post-Deploy Verification
# =============================================================================
echo ""
echo "Phase 7: Post-deploy verification"
echo "-------------------------------------------"

if [ "$CONFIRM" = true ]; then
  echo "Waiting 30 seconds for stabilization..."
  sleep 30

  echo "Running smoke tests..."
  echo ""

  # Run smoke tests (use staging domain, not IP - Caddy expects domain)
  STAGING_DOMAIN="staging.akisflow.com"
  if ./scripts/staging_smoke.sh --host "${STAGING_DOMAIN}" --commit "${EXPECTED_SHORT}"; then
    echo ""
    echo "✅ All smoke tests passed"
  else
    SMOKE_EXIT=$?
    echo ""
    echo -e "${RED}❌ Smoke tests failed with exit code: ${SMOKE_EXIT}${NC}"

    # Collect diagnostics
    echo ""
    echo "=== DEPLOYMENT FAILURE DIAGNOSTICS ==="
    echo ""
    echo "--- Container Status ---"
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "${SSH_USER}@${SSH_HOST}" \
      "cd /opt/akis && docker compose ps" || true

    echo ""
    echo "--- Backend Container Image ---"
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "${SSH_USER}@${SSH_HOST}" \
      "docker inspect akis-staging-backend --format 'Image: {{.Config.Image}}\nCreated: {{.Created}}' 2>/dev/null" || true

    echo ""
    echo "--- Backend Logs (last 100 lines, secrets redacted) ---"
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "${SSH_USER}@${SSH_HOST}" \
      "cd /opt/akis && docker compose logs --tail=100 backend 2>&1 | grep -v -E '(PASSWORD|SECRET|KEY|TOKEN)='" || true

    echo ""
    echo "=== END DIAGNOSTICS ==="
    echo ""

    # Offer rollback
    if [ -t 0 ]; then
      # Interactive terminal - prompt for rollback
      echo ""
      read -p "Would you like to rollback to the previous version? [y/N] " -n 1 -r
      echo ""
      if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Rolling back..."
        ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "${SSH_USER}@${SSH_HOST}" \
          "cd /opt/akis && \
           PREV_TAG=\$(docker inspect akis-staging-backend --format '{{.Config.Image}}' 2>/dev/null | sed 's/.*://') && \
           if [ -n \"\$PREV_TAG\" ] && [ \"\$PREV_TAG\" != '${EXPECTED_SHORT}' ]; then \
             docker compose stop backend && \
             BACKEND_VERSION=\$PREV_TAG docker compose up -d backend && \
             echo 'Rollback completed to '\$PREV_TAG; \
           else \
             echo 'No previous version found or already at target version'; \
           fi" || true
      fi
    else
      # Non-interactive - just print rollback command
      echo "ROLLBACK COMMAND (if needed):"
      echo "  ssh -i ${SSH_KEY} ${SSH_USER}@${SSH_HOST} 'cd /opt/akis && docker compose stop backend && BACKEND_VERSION=PREVIOUS_SHA docker compose up -d backend'"
    fi

    exit 4
  fi
else
  STAGING_DOMAIN="staging.akisflow.com"
  echo "[DRY-RUN] Would wait 30 seconds for stabilization"
  echo "[DRY-RUN] Would run: ./scripts/staging_smoke.sh --host ${STAGING_DOMAIN} --commit ${EXPECTED_SHORT}"
fi

# =============================================================================
# Phase 8: Summary
# =============================================================================
echo ""
echo "=============================================="
echo "Deployment Summary"
echo "=============================================="
echo "Expected commit: ${EXPECTED_SHORT}"
if [ "$CONFIRM" = true ]; then
  echo "Deployed commit: ${EXPECTED_SHORT}"
  echo "Verification: PASSED"
  echo ""
  echo -e "${GREEN}Deployment Status: ✅ SUCCESS${NC}"
  echo ""
  echo "Verification URLs:"
  echo "  https://staging.akisflow.com/health"
  echo "  https://staging.akisflow.com/ready"
  echo "  https://staging.akisflow.com/version"
else
  echo ""
  echo -e "${YELLOW}DRY-RUN COMPLETE${NC}"
  echo ""
  echo "To execute this deployment, add --confirm to the command."
fi
echo "=============================================="

exit 0
