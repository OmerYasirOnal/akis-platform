#!/bin/bash
# =============================================================================
# AKIS Staging Smoke Tests
# =============================================================================
# Verifies that staging deployment succeeded by testing critical endpoints.
#
# Usage:
#   ./scripts/staging_smoke.sh [--host DOMAIN] [--commit SHA] [--timeout SECONDS]
#
# Parameters:
#   --host      Target domain (default: staging.akisflow.com)
#   --commit    Expected git commit SHA (required for version verification)
#   --timeout   Total timeout in seconds (default: 150)
#   --help      Show this help message
#
# Exit Codes:
#   0 - All tests passed
#   1 - Version mismatch (CRITICAL)
#   2 - Health/ready endpoint failing
#   3 - Frontend not loading
#   4 - API endpoint failing
# =============================================================================

set -euo pipefail

# Default values
HOST="staging.akisflow.com"
EXPECTED_COMMIT=""
TIMEOUT=150
MAX_ATTEMPTS=30
INTERVAL=5

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --host)
      HOST="$2"
      shift 2
      ;;
    --commit)
      EXPECTED_COMMIT="$2"
      shift 2
      ;;
    --timeout)
      TIMEOUT="$2"
      MAX_ATTEMPTS=$((TIMEOUT / INTERVAL))
      shift 2
      ;;
    --help)
      head -n 24 "$0" | tail -n 20 | sed 's/^# //'
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Run with --help for usage information"
      exit 1
      ;;
  esac
done

# Banner
echo "=============================================="
echo "AKIS Staging Smoke Tests"
echo "=============================================="
echo "Target host: ${HOST}"
if [ -n "${EXPECTED_COMMIT}" ]; then
  echo "Expected commit: ${EXPECTED_COMMIT}"
fi
echo "Timeout: ${TIMEOUT}s (${MAX_ATTEMPTS} attempts × ${INTERVAL}s)"
echo ""

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

# Helper: Make HTTP request with retry
# Args: $1=URL, $2=test_name
check_endpoint() {
  local url="$1"
  local test_name="$2"

  for attempt in $(seq 1 "$MAX_ATTEMPTS"); do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")

    if [ "$HTTP_CODE" != "000" ] && [ "$HTTP_CODE" != "502" ] && [ "$HTTP_CODE" != "503" ]; then
      # Got a real response (not connection error or gateway errors)
      echo "$HTTP_CODE"
      return 0
    fi

    if [ "$attempt" -lt "$MAX_ATTEMPTS" ]; then
      sleep "$INTERVAL"
    fi
  done

  echo "000"
  return 1
}

# Helper: Extract JSON field (macOS compatible)
extract_json_field() {
  local json="$1"
  local field="$2"

  # Try jq first (preferred)
  if command -v jq &> /dev/null; then
    echo "$json" | jq -r ".${field} // \"unknown\"" 2>/dev/null || echo "unknown"
  else
    # Fallback to grep/cut (always available)
    echo "$json" | grep -o "\"${field}\":\"[^\"]*\"" | cut -d'"' -f4 || echo "unknown"
  fi
}

# =============================================================================
# Test 1: Health Endpoint
# =============================================================================
echo "Test 1: Health endpoint"
HEALTH_CODE=$(check_endpoint "https://${HOST}/health" "health")

if [ "$HEALTH_CODE" = "200" ]; then
  # Verify JSON response
  HEALTH_JSON=$(curl -sf "https://${HOST}/health" 2>/dev/null || echo '{}')
  HEALTH_STATUS=$(extract_json_field "$HEALTH_JSON" "status")

  if [ "$HEALTH_STATUS" = "ok" ]; then
    echo -e "${GREEN}✅ /health: ${HEALTH_CODE} {\"status\":\"${HEALTH_STATUS}\"}${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}❌ /health: ${HEALTH_CODE} but status=\"${HEALTH_STATUS}\" (expected \"ok\")${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
else
  echo -e "${RED}❌ /health: ${HEALTH_CODE} (expected 200)${NC}"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# =============================================================================
# Test 2: Ready Endpoint
# =============================================================================
echo "Test 2: Ready endpoint"
READY_CODE=$(check_endpoint "https://${HOST}/ready" "ready")

if [ "$READY_CODE" = "200" ]; then
  # Verify JSON response
  READY_JSON=$(curl -sf "https://${HOST}/ready" 2>/dev/null || echo '{}')
  READY_STATUS=$(extract_json_field "$READY_JSON" "ready")
  DB_STATUS=$(extract_json_field "$READY_JSON" "database")

  if [ "$READY_STATUS" = "true" ]; then
    echo -e "${GREEN}✅ /ready: ${READY_CODE} {\"ready\":${READY_STATUS}, \"database\":\"${DB_STATUS}\"}${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}❌ /ready: ${READY_CODE} but ready=${READY_STATUS} (expected true)${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
else
  echo -e "${RED}❌ /ready: ${READY_CODE} (expected 200)${NC}"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# =============================================================================
# Test 3: Version Endpoint with Commit Verification (CRITICAL)
# =============================================================================
echo "Test 3: Version endpoint (CRITICAL)"
VERSION_CODE=$(check_endpoint "https://${HOST}/version" "version")

if [ "$VERSION_CODE" = "200" ]; then
  # Fetch and parse version JSON
  VERSION_JSON=$(curl -sf "https://${HOST}/version" 2>/dev/null || echo '{}')
  DEPLOYED_COMMIT=$(extract_json_field "$VERSION_JSON" "commit")

  if [ -n "${EXPECTED_COMMIT}" ]; then
    if [ "$DEPLOYED_COMMIT" = "$EXPECTED_COMMIT" ]; then
      echo -e "${GREEN}✅ /version: ${VERSION_CODE} (commit: ${DEPLOYED_COMMIT}) MATCH${NC}"
      TESTS_PASSED=$((TESTS_PASSED + 1))
    else
      echo -e "${RED}❌ /version: ${VERSION_CODE} VERSION MISMATCH${NC}"
      echo -e "${RED}   Expected: ${EXPECTED_COMMIT}${NC}"
      echo -e "${RED}   Deployed: ${DEPLOYED_COMMIT}${NC}"
      echo ""
      echo "WHAT TO DO NEXT:"
      echo "  1. Check container status: ssh USER@HOST 'cd /opt/akis && docker compose ps'"
      echo "  2. Check backend logs: ssh USER@HOST 'cd /opt/akis && docker compose logs --tail=100 backend'"
      echo "  3. Verify .env BACKEND_VERSION: ssh USER@HOST 'grep BACKEND_VERSION /opt/akis/.env'"
      TESTS_FAILED=$((TESTS_FAILED + 1))
      # Exit immediately on version mismatch (critical failure)
      exit 1
    fi
  else
    echo -e "${YELLOW}⚠️  /version: ${VERSION_CODE} (commit: ${DEPLOYED_COMMIT}) - no expected commit provided, skipping verification${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  fi
else
  echo -e "${RED}❌ /version: ${VERSION_CODE} (expected 200)${NC}"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# =============================================================================
# Test 4: Frontend Loading
# =============================================================================
echo "Test 4: Frontend (served by Caddy)"
FRONTEND_CODE=$(check_endpoint "https://${HOST}/" "frontend")

if [ "$FRONTEND_CODE" = "200" ]; then
  # Verify it looks like HTML
  FRONTEND_CONTENT=$(curl -sf "https://${HOST}/" 2>/dev/null | head -c 100 || echo "")
  if echo "$FRONTEND_CONTENT" | grep -qi "<!DOCTYPE\|<html"; then
    echo -e "${GREEN}✅ / (frontend): ${FRONTEND_CODE}${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}❌ / (frontend): ${FRONTEND_CODE} but content doesn't look like HTML${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
else
  echo -e "${RED}❌ / (frontend): ${FRONTEND_CODE} (expected 200)${NC}"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# =============================================================================
# Test 5: API Existence (Auth Endpoint)
# =============================================================================
echo "Test 5: API endpoint existence"
AUTH_CODE=$(check_endpoint "https://${HOST}/auth/me" "auth")

# Accept 401 (unauthenticated) or 200 (authenticated) - both mean API is working
if [ "$AUTH_CODE" = "401" ] || [ "$AUTH_CODE" = "200" ]; then
  echo -e "${GREEN}✅ /auth/me: ${AUTH_CODE} (expected 401 or 200)${NC}"
  TESTS_PASSED=$((TESTS_PASSED + 1))
elif [ "$AUTH_CODE" = "404" ]; then
  echo -e "${RED}❌ /auth/me: ${AUTH_CODE} - Auth endpoint not found${NC}"
  TESTS_FAILED=$((TESTS_FAILED + 1))
elif [ "$AUTH_CODE" = "500" ] || [ "$AUTH_CODE" = "502" ] || [ "$AUTH_CODE" = "503" ]; then
  echo -e "${RED}❌ /auth/me: ${AUTH_CODE} - Auth server error${NC}"
  TESTS_FAILED=$((TESTS_FAILED + 1))
else
  echo -e "${YELLOW}⚠️  /auth/me: ${AUTH_CODE} (unexpected but not critical)${NC}"
  TESTS_PASSED=$((TESTS_PASSED + 1))
fi

# =============================================================================
# Summary
# =============================================================================
echo ""
echo "=============================================="
echo "Test Summary"
echo "=============================================="
echo "Passed: ${TESTS_PASSED}"
echo "Failed: ${TESTS_FAILED}"
echo ""

if [ "$TESTS_FAILED" -eq 0 ]; then
  echo -e "${GREEN}All smoke tests passed!${NC}"
  exit 0
else
  echo -e "${RED}Some smoke tests failed!${NC}"
  echo ""
  echo "WHAT TO DO NEXT:"
  echo "  1. Review backend logs: ssh USER@HOST 'cd /opt/akis && docker compose logs --tail=100 backend'"
  echo "  2. Check container status: ssh USER@HOST 'cd /opt/akis && docker compose ps'"
  echo "  3. Check Caddy logs: ssh USER@HOST 'cd /opt/akis && docker compose logs --tail=50 caddy'"

  # Determine exit code based on which tests failed
  if [ "$HEALTH_CODE" != "200" ] || [ "$READY_CODE" != "200" ]; then
    exit 2  # Health/ready failing
  elif [ "$FRONTEND_CODE" != "200" ]; then
    exit 3  # Frontend failing
  else
    exit 4  # API failing
  fi
fi
