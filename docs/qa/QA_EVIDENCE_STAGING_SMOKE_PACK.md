# AKIS Platform - QA Evidence Staging Smoke Pack

**Version**: 1.0.0  
**Date**: 2026-01-13  
**Scope**: Staging environment smoke tests and evidence collection  
**Last Run**: _Not yet executed_

---

## Overview

This document defines the staging smoke test checklist and evidence collection requirements for validating AKIS Platform deployments. Completing this pack is a prerequisite for promoting staging to production.

### Test Categories

| Category | Tests | Duration |
|----------|-------|----------|
| Health Endpoints | 3 | 2 min |
| Authentication Flow | 4 | 10 min |
| Agent Job Execution | 3 | 15 min |
| MCP Integration | 2 | 5 min |
| **Total** | **12** | **~32 min** |

---

## 1. Health and Readiness Tests

### 1.1 Liveness Check (`/health`)

**Endpoint**: `GET https://staging.akisflow.com/health`

**Expected Response**:
```json
{
  "status": "ok",
  "timestamp": "2026-01-13T12:00:00.000Z"
}
```

**Acceptance Criteria**:
- [ ] HTTP 200 response
- [ ] `status` field equals `"ok"`
- [ ] Response time < 500ms

**Evidence to Capture**:
- Screenshot of curl command with response
- Response time measurement

**Test Command**:
```bash
time curl -s https://staging.akisflow.com/health | jq .
```

---

### 1.2 Readiness Check (`/ready`)

**Endpoint**: `GET https://staging.akisflow.com/ready`

**Expected Response**:
```json
{
  "ready": true,
  "database": "connected",
  "timestamp": "2026-01-13T12:00:00.000Z"
}
```

**Acceptance Criteria**:
- [ ] HTTP 200 response
- [ ] `ready` field equals `true`
- [ ] `database` field equals `"connected"`

**Evidence to Capture**:
- Screenshot of curl command with response
- Database connectivity confirmation

**Test Command**:
```bash
curl -s https://staging.akisflow.com/ready | jq .
```

---

### 1.3 Version Check (`/version`)

**Endpoint**: `GET https://staging.akisflow.com/version`

**Expected Response**:
```json
{
  "version": "0.x.x",
  "name": "akis-backend",
  "commit": "abc1234",
  "buildTime": "2026-01-13T12:00:00.000Z",
  "environment": "production",
  "startTime": "2026-01-13T12:00:00.000Z"
}
```

**Acceptance Criteria**:
- [ ] HTTP 200 response
- [ ] `commit` matches deployed commit SHA
- [ ] `environment` equals `"production"`

**Evidence to Capture**:
- Screenshot showing version matches GitHub Actions deploy run
- Comparison with expected commit SHA

**Test Command**:
```bash
curl -s https://staging.akisflow.com/version | jq .
```

---

## 2. Authentication Flow Tests

### 2.1 Signup Flow Start

**Endpoint**: `POST https://staging.akisflow.com/auth/signup/start`

**Test Request**:
```json
{
  "firstName": "Smoke",
  "lastName": "Test",
  "email": "smoketest-TIMESTAMP@test.akisflow.com"
}
```

**Acceptance Criteria**:
- [ ] HTTP 200 response (or 409 if email exists)
- [ ] Returns `userId` in response
- [ ] Verification code logged to backend console (mock email)

**Evidence to Capture**:
- Screenshot of API response
- Backend log showing verification code (if accessible)

**Test Command**:
```bash
curl -X POST https://staging.akisflow.com/auth/signup/start \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Smoke","lastName":"Test","email":"smoketest-'$(date +%s)'@test.akisflow.com"}'
```

---

### 2.2 Login Flow (Existing User)

**Prerequisite**: Test user exists (e.g., `t@t.com`)

**Step 1 - Login Start**:
```bash
curl -X POST https://staging.akisflow.com/auth/login/start \
  -H "Content-Type: application/json" \
  -d '{"email":"t@t.com"}'
```

**Expected Response**:
```json
{
  "userId": "...",
  "email": "t@t.com",
  "requiresPassword": true
}
```

**Step 2 - Login Complete**:
```bash
curl -X POST https://staging.akisflow.com/auth/login/complete \
  -H "Content-Type: application/json" \
  -d '{"userId":"<userId_from_step1>","password":"12345678"}' \
  -c cookies.txt
```

**Acceptance Criteria**:
- [ ] HTTP 200 response
- [ ] Session cookie set (`akis_session`)
- [ ] User object returned

**Evidence to Capture**:
- Screenshot of successful login response
- Cookie file showing `akis_session` cookie set

---

### 2.3 Session Validation (`/auth/me`)

**Prerequisite**: Authenticated session (cookie from login)

**Endpoint**: `GET https://staging.akisflow.com/auth/me`

**Test Command**:
```bash
curl -s https://staging.akisflow.com/auth/me -b cookies.txt | jq .
```

**Acceptance Criteria**:
- [ ] HTTP 200 response
- [ ] Returns current user object
- [ ] User ID matches login user

**Evidence to Capture**:
- Screenshot showing user info returned

---

### 2.4 Email Verification (Staging)

**Note**: Staging uses `EMAIL_PROVIDER=mock` by default

**Verification**:
- [ ] Check backend logs for verification code output
- [ ] OR configure Resend and verify email delivery

**Evidence to Capture**:
- Backend logs showing `[MockEmailService] Code: XXXXXX`
- OR Email screenshot (if Resend configured)

**Test Command** (check backend logs):
```bash
ssh -i ~/.ssh/akis-oci opc@<VM_IP> "docker compose logs backend --tail=50 | grep -i verification"
```

---

## 3. Agent Job Execution Tests (Scribe)

### 3.1 View Available Agents

**Endpoint**: `GET https://staging.akisflow.com/api/agents`

**Acceptance Criteria**:
- [ ] HTTP 200 response
- [ ] At least `scribe` agent listed
- [ ] Agent has valid configuration schema

**Evidence to Capture**:
- Screenshot of agents list response

---

### 3.2 Create Scribe Dry-Run Job

**Prerequisite**: Authenticated session with GitHub OAuth connected

**Via Dashboard**:
1. Navigate to `https://staging.akisflow.com/dashboard/agents`
2. Select Scribe agent
3. Select organization and repository
4. Select base branch
5. Choose "Auto-create" branch strategy
6. Toggle "Dry Run" ON
7. Click "Run Agent"

**Acceptance Criteria**:
- [ ] Job created successfully (returns job ID)
- [ ] Job status transitions: `pending` → `running` → `completed`
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
