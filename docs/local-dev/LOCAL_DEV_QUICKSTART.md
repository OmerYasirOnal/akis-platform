# Local Development Quickstart

Quick reference for starting local development on AKIS.

## Prerequisites

- **Node.js**: >= 20.0.0
- **pnpm**: Latest version (`npm install -g pnpm`)
- **Docker**: For PostgreSQL (or install PostgreSQL 14+ locally)
- **Git**: For version control

## 🚀 Quick Start (5 steps)

```bash
# 1. Install dependencies (development mode)
unset NODE_ENV
export NODE_ENV=development
pnpm install

# 2. Start PostgreSQL (Docker)
./scripts/db-up.sh

# 3. Set DATABASE_URL and run migrations
export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/akis_v2"
pnpm -C backend db:migrate

# 4. Start backend dev server
pnpm -C backend dev

# 5. Start frontend dev server (new terminal)
pnpm -C frontend dev
```

## 🗄️ Database Configuration

**Default connection (local dev):**
```
Host:     localhost
Port:     5433  ⚠️ Note: 5433, not 5432!
Database: akis_v2
User:     postgres
Password: postgres
```

**DATABASE_URL:**
```bash
export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/akis_v2"
```

### Database Commands

```bash
# Start DB
./scripts/db-up.sh

# Stop DB
./scripts/db-down.sh

# Run migrations
pnpm -C backend db:migrate

# Generate new migration (after schema changes)
pnpm -C backend db:generate

# Open DB studio (GUI)
pnpm -C backend db:studio
```

## 🧪 Running Tests

### Backend Tests

```bash
# All tests (loads .env automatically)
pnpm -C backend test

# With explicit DATABASE_URL (if .env missing)
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/akis_v2" pnpm -C backend test

# Individual test file
pnpm -C backend test -- test/unit/example.test.ts
```

### Frontend Tests

```bash
# All tests
pnpm -C frontend test

# Watch mode
pnpm -C frontend test -- --watch

# UI mode (interactive)
pnpm -C frontend test -- --ui
```

## 🔍 Quality Gates (Local)

Run all gates locally before pushing:

```bash
# Backend
pnpm -C backend lint
pnpm -C backend typecheck
pnpm -C backend test

# Frontend
pnpm -C frontend lint
pnpm -C frontend typecheck
pnpm -C frontend test
pnpm -C frontend build

# Or run everything at once
./scripts/verify-local.sh
```

## ⚙️ Environment Variables

### Backend (.env)

Copy `backend/.env.example` to `backend/.env` and configure:

```bash
# Database (required)
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/akis_v2

# Server
PORT=3000
NODE_ENV=development

# Frontend
FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173

# GitHub OAuth (for user login)
GITHUB_OAUTH_CLIENT_ID=your_client_id
GITHUB_OAUTH_CLIENT_SECRET=your_client_secret

# GitHub Token (for agent operations)
GITHUB_TOKEN=your_github_pat

# MCP Gateway
GITHUB_MCP_BASE_URL=http://localhost:4010/mcp
```

### Frontend (.env)

Copy `frontend/.env.example` to `frontend/.env`:

```bash
VITE_API_URL=http://localhost:3000
```

## 🐛 Common Issues

### "command not found: vite/eslint/tsc/vitest"

**Cause**: Dependencies installed in production mode (NODE_ENV=production)

**Fix:**
```bash
# Clear and reinstall in development mode
cd frontend
rm -rf node_modules
unset NODE_ENV
export NODE_ENV=development
pnpm install
```

### "DATABASE_URL environment variable is required"

**Cause**: .env not loaded or DATABASE_URL not set

**Fix:**
```bash
# Option 1: Set in shell
export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/akis_v2"

# Option 2: Ensure backend/.env exists
cp backend/.env.example backend/.env
# Edit backend/.env and set DATABASE_URL

# Option 3: Check DB is running
./scripts/db-up.sh
```

### Backend test returns 500 DATABASE_ERROR

**Cause**: DB not running or migrations not applied

**Fix:**
```bash
./scripts/db-up.sh
export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/akis_v2"
pnpm -C backend db:migrate
pnpm -C backend test
```

### Port 5433 already in use

**Cause**: Previous Docker container still running

**Fix:**
```bash
./scripts/db-down.sh
./scripts/db-up.sh
```

### verify-local.sh fails on macOS

**Cause**: Script now fixed! If still failing:

**Fix:**
```bash
# Ensure using bash (not sh)
bash ./scripts/verify-local.sh

# Check bash version (should work with 3.2+)
bash --version
```

## 📂 Project Structure

```
devagents/
├── backend/               # Fastify + TypeScript backend
│   ├── src/
│   │   ├── server.ts     # Entry point
│   │   ├── api/          # REST routes
│   │   ├── agents/       # Agent implementations
│   │   ├── core/         # Orchestrator, state machine
│   │   └── db/           # Drizzle schema + client
│   ├── test/             # Unit + integration tests
│   └── migrations/       # SQL migrations
├── frontend/              # Vite + React frontend
│   ├── src/
│   │   ├── pages/        # Route pages
│   │   ├── components/   # React components
│   │   └── services/     # API client
│   └── test/             # Vitest tests
├── scripts/               # Dev scripts
│   ├── db-up.sh          # Start PostgreSQL
│   ├── db-down.sh        # Stop PostgreSQL
│   └── verify-local.sh   # Run all gates
└── docs/                  # Documentation
```

## 🔗 Helpful Links

- **Backend API**: http://localhost:3000
- **Frontend UI**: http://localhost:5173
- **DB Studio**: `pnpm -C backend db:studio` (opens in browser)
- **API Health**: http://localhost:3000/health

## 💡 Tips

1. **Always export DATABASE_URL** before running backend commands
2. **Use NODE_ENV=development** for pnpm install (ensures devDependencies)
3. **Run verify-local.sh** before opening PRs
4. **Check ./scripts/** for automation helpers
5. **Use pnpm -C <workspace>** to run commands in specific workspace

## 🆘 Still Stuck?

1. Check `backend/.env` and `frontend/.env` exist and are configured
2. Ensure PostgreSQL is running: `docker ps | grep pg`
3. Check logs: backend outputs to console, frontend to browser console
4. Run individual gates to isolate failures
5. Ask in project Slack/Discord or open an issue

---

**Last Updated**: 2025-12-23  
**Maintainer**: Dev Team

