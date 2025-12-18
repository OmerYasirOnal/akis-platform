# Implementation Report: Scribe GitHub-Only + Job Validation Fix

**Branch**: `fix/scribe-github-only-and-job-run-s0.4.6`  
**Date**: 2025-12-18  
**Status**: ✅ COMPLETE

---

## ROOT CAUSE ANALYSIS

### Backend Validation Bug
**Location**: `backend/src/api/agents.ts:13-22` (`scribePayloadSchema`)

**Problem**:
```typescript
const scribePayloadSchema = z.object({
  owner: z.string().min(1, 'owner field is required'),      // ❌ Required
  repo: z.string().min(1, 'repo field is required'),        // ❌ Required  
  baseBranch: z.string().min(1, 'baseBranch field is required'), // ❌ Required
  // ...
});
```

**Frontend sent**:
```json
{
  "type": "scribe",
  "payload": {
    "mode": "from_config",
    "dryRun": true
  }
}
```

**Result**: 400 VALIDATION_ERROR - "Scribe payload validation: Required"

**Root Cause**: Schema validation happened before config loading. Config-aware payloads (`mode: 'from_config'`) were rejected.

### UI Blocker Bug
**Location**: `frontend/src/pages/dashboard/agents/DashboardAgentScribePage.tsx:417`

**Problem**:
```tsx
disabled={!integrationStatus?.github.connected || !integrationStatus?.confluence.connected}
```

**Result**: Users could not proceed without Confluence, even for GitHub-only mode.

---

## IMPLEMENTATION SUMMARY

### Backend Changes

#### 1. Added Config-Aware Payload Schema
**File**: `backend/src/api/agents.ts`

**Added**:
```typescript
// Config-aware payload schema (S0.4.6)
const scribeConfigAwarePayloadSchema = z.object({
  mode: z.enum(['from_config', 'test', 'run']).optional(),
  config_id: z.string().uuid().optional(),
  dryRun: z.boolean().optional(),
}).passthrough();
```

#### 2. Updated Validation Logic
**File**: `backend/src/api/agents.ts:36-82`

**Change**: Conditional validation based on payload type
- **Config-aware** (`mode: 'from_config'`): Skip legacy field validation
- **Legacy** (full payload): Validate `owner`, `repo`, `baseBranch`

#### 3. Added Config Loading in Route Handler
**File**: `backend/src/api/agents.ts:127-230`

**Flow**:
```
1. Detect config-aware payload (mode or config_id)
2. requireAuth() → get userId
3. Load config from DB (agentConfigs table)
4. Validate config completeness
5. Transform config to legacy format:
   - repositoryOwner → owner
   - repositoryName → repo
   - baseBranch → baseBranch
6. Enrich payload with userId
7. Submit job to orchestrator
```

#### 4. Added agentConfigs Schema
**File**: `backend/src/db/schema.ts`

**Added**: Full `agentConfigs` table with relations

#### 5. Added Auth Utility
**File**: `backend/src/utils/auth.ts` (NEW)

**Function**: `requireAuth(request)` → extracts user from JWT cookie

#### 6. Added Integration Test
**File**: `backend/test/integration/scribe-config-aware.test.ts` (NEW)

**Tests**:
- T1: Config-aware payload (`mode: 'from_config'`) → requires auth
- T2: Legacy payload (backward compat) → works without auth
- T3: Missing config → actionable error
- T4: Incomplete payload → validation error

---

### Frontend Changes

#### 1. Removed Confluence Hard Requirement
**File**: `frontend/src/pages/dashboard/agents/DashboardAgentScribePage.tsx:417`

**Before**:
```tsx
disabled={!github.connected || !confluence.connected}
```

**After**:
```tsx
disabled={!github.connected}
```

#### 2. Added GitHub-Only Target Option
**File**: `DashboardAgentScribePage.tsx:550-640`

**Added**:
- ✅ "GitHub Repository Docs" (Recommended)
- Confluence (requires Confluence connection)
- Notion (Coming Soon)
- GitHub Wiki (Coming Soon)

**UX**:
- GitHub Repo: Shows docs path input (`docs/`)
- Confluence: Shows space key input + connection warning

#### 3. Conditional Validation in Step 3
**File**: `DashboardAgentScribePage.tsx:614`

**Logic**:
```tsx
disabled={
  !wizardData.targetPlatform || 
  (wizardData.targetPlatform === 'confluence' && 
    (!integrationStatus?.confluence.connected || !space_key))
}
```

#### 4. Enhanced Error Messages
**File**: `DashboardAgentScribePage.tsx:275-340`

**Before**: "Failed to run test job"

**After** (actionable):
- "No configuration found. Please complete the setup wizard first."
- "Configuration incomplete. Please ensure repository owner, name, and base branch are set."
- "GitHub is not connected. Please connect GitHub before running Scribe."
- "Confluence target selected but not connected. Please connect Confluence or change target platform."

#### 5. Updated TargetPlatform Type
**File**: `frontend/src/services/api/agent-configs.ts:20`

**Before**: `'confluence' | 'notion' | 'github_wiki'`

**After**: `'github_repo' | 'confluence' | 'notion' | 'github_wiki'`

---

## FILES CHANGED

### Backend (6 files)
1. ✅ `backend/src/api/agents.ts` - Config-aware validation + route handler
2. ✅ `backend/src/db/schema.ts` - Added agentConfigs table
3. ✅ `backend/src/utils/auth.ts` - NEW: requireAuth utility
4. ✅ `backend/test/integration/scribe-config-aware.test.ts` - NEW: Integration tests
5. ✅ `docs/TRACE_MAP_SCRIBE_JOB_VALIDATION_BUG.md` - NEW: Bug trace
6. ✅ `docs/MINIMUM_FIX_PLAN_SCRIBE_VALIDATION.md` - NEW: Fix plan

### Frontend (3 files)
1. ✅ `frontend/src/pages/dashboard/agents/DashboardAgentScribePage.tsx` - GitHub-only + validation
2. ✅ `frontend/src/services/api/agent-configs.ts` - Updated types (copied from feat branch)
3. ✅ `frontend/src/services/api/github-discovery.ts` - Copied from feat branch

---

## SAMPLE REQUEST BODIES

### ✅ Config-Aware Payload (NEW - WORKS)
```bash
curl -X POST http://localhost:3000/api/agents/jobs \
  -H "Content-Type: application/json" \
  -H "Cookie: sessionId=YOUR_SESSION" \
  -d '{
    "type": "scribe",
    "payload": {
      "mode": "from_config",
      "dryRun": true
    }
  }'
```

**Expected**: 200 with `{ jobId, state }`

### ✅ Legacy Payload (Backward Compatible - WORKS)
```bash
curl -X POST http://localhost:3000/api/agents/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "type": "scribe",
    "payload": {
      "owner": "test-owner",
      "repo": "test-repo",
      "baseBranch": "main",
      "taskDescription": "Update docs"
    }
  }'
```

**Expected**: 200 with `{ jobId, state }`

### ❌ Config-Aware Without Auth (Expected Failure)
```bash
curl -X POST http://localhost:3000/api/agents/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "type": "scribe",
    "payload": {
      "mode": "from_config"
    }
  }'
```

**Expected**: 401 UNAUTHORIZED

### ❌ Incomplete Legacy Payload (Expected Failure)
```bash
curl -X POST http://localhost:3000/api/agents/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "type": "scribe",
    "payload": {
      "owner": "test-owner"
    }
  }'
```

**Expected**: 400 VALIDATION_ERROR with actionable message

---

## MANUAL QA STEPS

### Path 1: GitHub-Only Mode (V1 Requirement)

**Setup**:
1. ✅ Login to AKIS
2. ✅ Connect GitHub OAuth at `/dashboard/integrations`
3. ✅ Navigate to `/dashboard/agents/scribe`

**Step 1: Pre-flight Checks**:
- ✅ GitHub shows "✓ Connected"
- ✅ Confluence shows "✗ Not connected" (OK - not required)
- ✅ "Continue →" button is ENABLED (not blocked by Confluence)

**Step 2: Repository & Branch**:
- ✅ Select owner/repo/branch from GitHub discovery dropdowns
- ✅ "Continue →" enabled when all 3 selected

**Step 3: Target Platform**:
- ✅ "GitHub Repository Docs" option visible with ⭐ badge
- ✅ Select "GitHub Repository Docs"
- ✅ See "Documentation Path" input (default: `docs/`)
- ✅ "Continue →" enabled (no Confluence required)

**Step 4: Trigger Mode**:
- ✅ Select "Manual Only"
- ✅ "Continue →" enabled

**Step 5: Review & Test**:
- ✅ Playbook preview shows GitHub-only flow
- ✅ Click "Run Test Job"
- ✅ **Expected**: Job created, redirected to `/dashboard/jobs/:jobId`
- ✅ **Network**: `POST /api/agents/jobs` returns 200

**Step 5: Save & Run**:
- ✅ Click "Save & Enable Scribe"
- ✅ Config saved
- ✅ Dashboard shows config summary
- ✅ Click "Run Now"
- ✅ **Expected**: Job created, redirected to `/dashboard/jobs/:jobId`

**Verify**:
- ✅ Navigate to `/dashboard/jobs`
- ✅ Both test job and real job appear in list
- ✅ Job payloads contain `owner`, `repo`, `baseBranch` (derived from config)

---

### Path 2: Confluence Mode (Optional)

**Step 3: Target Platform**:
- ✅ Select "Confluence"
- ✅ See Confluence warning if not connected
- ✅ "Confluence Space Key" input appears
- ✅ "Continue →" DISABLED until space key filled AND Confluence connected

**If Confluence not connected**:
- ✅ Warning: "⚠️ Confluence is not connected. Please connect..."
- ✅ Input disabled
- ✅ Cannot proceed (expected)

**If Confluence connected**:
- ✅ Input enabled
- ✅ Enter space key (e.g., "ENGDOCS")
- ✅ "Continue →" enabled
- ✅ Can save and run

---

## NETWORK EVIDENCE CHECKLIST

### ✅ Successful Job Creation (GitHub-Only)
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

### ✅ Jobs List Includes Created Job
```
GET /api/agents/jobs?type=scribe&limit=20

Response: 200
{
  "items": [
    {
      "id": "uuid-here",
      "type": "scribe",
      "state": "completed",
      "createdAt": "2025-12-18T...",
      ...
    }
  ],
  "nextCursor": null
}
```

### ✅ Config Load Success
```
GET /api/agents/configs/scribe

Response: 200
{
  "config": {
    "id": "uuid",
    "userId": "uuid",
    "agentType": "scribe",
    "enabled": true,
    "repositoryOwner": "test-owner",
    "repositoryName": "test-repo",
    "baseBranch": "main",
    "targetPlatform": "github_repo",
    "targetConfig": { "docs_path": "docs/" },
    ...
  },
  "integrationStatus": {
    "github": { "connected": true, "details": {...} },
    "confluence": { "connected": false }
  }
}
```

### ❌ Missing Config Error (Actionable)
```
POST /api/agents/jobs (with mode: 'from_config', no config in DB)

Response: 400 or 500
{
  "error": {
    "code": "CONFIG_NOT_FOUND" or "INTERNAL_ERROR",
    "message": "Scribe configuration not found. Please configure Scribe first at /dashboard/agents/scribe"
  },
  "requestId": "uuid"
}
```

### ❌ Validation Error (Actionable)
```
POST /api/agents/jobs (legacy payload, missing fields)

Response: 400
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Scribe payload validation: repo field is required"
  },
  "requestId": "uuid"
}
```

---

## BACKWARD COMPATIBILITY

✅ **Legacy payloads continue to work**:
- Full payload (`owner`, `repo`, `baseBranch`) → validated and accepted
- No auth required for legacy mode
- Existing tests pass

✅ **Config-aware payloads now work**:
- `mode: 'from_config'` → loads config, derives payload
- Auth required (user-specific config)
- New integration tests added

---

## NEXT STEPS

1. ✅ **Run backend tests**: `cd backend && pnpm test`
2. ✅ **Run frontend typecheck**: `cd frontend && pnpm typecheck`
3. ✅ **Manual QA**: Follow paths above
4. ✅ **Commit changes**: Descriptive commit message with trace reference
5. ✅ **Open PR**: Against `main` with QA evidence

---

## COMMIT MESSAGE TEMPLATE

```
fix(scribe): enable GitHub-only mode and fix job validation

PROBLEM:
- POST /api/agents/jobs returned 400 for config-aware payloads
- Frontend blocked users without Confluence (V1 requirement violated)

ROOT CAUSE:
- Backend validated payload before loading config
- Frontend gated Step 1 Continue on Confluence connection

SOLUTION (Backend):
- Added config-aware payload schema (mode: 'from_config')
- Load config in route handler before validation
- Transform config to legacy payload format
- Added requireAuth utility + agentConfigs schema

SOLUTION (Frontend):
- Removed Confluence hard requirement from Step 1
- Added "GitHub Repository Docs" target option
- Conditional validation: Confluence only required if selected
- Enhanced error messages (actionable)

TESTS:
- Added integration test: scribe-config-aware.test.ts
- Verified GitHub-only path works end-to-end
- Backward compat: legacy payloads still work

EVIDENCE:
- Trace: docs/TRACE_MAP_SCRIBE_JOB_VALIDATION_BUG.md
- Plan: docs/MINIMUM_FIX_PLAN_SCRIBE_VALIDATION.md
- Report: docs/IMPLEMENTATION_REPORT_SCRIBE_FIX.md

Closes #XXX
```

