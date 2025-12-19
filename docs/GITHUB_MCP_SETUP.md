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

### Quick Start (Recommended): MCP Doctor

The fastest way to get started:

```bash
# One-command setup + smoke test
./scripts/mcp-doctor.sh
```

**What it does:**
1. Ensures `.env.mcp.local` exists (creates from template if missing)
2. Verifies file is gitignored (security check)
3. Verifies `GITHUB_TOKEN` key is present
4. Runs: MCP Gateway up → smoke test → cleanup
5. Writes redacted logs to `.mcp-doctor-*.log` (gitignored)
6. Provides clear next steps for UI verification

**First-time flow:**
1. Run `./scripts/mcp-doctor.sh`
2. If token missing, script creates `.env.mcp.local` and exits with instructions
3. Get a GitHub token: https://github.com/settings/tokens (scopes: `repo`, `read:org`)
4. Edit `.env.mcp.local` and paste your token: `GITHUB_TOKEN=ghp_...`
5. Run `./scripts/mcp-doctor.sh` again → ✅ PASS

**Expected output (first run without token):**
```
[ERROR] SETUP INCOMPLETE: You must add your GitHub token!
Next steps:
  1. Get a GitHub Personal Access Token: https://github.com/settings/tokens
  2. Edit .env.mcp.local and set GITHUB_TOKEN: GITHUB_TOKEN=ghp_your_actual_token_here
  3. Run this script again: ./scripts/mcp-doctor.sh
```

**Expected output (with valid token):**
```
✅ All checks passed!
Next steps for UI verification:
  1. Start backend and frontend
  2. Open Scribe agent in browser
  3. Run a test job (dry run)
  4. Verify: No -32601 errors, Correlation ID visible, Copy button works
```

---

### Manual Setup (Alternative)

If you prefer step-by-step control or need to troubleshoot:

1. **Create GitHub Personal Access Token**:
   - Visit: https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Scopes: `repo`, `read:org`, `read:packages` (optional)
   - Copy the token (starts with `ghp_...`)

2. **Configure environment file**:
   ```bash
   # Copy the template
   cp env.mcp.local.example .env.mcp.local
   
   # Edit .env.mcp.local and add your token
   # Replace 'your_github_token_here' with your actual token
   ```
   
   **IMPORTANT**: 
   - `.env.mcp.local` is gitignored and will never be committed
   - This file is used by Docker Compose to configure the MCP Gateway
   - Never commit real tokens to version control

3. **Start MCP Gateway**:
   ```bash
   ./scripts/mcp-up.sh
   ```

   The script will:
   - **Auto-create `.env.mcp.local` from template if missing** (you'll need to add your token after)
   - Check for `GITHUB_TOKEN` presence and validate it's not empty (without reading the value)
   - **Fail fast with clear instructions if token is missing** (no silent skips)
   - Start Docker container with official `@modelcontextprotocol/server-github`
   - Expose HTTP endpoint at `http://localhost:4010/mcp`
   - Run health checks
   - Show configuration instructions

   **First-time flow**:
   1. Run `./scripts/mcp-up.sh`
   2. If `.env.mcp.local` doesn't exist, script creates it from `env.mcp.local.example`
   3. Script exits with instructions to add your `GITHUB_TOKEN`
   4. Edit `.env.mcp.local` and paste your token
   5. Run `./scripts/mcp-up.sh` again → gateway starts

   **Using a custom env file**:
   ```bash
   ./scripts/mcp-up.sh --mcp-env-file .env.mcp.dev
   ```
   
   This uses a different env file for the compose `env_file` directive. Useful for different environments (dev/staging/prod).

4. **Run smoke test** (optional but recommended):
   ```bash
   ./scripts/mcp-smoke-test.sh
   ```

   This validates:
   - Gateway is responding
   - JSON-RPC validation works
   - MCP initialize handshake succeeds
   - Correlation IDs are working

5. **Configure backend**:
   Add to `backend/.env`:
   ```bash
   GITHUB_MCP_BASE_URL=http://localhost:4010/mcp
   GITHUB_TOKEN=ghp_your_token_here  # Copy from .env.mcp.local
   ```
   
   **Note**: The backend needs `GITHUB_TOKEN` for its own API calls, separate from the MCP Gateway.

6. **Verify**:
   ```bash
   # Health check
   curl http://localhost:4010/health
   # Should return: {"status":"ok","service":"akis-github-mcp-gateway","mcpServer":{"running":true}}
   
   # Or run full smoke test
   ./scripts/mcp-smoke-test.sh
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

### Quick Diagnostics: Run MCP Doctor First

**Before diving into specific issues, run the automated diagnostic:**

```bash
./scripts/mcp-doctor.sh
```

This will:
- ✅ Check if `.env.mcp.local` exists and is properly configured
- ✅ Verify the file is gitignored (security)
- ✅ Validate `GITHUB_TOKEN` is present (without exposing value)
- ✅ Run complete setup + smoke test
- ✅ Provide redacted logs for sharing (safe for support)

**If doctor fails:**
1. Read the error message - it provides actionable fix instructions
2. Check the log file: `.mcp-doctor-<timestamp>.log`
3. Share the redacted log + correlation ID (never share token)

**Exit codes:**
- `0` = Success (all checks passed)
- `1` = Setup incomplete (user action required - e.g., missing token)
- `2` = Smoke test failed (MCP Gateway issue)
- `3` = Security violation (env file not ignored)

---

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
❌ ERROR: Environment file not found: .env.mcp.local
```
or
```
❌ ERROR: GITHUB_TOKEN is missing or empty in .env.mcp.local
```

**Fix**:
```bash
# Create .env.mcp.local from template
cp env.mcp.local.example .env.mcp.local

# Edit the file and add your token
# Replace 'your_github_token_here' with your actual token
nano .env.mcp.local  # or use your preferred editor

# Start the gateway
./scripts/mcp-up.sh
```

**Key point**: The gateway requires `.env.mcp.local` to exist with a valid `GITHUB_TOKEN`. There is no shell environment fallback - this is intentional to ensure consistent behavior and prevent token override bugs.

**Verify token works** (safe approach - without sourcing the file):
```bash
# Test your token directly (paste your actual token, don't commit this command)
curl -H "Authorization: token ghp_YOUR_TOKEN" https://api.github.com/user
# Should return your GitHub user info
```

**Note**: The `mcp-up.sh` script validates token presence in `.env.mcp.local` using `grep` - it never sources or echoes the file contents. This is by design to prevent accidental secret leakage.

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

### `MCP Error [-32601]: Method not found` (Scribe job)

**Cause**: Backend is calling a non-standard / legacy JSON-RPC method name (e.g. `github/getFile`) instead of MCP-standard methods.

**Fix**:
- Ensure backend uses MCP standard flow: `initialize` → `tools/list` → `tools/call`
- Re-run the job after updating backend

**Debug with correlationId**:
1. Open the failed job in UI: `/dashboard/jobs/<jobId>`
2. Copy **Correlation ID** from the error panel
3. Filter gateway logs by correlation ID:

```bash
docker compose -f docker-compose.mcp.yml logs -f akis-github-mcp-gateway | grep "<correlation-id>"
```

### "MCP Request failed: 400 Bad Request"

**Symptoms**:
Backend logs show: `MCP Request failed: 400 Bad Request`

**Root Causes**:

1. **Missing Content-Type header**:
   - Fix: Ensure HTTP client sends `Content-Type: application/json`
   - Backend GitHubMCPService should already do this

2. **Invalid JSON-RPC envelope**:
   - Requires: `{"jsonrpc": "2.0", "method": "...", "id": ...}`
   - Check: Gateway logs show correlation ID and exact error

3. **Wrong endpoint path**:
   - Correct: `POST http://localhost:4010/mcp`
   - Wrong: `POST http://localhost:4010/` or `POST http://localhost:4010/github`

**Debug**:
```bash
# Check gateway logs for correlation ID
docker compose -f docker-compose.mcp.yml logs -f | grep "ERROR"

# Test with valid request
curl -X POST http://localhost:4010/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","params":{},"id":1}'
```

### "MCP server not running" or service unavailable

**Symptoms**:
- Gateway returns 503
- Health check shows `"running": false`

**Fix**:
```bash
# Restart gateway
./scripts/mcp-down.sh
./scripts/mcp-up.sh

# Check logs for MCP server startup errors
docker compose -f docker-compose.mcp.yml logs akis-github-mcp-gateway
```

### Correlation ID debugging

Every request gets a unique correlation ID (UUID). Use it to trace requests:

**HTTP Header**: `x-correlation-id`
- Gateway accepts inbound correlation ID if provided
- Gateway always returns correlation ID in response headers
- Error bodies include `correlationId` in `data` field

**Workflow**:

```bash
# 1. Backend error shows:
#    "Correlation ID: abc-123-def"

# 2. Search gateway logs:
docker compose -f docker-compose.mcp.yml logs | grep "abc-123-def"

# 3. Or use the smoke test to verify correlation ID handling:
./scripts/mcp-smoke-test.sh
```

**Sending custom correlation ID** (useful for tracing):

```bash
curl -X POST http://localhost:4010/mcp \
  -H "Content-Type: application/json" \
  -H "x-correlation-id: my-trace-123" \
  -d '{"jsonrpc":"2.0","method":"initialize","params":{},"id":1}'

# Response header will include:
# x-correlation-id: my-trace-123
```

This shows the full request/response cycle for that specific request.

---

## Environment Variables Reference

### Understanding "Who Reads What"

Docker Compose has two ways to set container environment variables:

1. **`env_file`**: Loads file contents directly into container environment
   - File is read at container start
   - Values go directly to the container
   - **Use for: Secrets (GITHUB_TOKEN)**

2. **`environment`**: Shell interpolation + explicit values
   - `${VAR:-default}` reads from YOUR shell, not from env_file
   - Values OVERRIDE what was loaded from env_file
   - **Use for: Non-secret defaults (PORT, LOG_LEVEL)**

**Key Rules**:
1. **Never put secrets in `environment` section** - they should only come from `env_file`
2. **env_file path can be customized** via `COMPOSE_ENV_FILE` environment variable (used by scripts/mcp-up.sh)
3. **Compose loads env_file BEFORE environment** - so environment values can override env_file, but we never do this for secrets

### Docker Compose (.env.mcp.local)

This file is loaded via `env_file` directive - values go directly to the container.

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GITHUB_TOKEN` | ✅ | - | GitHub PAT with `repo`, `read:org` scopes |

Optional overrides (can be added to .env.mcp.local if needed):
| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `info` | Logging level (`debug`/`info`/`error`) |
| `MCP_GATEWAY_PORT` | `4010` | Gateway HTTP port (must match compose ports) |

**Note**: The gateway accepts both `LOG_LEVEL` and `MCP_LOG_LEVEL` for backward compatibility, but `LOG_LEVEL` is the canonical name.

### Backend (.env)

Loaded by the Fastify backend application (not Docker Compose).

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GITHUB_TOKEN` | ✅ | - | GitHub PAT for backend API calls |
| `GITHUB_MCP_BASE_URL` | ✅ | - | MCP Gateway URL (e.g., `http://localhost:4010/mcp`) |
| `DATABASE_URL` | ✅ | - | PostgreSQL connection string |

### Correlation ID Header

**Header**: `x-correlation-id`
- If provided in request, gateway preserves it in response
- If not provided, gateway generates a new UUID
- Always included in error response body and headers
- Useful for tracing requests across services

## Development

### Run gateway locally (no Docker)

For local development of the gateway source code (not normal usage), you can run without Docker:

```bash
cd mcp-gateway
pnpm install

# Create a local .env file for development (gitignored)
echo "GITHUB_TOKEN=ghp_your_token_here" > .env

# Run with dotenv support
pnpm dev
```

**⚠️ Important**: 
- This workflow is ONLY for developing the gateway itself
- For normal usage, always use Docker Compose with `.env.mcp.local`
- Never use `export GITHUB_TOKEN=...` in your shell - use env files instead
- The `.env` file in mcp-gateway/ is gitignored

### Test MCP endpoint

```bash
# Test initialize handshake
curl -X POST http://localhost:4010/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "initialize",
    "params": {
      "protocolVersion": "0.1.0",
      "capabilities": {},
      "clientInfo": {"name": "test", "version": "1.0.0"}
    },
    "id": 1
  }'

# Or use smoke test script
./scripts/mcp-smoke-test.sh
```

---

## Security

### Token Safety Checklist ✅

Before deploying or sharing your setup, verify all items:

#### 1. Token Creation (Least Privilege)
- [ ] Use **Classic tokens** (not fine-grained) for MCP compatibility
- [ ] Grant only required scopes:
  - `repo` - Repository access (required)
  - `read:org` - Organization data (required)
  - `read:packages` - Package data (optional)
- [ ] Set token expiration (recommended: 90 days)
- [ ] Never use tokens with `admin:*` or `delete_repo` scopes

#### 2. Local File Placement
- [ ] `.env.mcp.local` exists at repo root (for MCP Gateway)
- [ ] `backend/.env` exists in backend directory (for Fastify app)
- [ ] `.cursor/mcp.json` (if used) is gitignored - **never commit Cursor MCP config with real tokens**
- [ ] All local-only files are gitignored (verify with `git status`)
- [ ] Templates exist: `env.mcp.local.example`, `backend/.env.example`, `.cursor/mcp.json.example`

#### 3. Non-Leak Practices
- [ ] **Never print tokens** - scripts use `grep` to validate, not `echo`
- [ ] **Never source env files** - `source .env` leaks into shell environment
- [ ] **Never use shell export** - `export GITHUB_TOKEN=...` persists in shell history
- [ ] **Never commit env files** - all `.env*` patterns in `.gitignore`
- [ ] **Never put tokens in compose environment section** - only use `env_file`

#### 4. Verification Commands
```bash
# Check no secrets in git
git grep "ghp_" | grep -v "your_token" | grep -v "_here"
# Should return empty or only placeholders

# Verify all env files are gitignored
git status --ignored | grep -E "\.env"
# Should show all .env files as ignored

# Verify compose has no token in environment section
grep -A20 "environment:" docker-compose.mcp.yml | grep GITHUB_TOKEN
# Should return nothing

# Test compose config is warning-free
docker compose -f docker-compose.mcp.yml config 2>&1 | grep -i "variable"
# Should return nothing
```

### Who Reads What (Single Source of Truth)

Understanding which system reads which file prevents confusion and security issues:

| File | Read By | Contains | Committed? |
|------|---------|----------|------------|
| `.env.mcp.local` | Docker Compose `env_file` | `GITHUB_TOKEN` for MCP Gateway | ❌ No (gitignored) |
| `backend/.env` | Fastify app (dotenv) | `GITHUB_TOKEN`, `DATABASE_URL`, etc. | ❌ No (gitignored) |
| `.cursor/mcp.json` | Cursor IDE MCP extension | `GITHUB_TOKEN` in `env` field (optional) | ❌ No (gitignored) |
| `env.mcp.local.example` | Developers (copy template) | Placeholder values only | ✅ Yes |
| `backend/.env.example` | Developers (copy template) | Placeholder values only | ✅ Yes |
| `.cursor/mcp.json.example` | Developers (copy template) | Placeholder values only | ✅ Yes |

**Supported Workflow**:
```
1. Developer copies template → creates local env file
2. Docker Compose loads env_file → passes to container
3. Container receives GITHUB_TOKEN → uses for GitHub API
4. Nothing reads from shell environment (intentional)
```

**Unsupported Patterns** (will cause issues):
- ❌ `export GITHUB_TOKEN=...` in shell
- ❌ `${GITHUB_TOKEN:-}` in compose environment section
- ❌ `source .env.mcp.local` in scripts
- ❌ Committing any `.env` file

### Token Scopes (Least Privilege)

Minimum required scopes for AKIS MCP Gateway:

| Scope | Purpose | Required |
|-------|---------|----------|
| `repo` | Read/write repository content | ✅ Yes |
| `read:org` | List organizations and members | ✅ Yes |
| `read:packages` | Read package registry | ❌ Optional |

**Token Types**:
- **Classic tokens**: ✅ Recommended (full MCP compatibility)
- **Fine-grained tokens**: ⚠️ May have compatibility issues with some MCP operations

**Rotation**:
- Recommended: Every 90 days
- GitHub Settings → Developer settings → Personal access tokens → Regenerate

### Network Security

**Local gateway** (Docker):
- Binds to `0.0.0.0:4010` (accessible from Docker network)
- For production, use proper network segmentation
- Consider using Docker internal networks only

**Remote hosted** (GitHub Copilot MCP):
- Uses HTTPS (TLS encrypted)
- Managed by GitHub
- Requires active Copilot subscription

---

## FAQ

**Q: Which option should I use?**  
A: Local Docker gateway for development. Remote hosted if you have Copilot and want zero setup.

**Q: Can I use both options?**  
A: No, pick one. Set `GITHUB_MCP_BASE_URL` to only one value.

**Q: Do I need GitHub Copilot for local gateway?**  
A: No. Local gateway only needs a GitHub PAT.

**Q: What's the difference between `.env.mcp.local` and `backend/.env`?**  
A:
- `.env.mcp.local` - Used by Docker Compose for MCP Gateway container
- `backend/.env` - Used by Fastify backend application
- Both are gitignored and should contain your `GITHUB_TOKEN`

**Q: What's the difference between `GITHUB_TOKEN` and `GITHUB_OAUTH_*`?**  
A:
- `GITHUB_TOKEN` - Personal Access Token for GitHub API calls (used by MCP and backend)
- `GITHUB_OAUTH_CLIENT_ID/SECRET` - OAuth app credentials for user login flow
- They serve different purposes and are both needed

**Q: Can I use GitHub App credentials instead of PAT?**  
A: Not currently. The MCP gateway requires a PAT. GitHub App support may be added later.

**Q: Why do I need the token in two places?**  
A:
- MCP Gateway (`.env.mcp.local`) uses it to make GitHub API calls on behalf of agents
- Backend (`backend/.env`) may use it for its own direct GitHub API calls
- They can use the same token value

**Q: I see "variable is not set" warnings when running docker compose. Is this a problem?**  
A: You should NOT see this warning with the current setup. If you do:
1. Verify `docker-compose.mcp.yml` has NO `GITHUB_TOKEN` in the `environment` section
2. Verify `.env.mcp.local` exists and contains `GITHUB_TOKEN=ghp_...`
3. Run `docker compose -f docker-compose.mcp.yml config` to test

See the "Token Safety Checklist" section above for full verification steps.

---

## References

- [Model Context Protocol (MCP) Specification](https://modelcontextprotocol.io/)
- [GitHub MCP Server (Official)](https://github.com/modelcontextprotocol/servers/tree/main/src/github)
- [GitHub Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)

