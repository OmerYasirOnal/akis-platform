# Final Trace Map: S0.4.6 Scribe Job Validation

**Date**: 2025-12-18  
**Branch**: `fix/scribe-github-only-and-job-run-s0.4.6`

---

## 1. FRONTEND CALL FLOW

### Entry Points (UI Buttons)

**Run Test Job** (Step 5 Wizard + Dashboard):
- Location: `frontend/src/pages/dashboard/agents/DashboardAgentScribePage.tsx:275-313`
- Handler: `handleRunTestJob()`
- Gating: Lines 276-296 check config, GitHub connection, Confluence (if selected)

**Run Now** (Dashboard):
- Location: `frontend/src/pages/dashboard/agents/DashboardAgentScribePage.tsx:315-352`
- Handler: `handleRunNow()`
- Same gating logic as handleRunTestJob

### API Call

**Location**: `frontend/src/pages/dashboard/agents/DashboardAgentScribePage.tsx:302-305`
```typescript
const result = await agentsApi.runAgent('scribe', {
  mode: 'from_config',
  dryRun: true,  // false for handleRunNow
});
```

### agentsApi.runAgent

**Location**: `frontend/src/services/api/agents.ts:85-94`
```typescript
runAgent: async (type: AgentType, payload: unknown): Promise<RunAgentResponse> => {
  return httpClient.post<RunAgentResponse>(
    '/api/agents/jobs',
    {
      type,        // 'scribe'
      payload,     // { mode: 'from_config', dryRun: true/false }
    },
    withCredentials
  );
},
```

### Final HTTP Request
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

---

## 2. BACKEND VALIDATION FLOW

### Route Definition

**Location**: `backend/src/api/agents.ts:131-160`
```typescript
// POST /api/agents/jobs
fastify.post('/api/agents/jobs', {...}, async (request, reply) => {
  // Line 162: Zod validation
  const body = submitJobSchema.parse(request.body);
  ...
});
```

### Schema Definitions

**submitJobSchema** (Line 40-91):
```typescript
const submitJobSchema = z.object({
  type: z.enum(['scribe', 'trace', 'proto']),
  payload: z.unknown().optional(),
  requiresStrictValidation: z.boolean().optional().default(false),
}).superRefine((data, ctx) => {
  // Conditional validation based on payload content
});
```

**scribeConfigAwarePayloadSchema** (Line 24-29):
```typescript
const scribeConfigAwarePayloadSchema = z.object({
  mode: z.enum(['from_config', 'test', 'run']).optional(),
  config_id: z.string().uuid().optional(),
  dryRun: z.boolean().optional(),
}).passthrough();
```

**scribePayloadSchema** (Line 14-22) - Legacy:
```typescript
const scribePayloadSchema = z.object({
  owner: z.string().min(1, 'owner field is required'),
  repo: z.string().min(1, 'repo field is required'),
  baseBranch: z.string().min(1, 'baseBranch field is required'),
  featureBranch: z.string().optional(),
  targetPath: z.string().optional(),
  taskDescription: z.string().optional(),
  doc: z.string().optional(),
});
```

### Validation Logic (Line 48-91)

**Condition Check** (Line 55-58):
```typescript
const isConfigAware = 
  payload.mode === 'from_config' || 
  payload.mode === 'test' || 
  payload.mode === 'run' || 
  typeof payload.config_id === 'string';
```

**Config-Aware Path** (Line 60-69):
- Uses `scribeConfigAwarePayloadSchema`
- Does NOT require `owner`, `repo`, `baseBranch`
- Config loaded from DB in route handler

**Legacy Path** (Line 70-81):
- Uses `scribePayloadSchema`
- REQUIRES `owner`, `repo`, `baseBranch`
- Backward compatible with existing tests

---

## 3. CONFIG LOADING FLOW

### Location: `backend/src/api/agents.ts:167-230`

**Step 1: Detect Config-Aware Payload** (Line 168-173):
```typescript
if (body.type === 'scribe' && body.payload && typeof body.payload === 'object') {
  const payload = body.payload as Record<string, unknown>;
  const isConfigAware = 
    payload.mode === 'from_config' || ...;
```

**Step 2: Auth Check** (Line 176-182):
```typescript
const user = await requireAuth(request);
userId = user.id;
```

**Step 3: Load Config** (Line 185-196):
```typescript
config = await db.query.agentConfigs.findFirst({
  where: and(
    eq(agentConfigs.userId, userId),
    eq(agentConfigs.agentType, 'scribe')
  ),
});
```

**Step 4: Validate Config** (Line 198-205):
- Config must exist
- `repositoryOwner`, `repositoryName`, `baseBranch` must be set

**Step 5: Transform Config to Payload** (Line 207-221):
```typescript
enrichedPayload = {
  ...payload,
  owner: config.repositoryOwner,
  repo: config.repositoryName,
  baseBranch: config.baseBranch,
  userId,
};
```

---

## 4. UI GATING LOGIC

### Step 1 Continue Button

**Location**: `frontend/src/pages/dashboard/agents/DashboardAgentScribePage.tsx:456-463`
```typescript
<Button
  onClick={handleWizardNext}
  disabled={!integrationStatus?.github.connected}
>
  Continue →
</Button>
```

**Note**: Confluence NOT required in Step 1 (GitHub-only support)

### Step 3 Target Platform Validation

**Location**: Line 658-663
```typescript
<Button 
  onClick={handleWizardNext} 
  disabled={
    !wizardData.targetPlatform || 
    (wizardData.targetPlatform === 'confluence' && 
      (!integrationStatus?.confluence.connected || !space_key))
  }
>
```

**Logic**:
- GitHub Repo Docs: No Confluence required
- Confluence: Requires connection + space key

---

## 5. ERROR HANDLING

### Frontend Actionable Errors

**Location**: `DashboardAgentScribePage.tsx:276-296`
```typescript
if (!config) {
  setError('No configuration found. Please complete the setup wizard first.');
  return;
}

if (!config.repositoryOwner || !config.repositoryName || !config.baseBranch) {
  setError('Configuration incomplete. Please ensure repository owner, name, and base branch are set.');
  return;
}

if (!integrationStatus?.github.connected) {
  setError('GitHub is not connected. Please connect GitHub before running Scribe.');
  return;
}

if (config.targetPlatform === 'confluence' && !integrationStatus?.confluence.connected) {
  setError('Confluence target selected but not connected. ...');
  return;
}
```

### Backend Error Responses

**Config Not Found** (Line 198-200):
```typescript
throw new Error('Scribe configuration not found. Please configure Scribe first at /dashboard/agents/scribe');
```

**Config Incomplete** (Line 202-205):
```typescript
throw new Error('Scribe configuration incomplete. Missing repository owner, name, or base branch. ...');
```

---

## 6. SYMPTOM → ROOT CAUSE → FIX MAPPING

### Bug 1: 400 VALIDATION_ERROR

**Symptom**: POST `/api/agents/jobs` returns 400 with "Required"

**Trace**:
```
Frontend: handleRunTestJob() → agentsApi.runAgent('scribe', {mode: 'from_config'})
  ↓
Backend: submitJobSchema.parse() → superRefine() → scribePayloadSchema.safeParse()
  ↓
OLD: Required owner/repo/baseBranch but payload only has mode/dryRun
  ↓
FIXED: Detect isConfigAware, use scribeConfigAwarePayloadSchema instead
```

**Fix Location**: `backend/src/api/agents.ts:55-69`

### Bug 2: Confluence Hard Requirement

**Symptom**: Step 1 Continue disabled without Confluence

**Trace**:
```
Frontend: Step 1 Continue button
  ↓
OLD: disabled={!github.connected || !confluence.connected}
  ↓
FIXED: disabled={!github.connected}
```

**Fix Location**: `frontend/src/pages/dashboard/agents/DashboardAgentScribePage.tsx:459`

### Bug 3: Generic Error Messages

**Symptom**: "Request validation failed" with no guidance

**Trace**:
```
Frontend: catch (err) → setError(err.message || 'Failed to run job')
  ↓
OLD: Generic message, no actionable info
  ↓
FIXED: Pre-flight checks with specific error messages before API call
```

**Fix Location**: `DashboardAgentScribePage.tsx:276-296`

---

## 7. FILES CHANGED SUMMARY

### Backend
| File | Lines | Change |
|------|-------|--------|
| `backend/src/api/agents.ts` | 14-230 | Config-aware validation + route handler |
| `backend/src/db/schema.ts` | 180-238 | agentConfigs table |
| `backend/src/utils/auth.ts` | 1-50 | requireAuth utility |

### Frontend
| File | Lines | Change |
|------|-------|--------|
| `DashboardAgentScribePage.tsx` | 275-352 | Actionable error messages |
| `DashboardAgentScribePage.tsx` | 456-463 | GitHub-only gating |
| `DashboardAgentScribePage.tsx` | 550-660 | GitHub Repo Docs target |
| `agent-configs.ts` | 20 | github_repo TargetPlatform |
| `SearchableSelect.tsx` | 1-249 | Missing component |

---

## 8. VERIFICATION CHECKLIST

- [ ] Backend typecheck passes
- [ ] Backend lint passes
- [ ] Backend tests pass (85/85)
- [ ] Frontend typecheck passes
- [ ] Frontend dev server starts
- [ ] POST /api/agents/jobs with mode='from_config' returns 200
- [ ] Job appears in GET /api/agents/jobs
- [ ] GitHub-only path works end-to-end
- [ ] Confluence path enforces connection

