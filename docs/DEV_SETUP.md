# Developer Setup Guide

**Last Updated**: 2025-12-20  
**Target Audience**: Contributors, QA Engineers, New Developers

---

## Quick Start (5 Minutes)

```bash
# 1. Clone and install
git clone https://github.com/OmerYasirOnal/akis-platform-devolopment.git
cd akis-platform-devolopment/devagents
pnpm install

# 2. Start PostgreSQL
./scripts/db-up.sh

# 3. Setup backend
cd backend
cp .env.example .env
# Edit .env: add your DATABASE_URL and GitHub token (see below)
pnpm db:migrate

# 4. Run verification (optional but recommended)
cd ..
./scripts/verify-local.sh
```

**Prerequisites:**
- Node.js 20.x+ (use `nvm` or `asdf`)
- pnpm 8.x+ (`npm install -g pnpm`)
- Docker & Docker Compose
- GitHub account (for OAuth and MCP)

---

## Detailed Setup

### 1. Database Setup

The project uses **PostgreSQL 16** on port **5433** (not the default 5432) to avoid conflicts.

#### Start Database

```bash
./scripts/db-up.sh
```

**What this does:**
- Starts PostgreSQL in Docker
- Listens on `127.0.0.1:5433`
- Creates database `akis_v2`
- Uses credentials: `postgres` / `postgres`
- Persists data in named volume `devagents_pgdata`
- Uses restart policy `unless-stopped` in dev so Postgres returns after Docker restarts

#### Stop Database

```bash
./scripts/db-down.sh
```

If you want to keep the container stopped without removing it:

```bash
docker compose -f docker-compose.dev.yml stop pg
```

**Data persists** in the Docker volume. To completely reset:

```bash
./scripts/db-reset.sh  # ⚠️ DESTRUCTIVE: Deletes all data
```

#### Connection Details

```bash
Host: localhost
Port: 5433
Database: akis_v2
User: postgres
Password: postgres

# Connection string
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/akis_v2
```

#### Adminer (Web UI)

```bash
docker compose -f docker-compose.dev.yml up -d adminer
```

Navigate to http://localhost:8080

---

### 2. Backend Setup

```bash
cd backend

# Create local env file
cp .env.example .env

# Edit .env (required fields)
nano .env
```

**Minimum Required Environment Variables:**

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/akis_v2

# GitHub (for MCP integration)
GITHUB_TOKEN=ghp_YOUR_TOKEN_HERE  # Generate at https://github.com/settings/tokens
GITHUB_MCP_BASE_URL=http://localhost:4010/mcp

# AI (OpenAI or compatible)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o

# Session
SESSION_SECRET=some-random-string-here

# OAuth (for authentication)
GITHUB_OAUTH_CLIENT_ID=your-client-id
GITHUB_OAUTH_CLIENT_SECRET=your-client-secret
```

**GitHub Token Scopes:**
- `repo` (required for Scribe write operations)
- `read:org` (optional, for org discovery)

#### Run Migrations

```bash
pnpm db:migrate
```

#### Start Backend Dev Server

```bash
pnpm dev
```

Backend runs at http://localhost:3000

#### Run Backend Tests

```bash
# Unit + Integration tests
pnpm test

# Typecheck
pnpm typecheck

# Lint
pnpm lint
```

---

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies (if not already done at workspace root)
pnpm install

# Start dev server
pnpm dev
```

Frontend runs at http://localhost:5173

#### Run Frontend Tests

```bash
pnpm test        # Vitest (unit tests)
pnpm test:e2e    # Playwright (E2E smoke tests, requires backend + MCP)
pnpm typecheck   # TypeScript
pnpm lint        # ESLint
pnpm build       # Production build
```

**E2E Tests (Playwright):**

The E2E test suite (`frontend/tests/e2e/scribe.smoke.spec.ts`) requires:
- Backend running at `http://localhost:3000`
- MCP Gateway running at `http://localhost:4010`
- `SCRIBE_DEV_GITHUB_BOOTSTRAP=true` (dev/test only)
- Test user credentials via env vars:
  ```bash
  E2E_EMAIL="qa@example.com"
  E2E_PASSWORD="Passw0rd!"
  E2E_OWNER="my-github-org"
  E2E_REPO="my-repo"
  E2E_BRANCH="main"
  ```

See `docs/QA_SCRIBE_AUTOMATION.md` for full E2E workflows and CI integration.

---

### 4. MCP Gateway Setup (Optional)

The MCP Gateway bridges the GitHub MCP Server to the backend via HTTP.

#### One-Command Setup

```bash
./scripts/mcp-doctor.sh
```

**What this does:**
1. Creates `.env.mcp.local` if missing (from template)
2. Verifies `.env.mcp.local` is gitignored
3. Checks for `GITHUB_TOKEN` presence
4. Starts MCP Gateway
5. Runs smoke tests
6. Stops gateway

#### Manual Setup

```bash
# Create MCP env file
cp env.mcp.local.example .env.mcp.local

# Edit and add your token
nano .env.mcp.local

# Start gateway
./scripts/mcp-up.sh

# Test
./scripts/mcp-smoke-test.sh

# Stop
./scripts/mcp-down.sh
```

**Gateway runs at**: http://localhost:4010

---

## Common Errors & Solutions

### `ECONNREFUSED 127.0.0.1:5433`

**Cause**: PostgreSQL is not running.

**Solution**:
```bash
./scripts/db-up.sh
```

### `DATABASE_URL not set`

**Cause**: Backend `.env` file is missing or incomplete.

**Solution**:
```bash
cd backend
cp .env.example .env
# Edit .env and add DATABASE_URL
```

### `MCP_UNREACHABLE` in Job Details

**Cause**: MCP Gateway is not running or `backend/.env` is missing `GITHUB_MCP_BASE_URL`.

**Solution**:
```bash
# Start gateway
./scripts/mcp-doctor.sh

# Ensure backend/.env has:
GITHUB_MCP_BASE_URL=http://localhost:4010/mcp
GITHUB_TOKEN=ghp_...
```

### Frontend CI Timeout

**Cause**: Tests were using real timers and network requests.

**Status**: ✅ **Fixed** in PR #103 (now uses fake timers).

### Migration Error: `relation does not exist`

**Cause**: Database schema is out of sync.

**Solution**:
```bash
cd backend
pnpm db:migrate
```

To fully reset:
```bash
# Stop backend
./scripts/db-reset.sh  # ⚠️ Deletes all data
./scripts/db-up.sh
cd backend && pnpm db:migrate
```

---

## End-to-End Verification

Run the full CI-equivalent verification locally:

```bash
./scripts/verify-local.sh
```

**What it does:**
1. Install dependencies
2. Start PostgreSQL
3. Run migrations
4. Backend: typecheck, lint, tests
5. Frontend: typecheck, lint, tests, build
6. Generate evidence report in `docs/QA_EVIDENCE.md`

**Output**: Pass/Fail summary + logs in `/tmp/verify-*.log`

### Automated Scribe Smoke (CLI, dev/test only)

Use the deterministic CLI smoke runner to verify Scribe dry-run execution:

```bash
# Start backend (in separate terminal)
cd backend && pnpm dev

# Set required environment variables
export SCRIBE_DEV_GITHUB_BOOTSTRAP=true
export SCRIBE_SMOKE_EMAIL="qa@example.com"
export SCRIBE_SMOKE_PASSWORD="Passw0rd!"
export SCRIBE_SMOKE_OWNER="my-github-org"
export SCRIBE_SMOKE_REPO="my-repo"
export SCRIBE_SMOKE_BRANCH="main"

# Run smoke test
pnpm exec tsx scripts/scribe-smoke.ts
```

**What it does:**
1. Creates a test user via email/password signup
2. Uses `/test/github/bootstrap` to mock GitHub OAuth (dev/test only)
3. Creates a Scribe dry-run job
4. Polls until terminal state
5. Validates trace and artifacts presence
6. Outputs PASS ✅ or FAIL ❌ with details

**Notes:**
- ⚠️ Never set `SCRIBE_DEV_GITHUB_BOOTSTRAP=true` in production.
- The helper route (`POST /test/github/bootstrap`) is only registered in non-production environments.
- The smoke runner uses dry-run jobs and fails fast with actionable hints.
- For full E2E workflows including UI tests, see `docs/QA_SCRIBE_AUTOMATION.md`.

---

## Development Workflow

### 1. Feature Development

```bash
# Create feature branch
git checkout -b feat/your-feature-name

# Start services
./scripts/db-up.sh
cd backend && pnpm dev &
cd frontend && pnpm dev &

# Optional: Start MCP Gateway
./scripts/mcp-up.sh
```

### 2. Pre-Commit Checks

```bash
# Backend
cd backend
pnpm typecheck && pnpm lint && pnpm test

# Frontend
cd frontend
pnpm typecheck && pnpm lint && pnpm test

# Full verification
./scripts/verify-local.sh
```

### 3. Open PR

```bash
# Using automation (recommended)
./scripts/akis-pr-autoflow.sh

# Manual
git push origin feat/your-feature-name
gh pr create --fill
```

---

## Project Structure

```
devagents/
├── backend/          # Fastify API + Agents + DB
│   ├── src/
│   │   ├── agents/   # Scribe and future agents
│   │   ├── api/      # REST endpoints
│   │   ├── db/       # Drizzle schema and client
│   │   ├── core/     # Orchestrator, tracing
│   │   └── services/ # MCP, AI, OAuth
│   ├── test/         # Unit + Integration tests
│   └── migrations/   # Drizzle SQL migrations
├── frontend/         # Vite + React + TypeScript
│   ├── src/
│   │   ├── pages/    # Route pages
│   │   ├── components/ # UI components
│   │   └── services/ # API client
│   └── test/         # Vitest tests
├── mcp-gateway/      # HTTP-to-stdio MCP bridge
├── scripts/          # Automation and dev tools
│   ├── db-up.sh
│   ├── mcp-doctor.sh
│   └── verify-local.sh
└── docs/             # Documentation
```

---

## Environment Files (Security)

### ⚠️ **Never Commit Secrets**

**Gitignored (local only):**
- `backend/.env`
- `frontend/.env`
- `.env.mcp.local`
- `.cursor/mcp.json`

**Committed (safe templates):**
- `backend/.env.example`
- `env.mcp.local.example`
- `.cursor/mcp.json.example`

**Secret Scanning:**
The PR automation (`scripts/akis-pr-autoflow.sh`) scans for token prefixes:
- `ghp_`, `gho_`, `ghu_`, `ghs_`, `ghr_` (GitHub)
- `sk-` (OpenAI)
- `ntn_`, `secret_`

---

## Next Steps

1. **Read**: `docs/PROJECT_STATUS.md` for current capabilities
2. **Explore**: Run `./scripts/verify-local.sh` to validate your setup
3. **Try**: Navigate to http://localhost:5173 and run a Scribe job
4. **QA**: See `docs/QA_SCRIBE_AUTOMATION.md` for automated smoke/E2E workflows
5. **Contribute**: See `CONTRIBUTING.md` for guidelines

---

## Support

**Documentation:**
- MCP Setup: `docs/GITHUB_MCP_SETUP.md`
- QA Automation: `docs/QA_SCRIBE_AUTOMATION.md`
- Testing: `backend/test/README.md`
- Project Status: `docs/PROJECT_STATUS.md`

**Issues:**
- GitHub: https://github.com/OmerYasirOnal/akis-platform-devolopment/issues

**CI/CD:**
- All PRs run automated checks (backend + frontend)
- Merge requires CI green ✅
- Nightly smoke tests (CLI + Playwright E2E) run on `main`

---

**Last Updated**: 2025-12-20  
**Maintainer**: Development Team
