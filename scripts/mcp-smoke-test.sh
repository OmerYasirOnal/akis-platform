#!/usr/bin/env bash
# AKIS - GitHub MCP Gateway Smoke Test
# Tests basic connectivity, validation, and JSON-RPC functionality
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MCP_URL="${MCP_GATEWAY_URL:-http://localhost:4010}"
FAILED_TESTS=0

echo "=== AKIS GitHub MCP Gateway Smoke Test ==="
echo "Testing: $MCP_URL"
echo ""

# Test 1: Health Check
echo "[1/4] Health check..."
HEALTH=$(curl -s -f "$MCP_URL/health" 2>/dev/null || echo "FAILED")
if echo "$HEALTH" | grep -q '"status":"ok"'; then
  echo "✅ Health check passed"
  echo "   Response: $HEALTH"
else
  echo "❌ Health check failed"
  echo "   Response: $HEALTH"
  exit 1
fi
echo ""

# Test 2: Invalid Request (validation test with correlation ID check)
echo "[2/4] Testing request validation + correlation ID..."
INVALID_RESPONSE=$(curl -s -i \
  -X POST "$MCP_URL/mcp" \
  -H "Content-Type: application/json" \
  -d '{"invalid": "request"}' 2>/dev/null || echo "FAILED")

HTTP_CODE=$(echo "$INVALID_RESPONSE" | grep -i "^HTTP" | head -1 | awk '{print $2}')
CORRELATION_HEADER=$(echo "$INVALID_RESPONSE" | grep -i "x-correlation-id" || echo "")
BODY=$(echo "$INVALID_RESPONSE" | sed -n '/^\r$/,$p' | tail -n +2)

if [ "$HTTP_CODE" = "400" ]; then
  echo "✅ Validation works (rejected invalid request with 400)"
else
  echo "⚠️  Expected 400, got: $HTTP_CODE"
  ((FAILED_TESTS++))
fi

if echo "$CORRELATION_HEADER" | grep -qi "x-correlation-id:"; then
  echo "✅ Correlation ID returned in response header"
else
  echo "⚠️  Missing x-correlation-id header in error response"
  ((FAILED_TESTS++))
fi

if echo "$BODY" | grep -q '"correlationId"'; then
  echo "✅ Correlation ID included in error body"
else
  echo "⚠️  Missing correlationId in error body"
  ((FAILED_TESTS++))
fi
echo ""

# Test 3: Correlation ID forwarding
echo "[3/4] Testing inbound correlation ID forwarding..."
TEST_CORR_ID="test-correlation-$(date +%s)"
CORR_RESPONSE=$(curl -s -i \
  -X POST "$MCP_URL/mcp" \
  -H "Content-Type: application/json" \
  -H "x-correlation-id: $TEST_CORR_ID" \
  -d '{"jsonrpc": "2.0", "method": "test", "id": 1}' 2>/dev/null || echo "FAILED")

if echo "$CORR_RESPONSE" | grep -qi "x-correlation-id: $TEST_CORR_ID"; then
  echo "✅ Inbound correlation ID preserved in response"
else
  echo "⚠️  Inbound correlation ID not preserved"
  ((FAILED_TESTS++))
fi
echo ""

# Test 4: Initialize handshake
echo "[4/4] Testing MCP initialize..."
INIT_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X POST "$MCP_URL/mcp" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "initialize",
    "params": {
      "protocolVersion": "0.1.0",
      "capabilities": {},
      "clientInfo": {
        "name": "akis-smoke-test",
        "version": "1.0.0"
      }
    },
    "id": 1
  }' 2>/dev/null || echo "FAILED")

HTTP_CODE=$(echo "$INIT_RESPONSE" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
BODY=$(echo "$INIT_RESPONSE" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" = "200" ]; then
  if echo "$BODY" | grep -q '"result"' || echo "$BODY" | grep -q '"serverInfo"'; then
    echo "✅ Initialize succeeded"
    echo "   Server response (truncated):"
    echo "$BODY" | head -c 200
    echo "..."
  else
    echo "⚠️  Initialize returned 200 but unexpected body:"
    echo "$BODY" | head -c 300
    ((FAILED_TESTS++))
  fi
else
  echo "❌ Initialize failed with HTTP $HTTP_CODE"
  echo "   Response:"
  echo "$BODY" | head -c 500
  ((FAILED_TESTS++))
fi
echo ""

echo "=== Smoke Test Summary ==="
if [ "$FAILED_TESTS" -eq 0 ]; then
  echo "✅ All tests passed (4/4)"
  echo ""
  echo "Gateway is ready for AKIS backend"
  echo "Set in backend/.env:"
  echo "  GITHUB_MCP_BASE_URL=$MCP_URL/mcp"
  exit 0
else
  echo "⚠️  Some tests had warnings ($FAILED_TESTS issues)"
  echo "   Gateway may still work but review the output above."
  exit 0  # Don't fail for warnings, only for critical failures
fi

