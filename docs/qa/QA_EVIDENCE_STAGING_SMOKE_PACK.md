# AKIS Platform - QA Evidence Staging Smoke Pack

**Version**: 2.0.0
**Date**: 2026-02-16
**Scope**: Staging smoke + manual UI + fallback quality gates
**Last Verified Run**: 2026-02-16 (`ee5041f`)

---

## 1. Evidence Snapshot

| Area | Result | Notes |
|------|--------|-------|
| Deploy commit check | PASS | `/version.commit = ee5041f` |
| Health/Readiness | PASS | `/health`, `/ready`, `/version` HTTP 200 |
| Security headers | PASS | `strict-transport-security`, `x-content-type-options`, `x-frame-options` |
| OAuth start redirect | PASS | `/auth/oauth/github` HTTP 302 → `github.com/login/oauth/authorize` |
| Auth guard (unauth) | PASS | `/auth/me` ve `/api/agents/jobs` HTTP 401 |
| Manual route smoke | PASS | 13/13 route check, redirect semantiği doğrulandı |
| Playwright E2E (staging target) | PASS | 61/61 test geçti |
| Frontend unit tests | PASS | 602/602 (Vitest) |
| Frontend UI target E2E pack (local) | PASS | 50/50 (auth-login + navigation-guards + scribe/trace/proto/agents-hub) |
| Backend unit tests | PASS | 1302/1302 (Node test runner) |
| Frontend typecheck | PASS | `tsc --noEmit` |
| Backend typecheck | PASS | `tsc --noEmit` |

---

## 2. Endpoint & API Smoke (Executed)

### Executed Commands

```bash
curl -i https://staging.akisflow.com/health
curl -i https://staging.akisflow.com/ready
curl -i https://staging.akisflow.com/version
curl -i https://staging.akisflow.com/auth/oauth/github
curl -i https://staging.akisflow.com/auth/me
curl -i 'https://staging.akisflow.com/api/agents/jobs?limit=1'
curl -i https://staging.akisflow.com/metrics
```

### Key Results

- `/health` → `200`, `{"status":"ok"}`
- `/ready` → `200`, `ready=true`, `database=connected`, `mcp.gatewayReachable=true`, `encryption.configured=true`
- `/version` → `200`, `commit=ee5041f`
- `/auth/oauth/github` → `302` redirect
- `/auth/me` (no session) → `401` + `{"user":null}`
- `/api/agents/jobs` (no session) → `401` standard error envelope

---

## 3. Manual UI Smoke (Browser)

### Route Matrix (13/13 PASS)

- `/`
- `/login`
- `/signup`
- `/docs`
- `/pricing`
- `/contact`
- `/about`
- `/legal/privacy`
- `/legal/terms`
- `/agents` (redirect expected)
- `/agents/trace` (redirect expected)
- `/agents/proto` (redirect expected)
- `/dashboard` (redirect expected)

### Verified UI Interactions

- TR/EN locale toggle: PASS
- Theme toggle (dark/light): PASS
- GitHub OAuth button from login page: PASS (GitHub sign-in page reached)

### Artifact Pack

- Local artifact folder:
  - `output/manual-ui-2026-02-16T09-25-23-636Z`
- Report file:
  - `output/manual-ui-2026-02-16T09-25-23-636Z/report.json`
- Representative screenshots:
  - `18-login-manual-dark.png`
  - `19-login-theme-light.png`
  - `20-github-oauth-page.png`

> Not: Bu görseller deploy delili olarak local doğrulama çıktısıdır; git deposuna eklenmemiştir.

---

## 4. Automated Browser Evidence (Staging Target)

### Executed Commands

```bash
pnpm -C frontend exec playwright test landing-sanity.spec.ts ui-smoke.spec.ts --config=.tmp/playwright.staging.config.ts
pnpm -C frontend exec playwright test navigation-guards.spec.ts auth-deep-links.spec.ts getting-started.spec.ts --config=.tmp/playwright.staging.config.ts
pnpm -C frontend exec playwright test trace-console.spec.ts proto-console.spec.ts scribe-console.spec.ts --config=.tmp/playwright.staging.config.ts
```

### Result

- Total: `61 passed`
- Failed: `0`
- Worker mode: `1` (deterministic CI-friendly profile)

---

## 5. Quality Gates (Local Fallback)

### Executed Commands

```bash
pnpm -C frontend run typecheck
pnpm -C backend run typecheck
pnpm -C frontend run test
pnpm -C backend run test
```

### Result

- Backend typecheck: PASS
- Frontend typecheck: PASS
- Backend unit: `1302/1302 PASS`
- Frontend unit: `602/602 PASS`

---

## 6. Risks / Remaining Gaps

1. GitHub-hosted Actions billing blokajı nedeniyle cloud CI run logları bu turda üretilemedi.
2. Tam authenticated user journey (real account ile callback sonrası dashboard içi mutation akışları) bu kanıt paketinde kapsam dışı bırakıldı.

---

## 7. Sign-off

- Smoke baseline: PASS
- UI baseline: PASS
- Type/test baseline: PASS
- Deploy commit consistency: PASS (`ee5041f`)
- Release decision: **Staging dokümantasyon kapanışı için uygun**
- UI closure evidence: `docs/qa/UI_M2_BASELINE_EVIDENCE_2026-02-16.md` ve `docs/qa/UI_MANUAL_SMOKE_EVIDENCE_2026-02-16.md`
- [ ] Live progress events visible in UI
- [ ] No duplicate job error (if job already running for same repo)

**Evidence to Capture**:
- Screenshot of job creation
- Screenshot of live progress events
- Screenshot of completed job status

**Alternative - API Test**:
```bash
curl -X POST https://staging.akisflow.com/api/agents/jobs \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "agentType": "scribe",
    "config": {
      "owner": "test-org",
      "repo": "test-repo",
      "baseBranch": "main",
      "dryRun": true
    }
  }'
```

---

### 3.3 View Job Details

**Endpoint**: `GET https://staging.akisflow.com/api/agents/jobs/:jobId`

**Acceptance Criteria**:
- [ ] Job details returned with trace events
- [ ] Status matches expected lifecycle state
- [ ] Documents read listed (if applicable)
- [ ] Files produced listed (if applicable)

**Evidence to Capture**:
- Screenshot of job details API response
- Screenshot of job timeline in UI

**Test Command**:
```bash
curl -s "https://staging.akisflow.com/api/agents/jobs/<JOB_ID>?include=trace" \
  -b cookies.txt | jq '.status, .trace | length'
```

---

## 4. MCP Integration Tests

### 4.1 GitHub Integration Status Check

**Prerequisite**: GitHub OAuth connected in Integrations Hub

**Endpoint**: `GET https://staging.akisflow.com/api/integrations/github/status`

**Acceptance Criteria**:
- [ ] HTTP 200 response
- [ ] `connected` field equals `true`
- [ ] User profile data available

**Evidence to Capture**:
- Screenshot of integration status
- GitHub username shown in response

**Test via Dashboard**:
1. Navigate to `https://staging.akisflow.com/dashboard/integrations`
2. Verify GitHub shows as "Connected"
3. Verify GitHub username displayed

---

### 4.2 MCP Gateway Health (If Enabled)

**Note**: MCP Gateway is optional in staging

**Check if MCP is running**:
```bash
ssh -i ~/.ssh/akis-oci opc@<VM_IP> "docker ps | grep mcp"
```

**If running, test health**:
```bash
curl -s http://localhost:4010/health
```

**Acceptance Criteria** (if MCP enabled):
- [ ] MCP container is running
- [ ] Health endpoint returns 200
- [ ] GitHub API calls succeed through MCP

**Evidence to Capture**:
- Screenshot of docker ps showing mcp container
- MCP health check response

---

## 5. Evidence Artifacts

### Required Screenshots

| Test | Screenshot Name | Description |
|------|-----------------|-------------|
| 1.1 | `01_health_check.png` | Curl output for /health |
| 1.2 | `02_ready_check.png` | Curl output for /ready |
| 1.3 | `03_version_check.png` | Curl output for /version |
| 2.2 | `04_login_success.png` | Login complete response |
| 2.3 | `05_session_valid.png` | /auth/me response |
| 3.2 | `06_job_created.png` | Job creation response |
| 3.2 | `07_job_progress.png` | Live progress in UI |
| 3.3 | `08_job_complete.png` | Completed job details |
| 4.1 | `09_github_connected.png` | Integrations Hub |

### Required Logs

| Log | File Name | Description |
|-----|-----------|-------------|
| Backend startup | `backend_startup.log` | Last 100 lines of backend logs |
| Job execution | `job_execution.log` | Trace events for test job |
| Deployment | `deploy.log` | GitHub Actions deployment log |

### Required Database Records

| Table | Query | Expected |
|-------|-------|----------|
| `users` | `SELECT COUNT(*) FROM users` | ≥ 1 test user |
| `agent_jobs` | `SELECT status FROM agent_jobs ORDER BY created_at DESC LIMIT 1` | `completed` |
| `oauth_accounts` | `SELECT provider FROM oauth_accounts LIMIT 5` | GitHub entries |

**Query Example**:
```bash
ssh -i ~/.ssh/akis-oci opc@<VM_IP> \
  "docker exec akis-staging-db psql -U akis -d akis_staging -c 'SELECT COUNT(*) FROM users'"
```

---

## 6. Acceptance Criteria for Promotion

### Required Passes

All tests in these sections must pass:
- [x] **1. Health Endpoints** (100% required)
- [x] **2.2 Login Flow** (required)
- [x] **2.3 Session Validation** (required)
- [x] **3.2 Scribe Dry-Run Job** (required)

### Conditional Passes

These tests may be skipped if feature not enabled:
- [ ] **2.1 Signup Flow** (if testing email flow)
- [ ] **4.2 MCP Gateway** (if MCP not enabled)

### Promotion Checklist

Before promoting staging to production:

- [ ] All required smoke tests pass
- [ ] Evidence screenshots collected
- [ ] No error log entries in last 24 hours
- [ ] Staging stable for minimum 24 hours
- [ ] Performance acceptable (p95 < 2s)
- [ ] Security checklist complete (see Runbook)
- [ ] Production OAuth Apps created (separate from staging)
- [ ] Production environment file prepared
- [ ] Rollback procedure documented and tested

---

## 7. Test Execution Log

### Run Template

```markdown
## Smoke Test Run - YYYY-MM-DD

**Tester**: [Name]
**Environment**: staging.akisflow.com
**Commit**: [commit SHA]

### Results

| Test | Status | Notes |
|------|--------|-------|
| 1.1 Health | ⬜ | |
| 1.2 Ready | ⬜ | |
| 1.3 Version | ⬜ | |
| 2.1 Signup | ⬜ | |
| 2.2 Login | ⬜ | |
| 2.3 Session | ⬜ | |
| 2.4 Email | ⬜ | |
| 3.1 Agents List | ⬜ | |
| 3.2 Scribe Job | ⬜ | |
| 3.3 Job Details | ⬜ | |
| 4.1 GitHub | ⬜ | |
| 4.2 MCP | ⬜ | |

### Evidence Attached

- [ ] Screenshots folder
- [ ] Log files
- [ ] Database query results

### Recommendation

- [ ] Ready for production promotion
- [ ] Needs fixes (list blockers)

**Signed**: [Name] / [Date]
```

---

## Appendix A: Observability Alignment

### Job Lifecycle State Machine

Jobs follow this state machine (from `backend/src/core/orchestrator/`):

```
pending → running → completed
              ↘ failed
              ↘ cancelled
```

### Trace Event Types

| Event Type | Emoji | Description |
|------------|-------|-------------|
| `start` | ▶ | Job started |
| `step` | ⚡ | Step execution |
| `ai_call` | 🤖 | AI provider call |
| `complete` | ✓ | Job completed |
| `error` | ❌ | Error occurred |

### Relevant API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/agents/jobs` | List jobs |
| `GET /api/agents/jobs/:id` | Job details |
| `GET /api/agents/jobs/:id?include=trace` | Job with trace events |
| `GET /api/agents/jobs/running` | Currently running jobs |
| `POST /api/agents/jobs` | Create new job |

---

**Document Control**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-01-13 | Auto | Initial smoke pack definition |
