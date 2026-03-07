# AKIS Staging Deploy Checklist

## One-Command Deploy (Recommended)

```bash
# From devagents/ repo root:

# 1. Dry-run (preview what will happen):
./scripts/staging_deploy_manual.sh \
  --host 141.147.25.123 \
  --user ubuntu \
  --key ~/.ssh/id_ed25519

# 2. Full deploy (after reviewing dry-run):
./scripts/staging_deploy_manual.sh \
  --host 141.147.25.123 \
  --user ubuntu \
  --key ~/.ssh/id_ed25519 \
  --confirm
```

The script handles: quality gate → frontend build → DB backup → file transfer → Docker build → deploy → smoke test.

---

## Manual Deploy Steps (if script fails)

### Pre-Deploy (Local)

- [ ] Working tree clean: `git status`
- [ ] On `main` branch: `git checkout main && git pull origin main`
- [ ] Quality gate passes:
  ```bash
  pnpm -C backend typecheck && pnpm -C backend lint && pnpm -C backend build
  pnpm -C frontend typecheck && pnpm -C frontend lint && pnpm -C frontend build
  ```
- [ ] Frontend dist built: `ls frontend/dist/index.html`

### SSH Connection

```bash
ssh -i ~/.ssh/id_ed25519 ubuntu@141.147.25.123
```

### On Server (/opt/akis/)

- [ ] `.env` file exists with required values:
  ```
  POSTGRES_PASSWORD=<set>
  DATABASE_URL=postgresql://akis:<password>@db:5432/akis_staging
  AUTH_JWT_SECRET=<set>
  AI_PROVIDER=anthropic
  AI_API_KEY=<real Anthropic key>
  AI_MODEL_DEFAULT=claude-sonnet-4-6
  AI_KEY_ENCRYPTION_KEY=<set>
  GITHUB_TOKEN=<real GitHub PAT with repo + read:org>
  GITHUB_MCP_BASE_URL=http://mcp-gateway:4010/mcp
  ```
- [ ] `docker-compose.yml` is current (copied from `deploy/oci/staging/docker-compose.yml`)
- [ ] `Caddyfile` is current (copied from `deploy/oci/staging/Caddyfile`)
- [ ] `frontend/` has latest dist (built from `pnpm -C frontend build`)
- [ ] `repo-src/` has latest source with:
  - `Dockerfile.backend` at root
  - `backend/` (package.json, src/, migrations/, tsconfig.json)
  - `pipeline/backend/` (agents, core, adapters)

### Deploy Execution

```bash
cd /opt/akis
# Run the server-side deploy script:
./deploy.sh <COMMIT_SHA>
```

### Post-Deploy Verification

- [ ] Health: `curl https://staging.akisflow.com/health` → `{"status":"ok"}`
- [ ] Ready: `curl https://staging.akisflow.com/ready` → `{"ready":true, ...}`
- [ ] Version: `curl https://staging.akisflow.com/version` → commit matches
- [ ] Frontend: `curl -I https://staging.akisflow.com/` → 200 + HTML
- [ ] Pipeline UI: Open `https://staging.akisflow.com/pipeline` in browser
- [ ] Pipeline API: `curl https://staging.akisflow.com/api/pipelines` → 401 (auth required)
- [ ] MCP: `/ready` response shows `mcp.configured=true, mcp.gatewayReachable=true`
- [ ] Run smoke tests: `./scripts/staging_smoke.sh --host staging.akisflow.com --commit <SHA>`

### Rollback (if needed)

```bash
# On server:
cd /opt/akis
docker compose stop backend
BACKEND_VERSION=<previous_sha> docker compose up -d backend
```

---

## Required .env Variables (template: `deploy/oci/staging/env.example`)

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_PASSWORD` | Yes | Database password |
| `DATABASE_URL` | Yes | Full PostgreSQL connection string |
| `AUTH_JWT_SECRET` | Yes | JWT signing key (openssl rand -base64 32) |
| `AI_PROVIDER` | Yes | `anthropic` for pipeline agents |
| `AI_API_KEY` | Yes | Anthropic API key |
| `AI_KEY_ENCRYPTION_KEY` | Yes | Encryption key for user AI keys |
| `GITHUB_TOKEN` | Yes | GitHub PAT for MCP gateway |
| `GITHUB_MCP_BASE_URL` | Yes | `http://mcp-gateway:4010/mcp` |
| `ACME_EMAIL` | Yes | Let's Encrypt cert notifications |
| `GITHUB_OAUTH_CLIENT_ID` | Optional | GitHub OAuth login |
| `GOOGLE_OAUTH_CLIENT_ID` | Optional | Google OAuth login |
