# QA Manual: Scribe GitHub-Only + Job Validation Fix (S0.4.6)

**Branch**: `fix/scribe-github-only-and-job-run-s0.4.6`  
**Date**: 2025-12-18  
**QA Owner**: [TBD]

---

## OVERVIEW

This QA validates two critical fixes:
1. **GitHub-only Scribe mode** (V1 requirement) - Users can configure and run Scribe without Confluence
2. **Job creation validation** - Config-aware payloads (`mode: 'from_config'`) now work correctly

---

## PREREQUISITES

### Environment Setup
- ✅ Backend running on `http://localhost:3000`
- ✅ Frontend running on `http://localhost:5173`
- ✅ PostgreSQL database with migrations applied
- ✅ GitHub OAuth configured (for integration tests)

### Test Accounts
- User account with GitHub OAuth connected
- User account WITHOUT Confluence connection (for GitHub-only path)

---

## QA PATH 1: GitHub-Only Mode (V1 Requirement)

**Goal**: Verify users can configure and run Scribe without Confluence connection.

### Step 1: Pre-flight Checks

**Setup**:
1. Navigate to `/dashboard/agents/scribe`
2. Ensure GitHub is connected (✓ GitHub)
3. Ensure Confluence is **NOT** connected (✗ Confluence)

**Expected Behavior**:
- ✅ GitHub shows "✓ Connected"
- ✅ Confluence shows "✗ Not connected"
- ✅ **"Continue →" button is ENABLED** (not blocked by Confluence)

**Network Evidence**:
```
GET /api/agents/configs/scribe
Response: 200
{
  "integrationStatus": {
    "github": { "connected": true },
    "confluence": { "connected": false }
  }
}
```

**Failure Criteria**:
- ❌ "Continue →" button disabled when Confluence not connected
- ❌ Error message requiring Confluence connection

---

### Step 2: Repository & Branch Selection

**Actions**:
1. Click "Continue →" (should work without Confluence)
2. Select Repository Owner from dropdown
3. Select Repository Name from dropdown
4. Select Base Branch from dropdown
5. Optionally set Branch Naming Pattern

**Expected Behavior**:
- ✅ GitHub discovery API loads owners/repos/branches
- ✅ Dropdowns populate correctly
- ✅ "Continue →" enabled when owner + repo + branch selected

**Network Evidence**:
```
GET /api/github-discovery/owners
Response: 200
{ "owners": [...] }

GET /api/github-discovery/repos?owner=...
Response: 200
{ "repos": [...] }

GET /api/github-discovery/branches?owner=...&repo=...
Response: 200
{ "branches": [...] }
```

---

### Step 3: Target Platform Selection

**Actions**:
1. Select "GitHub Repository Docs" (⭐ Recommended)
2. Optionally set Documentation Path (default: `docs/`)

**Expected Behavior**:
- ✅ "GitHub Repository Docs" option visible with ⭐ badge
- ✅ Documentation Path input appears
- ✅ "Continue →" enabled immediately (no Confluence required)
- ✅ No Confluence connection warning

**Alternative**: Select "Confluence"
- ✅ Warning appears: "⚠️ Confluence is not connected"
- ✅ Space Key input disabled
- ✅ "Continue →" disabled until Confluence connected

**Network Evidence**:
```
POST /api/agents/configs/scribe (on save)
Request:
{
  "repositoryOwner": "test-owner",
  "repositoryName": "test-repo",
  "baseBranch": "main",
  "targetPlatform": "github_repo",
  "targetConfig": { "docs_path": "docs/" }
}
Response: 200
```

---

### Step 4: Trigger Mode

**Actions**:
1. Select "Manual Only" (or any trigger mode)
2. Click "Continue →"

**Expected Behavior**:
- ✅ Trigger mode selection works
- ✅ "Continue →" enabled

---

### Step 5: Review & Test

**Actions**:
1. Review playbook preview
2. Click "Run Test Job"

**Expected Behavior**:
- ✅ Playbook preview shows GitHub-only flow (no Confluence mentions)
- ✅ "Run Test Job" button enabled
- ✅ Clicking creates job successfully
- ✅ Redirects to `/dashboard/jobs/:jobId`

**Network Evidence**:
```
POST /api/agents/jobs
Request:
{
  "type": "scribe",
  "payload": {
    "mode": "from_config",
    "dryRun": true
  }
}
Response: 200
{
  "jobId": "uuid-here",
  "state": "pending" | "running" | "completed" | "failed"
}
```

**Failure Criteria**:
- ❌ 400 VALIDATION_ERROR
- ❌ Error: "Scribe payload validation: Required"
- ❌ Error: "Scribe configuration not found"

---

### Step 6: Save Configuration

**Actions**:
1. Click "Save & Enable Scribe"

**Expected Behavior**:
- ✅ Config saved successfully
- ✅ Wizard closes, dashboard view appears
- ✅ Config summary shows GitHub-only settings

**Network Evidence**:
```
PUT /api/agents/configs/scribe
Request:
{
  "enabled": true,
  "repositoryOwner": "test-owner",
  "repositoryName": "test-repo",
  "baseBranch": "main",
  "targetPlatform": "github_repo",
  ...
}
Response: 200
{
  "config": { ... }
}
```

---

### Step 7: Run Job from Dashboard

**Actions**:
1. Click "Run Now" button

**Expected Behavior**:
- ✅ Job created successfully
- ✅ Redirects to job detail page
- ✅ Job appears in jobs list

**Network Evidence**:
```
POST /api/agents/jobs
Request:
{
  "type": "scribe",
  "payload": {
    "mode": "from_config",
    "dryRun": false
  }
}
Response: 200
{
  "jobId": "uuid-here",
  "state": "pending"
}
```

---

### Step 8: Verify Job in List

**Actions**:
1. Navigate to `/dashboard/jobs`
2. Filter by `type=scribe`

**Expected Behavior**:
- ✅ Both test job and real job appear in list
- ✅ Jobs have correct `type: "scribe"`
- ✅ Jobs show correct state (pending/running/completed/failed)

**Network Evidence**:
```
GET /api/agents/jobs?type=scribe&limit=20
Response: 200
{
  "items": [
    {
      "id": "uuid-1",
      "type": "scribe",
      "state": "completed",
      "createdAt": "2025-12-18T...",
      ...
    },
    {
      "id": "uuid-2",
      "type": "scribe",
      "state": "pending",
      ...
    }
  ],
  "nextCursor": null
}
```

**Failure Criteria**:
- ❌ Jobs not appearing in list
- ❌ Wrong job type or state

---

## QA PATH 2: Confluence Target Mode (Optional)

**Goal**: Verify Confluence target requires connection and validates fields.

### Step 1: Pre-flight Checks

**Setup**:
1. Navigate to `/dashboard/agents/scribe`
2. Ensure GitHub is connected
3. Ensure Confluence is **NOT** connected

**Actions**:
1. Click "Continue →" (should work - GitHub only required)

**Expected**: ✅ Can proceed

---

### Step 2-3: Repository & Target Selection

**Actions**:
1. Select repository owner/repo/branch
2. Select "Confluence" as target platform

**Expected Behavior**:
- ✅ Warning appears: "⚠️ Confluence is not connected"
- ✅ Space Key input appears but is **disabled**
- ✅ "Continue →" button is **disabled**

**Failure Criteria**:
- ❌ Can proceed without Confluence connection
- ❌ No warning shown

---

### Step 3: Connect Confluence

**Actions**:
1. Navigate to `/dashboard/integrations`
2. Connect Confluence (if not already connected)
3. Return to `/dashboard/agents/scribe`

**Expected Behavior**:
- ✅ Confluence shows "✓ Connected"
- ✅ Space Key input now **enabled**
- ✅ Can enter space key (e.g., "ENGDOCS")

---

### Step 4: Complete Configuration

**Actions**:
1. Enter Confluence Space Key
2. Complete remaining wizard steps
3. Save configuration

**Expected Behavior**:
- ✅ "Continue →" enabled when space key filled
- ✅ Config saves with `targetPlatform: "confluence"`
- ✅ Config saves with `targetConfig: { space_key: "ENGDOCS" }`

**Network Evidence**:
```
PUT /api/agents/configs/scribe
Request:
{
  "targetPlatform": "confluence",
  "targetConfig": {
    "space_key": "ENGDOCS"
  },
  ...
}
Response: 200
```

---

### Step 5: Run Job

**Actions**:
1. Click "Run Now"

**Expected Behavior**:
- ✅ Job created successfully
- ✅ Job payload includes Confluence config

**Network Evidence**:
```
POST /api/agents/jobs
Request:
{
  "type": "scribe",
  "payload": {
    "mode": "from_config",
    ...
  }
}
Response: 200
```

**Backend Payload (derived from config)**:
```json
{
  "mode": "from_config",
  "owner": "test-owner",
  "repo": "test-repo",
  "baseBranch": "main",
  "targetPlatform": "confluence",
  "targetConfig": {
    "space_key": "ENGDOCS"
  },
  "userId": "user-uuid"
}
```

---

## NETWORK EVIDENCE CHECKLIST

### ✅ Successful Job Creation (Config-Aware)

**Request**:
```http
POST /api/agents/jobs
Content-Type: application/json
Cookie: sessionId=...

{
  "type": "scribe",
  "payload": {
    "mode": "from_config",
    "dryRun": true
  }
}
```

**Expected Response**: `200 OK`
```json
{
  "jobId": "uuid-here",
  "state": "pending" | "running" | "completed" | "failed"
}
```

**Backend Processing**:
1. ✅ Detects `mode: 'from_config'`
2. ✅ Loads config from DB using `userId`
3. ✅ Validates config completeness
4. ✅ Transforms config → legacy payload format
5. ✅ Creates job with enriched payload

---

### ✅ Successful Job Creation (Legacy Payload)

**Request**:
```http
POST /api/agents/jobs
Content-Type: application/json

{
  "type": "scribe",
  "payload": {
    "owner": "test-owner",
    "repo": "test-repo",
    "baseBranch": "main"
  }
}
```

**Expected Response**: `200 OK` (backward compatible)

---

### ✅ Jobs List Includes New Job

**Request**:
```http
GET /api/agents/jobs?type=scribe&limit=20
```

**Expected Response**: `200 OK`
```json
{
  "items": [
    {
      "id": "new-job-uuid",
      "type": "scribe",
      "state": "completed",
      "createdAt": "2025-12-18T...",
      "updatedAt": "2025-12-18T..."
    },
    ...
  ],
  "nextCursor": null
}
```

**Verification**:
- ✅ New job appears in list
- ✅ Job has correct `type: "scribe"`
- ✅ Job has valid state
- ✅ Job has timestamps

---

### ❌ Missing Config Error (Actionable)

**Request**:
```http
POST /api/agents/jobs
Cookie: sessionId=...
{
  "type": "scribe",
  "payload": {
    "mode": "from_config"
  }
}
```

**Expected Response**: `400 Bad Request` or `500 Internal Server Error`
```json
{
  "error": {
    "code": "CONFIG_NOT_FOUND" | "INTERNAL_ERROR",
    "message": "Scribe configuration not found. Please configure Scribe first at /dashboard/agents/scribe"
  },
  "requestId": "uuid"
}
```

**Verification**:
- ✅ Error message is actionable (tells user what to do)
- ✅ Error includes requestId for debugging

---

### ❌ Validation Error (Actionable)

**Request**:
```http
POST /api/agents/jobs
{
  "type": "scribe",
  "payload": {
    "owner": "test-owner"
    // Missing: repo, baseBranch
  }
}
```

**Expected Response**: `400 Bad Request`
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Scribe payload validation: repo field is required"
  },
  "requestId": "uuid"
}
```

**Verification**:
- ✅ Error mentions specific missing field
- ✅ Error is actionable (user knows what to fix)

---

## TROUBLESHOOTING

### Issue: 400 VALIDATION_ERROR on Job Creation

**Symptoms**:
- POST `/api/agents/jobs` returns 400
- Error: "Scribe payload validation: Required"

**Root Causes**:

1. **Config-aware payload without config**:
   - User sent `mode: 'from_config'` but no config exists in DB
   - **Fix**: Complete wizard at `/dashboard/agents/scribe`

2. **Config incomplete**:
   - Config exists but missing `repositoryOwner`, `repositoryName`, or `baseBranch`
   - **Fix**: Complete Step 2 of wizard (Repository & Branch)

3. **Legacy payload incomplete**:
   - Missing `owner`, `repo`, or `baseBranch` in payload
   - **Fix**: Include all required fields in payload

**Debug Steps**:
```bash
# 1. Check if config exists
curl http://localhost:3000/api/agents/configs/scribe \
  -H "Cookie: sessionId=YOUR_SESSION"

# 2. Check config completeness
# Look for: repositoryOwner, repositoryName, baseBranch

# 3. Check job creation payload
# Network tab → POST /api/agents/jobs → Request payload
```

---

### Issue: Jobs Not Appearing in List

**Symptoms**:
- Job creation returns 200 with `jobId`
- GET `/api/agents/jobs` doesn't show the job

**Root Causes**:

1. **Job creation failed silently**:
   - Backend returned 200 but job state is `failed`
   - **Fix**: Check job detail: GET `/api/agents/jobs/:jobId`

2. **Filter mismatch**:
   - Job created but filter excludes it
   - **Fix**: Check filters (type, state, cursor)

3. **Database issue**:
   - Job not persisted to DB
   - **Fix**: Check backend logs for DB errors

**Debug Steps**:
```bash
# 1. Check job detail
curl http://localhost:3000/api/agents/jobs/JOB_ID

# 2. Check job list without filters
curl http://localhost:3000/api/agents/jobs

# 3. Check backend logs
# Look for: "Failed to create job", "Database error"
```

---

### Issue: Confluence Still Required

**Symptoms**:
- Step 1 "Continue →" button disabled
- Error: "Confluence must be connected"

**Root Causes**:

1. **Frontend not updated**:
   - Old code still has hard requirement
   - **Fix**: Verify `DashboardAgentScribePage.tsx` line 417

2. **Cache issue**:
   - Browser cached old JavaScript
   - **Fix**: Hard refresh (Cmd+Shift+R) or clear cache

**Debug Steps**:
```bash
# 1. Check frontend code
grep -n "confluence.connected" frontend/src/pages/dashboard/agents/DashboardAgentScribePage.tsx

# Should show: disabled={!integrationStatus?.github.connected}
# Should NOT show: || !integrationStatus?.confluence.connected
```

---

### Issue: Config-Aware Payload Returns 401

**Symptoms**:
- POST `/api/agents/jobs` with `mode: 'from_config'` returns 401
- Error: "UNAUTHORIZED"

**Root Causes**:

1. **No session cookie**:
   - User not authenticated
   - **Fix**: Login first, ensure session cookie sent

2. **Invalid session**:
   - Session expired or invalid
   - **Fix**: Re-login

**Debug Steps**:
```bash
# 1. Check if session cookie exists
# Browser DevTools → Application → Cookies → sessionId

# 2. Check auth endpoint
curl http://localhost:3000/api/auth/me \
  -H "Cookie: sessionId=YOUR_SESSION"
```

---

## DEFINITION OF DONE

### ✅ Backend
- [ ] All TypeScript typechecks pass (`pnpm typecheck`)
- [ ] All tests pass (`pnpm test`)
- [ ] Integration test `scribe-config-aware.test.ts` passes
- [ ] Config-aware payload creates job successfully
- [ ] Legacy payload still works (backward compat)
- [ ] Error messages are actionable

### ✅ Frontend
- [ ] All TypeScript typechecks pass (`pnpm typecheck`)
- [ ] No lint errors (`pnpm lint`)
- [ ] GitHub-only path works end-to-end
- [ ] Confluence path requires connection
- [ ] Error messages are actionable (not generic)

### ✅ QA Evidence
- [ ] Path 1 (GitHub-only) completed successfully
- [ ] Path 2 (Confluence) completed successfully
- [ ] Network evidence captured (screenshots/logs)
- [ ] Jobs appear in list after creation
- [ ] No regressions in existing flows

### ✅ Documentation
- [ ] QA manual updated (this file)
- [ ] Implementation report complete
- [ ] Trace map documented
- [ ] PR description ready

---

## TEST EVIDENCE TEMPLATE

**Test Date**: [DATE]  
**Tester**: [NAME]  
**Environment**: [LOCAL/STAGING]

### Path 1: GitHub-Only
- [ ] Step 1: Continue enabled without Confluence
- [ ] Step 2: Repository selection works
- [ ] Step 3: GitHub Repo Docs selected
- [ ] Step 5: Test job created successfully
- [ ] Step 7: Real job created successfully
- [ ] Step 8: Jobs appear in list

**Screenshots**: [ATTACH]

### Path 2: Confluence
- [ ] Step 3: Confluence requires connection
- [ ] Step 3: Space key required
- [ ] Step 5: Job created with Confluence config

**Screenshots**: [ATTACH]

### Network Evidence
- [ ] POST `/api/agents/jobs` → 200
- [ ] GET `/api/agents/jobs` → Job appears
- [ ] Error cases return actionable messages

**Logs**: [ATTACH]

---

## NOTES

- **Backward Compatibility**: Legacy payloads (`owner`, `repo`, `baseBranch`) continue to work without auth
- **Config-Aware**: New payloads (`mode: 'from_config'`) require auth and config in DB
- **V1 Requirement**: GitHub-only mode must work (Confluence optional)

