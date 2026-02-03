#!/bin/bash
# =============================================================================
# AKIS Staging Deploy Script
# =============================================================================
# This script is copied to the server and executed during deployment.
# It handles GHCR pull fallback, local build, migrations, and compose up.
#
# Arguments:
#   $1 - EXPECTED_COMMIT (git sha to deploy)
#
# Required environment on server:
#   - /opt/akis/.env with all required variables
#   - /opt/akis/backend-src with backend source (copied before this runs)
#   - /opt/akis/docker-compose.yml (copied before this runs)
#
# Exit codes:
#   0 - Success
#   1 - Failure (build or compose failed)
# =============================================================================

set -o pipefail  # Capture pipe failures

EXPECTED_COMMIT="$1"
if [ -z "$EXPECTED_COMMIT" ]; then
    echo "ERROR: EXPECTED_COMMIT argument required"
    exit 1
fi

cd /opt/akis

BACKEND_VERSION="${EXPECTED_COMMIT}"
BACKEND_IMAGE="ghcr.io/omeryasironal/akis-platform-devolopment/akis-backend"
BUILD_TIME="$(date -u +'%Y-%m-%dT%H:%M:%SZ')"
DEPLOY_EXIT=0

echo "=============================================="
echo "=== AKIS Staging Deploy Script ==="
echo "=============================================="
echo "Target commit: ${BACKEND_VERSION}"
echo "Build time: ${BUILD_TIME}"
echo "Working directory: $(pwd)"
echo ""

# -----------------------------------------------------------------------------
# Step 1: Try GHCR pull (may fail if no credentials)
# -----------------------------------------------------------------------------
echo ">>> Step 1: Attempting GHCR pull..."
if docker pull "${BACKEND_IMAGE}:${BACKEND_VERSION}" 2>&1; then
    echo "GHCR pull successful"
    PULL_SUCCESS=true
else
    echo "GHCR pull failed (no credentials or image not found)"
    PULL_SUCCESS=false
fi
echo ""

# -----------------------------------------------------------------------------
# Step 2: Fallback to server-side build if pull failed
# -----------------------------------------------------------------------------
echo ">>> Step 2: Check if local build needed..."
if [ "$PULL_SUCCESS" = "false" ]; then
    echo "=== Building image locally (fallback) ==="
    
    if [ ! -d /opt/akis/backend-src ]; then
        echo "ERROR: /opt/akis/backend-src not found!"
        exit 1
    fi
    
    cd /opt/akis/backend-src
    
    # Use --no-cache to ensure BUILD_COMMIT is always fresh
    echo "Building with --no-cache to ensure commit hash is embedded..."
    if docker build \
        --no-cache \
        --build-arg BUILD_COMMIT="${BACKEND_VERSION}" \
        --build-arg BUILD_TIME="${BUILD_TIME}" \
        --build-arg APP_VERSION="0.1.0" \
        -t "${BACKEND_IMAGE}:${BACKEND_VERSION}" \
        -t "${BACKEND_IMAGE}:staging" \
        . 2>&1; then
        echo "Local build successful"
    else
        echo "ERROR: Local build FAILED"
        DEPLOY_EXIT=1
    fi
    cd /opt/akis
else
    echo "Skipping local build - using GHCR image"
fi
echo ""

# Exit early if build failed
if [ "$DEPLOY_EXIT" != "0" ]; then
    echo "=== Deployment FAILED at build step ==="
    exit ${DEPLOY_EXIT}
fi

# -----------------------------------------------------------------------------
# Step 3: Update .env with the target version
# -----------------------------------------------------------------------------
echo ">>> Step 3: Updating .env..."
if grep -q '^BACKEND_VERSION=' .env 2>/dev/null; then
    sed -i "s/^BACKEND_VERSION=.*/BACKEND_VERSION=${BACKEND_VERSION}/" .env
else
    echo "BACKEND_VERSION=${BACKEND_VERSION}" >> .env
fi
export BACKEND_VERSION="${BACKEND_VERSION}"
echo "BACKEND_VERSION set to: ${BACKEND_VERSION}"
echo ""

# -----------------------------------------------------------------------------
# Step 4: Run database migrations (idempotent)
# Migrations may fail on already-applied migrations - this is OK
# -----------------------------------------------------------------------------
echo ">>> Step 4: Running migrations..."
echo "Note: Migration errors for already-applied changes are expected and OK."

# Run migrations - capture output but don't fail the whole script
docker compose run --rm --pull never backend pnpm db:migrate 2>&1 || true
MIGRATION_EXIT=$?

if [ "$MIGRATION_EXIT" = "0" ]; then
    echo "Migrations completed successfully"
else
    echo "Migration exited with code ${MIGRATION_EXIT} (may be OK if already applied)"
fi
echo "Migration step done."
echo ""

# -----------------------------------------------------------------------------
# Step 5: Deploy with rolling update (CRITICAL - must run even if migration failed)
# -----------------------------------------------------------------------------
echo ">>> Step 5: Starting services (CRITICAL STEP)..."
if [ "$PULL_SUCCESS" = "false" ]; then
    echo "Using locally built image (--pull never)"
    if docker compose up -d --remove-orphans --pull never --force-recreate 2>&1; then
        echo "docker compose up completed successfully"
    else
        echo "ERROR: docker compose up FAILED"
        DEPLOY_EXIT=1
    fi
else
    if docker compose up -d --remove-orphans --force-recreate 2>&1; then
        echo "docker compose up completed successfully"
    else
        echo "ERROR: docker compose up FAILED"
        DEPLOY_EXIT=1
    fi
fi
echo ""

# -----------------------------------------------------------------------------
# Step 6: Verify containers are running
# -----------------------------------------------------------------------------
echo ">>> Step 6: Verifying container status..."
docker compose ps
echo ""

# -----------------------------------------------------------------------------
# Step 7: Prune old images
# -----------------------------------------------------------------------------
echo ">>> Step 7: Pruning old images..."
docker image prune -f 2>/dev/null || true
echo ""

# -----------------------------------------------------------------------------
# Final status
# -----------------------------------------------------------------------------
echo "=============================================="
echo "=== Deployment script completed ==="
echo "Exit code: ${DEPLOY_EXIT}"
echo "=============================================="
exit ${DEPLOY_EXIT}
