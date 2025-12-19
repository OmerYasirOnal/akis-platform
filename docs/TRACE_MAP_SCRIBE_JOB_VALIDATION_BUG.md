# Trace Map: Scribe Job Validation Bug (S0.4.6)

**Date**: 2025-01-XX  
**Bug**: POST /api/agents/jobs returns 400 VALIDATION_ERROR for Scribe jobs  
**Error Message**: "Scribe payload validation: Required" (ZodError)

---

## 1. FRONTEND CALL TRACE

### Entry Point
**File**: `frontend/src/pages/dashboard/agents/DashboardAgentScribePage.tsx`

**Function**: `handleRunTestJob()` (line 275-290)  
**Function**: `handleRunNow()` (line 292-307)

**Payload Sent**:
```typescript
{
  mode: 'from_config',
  dryRun: true  // or false for handleRunNow
}
```

**API Call Chain**:
1. `DashboardAgentScribePage.tsx:280` → `agentsApi.runAgent('scribe', { mode: 'from_config', dryRun: true })`
2. `frontend/src/services/api/agents.ts:85-94` → `httpClient.post('/api/agents/jobs', { type: 'scribe', payload: { mode: 'from_config', dryRun: true } })`

**Missing Fields**: Frontend payload contains `mode` and `dryRun`, but **NOT**:
- `owner` (required)
- `repo` (required)  
- `baseBranch` (required)

---

## 2. BACKEND VALIDATION TRACE

### Route Handler
**File**: `backend/src/api/agents.ts`

**Route**: `POST /api/agents/jobs` (line 101-190)

**Validation Schema**: `submitJobSchema` (line 32-82)
- Uses `superRefine` to validate payload based on agent type
- For `type === 'scribe'`, validates against `scribePayloadSchema`

**Scribe Payload Schema** (line 13-22):
```typescript
const scribePayloadSchema = z.object({
  owner: z.string().min(1, 'owner field is required'),      // ❌ MISSING
  repo: z.string().min(1, 'repo field is required'),        // ❌ MISSING
  baseBranch: z.string().min(1, 'baseBranch field is required'), // ❌ MISSING
  featureBranch: z.string().optional(),
  targetPath: z.string().optional(),
  taskDescription: z.string().optional(),
  doc: z.string().optional(),
});
```

**Validation Flow**:
1. Line 133: `submitJobSchema.parse(request.body)` → triggers validation
2. Line 40-50: For `type === 'scribe'`, validates payload against `scribePayloadSchema`
3. Line 46: Error message format: `"Scribe payload validation: ${err.message}"`
4. Line 184-188: Error returned as 400 with `VALIDATION_ERROR` code

**Root Cause**: Schema expects legacy payload format (`owner`, `repo`, `baseBranch`), but frontend sends config-aware format (`mode: 'from_config'`).

---

## 3. CONFIG-AWARE EXECUTION (WORKS, BUT TOO LATE)

**File**: `backend/src/core/orchestrator/AgentOrchestrator.ts`

**Function**: `startJob()` (line 88-642)

**Config Loading** (line 139-157):
- Loads config from DB if `userId` is present in payload
- Config contains: `repositoryOwner`, `repositoryName`, `baseBranch`, etc.

**Context Enrichment** (line 189-208):
- Merges config into context for agent execution
- Supports `dryRun` mode from payload

**Problem**: Config loading happens **AFTER** validation passes. Validation fails before `startJob()` is called.

---

## 4. UI GATING (CONFLUENCE BLOCKER)

**File**: `frontend/src/pages/dashboard/agents/DashboardAgentScribePage.tsx`

**Location**: Step 1 of 5 wizard (line 414-421)

**Code**:
```typescript
<Button
  onClick={handleWizardNext}
  disabled={!integrationStatus?.github.connected || !integrationStatus?.confluence.connected}
>
  Continue →
</Button>
```

**Issue**: Confluence connection is **required** to proceed, but V1 should support GitHub-only Scribe.

**Impact**: Users cannot configure Scribe without Confluence, even though backend supports GitHub-only mode.

---

## 5. EXACT REQUIRED FIELDS

### For Legacy Payload (Current Schema Expectation)
- `owner`: string (min 1 char) - **REQUIRED**
- `repo`: string (min 1 char) - **REQUIRED**
- `baseBranch`: string (min 1 char) - **REQUIRED**
- `featureBranch`: string - optional
- `targetPath`: string - optional
- `taskDescription`: string - optional
- `doc`: string - optional (backward compat)

### For Config-Aware Payload (Frontend Sends)
- `mode`: `'from_config'` - indicates use saved config
- `dryRun`: boolean - optional, test mode flag
- `userId`: added by backend (line 136-139)

### Config Schema (DB)
- `repositoryOwner`: string (maps to `owner`)
- `repositoryName`: string (maps to `repo`)
- `baseBranch`: string (maps to `baseBranch`)
- `targetPlatform`: enum - optional (can be null for GitHub-only)
- Other fields: optional

---

## 6. VALIDATION ERROR FLOW

```
Frontend Request
  ↓
POST /api/agents/jobs
  {
    type: 'scribe',
    payload: { mode: 'from_config', dryRun: true }
  }
  ↓
Backend: submitJobSchema.parse()
  ↓
superRefine() → type === 'scribe'
  ↓
scribePayloadSchema.safeParse({ mode: 'from_config', dryRun: true })
  ↓
❌ VALIDATION FAILS
  - Missing: owner
  - Missing: repo
  - Missing: baseBranch
  ↓
ZodError → "Scribe payload validation: Required"
  ↓
400 VALIDATION_ERROR response
```

---

## SUMMARY

**Bug Location**: `backend/src/api/agents.ts:13-22` (scribePayloadSchema)

**Root Cause**: Schema validation happens before config loading. Frontend sends config-aware payload, but schema expects legacy format.

**UI Blocker**: `DashboardAgentScribePage.tsx:417` - Confluence required to proceed.

**Files Involved**:
1. `backend/src/api/agents.ts` - validation schema
2. `frontend/src/pages/dashboard/agents/DashboardAgentScribePage.tsx` - UI gating
3. `backend/src/core/orchestrator/AgentOrchestrator.ts` - config loading (works, but too late)


