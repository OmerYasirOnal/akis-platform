#!/usr/bin/env bash
#
# dev-smoke-jobs.sh
# Quick smoke test for job creation API (macOS compatible)
#
set -euo pipefail

API_BASE="${API_BASE:-http://localhost:3000}"

echo "🔍 Job API Smoke Test"
echo "====================="
echo "API Base: $API_BASE"
echo ""

# Helper to extract HTTP code from curl output (last line)
get_http_code() {
  tail -1
}

# Helper to get body (all lines except last)
get_body() {
  sed '$ d'
}

# 1) Health check
echo "1) GET /health"
RESPONSE=$(curl -s -w "\n%{http_code}" "$API_BASE/health")
HTTP_CODE=$(echo "$RESPONSE" | get_http_code)
BODY=$(echo "$RESPONSE" | get_body)
echo "   Status: $HTTP_CODE"
echo "   Body: $BODY"
if [[ "$HTTP_CODE" != "200" ]]; then
  echo "   ❌ Health check failed"
  exit 1
fi
echo "   ✅ OK"
echo ""

# 2) List jobs
echo "2) GET /api/agents/jobs?limit=1"
RESPONSE=$(curl -s -w "\n%{http_code}" "$API_BASE/api/agents/jobs?limit=1")
HTTP_CODE=$(echo "$RESPONSE" | get_http_code)
BODY=$(echo "$RESPONSE" | get_body)
echo "   Status: $HTTP_CODE"
echo "   Body (first 200 chars): $(echo "$BODY" | head -c 200)"
if [[ "$HTTP_CODE" != "200" ]]; then
  echo "   ❌ List jobs failed"
fi
echo ""

# 3) Create a job (legacy payload without auth)
echo "3) POST /api/agents/jobs (legacy payload)"
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"type":"scribe","payload":{"doc":"Test document for smoke testing","owner":"test-owner","repo":"test-repo","baseBranch":"main","dryRun":true}}' \
  "$API_BASE/api/agents/jobs")
HTTP_CODE=$(echo "$RESPONSE" | get_http_code)
BODY=$(echo "$RESPONSE" | get_body)
echo "   Status: $HTTP_CODE"
echo "   Body: $BODY"

if [[ "$HTTP_CODE" == "200" ]] || [[ "$HTTP_CODE" == "201" ]]; then
  JOB_ID=$(echo "$BODY" | grep -o '"jobId":"[^"]*"' | cut -d'"' -f4 || echo "")
  if [[ -n "$JOB_ID" ]]; then
    echo "   ✅ Job created: $JOB_ID"
    echo ""
    
    # 4) Get job by ID (no includes)
    echo "4) GET /api/agents/jobs/$JOB_ID"
    RESPONSE=$(curl -s -w "\n%{http_code}" "$API_BASE/api/agents/jobs/$JOB_ID")
    HTTP_CODE=$(echo "$RESPONSE" | get_http_code)
    BODY=$(echo "$RESPONSE" | get_body)
    echo "   Status: $HTTP_CODE"
    echo "   Body (first 200 chars): $(echo "$BODY" | head -c 200)"
    echo ""
    
    # 5) Get job with includes
    echo "5) GET /api/agents/jobs/$JOB_ID?include=trace,artifacts"
    RESPONSE=$(curl -s -w "\n%{http_code}" "$API_BASE/api/agents/jobs/$JOB_ID?include=trace,artifacts")
    HTTP_CODE=$(echo "$RESPONSE" | get_http_code)
    BODY=$(echo "$RESPONSE" | get_body)
    echo "   Status: $HTTP_CODE"
    echo "   Body (first 300 chars): $(echo "$BODY" | head -c 300)"
    if [[ "$HTTP_CODE" == "200" ]]; then
      echo "   ✅ OK"
    else
      echo "   ❌ Include query failed with $HTTP_CODE"
    fi
  else
    echo "   ⚠️ Job created but couldn't extract jobId"
  fi
else
  echo "   ❌ Job creation failed with $HTTP_CODE"
  echo "   Full response: $BODY"
fi

echo ""
echo "====================="
echo "Smoke test complete"
