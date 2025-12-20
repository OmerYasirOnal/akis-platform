# Scribe QA Automation Guide

**Last Updated**: 2025-12-20  
**Target Audience**: QA Engineers, Release Managers, CI/CD Maintainers

---

## Overview

This document defines the **automated QA workflow** for **Scribe** (AKIS documentation agent), including:

- **Evidence layout** and **PASS/FAIL templates**
- **Definition of Done** checklist for demo readiness
- **Secrets & tokens policy** (vault, gitignore, redaction)
- **Local and CI verification flows**

---

## 1. Evidence Layout

All QA evidence should be structured for audit-friendly review and reproducibility.

### Evidence Directory Structure

```
docs/
  ├── QA_EVIDENCE.md           # High-level summary table
  ├── SCRIBE_E2E_REPORT.md     # Detailed operational report
  └── qa-runs/                 # (optional) timestamped runs
      └── 2025-12-20-scribe-e2e/
          ├── backend-tests.log
          ├── frontend-tests.log
          ├── playwright-report/
          └── screenshots/
```

### QA_EVIDENCE.md Template

```markdown
# QA Evidence - Scribe

**Run Date**: YYYY-MM-DD  
**Commit SHA**: `<commit-hash>`  
**Branch**: `<branch-name>`  
**Executor**: `<name/CI>`

## Environment

| Item | Value |
|------|-------|
| Node | v20.x.x |
| pnpm | 9.x.x |
| PostgreSQL | 16 (port 5433) |
| Docker | Running |

## Quality Gates

| Gate | Status | Evidence |
|------|--------|----------|
| Backend lint | ✅ PASS | `pnpm -C backend lint` |
| Backend typecheck | ✅ PASS | `pnpm -C backend typecheck` |
| Backend tests | ✅ PASS | 129/129 tests |
| Frontend lint | ✅ PASS | `pnpm -C frontend lint` |
| Frontend typecheck | ✅ PASS | `pnpm -C frontend typecheck` |
| Frontend tests | ✅ PASS | 34/34 tests |
| Frontend build | ✅ PASS | `dist/` created |
| MCP smoke | ✅ PASS | `./scripts/mcp-doctor.sh` |
| Scribe CLI smoke | ✅ PASS | `./scripts/scribe-smoke.ts` |
| Playwright E2E | ✅ PASS | `pnpm -C frontend test:e2e` |

## API Smoke (Authenticated)

| Test | Status | jobId | Notes |
|------|--------|-------|-------|
| Scribe dry-run | ✅ PASS | `<uuid>` | correlationId visible |
| Job Details | ✅ PASS | - | Timeline + Artifacts render |

## UI Smoke (Manual)

| Test | Status | Notes |
|------|--------|-------|
| Login (email/password) | ✅ PASS | - |
| Scribe Step 2 dropdowns | ✅ PASS | SearchableSelect for owner/repo/branch |
| GitHub integration check | ✅ PASS | `GET /api/integrations/status` → 200 |
| Run dry-run job | ✅ PASS | - |
| Job Details | ✅ PASS | Correlation ID copy works |

## Issues / Blockers

None.

## Go / No-Go Decision

**GO** ✅ — All quality gates passed.
```

---

## 2. Definition of Done (Demo Readiness)

For a Scribe release to be considered **demo-ready**, the following checklist **must** be completed:

### Backend Quality

- [ ] All backend lint/typecheck/tests **GREEN**
- [ ] Database migrations applied successfully
- [ ] MCP Gateway connectivity verified (`mcp-doctor.sh` PASS)
- [ ] No high-severity linter warnings

### Frontend Quality

- [ ] All frontend lint/typecheck/tests **GREEN**
- [ ] Production build succeeds (`pnpm build`)
- [ ] No console errors in dev mode (manual check)

### API Integration

- [ ] Authenticated Scribe job creation succeeds (dry-run)
- [ ] Job Details API includes:
  - `correlationId`
  - `trace` (timeline events)
  - `artifacts` (documents/files)
- [ ] Integration status endpoint (`/api/integrations/status`) returns valid GitHub connection status

### UI Smoke

- [ ] Login via email/password succeeds
- [ ] Login via GitHub OAuth succeeds (if configured)
- [ ] Scribe wizard Step 2 uses **SearchableSelect** components (not plain text inputs)
- [ ] GitHub owners/repos/branches dropdowns populate correctly
- [ ] Dry-run job completes successfully
- [ ] Job Details page renders:
  - Tabs (Overview, Timeline, Documents Read, Files Produced, Audit, Raw)
  - Correlation ID with Copy button
  - MCP Gateway URL badge
  - No UI crashes

### CI/CD

- [ ] All CI checks **GREEN** on `main`
- [ ] Nightly smoke workflow (if enabled) runs successfully
- [ ] PR gate workflow passes on all feature branches

### Documentation

- [ ] `docs/DEV_SETUP.md` up-to-date
- [ ] `docs/QA_EVIDENCE.md` populated with latest run
- [ ] `docs/SCRIBE_E2E_REPORT.md` reflects current system state
- [ ] No outdated instructions or broken links

### Secrets & Compliance

- [ ] No secrets committed (scan: `git grep -E 'ghp_|github_pat_|gho_|ghs_|ghr_'`)
- [ ] `.env.mcp.local` is gitignored
- [ ] `backend/.env` is gitignored
- [ ] `frontend/.env` is gitignored
- [ ] All logs/screenshots are redacted (no tokens/cookies visible)

---

## 3. Secrets & Tokens Policy

### 3.1 Secrets Management Strategy

| Secret Type | Storage Location | Access Method | Rotation Policy |
|-------------|------------------|---------------|-----------------|
| `GITHUB_TOKEN` (dev) | `.env.mcp.local` | Docker `env_file` | Monthly or on suspected exposure |
| `GITHUB_OAUTH_*` | `backend/.env` | Fastify env config | Quarterly or on suspected exposure |
| `AUTH_JWT_SECRET` | `backend/.env` | Fastify env config | Annually or on suspected exposure |
| `OPENAI_API_KEY` | `backend/.env` | Fastify env config | As needed |

### 3.2 Gitignore Requirements

**Mandatory gitignore entries** (must be present in `.gitignore`):

```gitignore
# Secrets (never commit)
.env
.env.local
.env.*.local
backend/.env
frontend/.env
.env.mcp.local

# MCP Gateway (local config)
.cursor/mcp.json

# Logs (may contain tokens)
*.log
.mcp-doctor-*.log
/tmp/*.log

# Test artifacts (may contain cookies)
cookies.txt
playwright-report/
test-results/
```

### 3.3 Example Files (Safe to Commit)

**Always provide `.example` templates** for local-only files:

- `env.mcp.local.example`
- `backend/.env.example`
- `frontend/.env.example`
- `.cursor/mcp.json.example`

**Example content**:

```bash
# .env.mcp.local.example
GITHUB_TOKEN=your_github_personal_access_token_here
LOG_LEVEL=info
```

### 3.4 Redaction Policy

When capturing logs, screenshots, or HAR files for QA evidence:

1. **Tokens**: Replace with `<REDACTED>` or `ghp_***`
2. **Cookies**: Replace with `akis_sid=<REDACTED>`
3. **JWTs**: Replace with `eyJ***` (show only first 3 chars)
4. **API Keys**: Replace with `sk-***` (show only first 3 chars)

**Example**:

```bash
# ❌ BAD (real token visible)
curl -H "Authorization: Bearer ghp_abcd1234efgh5678"

# ✅ GOOD (redacted)
curl -H "Authorization: Bearer <REDACTED>"
```

### 3.5 Secret Scanning

**Pre-commit scan** (manual or hook):

```bash
# Scan for common token prefixes
git grep -E 'ghp_|github_pat_|gho_|ghs_|ghr_|sk-|ntn_' -- ':(exclude)*.example'
```

If any matches are found (outside `.example` files), **do not commit**.

**Automated scan in CI**:

- The `akis-pr-autoflow.sh` script includes `check_token_prefixes_in_tracked_files`.
- PR gate workflow should fail if secrets are detected.

### 3.6 Token Rotation After Exposure

**If a token is accidentally committed or exposed**:

1. **Revoke immediately** via GitHub Settings → Developer settings → Personal access tokens
2. Generate a new token with minimal scopes (read:user, repo)
3. Update `.env.mcp.local` locally
4. **Do not** try to rewrite git history unless the commit is unpushed
5. Document the incident in a short note (no token values)

**Reference**: See `docs/GITHUB_MCP_SETUP.md` → "Token Rotation After Exposure"

---

## 4. Local Verification Workflow

### 4.1 Prerequisites

- Docker running
- Node 20+ installed
- pnpm 9+ installed
- `.env.mcp.local` configured with `GITHUB_TOKEN`
- `backend/.env` configured (see `backend/.env.example`)

### 4.2 Quick Verification Script

Use the provided `scripts/verify-local.sh`:

```bash
cd /path/to/devagents
./scripts/verify-local.sh
```

This script will:

1. Install dependencies (`pnpm install`)
2. Start PostgreSQL (`scripts/db-up.sh`)
3. Run migrations (`pnpm -C backend db:migrate`)
4. Run backend quality gates (lint/typecheck/test)
5. Run frontend quality gates (lint/typecheck/test/build)
6. Capture results to `/tmp/verify-*.log`

**Expected exit code**: `0` (all gates passed)

### 4.3 MCP Smoke Test

```bash
./scripts/mcp-doctor.sh
```

**Expected output**:

```
[INFO] MCP Doctor completed successfully
Log: .mcp-doctor-<timestamp>.log
```

### 4.4 Scribe CLI Smoke

```bash
export SCRIBE_DEV_GITHUB_BOOTSTRAP=true
export GITHUB_TOKEN=<your-token>
./scripts/scribe-smoke.ts
```

**Expected output**:

```
✅ SCRIBE SMOKE: PASS
```

---

## 5. CI Verification Workflow

### 5.1 PR Gate Workflow

**File**: `.github/workflows/pr-gate.yml`

**Triggers**: Every PR to `main`

**Jobs**:

- Backend lint/typecheck/tests (with Postgres service)
- Frontend lint/typecheck/tests/build

**Success Criteria**: All jobs exit `0`

### 5.2 Nightly Smoke Workflow

**File**: `.github/workflows/nightly-smoke.yml`

**Triggers**:

- Scheduled (nightly on `main`)
- Manual dispatch

**Jobs**:

1. Run `scripts/scribe-smoke.ts` (with dev bootstrap)
2. Run Playwright E2E (`pnpm -C frontend test:e2e`)
3. Upload artifacts:
   - Playwright report (HTML)
   - Screenshots
   - HAR files (redacted)

**Success Criteria**: Both CLI smoke and E2E pass

---

## 6. Playwright E2E Tests

### 6.1 Test Suite Coverage

**File**: `frontend/tests/e2e/scribe.smoke.spec.ts`

**Critical Path**:

1. Login via email/password
2. Navigate to `/dashboard/agents/scribe`
3. Verify Step 2 uses `SearchableSelect` dropdowns (not plain text inputs)
4. Select owner/repo/branch
5. Run "Test Job" (dry-run)
6. Wait for job completion
7. Open Job Details
8. Verify:
   - Timeline tab renders
   - Artifacts tab renders
   - Correlation ID visible
   - Copy button works
   - No MCP `-32601` errors

### 6.2 Configuration

**File**: `frontend/playwright.config.ts`

**Requirements**:

- Headless by default
- `baseURL`: `http://localhost:5173`
- Timeout: 30s per test
- Artifacts: screenshots + HTML report + HAR on failure
- Stable viewport: 1280x720

### 6.3 Running Locally

```bash
# Start services
./scripts/db-up.sh
cd backend && pnpm dev &
cd frontend && pnpm dev &
./scripts/mcp-up.sh

# Run Playwright
cd frontend
pnpm test:e2e

# View report
pnpm playwright show-report
```

---

## 7. Troubleshooting

### 7.1 Common Issues

| Issue | Root Cause | Fix |
|-------|------------|-----|
| `ECONNREFUSED :5433` | PostgreSQL not running | `./scripts/db-up.sh` |
| `GITHUB_TOKEN missing` | `.env.mcp.local` not configured | `cp env.mcp.local.example .env.mcp.local` and add token |
| `GitHub not connected` | OAuth not linked | Login via GitHub OAuth or use dev bootstrap |
| `MCP_UNREACHABLE` | Gateway not running | `./scripts/mcp-up.sh` |
| Playwright timeout | Services not running | Start backend + frontend + MCP |

### 7.2 Debug Commands

```bash
# Check Docker
docker ps

# Check Postgres
lsof -i :5433

# Check backend
curl http://localhost:3000/health

# Check frontend
curl http://localhost:5173

# Check MCP
curl http://localhost:4010/health
```

---

## 8. References

- **Dev Setup**: `docs/DEV_SETUP.md`
- **GitHub MCP Setup**: `docs/GITHUB_MCP_SETUP.md`
- **MCP Security Implementation**: `docs/MCP_ENV_SECURITY_IMPLEMENTATION.md`
- **Scribe E2E Report**: `docs/SCRIBE_E2E_REPORT.md`
- **QA Evidence**: `docs/QA_EVIDENCE.md`
- **Project Status**: `docs/PROJECT_STATUS.md`

---

## 9. Revision History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-12-20 | 1.0 | Initial version | AI Assistant |

---

## 10. Contact & Support

For questions or issues:

- **GitHub Issues**: [akis-platform-devolopment/issues](https://github.com/OmerYasirOnal/akis-platform-devolopment/issues)
- **Internal Slack**: `#akis-qa` (if applicable)
- **Documentation**: This file + references above

---

**End of Document**

