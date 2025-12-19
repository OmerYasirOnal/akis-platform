# AKIS GitHub MCP Gateway

HTTP-to-stdio bridge for GitHub MCP Server. Exposes HTTP JSON-RPC endpoint that forwards requests to the official GitHub MCP Server running via stdio.

## Purpose

The official `@modelcontextprotocol/server-github` runs as a stdio MCP server. AKIS backend expects HTTP-based MCP endpoints. This gateway bridges the gap.

## Architecture

```
AKIS Backend → HTTP POST /mcp → Gateway → stdio → GitHub MCP Server
                                          ←        ←
```

## Running Locally

### Option 1: Docker Compose (Recommended)

```bash
# From repo root
export GITHUB_TOKEN=ghp_your_token_here
docker compose -f docker-compose.mcp.yml up -d

# Verify
curl http://localhost:4010/health

# Shutdown
docker compose -f docker-compose.mcp.yml down
```

### Option 2: Local Node.js

```bash
cd mcp-gateway
export GITHUB_TOKEN=ghp_your_token_here
pnpm install
pnpm dev  # or: pnpm build && pnpm start
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GITHUB_TOKEN` | ✅ | - | GitHub Personal Access Token (PAT) with `repo` scope |
| `MCP_GATEWAY_PORT` | ❌ | `4010` | HTTP server port |
| `MCP_GATEWAY_HOST` | ❌ | `0.0.0.0` | HTTP server host |
| `LOG_LEVEL` | ❌ | `info` | Log level (debug/info/warn/error) |

## Usage in AKIS Backend

Set in `backend/.env`:

```bash
# Local MCP Gateway (Docker)
GITHUB_MCP_BASE_URL=http://localhost:4010/mcp

# OR: Remote hosted GitHub Copilot MCP (if available)
# GITHUB_MCP_BASE_URL=https://api.githubcopilot.com/mcp/
```

## Health Check

```bash
curl http://localhost:4010/health
# {"status":"ok","service":"akis-github-mcp-gateway"}
```

## Troubleshooting

### Gateway fails to start

- Ensure `GITHUB_TOKEN` is set
- Check token has `repo` scope
- Verify port 4010 is not in use

### MCP requests timeout

- Check `docker compose logs akis-github-mcp-gateway`
- Verify GitHub token is valid
- Ensure network connectivity

### Backend still shows "GITHUB_MCP_BASE_URL missing"

- Verify `.env` has `GITHUB_MCP_BASE_URL=http://localhost:4010/mcp`
- Restart backend after env change
- Check backend can reach gateway: `curl http://localhost:4010/health` from backend container/host

## Development

```bash
cd mcp-gateway
pnpm install
pnpm dev  # Watch mode with tsx
```

## License

MIT

