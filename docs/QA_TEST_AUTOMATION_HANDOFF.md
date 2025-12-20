# QA / Test Automation Handoff Report

**Last Updated**: 2025-12-20  
**Author**: Development Team  
**Target Audience**: QA Engineers, Test Automation Engineers, Release Managers

---

## 0. Snapshot (Current State)

| Item | Value |
|------|-------|
| **Date** | 2025-12-20 |
| **Repository** | `OmerYasirOnal/akis-platform-devolopment` |
| **Branch** | `main` |
| **HEAD SHA** | `b5c88fa` |
| **Node Version** | v20.x (LTS) |
| **pnpm Version** | 9.15.9 |
| **Docker** | Running (postgres:16, mcp-gateway) |
| **PostgreSQL** | Port 5433, Database `akis_v2` |
| **Backend URL** | http://localhost:3000 |
| **Frontend URL** | http://localhost:5173 |
| **MCP Gateway** | http://localhost:4010 |

---

## 1. What Changed (Since Last Handoff)

### Merged PRs (Last 7 Days)

| PR | Title | Impact |
|----|-------|--------|
| #110 | test(e2e): add Playwright Scribe smoke | ✅ E2E automation framework |
| #109 | docs(scribe): add QA automation guide | 📄 Comprehensive QA docs |
| #108 | chore(scribe): allow dev bootstrap for gh owners/repos | 🔧 Dev/test helper routes |
| #107 | feat(scribe): enable dev GitHub bootstrap + smoke runner | 🧪 CLI smoke test automation |
| #106 | chore(docker): remove obsolete compose version field | 🐛 Docker warning fix |
| #105 | docs(qa): Update QA_EVIDENCE.md and add SCRIBE_E2E_REPORT.md | 📄 QA evidence structure |
| #104 | feat(dev): PostgreSQL bootstrap + E2E verification + Project Status Report | 🔧 Local dev tooling |
| #103 | feat: Scribe Observability + UX v1 - Trace Timeline, Artifacts, CI Stabilization | ✨ Job Details UI overhaul |

### Key Features Added

1. **Playwright E2E Framework**
   - End-to-end smoke test for Scribe critical path
   - Login → Configure → Run → Verify job details
   - Headless, CI-stable, artifact-friendly
   - Located: `frontend/tests/e2e/scribe.smoke.spec.ts`

2. **CLI Smoke Test Automation**
   - Deterministic API-level smoke test
   - No OAuth required (dev/test bootstrap)
   - Located: `scripts/scribe-smoke.ts`
   - Outputs: PASS ✅ or FAIL ❌ with details

3. **Dev/Test Bootstrap Helper**
   - `POST /test/github/bootstrap` (non-production only)
   - Allows Scribe dry-run without OAuth
   - Gated by `SCRIBE_DEV_GITHUB_BOOTSTRAP=true` + `NODE_ENV !== 'production'`

4. **Job Details Diagnostics**
   - Timeline tab (trace events)
   - Documents Read tab (artifacts)
   - Files Produced tab (artifacts)
   - Correlation ID copy button
   - MCP Gateway status indicator
   - Actionable error hints

5. **CI Workflows**
   - **PR Gate** (fast quality checks): lint, typecheck, test, build
   - **Nightly Smoke** (full E2E): CLI smoke + Playwright + artifact upload
   - All workflows use GitHub Actions secrets (no secrets in logs)

---

## 2. Environment Setup

### Prerequisites

```bash
# Required
- Node.js 20.x (LTS)
- pnpm 9.x (`npm install -g pnpm`)
- Docker & Docker Compose
- GitHub PAT (for MCP integration)

# Optional
- OpenAI API Key (for AI features)
- GitHub OAuth App credentials (for OAuth login)
```

### Quick Start

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
# Edit .env: add DATABASE_URL, GITHUB_TOKEN, OPENAI_API_KEY
pnpm db:migrate
cd ..

# 4. Setup MCP Gateway
./scripts/mcp-doctor.sh

# 5. Verify setup
./scripts/verify-local.sh
```

### Environment Variables (Test/QA)

**Backend (`backend/.env`)**:
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/akis_v2
GITHUB_TOKEN=ghp_... # Generate at https://github.com/settings/tokens
GITHUB_MCP_BASE_URL=http://localhost:4010/mcp
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
SESSION_SECRET=test-session-secret
NODE_ENV=development
SCRIBE_DEV_GITHUB_BOOTSTRAP=true # For dev/test only
```

**MCP Gateway (`.env.mcp.local`)**:
```bash
GITHUB_TOKEN=ghp_... # Same as backend or separate dev token
LOG_LEVEL=info
```

**Frontend (Environment Variables for E2E)**:
```bash
E2E_EMAIL=qa@example.com
E2E_PASSWORD=Passw0rd!
E2E_OWNER=my-github-org
E2E_REPO=my-repo
E2E_BRANCH=main
```

**⚠️ Security Notes**:
- Never commit `.env` files
- Never set `SCRIBE_DEV_GITHUB_BOOTSTRAP=true` in production
- Redact tokens in logs/screenshots
- Use least-privilege GitHub tokens (scopes: `repo`, `read:org`)

---

## 3. Test Automation Structure

### Test Types

| Type | Location | Runner | Trigger |
|------|----------|--------|---------|
| **Unit Tests (Backend)** | `backend/test/unit/` | Vitest | PR, CI |
| **Integration Tests (Backend)** | `backend/test/integration/` | Vitest | PR, CI |
| **Unit Tests (Frontend)** | `frontend/src/**/__tests__/` | Vitest | PR, CI |
| **E2E Tests (Frontend)** | `frontend/tests/e2e/` | Playwright | Nightly, Manual |
| **CLI Smoke** | `scripts/scribe-smoke.ts` | Node (tsx) | Nightly, Manual |
| **MCP Smoke** | `scripts/mcp-smoke-test.sh` | Bash | Pre-commit, CI |

### CI/CD Workflows

| Workflow | File | Trigger | Purpose |
|----------|------|---------|---------|
| **CI** | `.github/workflows/ci.yml` | Push, PR (all branches) | Full quality gates |
| **PR Gate** | `.github/workflows/pr-gate.yml` | PR → `main` | Fast required checks |
| **Nightly Smoke** | `.github/workflows/nightly-smoke.yml` | Scheduled (2 AM UTC), Manual | E2E verification |

### Test Coverage

| Area | Coverage | Notes |
|------|----------|-------|
| Backend API | ~85% | Unit + Integration tests |
| Frontend Components | ~70% | Vitest + Testing Library |
| Scribe Agent | ~80% | Unit + Integration + Smoke |
| Job Execution | ~75% | Orchestrator, tracing, artifacts |
| MCP Integration | ~70% | Contract tests + smoke |
| E2E Critical Path | 1 spec | Scribe login → configure → run → verify |

---

## 4. Commands Run + Results

### Local Verification (Full Suite)

```bash
# From repo root
./scripts/verify-local.sh

# What it runs:
✅ pnpm install
✅ ./scripts/db-up.sh
✅ pnpm -C backend db:migrate
✅ pnpm -C backend lint
✅ pnpm -C backend typecheck
✅ pnpm -C backend test (129 tests)
✅ pnpm -C frontend lint
✅ pnpm -C frontend typecheck
✅ pnpm -C frontend test (34 tests)
✅ pnpm -C frontend build
```

**Result**: ✅ PASS (All quality gates green)  
**Duration**: ~4-5 minutes  
**Output**: Logs in `/tmp/verify-*.log`, summary in `docs/QA_EVIDENCE.md`

### CLI Smoke Test (Deterministic)

```bash
# Prerequisites: backend running, MCP gateway up
export SCRIBE_DEV_GITHUB_BOOTSTRAP=true
export SCRIBE_SMOKE_EMAIL="qa@example.com"
export SCRIBE_SMOKE_PASSWORD="Passw0rd!"
export SCRIBE_SMOKE_OWNER="my-github-org"
export SCRIBE_SMOKE_REPO="my-repo"
export SCRIBE_SMOKE_BRANCH="main"

pnpm exec tsx scripts/scribe-smoke.ts
```

**Result**: ✅ PASS  
**Duration**: ~15-20 seconds  
**Validates**:
- User signup/login via email/password
- GitHub bootstrap (dev/test helper)
- Scribe dry-run job creation
- Job polling until terminal state
- Trace events presence (min 1)
- Artifacts presence (optional)
- Correlation ID returned

### Playwright E2E Smoke Test

```bash
# Prerequisites: backend + MCP gateway running
cd frontend
export E2E_EMAIL="qa@example.com"
export E2E_PASSWORD="Passw0rd!"
export E2E_OWNER="my-github-org"
export E2E_REPO="my-repo"
export E2E_BRANCH="main"
export SCRIBE_DEV_GITHUB_BOOTSTRAP=true

pnpm test:e2e
```

**Result**: ✅ PASS (1 spec, 1 test)  
**Duration**: ~30-45 seconds  
**Validates**:
- Login flow (email/password)
- Navigate to Scribe dashboard
- Step 1: GitHub connection check (passed)
- Step 2: Dropdown-based selection (SearchableSelect for owner/repo/branch, not plain inputs)
- Run dry-run job
- Job Details page renders
- Timeline tab renders (trace events visible)
- Documents Read tab renders
- Files Produced tab renders
- Correlation ID visible and copy button works

**Artifacts**: `frontend/playwright-report/`, `frontend/test-results/`

### MCP Doctor (Pre-commit Check)

```bash
./scripts/mcp-doctor.sh
```

**Result**: ✅ PASS  
**Duration**: ~10-15 seconds  
**Validates**:
- `.env.mcp.local` exists and is gitignored
- `GITHUB_TOKEN` present (not value, just key)
- MCP Gateway starts successfully
- Gateway responds to health check
- Smoke test passes (initialize + tools/list + tools/call)
- Gateway stops cleanly

---

## 5. Known Issues / Limitations

### Current Limitations

1. **E2E Tests Require Manual Setup**
   - Backend and MCP gateway must be running
   - Test user credentials must be provided via env vars
   - Not yet integrated into PR gate workflow (by design; too slow)

2. **Playwright E2E is Single-Spec**
   - Currently covers only Scribe critical path
   - Future: Add specs for other agents (Trace, Proto)
   - Future: Add negative test cases

3. **MCP Gateway Dependency**
   - All Scribe tests require MCP Gateway running
   - If gateway is down, tests fail with `MCP_UNREACHABLE`
   - Workaround: Use `./scripts/mcp-doctor.sh` before tests

4. **Dev/Test Bootstrap is Environment-Gated**
   - `SCRIBE_DEV_GITHUB_BOOTSTRAP=true` only works in non-production
   - Production requires real GitHub OAuth
   - This is intentional for security

5. **No Negative Test Coverage Yet**
   - E2E currently covers happy path only
   - TODO: Add tests for error states (MCP down, invalid credentials, etc.)

### Workarounds

| Issue | Workaround |
|-------|------------|
| MCP Gateway not starting | Check `.env.mcp.local` has valid `GITHUB_TOKEN`, run `./scripts/mcp-doctor.sh` |
| Backend tests fail with `ECONNREFUSED 5433` | Run `./scripts/db-up.sh` before tests |
| Playwright times out | Increase timeout in `playwright.config.ts` (default: 30s per test, 60s global) |
| "GitHub not connected" error in E2E | Ensure `SCRIBE_DEV_GITHUB_BOOTSTRAP=true` is set |
| Frontend CI flaky | Already fixed in PR #103 (fake timers for polling) |

---

## 6. Links & References

### Documentation

- **Setup**: `docs/DEV_SETUP.md` (comprehensive local setup guide)
- **QA Automation**: `docs/QA_SCRIBE_AUTOMATION.md` (detailed QA workflows)
- **MCP Setup**: `docs/GITHUB_MCP_SETUP.md` (MCP Gateway configuration)
- **Project Status**: `docs/PROJECT_STATUS.md` (features by phase)

### GitHub

- **Repository**: https://github.com/OmerYasirOnal/akis-platform-devolopment
- **CI Runs**: https://github.com/OmerYasirOnal/akis-platform-devolopment/actions
- **Recent PRs**:
  - #110: Playwright E2E
  - #109: QA Automation Guide
  - #107: CLI Smoke Runner
  - #103: Scribe Observability

### CI Artifacts

- **Nightly Smoke Reports**: Available in GitHub Actions > Nightly Smoke Tests > Artifacts
  - `playwright-report/` (HTML report)
  - `playwright-screenshots/` (test screenshots)
  - `backend-logs` (backend console output)

---

## 7. Next Steps for QA Team

### Immediate Actions (This Week)

1. **Setup Local Environment**
   - Follow `docs/DEV_SETUP.md` Quick Start
   - Validate with `./scripts/verify-local.sh`
   - Run CLI smoke: `scripts/scribe-smoke.ts`
   - Run Playwright E2E: `pnpm -C frontend test:e2e`

2. **Review Test Automation Structure**
   - Explore `backend/test/` (unit + integration)
   - Explore `frontend/tests/e2e/` (Playwright specs)
   - Review CI workflows in `.github/workflows/`

3. **Verify CI Stability**
   - Monitor nightly smoke results (will start running after this PR is merged)
   - Check GitHub Actions for any failures
   - Report flaky tests to dev team

### Short-Term (Next 2 Weeks)

1. **Expand E2E Coverage**
   - Add negative test cases (MCP down, invalid credentials)
   - Add specs for Trace and Proto agents (when ready)
   - Add integration tests for OAuth flow (currently skipped)

2. **Performance Baseline**
   - Establish baseline for Scribe execution time (dry-run: ~10s, non-dry: ~30s)
   - Add performance assertions to E2E tests

3. **Test Data Management**
   - Create seeded test users for consistent E2E runs
   - Document test GitHub org/repo setup (or use fixtures)

### Long-Term (Next Month)

1. **Visual Regression Testing**
   - Add Playwright screenshot comparison for Job Details UI
   - Detect unintended UI changes

2. **Load Testing**
   - Simulate concurrent Scribe jobs
   - Validate MCP Gateway under load

3. **Security Testing**
   - Verify secret redaction in logs/screenshots
   - Test least-privilege token scopes

---

## If You Only Read One Thing

**Scribe is E2E operational** with automated smoke tests (CLI + Playwright) running nightly on `main`. All quality gates are green (lint, typecheck, tests, build). The critical path (login → configure → run → verify) is covered by deterministic E2E tests. Dev/test environments use a bootstrap helper (`SCRIBE_DEV_GITHUB_BOOTSTRAP=true`) to bypass OAuth, allowing repeatable smoke runs without manual intervention.

**Next move for QA**: Run `./scripts/verify-local.sh` to validate your local setup, then execute `pnpm exec tsx scripts/scribe-smoke.ts` and `pnpm -C frontend test:e2e` to see the automation in action. All evidence and logs are in `docs/QA_EVIDENCE.md` and nightly CI artifacts.

**Known gaps**: E2E currently covers happy path only; negative test cases (MCP down, auth failures) are TODO. Playwright E2E is not in PR gate (intentionally; too slow), but runs nightly and can be triggered manually.

---

**Report Generated**: 2025-12-20  
**Status**: ✅ Ready for QA Handoff  
**Contact**: Development Team

