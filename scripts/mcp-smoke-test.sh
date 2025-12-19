#!/usr/bin/env bash
# AKIS - GitHub MCP Gateway Smoke Test
# Tests basic connectivity and JSON-RPC functionality
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MCP_URL="${MCP_GATEWAY_URL:-http://localhost:4010}"

echo "=== AKIS GitHub MCP Gateway Smoke Test ==="
echo "Testing: $MCP_URL"
echo ""

# Test 1: Health Check
echo "[1/3] Health check..."
HEALTH=$(curl -s -f "$MCP_URL/health" || echo "FAILED")
if echo "$HEALTH" | grep -q '"status":"ok"'; then
  echo "✅ Health check passed"
  echo "   Response: $HEALTH"
else
  echo "❌ Health check failed"
  echo "   Response: $HEALTH"
  exit 1
fi
echo ""

# Test 2: Invalid Request (validation test)
echo "[2/3] Testing request validation..."
INVALID=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X POST "$MCP_URL/mcp" \
  -H "Content-Type: application/json" \
  -d '{"invalid": "request"}' || echo "FAILED")
HTTP_CODE=$(echo "$INVALID" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
if [ "$HTTP_CODE" = "400" ]; then
  echo "✅ Validation works (rejected invalid request)"
else
  echo "⚠️  Expected 400, got: $HTTP_CODE"
fi
echo ""

# Test 3: Initialize handshake
echo "[3/3] Testing MCP initialize..."
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
  }' || echo "FAILED")

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
  fi
else
  echo "❌ Initialize failed with HTTP $HTTP_CODE"
  echo "   Response:"
  echo "$BODY" | head -c 500
  exit 1
fi
echo ""

echo "=== Smoke Test Summary ==="
echo "✅ All critical tests passed"
echo ""
echo "Gateway is ready for AKIS backend"
echo "Set in backend/.env:"
echo "  GITHUB_MCP_BASE_URL=$MCP_URL/mcp"

