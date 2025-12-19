# GitHub MCP Gateway Implementation Summary

**Date**: 2025-12-19  
**Goal**: Provide Docker-based local GitHub MCP Server with HTTP endpoint for AKIS backend

---

## What Was Built

### 1. MCP Gateway Service (`mcp-gateway/`)

HTTP-to-stdio bridge that:
- Accepts JSON-RPC requests over HTTP at `/mcp`
- Spawns official `@modelcontextprotocol/server-github` via npx
- Forwards requests/responses via stdio
- Exposes port 4010 by default

**Key files**:
- `mcp-gateway/src/server.ts` - Gateway implementation (Fastify + child_process)
- `mcp-gateway/package.json` - Dependencies
- `mcp-gateway/Dockerfile` - Alpine-based Node.js image
- `mcp-gateway/README.md` - Gateway-specific docs

### 2. Docker Compose (`docker-compose.mcp.yml`)

Single-service compose file:
- `akis-github-mcp-gateway` - Runs gateway on port 4010
- Health check endpoint
- Requires `GITHUB_TOKEN` env var

### 3. Convenience Scripts

- `scripts/mcp-up.sh` - Start gateway (checks token, runs compose, verifies health)
- `scripts/mcp-down.sh` - Stop gateway

### 4. Documentation

- `docs/GITHUB_MCP_SETUP.md` - Complete setup guide
  - Option 1: Local Docker gateway
  - Option 2: Remote hosted GitHub Copilot MCP
  - Troubleshooting
  - FAQs

- `backend/README.md` - Added GitHub MCP Server section
- `backend/.env.example` - Added commented examples:
  ```bash
  # Option 1: Local gateway
  GITHUB_MCP_BASE_URL=http://localhost:4010/mcp
  GITHUB_TOKEN=ghp_...
  
  # Option 2: Remote hosted
  # GITHUB_MCP_BASE_URL=https://api.githubcopilot.com/mcp/
  ```

---

## How to Use

### Quick Start

```bash
# 1. Set GitHub token
export GITHUB_TOKEN=ghp_your_token_here

# 2. Start gateway
./scripts/mcp-up.sh

# 3. Verify
curl http://localhost:4010/health
# {"status":"ok","service":"akis-github-mcp-gateway"}

# 4. Configure backend
echo "GITHUB_MCP_BASE_URL=http://localhost:4010/mcp" >> backend/.env
echo "GITHUB_TOKEN=$GITHUB_TOKEN" >> backend/.env

# 5. Start backend
cd backend && pnpm dev
```

### Stop Gateway

```bash
./scripts/mcp-down.sh
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AKIS Backend                             │
│  AgentOrchestrator → GitHubMCPService                       │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP POST
                          │ http://localhost:4010/mcp
                          │ JSON-RPC 2.0
                          ▼
┌─────────────────────────────────────────────────────────────┐
│          MCP Gateway (Node.js/Fastify)                      │
│  - Accepts HTTP JSON-RPC                                    │
│  - Spawns @modelcontextprotocol/server-github              │
│  - Forwards via stdio                                       │
└─────────────────────────┬───────────────────────────────────┘
                          │ stdio (stdin/stdout)
                          │ JSON-RPC 2.0
                          ▼
┌─────────────────────────────────────────────────────────────┐
│    GitHub MCP Server (Official npm package)                 │
│  @modelcontextprotocol/server-github                        │
└─────────────────────────┬───────────────────────────────────┘
                          │ GitHub REST API
                          ▼
                     GitHub.com
```

---

## Files Changed/Added

### New Files

| File | Purpose |
|------|---------|
| `mcp-gateway/src/server.ts` | Gateway implementation |
| `mcp-gateway/package.json` | Gateway dependencies |
| `mcp-gateway/tsconfig.json` | TypeScript config |
| `mcp-gateway/Dockerfile` | Docker image |
| `mcp-gateway/.dockerignore` | Docker build excludes |
| `mcp-gateway/.gitignore` | Git excludes |
| `mcp-gateway/README.md` | Gateway docs |
| `docker-compose.mcp.yml` | Docker Compose setup |
| `scripts/mcp-up.sh` | Start script |
| `scripts/mcp-down.sh` | Stop script |
| `docs/GITHUB_MCP_SETUP.md` | Complete setup guide |
| `IMPLEMENTATION_SUMMARY_MCP.md` | This file |

### Modified Files

| File | Change |
|------|--------|
| `backend/.env.example` | Added `GITHUB_MCP_BASE_URL` and `GITHUB_TOKEN` guidance |
| `backend/README.md` | Added GitHub MCP Server section |

---

## Acceptance Criteria

### ✅ 1. Docker Compose starts gateway

```bash
docker compose -f docker-compose.mcp.yml up -d
# ✓ Container: akis-github-mcp-gateway running
# ✓ Port: 4010 exposed
```

### ✅ 2. Health check confirms gateway is alive

```bash
curl http://localhost:4010/health
# {"status":"ok","service":"akis-github-mcp-gateway"}
```

### ✅ 3. Backend can use gateway

```bash
# backend/.env
GITHUB_MCP_BASE_URL=http://localhost:4010/mcp
GITHUB_TOKEN=ghp_...

# Backend starts without "Missing dependency: GITHUB_MCP_BASE_URL"
cd backend && pnpm dev
```

### ✅ 4. Remote hosted option documented

See `docs/GITHUB_MCP_SETUP.md` → Option 2

---

## Testing

### Manual Test: Gateway Health

```bash
export GITHUB_TOKEN=ghp_your_token_here
./scripts/mcp-up.sh

# Should output:
# ✅ GITHUB_TOKEN is set
# ✅ Docker found
# ✅ MCP Gateway is running!
# Gateway URL: http://localhost:4010/mcp
```

### Manual Test: MCP Request

```bash
curl -X POST http://localhost:4010/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "params": {},
    "id": 1
  }'

# Should return JSON-RPC response with available tools
```

### Manual Test: Backend Integration

```bash
# 1. Start gateway
export GITHUB_TOKEN=ghp_your_token_here
./scripts/mcp-up.sh

# 2. Configure backend
echo "GITHUB_MCP_BASE_URL=http://localhost:4010/mcp" >> backend/.env

# 3. Start backend
cd backend && pnpm dev

# 4. Trigger Scribe job (via UI or API)
# Should NOT fail with "Missing dependency: GITHUB_MCP_BASE_URL"
```

---

## Troubleshooting Quick Reference

| Symptom | Fix |
|---------|-----|
| `GITHUB_TOKEN is not set` | `export GITHUB_TOKEN=ghp_...` |
| Gateway fails to start | Check Docker is running |
| Health check fails | Check logs: `docker compose -f docker-compose.mcp.yml logs` |
| Backend "Missing dependency" | Add `GITHUB_MCP_BASE_URL=http://localhost:4010/mcp` to `backend/.env` |
| MCP requests timeout | Check gateway logs, verify GitHub token |

---

## Next Steps

1. **Test with real Scribe job**:
   - Connect GitHub OAuth in UI
   - Create Scribe config
   - Run test job
   - Verify job completes without injection errors

2. **Production considerations**:
   - Use secrets manager for `GITHUB_TOKEN`
   - Monitor gateway health
   - Set up log aggregation
   - Consider rate limiting

3. **Future enhancements**:
   - Support GitHub App authentication (instead of PAT)
   - Add metrics/observability
   - Connection pooling
   - Request caching

---

## Security Notes

- **Never commit** `GITHUB_TOKEN` to version control
- Use `.env` files (ignored by git)
- Token should have minimum scopes: `repo`, `read:org`
- Rotate tokens periodically
- For production, use secrets management (Vault, AWS Secrets Manager, etc.)

---

## References

- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
- [GitHub MCP Server (Official)](https://github.com/modelcontextprotocol/servers/tree/main/src/github)
- [AKIS Backend README](backend/README.md)
- [GitHub MCP Setup Guide](docs/GITHUB_MCP_SETUP.md)

