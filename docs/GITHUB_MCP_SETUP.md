# GitHub MCP Server Setup Guide

This guide explains how to run GitHub MCP (Model Context Protocol) Server for AKIS agents.

## What is GitHub MCP?

GitHub MCP Server provides structured access to GitHub APIs via the Model Context Protocol. AKIS agents (Scribe, Trace, Proto) use it to interact with GitHub repositories.

## Two Options

### Option 1: Local Docker Gateway (Recommended for Development)

Run the official GitHub MCP Server locally with an HTTP gateway.

**Pros:**
- Full control and privacy
- No external service dependencies
- Works with standard GitHub PAT
- Free

**Cons:**
- Requires Docker
- Requires GitHub Personal Access Token
- Local resource usage

**Setup:**

1. **Create GitHub Personal Access Token**:
   - Visit: https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Scopes: `repo`, `read:org`
   - Copy the token (starts with `ghp_...`)

2. **Set environment variable**:
   ```bash
   export GITHUB_TOKEN=ghp_your_token_here
   ```

3. **Start MCP Gateway**:
   ```bash
   ./scripts/mcp-up.sh
   ```

   This will:
   - Start Docker container with GitHub MCP Server
   - Expose HTTP endpoint at `http://localhost:4010/mcp`
   - Run health checks

4. **Configure backend**:
   Add to `backend/.env`:
   ```bash
   GITHUB_MCP_BASE_URL=http://localhost:4010/mcp
   GITHUB_TOKEN=ghp_your_token_here
   ```

5. **Verify**:
   ```bash
   curl http://localhost:4010/health
   # Should return: {"status":"ok","service":"akis-github-mcp-gateway"}
   ```

**Stop gateway**:
```bash
./scripts/mcp-down.sh
```

---

### Option 2: Remote Hosted GitHub Copilot MCP (Easy Mode)

Use GitHub's hosted MCP endpoint (if you have GitHub Copilot subscription).

**Pros:**
- No local setup required
- No Docker needed
- Managed by GitHub

**Cons:**
- Requires GitHub Copilot subscription
- External dependency
- May have rate limits

**Setup:**

1. **Verify GitHub Copilot access**:
   - Check you have active GitHub Copilot subscription
   - Visit: https://github.com/settings/copilot

2. **Configure backend**:
   Add to `backend/.env`:
   ```bash
   GITHUB_MCP_BASE_URL=https://api.githubcopilot.com/mcp/
   ```

3. **Authentication**:
   - Uses OAuth tokens from user's GitHub connection
   - No additional PAT needed

---

## Architecture

### Local Docker Gateway

```
AKIS Backend
   ↓ HTTP POST (JSON-RPC)
   ↓ http://localhost:4010/mcp
   ↓
MCP Gateway (Node.js)
   ↓ stdio (JSON-RPC)
   ↓
GitHub MCP Server (official @modelcontextprotocol/server-github)
   ↓ GitHub REST API
   ↓
GitHub.com
```

### Remote Hosted

```
AKIS Backend
   ↓ HTTP POST (JSON-RPC)
   ↓ https://api.githubcopilot.com/mcp/
   ↓
GitHub Copilot MCP Service
   ↓
GitHub.com
```

---

## Troubleshooting

### "Missing dependency: GITHUB_MCP_BASE_URL"

**Cause**: Backend `.env` does not have `GITHUB_MCP_BASE_URL` set.

**Fix**: Add one of:
```bash
GITHUB_MCP_BASE_URL=http://localhost:4010/mcp  # Local
# OR
GITHUB_MCP_BASE_URL=https://api.githubcopilot.com/mcp/  # Remote
```

### "GitHubMCPService not injected" during job execution

**Cause**: GitHub OAuth not connected for user OR `GITHUB_MCP_BASE_URL` not set.

**Fix**:
1. Connect GitHub at `/dashboard/agents/scribe`
2. Ensure `GITHUB_MCP_BASE_URL` is set (see above)
3. Restart backend

### Local gateway fails to start

**Symptoms**:
```
❌ ERROR: GITHUB_TOKEN environment variable is not set
```

**Fix**:
```bash
export GITHUB_TOKEN=ghp_your_token_here
./scripts/mcp-up.sh
```

**Verify token**:
```bash
curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user
```

### Gateway health check fails

**Check logs**:
```bash
docker compose -f docker-compose.mcp.yml logs akis-github-mcp-gateway
```

**Common issues**:
- Port 4010 already in use → Change `MCP_GATEWAY_PORT` in `.env`
- Invalid GitHub token → Verify token scopes
- Docker not running → Start Docker Desktop

### MCP requests timeout

**Check**:
1. Gateway logs: `docker compose -f docker-compose.mcp.yml logs -f`
2. Network connectivity: `curl http://localhost:4010/health`
3. GitHub API status: https://www.githubstatus.com/

**Increase timeout**:
The gateway has a 30-second request timeout. If needed, edit `mcp-gateway/src/server.ts`:
```typescript
private readonly REQUEST_TIMEOUT = 60000; // 60 seconds
```

---

## Development

### Run gateway locally (no Docker)

```bash
cd mcp-gateway
export GITHUB_TOKEN=ghp_your_token_here
pnpm install
pnpm dev
```

### Test MCP endpoint

```bash
curl -X POST http://localhost:4010/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "github/getRepository",
    "params": {"owner": "octocat", "repo": "hello-world"},
    "id": 1
  }'
```

---

## Security

### Token Storage

- **Never commit** GitHub tokens to version control
- Use `.env` files (ignored by git)
- Rotate tokens periodically

### Token Scopes

Minimum required scopes:
- `repo` - Full repository access
- `read:org` - Read organization data

### Network Security

Local gateway:
- Binds to `0.0.0.0:4010` (accessible from Docker network)
- For production, use proper network segmentation

Remote hosted:
- Uses HTTPS
- Managed by GitHub

---

## FAQ

**Q: Which option should I use?**  
A: Local Docker gateway for development. Remote hosted if you have Copilot and want zero setup.

**Q: Can I use both options?**  
A: No, pick one. Set `GITHUB_MCP_BASE_URL` to only one value.

**Q: Do I need GitHub Copilot for local gateway?**  
A: No. Local gateway only needs a GitHub PAT.

**Q: What's the difference between `GITHUB_TOKEN` and `GITHUB_OAUTH_*`?**  
A:
- `GITHUB_TOKEN` - Used by MCP gateway for GitHub API calls
- `GITHUB_OAUTH_CLIENT_ID/SECRET` - Used for user login flow

**Q: Can I use GitHub App credentials instead of PAT?**  
A: Not currently. The MCP gateway requires a PAT. GitHub App support may be added later.

---

## References

- [Model Context Protocol (MCP) Specification](https://modelcontextprotocol.io/)
- [GitHub MCP Server (Official)](https://github.com/modelcontextprotocol/servers/tree/main/src/github)
- [GitHub Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)

