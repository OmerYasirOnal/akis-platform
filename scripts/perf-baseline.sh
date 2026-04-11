#!/usr/bin/env bash
# Performance baseline measurement for AKIS Platform
# Usage: ./scripts/perf-baseline.sh [BASE_URL]
# Default: https://akisflow.com

set -euo pipefail

BASE_URL="${1:-https://akisflow.com}"
REPORT_FILE="perf-baseline-$(date +%Y%m%d-%H%M%S).md"
REQUESTS=5  # requests per endpoint for averaging

echo "=== AKIS Performance Baseline ==="
echo "Target: $BASE_URL"
echo "Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo ""

# Measure response time (average of N requests)
measure() {
  local endpoint="$1"
  local label="$2"
  local total=0
  local status=""

  for i in $(seq 1 $REQUESTS); do
    result=$(curl -s -o /dev/null -w "%{http_code} %{time_total}" "$BASE_URL$endpoint" 2>/dev/null || echo "000 0")
    status=$(echo "$result" | awk '{print $1}')
    time_ms=$(echo "$result" | awk '{printf "%.0f", $2 * 1000}')
    total=$((total + time_ms))
  done

  avg=$((total / REQUESTS))
  echo "| $label | \`$endpoint\` | $status | ${avg}ms |"
}

# Header
{
  echo "# AKIS Performance Baseline"
  echo ""
  echo "- **Date:** $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "- **Target:** $BASE_URL"
  echo "- **Samples:** $REQUESTS per endpoint"
  echo ""
  echo "## Response Times"
  echo ""
  echo "| Endpoint | Path | Status | Avg (ms) |"
  echo "|----------|------|--------|----------|"
} > "$REPORT_FILE"

# Health endpoints
measure "/health" "Health" | tee -a "$REPORT_FILE"
measure "/ready" "Ready" | tee -a "$REPORT_FILE"
measure "/version" "Version" | tee -a "$REPORT_FILE"

# Public pages
measure "/" "Landing" | tee -a "$REPORT_FILE"
measure "/docs" "Docs" | tee -a "$REPORT_FILE"

# API endpoints (unauthenticated — expect 401)
measure "/api/pipelines" "Pipelines (unauth)" | tee -a "$REPORT_FILE"
measure "/auth/profile" "Profile (unauth)" | tee -a "$REPORT_FILE"

# Bundle size check
{
  echo ""
  echo "## Frontend Bundle"
  echo ""
  echo "| File | Size |"
  echo "|------|------|"
} >> "$REPORT_FILE"

if [ -d "frontend/dist/assets" ]; then
  for f in frontend/dist/assets/*.js; do
    size=$(wc -c < "$f" | tr -d ' ')
    size_kb=$((size / 1024))
    name=$(basename "$f")
    echo "| $name | ${size_kb}KB |" >> "$REPORT_FILE"
  done
fi

# Security headers check
{
  echo ""
  echo "## Security Headers"
  echo ""
} >> "$REPORT_FILE"

headers=$(curl -s -I "$BASE_URL/health" 2>/dev/null)
for h in "strict-transport-security" "x-content-type-options" "x-frame-options" "content-security-policy" "x-xss-protection"; do
  val=$(echo "$headers" | grep -i "^$h:" | head -1 | sed 's/^[^:]*: //' | tr -d '\r')
  if [ -n "$val" ]; then
    echo "| $h | present |" >> "$REPORT_FILE"
  else
    echo "| $h | **MISSING** |" >> "$REPORT_FILE"
  fi
done

echo ""
echo "Report saved to: $REPORT_FILE"
echo "Done."
