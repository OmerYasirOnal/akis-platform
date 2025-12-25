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

### Real AI (OpenRouter) - Optional

Varsayılanda AI mock modunda çalışır. Gerçek LLM yanıtları için:

1. `backend/.env.local` oluşturun (git'e commit edilmez!)
2. Aşağıdaki değerleri ekleyin:

```bash
# backend/.env.local (DO NOT COMMIT!)
AI_PROVIDER=openrouter
AI_API_KEY=sk-or-v1-***  # OpenRouter API key
AI_MODEL_DEFAULT=meta-llama/llama-3.3-70b-instruct:free
AI_MODEL_PLANNER=tngtech/deepseek-r1t-chimera:free
AI_MODEL_VALIDATION=google/gemini-2.0-flash-exp:free
```

3. Backend'i yeniden başlatın

**Mock'a dönmek için**: `.env.local`'dan `AI_PROVIDER` satırını silin veya `AI_PROVIDER=mock` yapın.

**Yaygın Hatalar:**
- **401**: API key geçersiz → OpenRouter dashboard'dan kontrol edin
- **429**: Rate limit → Bekleyin veya farklı model deneyin

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

### Migrations ran but tables are missing at runtime (500 errors)

**Cause**: Migrations ran against a different database (port mismatch)

This happens when `backend/.env.local` has a different DATABASE_URL than what you're using at runtime.

**How env files are resolved:**
1. Shell export (`export DATABASE_URL=...`) takes highest priority
2. `backend/.env.local` (gitignored, local overrides)
3. `backend/.env` (base config)

**Diagnosis:**
```bash
# Check what drizzle sees
grep DATABASE_URL backend/.env backend/.env.local 2>/dev/null

# Check what Docker is using
docker ps | grep pg
# Should show: 0.0.0.0:5433->5432/tcp

# Check current shell
echo $DATABASE_URL
```

**Fix:**
```bash
# Ensure .env.local uses 5433 (not 5432)
sed -i '' 's/5432/5433/g' backend/.env.local

# Or set explicitly in shell
export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/akis_v2"

# Re-run migrations
pnpm -C backend db:migrate

# Verify with smoke test
./scripts/dev-smoke-jobs.sh
```

**Prevention:**
- The `drizzle.config.ts` now warns if it detects port 5432
- Always export DATABASE_URL before running `db:migrate`
- The standard port for this project is **5433**, not 5432

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

## 🐛 Common Issues

### IPv6 ECONNREFUSED (macOS)
If Playwright tests fail with `ECONNREFUSED` to `127.0.0.1:5173`:
- **Cause**: macOS/Vite binds to `::1` (IPv6) by default, not `127.0.0.1` (IPv4)
- **Fix**: Vite config now sets `host: '127.0.0.1'` explicitly
- **Workaround**: Use `localhost` instead of `127.0.0.1` in URLs

### MCP Gateway Tests Failing
If backend tests fail on "MCP Gateway Integration":
- **Cause**: Tests try to connect to `localhost:4010` but no MCP Gateway is running
- **Fix**: Tests are skipped by default via `SKIP_MCP_TESTS=true`
- **Run MCP tests**: `pnpm -C backend test:mcp` (requires running gateway)

### Port Already in Use
If you get "EADDRINUSE" errors:
```bash
# Find and kill process on port
lsof -ti:3000 | xargs kill -9  # Backend
lsof -ti:5173 | xargs kill -9  # Frontend
```

## 🆘 Still Stuck?

1. Check `backend/.env` and `frontend/.env` exist and are configured
2. Ensure PostgreSQL is running: `docker ps | grep pg`
3. Check logs: backend outputs to console, frontend to browser console
4. Run individual gates to isolate failures
5. Ask in project Slack/Discord or open an issue

---

**Last Updated**: 2025-12-25  
**Maintainer**: Dev Team

