# GitHub MCP Gateway V2 Implementation Summary

**Date**: 2025-12-19 (Updated)  
**Goal**: Robust, production-ready Docker-based GitHub MCP Gateway with official server

---

## Changes from V1

### Enhanced Gateway (`mcp-gateway/src/server.ts`)

**1. Improved Error Handling**:
- Added correlation IDs (UUID) to every request for traceability
- Strict Content-Type validation (`application/json` required)
- Comprehensive JSON-RPC envelope validation
- Actionable error messages with hints
- MCP server running status check (503 if down)

**2. Better Logging**:
- Debug mode via `LOG_LEVEL=debug`
- Production mode only logs errors (not every request)
- Correlation IDs in all log lines
- Request/response pairs traceable

**3. Robustness**:
- Check if MCP server process is alive before forwarding
- Graceful shutdown with 5-second timeout
- Better process lifecycle management
- Initialize promise to prevent race conditions

**4. Request Validation**:
Validates in order:
1. Content-Type header
2. Body is JSON object
3. `jsonrpc` field equals `"2.0"`
4. `method` field exists and is string
5. MCP server is running

Each failure returns specific error code and actionable message.

### New Smoke Test Script (`scripts/mcp-smoke-test.sh`)

Automated testing:
1. **Health check** - Verifies gateway responds
2. **Validation test** - Confirms 400 for invalid requests
3. **Initialize test** - Tests full MCP handshake

Usage:
```bash
./scripts/mcp-smoke-test.sh
```

### Enhanced Documentation

**`docs/GITHUB_MCP_SETUP.md`** now includes:
- Smoke test instructions
- Correlation ID debugging guide
- Expanded troubleshooting for 400/503 errors
- Debug logging instructions

**`scripts/mcp-up.sh`** now shows:
- Smoke test command
- Better error diagnostics (shows logs if health check fails)

---

## Request Flow

```
Backend
  ↓ POST /mcp
  ↓ Content-Type: application/json
  ↓ {"jsonrpc":"2.0","method":"...","id":1}
  ↓
Gateway (HTTP validation)
  ├─ Generate correlation ID
  ├─ Validate Content-Type
  ├─ Validate JSON-RPC envelope
  ├─ Check MCP server is running
  └─ Forward to MCP server
      ↓ stdio (JSON-RPC line protocol)
      ↓
Official GitHub MCP Server
  (@modelcontextprotocol/server-github via npx)
      ↓ GitHub REST API
      ↓
GitHub.com
```

---

## Error Response Examples

### Missing Content-Type

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32700,
    "message": "Parse error: Content-Type must be application/json",
    "data": {
      "correlationId": "abc-123-def",
      "hint": "Set header: Content-Type: application/json"
    }
  },
  "id": null
}
```

### Invalid Method

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32600,
    "message": "Invalid Request: method field is required and must be a string",
    "data": {
      "correlationId": "abc-123-def",
      "hint": "Common methods: initialize, tools/list, tools/call"
    }
  },
  "id": null
}
```

### MCP Server Not Running

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32000,
    "message": "Service Unavailable: MCP server is not running",
    "data": {
      "correlationId": "abc-123-def",
      "hint": "Try restarting the gateway"
    }
  },
  "id": null
}
```

### Internal Error (Timeout)

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32603,
    "message": "Internal error: Request 1 timed out after 30000ms",
    "data": {
      "correlationId": "abc-123-def",
      "hint": "Request timed out. GitHub API might be slow or rate-limited.",
      "timestamp": "2025-12-19T12:34:56.789Z"
    }
  },
  "id": 1
}
```

---

## Debugging Workflow

### 1. Backend Reports 400 Error

```bash
# 1. Find correlation ID in backend logs
# Example: "Correlation ID: abc-123-def"

# 2. Search gateway logs
docker compose -f docker-compose.mcp.yml logs | grep "abc-123-def"

# Output shows:
# [MCP Gateway] [abc-123-def] Invalid Content-Type: text/plain
# → Fix: Ensure HttpClient sends application/json
```

### 2. Request Times Out

```bash
# Check if GitHub API is slow
curl -w "\nTime: %{time_total}s\n" https://api.github.com/

# Check gateway logs for that correlation ID
docker compose -f docker-compose.mcp.yml logs | grep "correlation-id"

# See if MCP server is responding
docker compose -f docker-compose.mcp.yml logs | grep "MCP Server"
```

### 3. Enable Debug Logging

```bash
# Stop gateway
./scripts/mcp-down.sh

# Set debug mode
echo "MCP_LOG_LEVEL=debug" >> .env

# Restart
./scripts/mcp-up.sh

# Now all requests/responses are logged
docker compose -f docker-compose.mcp.yml logs -f
```

---

## Files Changed

| File | Change |
|------|--------|
| `mcp-gateway/src/server.ts` | Enhanced error handling, validation, correlation IDs |
| `scripts/mcp-smoke-test.sh` | **NEW**: Automated smoke test |
| `scripts/mcp-up.sh` | Added smoke test instructions, better error output |
| `docs/GITHUB_MCP_SETUP.md` | Added troubleshooting for 400/503, correlation ID guide |

---

## Testing

### Manual Test: Smoke Test

```bash
export GITHUB_TOKEN=ghp_your_token_here
./scripts/mcp-up.sh
./scripts/mcp-smoke-test.sh

# Expected output:
# [1/3] Health check...
# ✅ Health check passed
# [2/3] Testing request validation...
# ✅ Validation works (rejected invalid request)
# [3/3] Testing MCP initialize...
# ✅ Initialize succeeded
# ✅ All critical tests passed
```

### Manual Test: Correlation ID Tracing

```bash
# Make a request (via backend or curl)
CORRELATION_ID=$(uuidgen)
curl -X POST http://localhost:4010/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","params":{},"id":1}'

# Search logs for that request
docker compose -f docker-compose.mcp.yml logs | grep "$CORRELATION_ID"
```

### Manual Test: 400 Error Path

```bash
# Missing Content-Type
curl -X POST http://localhost:4010/mcp \
  -d '{"jsonrpc":"2.0","method":"test","id":1}'
# Should return 400 with hint about Content-Type

# Invalid jsonrpc
curl -X POST http://localhost:4010/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"1.0","method":"test","id":1}'
# Should return 400 with hint about jsonrpc version

# Missing method
curl -X POST http://localhost:4010/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1}'
# Should return 400 with hint about method field
```

---

## Production Checklist

- [ ] `GITHUB_TOKEN` stored in secrets manager (not `.env` file)
- [ ] Gateway logs forwarded to centralized logging (CloudWatch, Datadog, etc.)
- [ ] Health check endpoint monitored (alerts if down)
- [ ] Correlation IDs indexed in logs for search
- [ ] Rate limiting on `/mcp` endpoint (if needed)
- [ ] Network security: Gateway only accessible from backend

---

## Acceptance Criteria

✅ **V1 Criteria** (all still pass):
1. Docker Compose starts gateway
2. Health check returns `{"status":"ok"}`
3. Backend connects without "Missing dependency" error
4. Remote hosted option documented

✅ **V2 Additions**:
5. Smoke test script passes all 3 tests
6. Invalid requests return 400 with actionable errors
7. Correlation IDs in all error responses
8. MCP server down → 503 (not 500)
9. Debug logging available via `LOG_LEVEL=debug`
10. Gateway logs show correlation IDs for tracing

---

## Known Limitations

1. **Single PAT**: Gateway uses one GitHub token for all requests. Future: support per-user tokens.
2. **No rate limiting**: Gateway doesn't rate-limit incoming requests. Add nginx/proxy if needed.
3. **No request queuing**: If MCP server is slow, requests queue in Node.js. Consider adding Redis queue.
4. **No metrics**: No Prometheus/StatsD metrics yet. Add if monitoring needed.

---

## Next Steps

1. **Test with real Scribe job**: Verify correlation IDs appear in logs
2. **Monitor production**: Watch for timeout/400 patterns
3. **Tune timeouts**: Adjust 30-second timeout based on real usage
4. **Add metrics**: Track request latency, error rates
5. **Per-user tokens**: Load user's GitHub token from DB (not gateway env)

---

## References

- [V1 Implementation Summary](IMPLEMENTATION_SUMMARY_MCP.md)
- [GitHub MCP Setup Guide](docs/GITHUB_MCP_SETUP.md)
- [Model Context Protocol Spec](https://modelcontextprotocol.io/)

