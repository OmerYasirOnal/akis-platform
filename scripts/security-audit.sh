#!/usr/bin/env bash
# Security audit script for AKIS Platform
# Usage: ./scripts/security-audit.sh [BASE_URL]
# Default: https://akisflow.com

set -euo pipefail

BASE_URL="${1:-https://akisflow.com}"
REPORT_FILE="security-audit-$(date +%Y%m%d-%H%M%S).md"
PASS=0
FAIL=0
WARN=0

echo "=== AKIS Security Audit ==="
echo "Target: $BASE_URL"
echo ""

check() {
  local label="$1"
  local result="$2"  # pass/fail/warn
  local detail="$3"

  case "$result" in
    pass) PASS=$((PASS + 1)); echo "[PASS] $label" ;;
    fail) FAIL=$((FAIL + 1)); echo "[FAIL] $label — $detail" ;;
    warn) WARN=$((WARN + 1)); echo "[WARN] $label — $detail" ;;
  esac
  echo "| $label | $result | $detail |" >> "$REPORT_FILE"
}

{
  echo "# AKIS Security Audit Report"
  echo ""
  echo "- **Date:** $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "- **Target:** $BASE_URL"
  echo ""
  echo "## Checks"
  echo ""
  echo "| Check | Result | Detail |"
  echo "|-------|--------|--------|"
} > "$REPORT_FILE"

# 1. HTTPS redirect
http_status=$(curl -s -o /dev/null -w "%{http_code}" "http://$(echo $BASE_URL | sed 's|https://||')" 2>/dev/null || echo "000")
if [ "$http_status" = "301" ] || [ "$http_status" = "308" ]; then
  check "HTTPS redirect" "pass" "HTTP → HTTPS ($http_status)"
else
  check "HTTPS redirect" "warn" "Status: $http_status"
fi

# 2. Security headers
headers=$(curl -s -I "$BASE_URL/health" 2>/dev/null)

hsts=$(echo "$headers" | grep -i "strict-transport-security" | head -1)
if [ -n "$hsts" ]; then
  check "HSTS header" "pass" "Present"
else
  check "HSTS header" "fail" "Missing Strict-Transport-Security"
fi

xcto=$(echo "$headers" | grep -i "x-content-type-options" | head -1)
if [ -n "$xcto" ]; then
  check "X-Content-Type-Options" "pass" "Present"
else
  check "X-Content-Type-Options" "fail" "Missing"
fi

xfo=$(echo "$headers" | grep -i "x-frame-options" | head -1)
if [ -n "$xfo" ]; then
  check "X-Frame-Options" "pass" "Present"
else
  check "X-Frame-Options" "warn" "Missing (CSP frame-ancestors may cover)"
fi

# 3. Health endpoint info leakage (production)
ready_body=$(curl -s "$BASE_URL/ready" 2>/dev/null)
if echo "$ready_body" | grep -q "SMTP_HOST\|baseUrl\|callbackBase"; then
  check "Ready info leakage" "fail" "Sensitive info exposed in /ready"
else
  check "Ready info leakage" "pass" "No sensitive info in /ready"
fi

# 4. Auth rate limiting
rate_results=""
for i in $(seq 1 12); do
  status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/auth/login/start" -H "Content-Type: application/json" -d '{"email":"test@test.com"}' 2>/dev/null || echo "000")
  rate_results="$rate_results $status"
done
if echo "$rate_results" | grep -q "429"; then
  check "Auth rate limiting" "pass" "429 returned after burst"
else
  check "Auth rate limiting" "warn" "No 429 seen in 12 requests (global limit may be higher)"
fi

# 5. CORS check
cors_header=$(curl -s -I -H "Origin: https://evil.com" "$BASE_URL/health" 2>/dev/null | grep -i "access-control-allow-origin" | head -1)
if echo "$cors_header" | grep -qi "evil.com"; then
  check "CORS wildcard" "fail" "Allows arbitrary origins"
else
  check "CORS origin restriction" "pass" "Does not allow arbitrary origins"
fi

# 6. Cookie security
cookie_header=$(curl -s -I -X POST "$BASE_URL/auth/login/start" -H "Content-Type: application/json" -d '{"email":"test@test.com"}' 2>/dev/null | grep -i "set-cookie" | head -1)
if [ -n "$cookie_header" ]; then
  if echo "$cookie_header" | grep -qi "httponly"; then
    check "Cookie HttpOnly" "pass" "Set"
  else
    check "Cookie HttpOnly" "fail" "Missing HttpOnly flag"
  fi
  if echo "$cookie_header" | grep -qi "secure"; then
    check "Cookie Secure" "pass" "Set"
  else
    check "Cookie Secure" "fail" "Missing Secure flag"
  fi
else
  check "Cookie flags" "pass" "No cookie set on failed login (expected)"
fi

# 7. npm audit (local)
echo ""
echo "--- Dependency Audit ---"
if command -v pnpm &> /dev/null; then
  backend_audit=$(pnpm -C backend audit --audit-level=high 2>&1 || true)
  if echo "$backend_audit" | grep -q "No known vulnerabilities"; then
    check "Backend npm audit" "pass" "No high/critical vulnerabilities"
  else
    vuln_count=$(echo "$backend_audit" | grep -c "high\|critical" || echo "0")
    check "Backend npm audit" "warn" "$vuln_count high/critical findings"
  fi

  frontend_audit=$(pnpm -C frontend audit --audit-level=high 2>&1 || true)
  if echo "$frontend_audit" | grep -q "No known vulnerabilities"; then
    check "Frontend npm audit" "pass" "No high/critical vulnerabilities"
  else
    vuln_count=$(echo "$frontend_audit" | grep -c "high\|critical" || echo "0")
    check "Frontend npm audit" "warn" "$vuln_count high/critical findings"
  fi
fi

# Summary
{
  echo ""
  echo "## Summary"
  echo ""
  echo "| Result | Count |"
  echo "|--------|-------|"
  echo "| PASS | $PASS |"
  echo "| WARN | $WARN |"
  echo "| FAIL | $FAIL |"
  echo ""
  echo "**Score:** $PASS/$((PASS + FAIL + WARN)) checks passed"
} >> "$REPORT_FILE"

echo ""
echo "=== Results ==="
echo "PASS: $PASS | WARN: $WARN | FAIL: $FAIL"
echo "Report: $REPORT_FILE"

# Exit code
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
