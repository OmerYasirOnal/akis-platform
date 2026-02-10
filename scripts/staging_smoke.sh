#!/bin/bash
# =============================================================================
# AKIS Staging Smoke Tests (S0.5.1: 10 checks)
# =============================================================================
# Verifies that staging deployment succeeded by testing critical endpoints.
# Required checks: health, ready, version, frontend, auth API, SPA deep link,
# MCP gateway, logo, agents route, OAuth providers.
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
  MIG_STATUS=$(extract_json_field "$READY_JSON" "migrations")

  if [ "$READY_STATUS" = "true" ]; then
    echo -e "${GREEN}✅ /ready: ${READY_CODE} {\"ready\":${READY_STATUS}, \"database\":\"${DB_STATUS}\", \"migrations\":\"${MIG_STATUS}\"}${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    if [ "$MIG_STATUS" = "pending" ]; then
      echo -e "${YELLOW}⚠️  Migrations pending — run: docker compose run --rm backend pnpm db:migrate${NC}"
    fi
  else
    echo -e "${RED}❌ /ready: ${READY_CODE} but ready=${READY_STATUS} (expected true)${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
else
  echo -e "${RED}❌ /ready: ${READY_CODE} (expected 200)${NC}"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# =============================================================================
# Test 2b: Encryption readiness (from /ready response)
# =============================================================================
echo "Test 2b: Encryption configuration"
if [ "$READY_CODE" = "200" ]; then
  ENCRYPTION_STATUS=$(extract_json_field "$READY_JSON" "encryption.configured" 2>/dev/null || echo "unknown")
  # jq handles nested fields; fallback grep may not, so tolerate "unknown"
  if [ "$ENCRYPTION_STATUS" = "true" ]; then
    echo -e "${GREEN}✅ Encryption: configured${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  elif [ "$ENCRYPTION_STATUS" = "false" ]; then
    echo -e "${RED}❌ Encryption: NOT configured — user AI key saving will fail (503)${NC}"
    echo -e "${YELLOW}   FIX: Set AI_KEY_ENCRYPTION_KEY in /opt/akis/.env (openssl rand -base64 32)${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  else
    echo -e "${YELLOW}⚠️  Encryption: could not determine status (old backend version?)${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  fi
else
  echo -e "${YELLOW}⚠️  Skipping encryption check (/ready not available)${NC}"
fi

# =============================================================================
# Test 2c: Email configuration (from /ready response)
# =============================================================================
echo "Test 2c: Email configuration"
if [ "$READY_CODE" = "200" ]; then
  EMAIL_STATUS=$(extract_json_field "$READY_JSON" "email.configured" 2>/dev/null || echo "unknown")
  EMAIL_PROVIDER=$(extract_json_field "$READY_JSON" "email.provider" 2>/dev/null || echo "unknown")
  if [ "$EMAIL_STATUS" = "true" ]; then
    echo -e "${GREEN}✅ Email: configured (provider=${EMAIL_PROVIDER})${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  elif [ "$EMAIL_PROVIDER" = "mock" ]; then
    echo -e "${YELLOW}⚠️  Email: mock provider — verification emails logged to console only${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  elif [ "$EMAIL_STATUS" = "false" ]; then
    echo -e "${RED}❌ Email: NOT configured (provider=${EMAIL_PROVIDER})${NC}"
    echo -e "${YELLOW}   FIX: Set SMTP_* vars in /opt/akis/.env or switch EMAIL_PROVIDER=mock${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  else
    echo -e "${YELLOW}⚠️  Email: could not determine status (old backend version?)${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  fi
else
  echo -e "${YELLOW}⚠️  Skipping email check (/ready not available)${NC}"
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
# Test 6: SPA Deep Link (no backend 404)
# =============================================================================
echo "Test 6: SPA deep link (/auth/privacy-consent)"
SPA_CODE=$(check_endpoint "https://${HOST}/auth/privacy-consent" "spa-deep-link")

if [ "$SPA_CODE" = "200" ]; then
  SPA_CONTENT=$(curl -sf "https://${HOST}/auth/privacy-consent" 2>/dev/null | head -c 100 || echo "")
  if echo "$SPA_CONTENT" | grep -qi "<!DOCTYPE\|<html"; then
    echo -e "${GREEN}✅ /auth/privacy-consent: ${SPA_CODE} (HTML — SPA served)${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}❌ /auth/privacy-consent: ${SPA_CODE} but content is not HTML (likely backend JSON)${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
else
  echo -e "${RED}❌ /auth/privacy-consent: ${SPA_CODE} (expected 200)${NC}"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# =============================================================================
# Test 7: MCP Gateway readiness (from /ready response) — REQUIRED for staging
# =============================================================================
echo "Test 7: MCP Gateway readiness"
if [ "$READY_CODE" = "200" ]; then
  MCP_CONFIGURED=$(extract_json_field "$READY_JSON" "mcp.configured" 2>/dev/null || echo "unknown")
  MCP_GATEWAY_REACHABLE=$(extract_json_field "$READY_JSON" "mcp.gatewayReachable" 2>/dev/null || echo "unknown")
  MCP_BASE_URL=$(extract_json_field "$READY_JSON" "mcp.baseUrl" 2>/dev/null || echo "unknown")
  MCP_MISSING_ENV=$(extract_json_field "$READY_JSON" "mcp.missingEnv" 2>/dev/null || echo "unknown")
  MCP_ERROR=$(extract_json_field "$READY_JSON" "mcp.error" 2>/dev/null || echo "unknown")

  if [ "$MCP_CONFIGURED" = "true" ] && [ "$MCP_GATEWAY_REACHABLE" = "true" ]; then
    echo -e "${GREEN}✅ MCP: configured=true, gatewayReachable=true, baseUrl=${MCP_BASE_URL}${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  elif [ "$MCP_CONFIGURED" = "true" ] && [ "$MCP_GATEWAY_REACHABLE" = "false" ]; then
    echo -e "${RED}❌ MCP: configured but gatewayReachable=false${NC}"
    echo -e "${YELLOW}   Error: ${MCP_ERROR}${NC}"
    echo -e "${YELLOW}   Check: docker compose logs mcp-gateway${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  elif [ "$MCP_CONFIGURED" = "false" ]; then
    echo -e "${RED}❌ MCP: NOT configured — agents (Scribe/Trace/Proto) will fail${NC}"
    echo -e "${YELLOW}   FIX: Set GITHUB_MCP_BASE_URL and GITHUB_TOKEN in /opt/akis/.env${NC}"
    echo -e "${YELLOW}   MCP Gateway is always-on in staging docker-compose. Ensure .env has:${NC}"
    echo -e "${YELLOW}     GITHUB_MCP_BASE_URL=http://mcp-gateway:4010/mcp${NC}"
    echo -e "${YELLOW}     GITHUB_TOKEN=ghp_xxxxx (repo + read:org scopes)${NC}"
    echo -e "${YELLOW}   missingEnv=${MCP_MISSING_ENV}${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  else
    echo -e "${RED}❌ MCP: could not determine status from /ready response${NC}"
    echo -e "${YELLOW}   Expected mcp fields: configured, gatewayReachable, baseUrl, missingEnv, error${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
else
  echo -e "${RED}❌ Skipping MCP check (/ready not available)${NC}"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# =============================================================================
# Test 8: Canonical logo asset
# =============================================================================
echo "Test 8: Canonical logo (/brand/logo.png)"
LOGO_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://${HOST}/brand/logo.png" 2>/dev/null || echo "000")

if [ "$LOGO_CODE" = "200" ]; then
  echo -e "${GREEN}✅ /brand/logo.png: ${LOGO_CODE}${NC}"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  echo -e "${RED}❌ /brand/logo.png: ${LOGO_CODE} (expected 200)${NC}"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# =============================================================================
# Test 9: Route redirect (/dashboard/scribe -> /agents/scribe)
# =============================================================================
echo "Test 9: Route redirect (dashboard -> agents)"
# SPA route redirect is client-side (React Router), so the HTML page loads as 200
# We just verify the /agents page loads correctly
AGENTS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://${HOST}/agents" 2>/dev/null || echo "000")

if [ "$AGENTS_CODE" = "200" ]; then
  AGENTS_CONTENT=$(curl -sf "https://${HOST}/agents" 2>/dev/null | head -c 100 || echo "")
  if echo "$AGENTS_CONTENT" | grep -qi "<!DOCTYPE\|<html"; then
    echo -e "${GREEN}✅ /agents: ${AGENTS_CODE} (SPA served)${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}❌ /agents: ${AGENTS_CODE} but content is not HTML${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
else
  echo -e "${RED}❌ /agents: ${AGENTS_CODE} (expected 200)${NC}"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# =============================================================================
# Test 10: OAuth readiness (from /ready response)
# =============================================================================
echo "Test 10: OAuth provider readiness"
if [ "$READY_CODE" = "200" ]; then
  OAUTH_GITHUB=$(extract_json_field "$READY_JSON" "oauth.github" 2>/dev/null || echo "unknown")
  OAUTH_GOOGLE=$(extract_json_field "$READY_JSON" "oauth.google" 2>/dev/null || echo "unknown")
  if [ "$OAUTH_GITHUB" = "true" ] || [ "$OAUTH_GOOGLE" = "true" ]; then
    echo -e "${GREEN}✅ OAuth: github=${OAUTH_GITHUB}, google=${OAUTH_GOOGLE}${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  elif [ "$OAUTH_GITHUB" = "false" ] && [ "$OAUTH_GOOGLE" = "false" ]; then
    echo -e "${YELLOW}⚠️  OAuth: no providers configured — social login disabled${NC}"
    echo -e "${YELLOW}   FIX: Set GITHUB_OAUTH_CLIENT_ID/SECRET and/or GOOGLE_OAUTH_CLIENT_ID/SECRET${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${YELLOW}⚠️  OAuth: could not determine status (old backend version?)${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  fi
else
  echo -e "${YELLOW}⚠️  Skipping OAuth check (/ready not available)${NC}"
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
