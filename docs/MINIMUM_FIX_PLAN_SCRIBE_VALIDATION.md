# Minimum Fix Plan: Scribe Job Validation & GitHub-Only Support

**Branch**: `fix/scribe-github-only-and-job-run-s0.4.6`  
**Goal**: Fix 400 VALIDATION_ERROR and enable GitHub-only Scribe (V1 requirement)

---

## FIX OPTIONS ANALYSIS

### Option A: Config-ID Approach (Backend Derives Payload)

**How it works**:
1. Frontend sends: `{ mode: 'from_config' }` or `{ config_id: '<uuid>' }`
2. Backend validation: If `mode === 'from_config'` or `config_id` present, skip legacy schema validation
3. Backend route handler: Load config from DB using `userId` + `agentType`
4. Backend route handler: Transform config fields (`repositoryOwner` → `owner`, etc.) before validation OR bypass validation
5. Pass enriched payload to orchestrator

**Pros**:
- ✅ Minimal frontend changes (already sends `mode: 'from_config'`)
- ✅ Single source of truth (config in DB)
- ✅ Backward compatible (legacy payloads still work)
- ✅ Safer for V1 (validates config exists before job creation)

**Cons**:
- ⚠️ Requires DB query in route handler (before validation)
- ⚠️ More complex validation logic (conditional schema)

**Files to Edit**:
1. `backend/src/api/agents.ts` - Modify `submitJobSchema` to handle config-aware payloads
2. `backend/src/api/agents.ts` - Add config loading in route handler (before validation or conditional validation)
3. `frontend/src/pages/dashboard/agents/DashboardAgentScribePage.tsx` - Remove Confluence requirement (line 417)

**Risk Level**: **LOW** ✅ (Recommended for V1)

---

### Option B: Full Payload Approach (Frontend Sends Everything)

**How it works**:
1. Frontend: Load config from `GET /api/agents/configs/scribe`
2. Frontend: Transform config to legacy format: `{ owner, repo, baseBranch, ... }`
3. Frontend: Send full payload: `{ type: 'scribe', payload: { owner, repo, baseBranch, ... } }`
4. Backend: Existing validation works as-is

**Pros**:
- ✅ No backend validation changes needed
- ✅ Simpler backend logic

**Cons**:
- ❌ Frontend must duplicate config loading logic
- ❌ Two sources of truth (config API + job payload)
- ❌ More network calls (config fetch + job creation)
- ❌ Risk of stale config data
- ❌ Not aligned with config-aware architecture

**Files to Edit**:
1. `frontend/src/pages/dashboard/agents/DashboardAgentScribePage.tsx` - Load config and transform before `runAgent()` call
2. `frontend/src/pages/dashboard/agents/DashboardAgentScribePage.tsx` - Remove Confluence requirement

**Risk Level**: **MEDIUM** ⚠️ (Not recommended - violates config-aware design)

---

## RECOMMENDATION: Option A (Config-ID Approach)

**Rationale**:
1. **Architectural Alignment**: Matches existing config-aware design in `AgentOrchestrator.startJob()`
2. **Single Source of Truth**: Config stored once in DB, used consistently
3. **V1 Safety**: Validates config exists before job creation (prevents orphaned jobs)
4. **Backward Compatible**: Legacy payloads (`owner`, `repo`, `baseBranch`) still work
5. **Minimal Changes**: Frontend already sends `mode: 'from_config'`

---

## IMPLEMENTATION PLAN (Option A)

### Step 1: Backend - Conditional Validation Schema

**File**: `backend/src/api/agents.ts`

**Change**: Modify `submitJobSchema` to handle config-aware payloads

**Logic**:
```typescript
// If payload.mode === 'from_config', skip legacy schema validation
// Validation will happen after config is loaded (or config existence check)
```

**Code Location**: Line 32-82 (`submitJobSchema.superRefine`)

**Details**:
- Check if `payload.mode === 'from_config'`
- If yes, skip `scribePayloadSchema` validation (config will be loaded and validated separately)
- If no, use existing `scribePayloadSchema` validation (backward compat)

---

### Step 2: Backend - Load Config in Route Handler

**File**: `backend/src/api/agents.ts`

**Change**: Load config from DB when `mode === 'from_config'`

**Code Location**: Line 127-146 (route handler)

**Logic**:
```typescript
// After requireAuth, before submitJobSchema.parse()
if (body.payload?.mode === 'from_config' && body.type === 'scribe') {
  // Load config from DB using userId + agentType
  // Validate config exists and has required fields
  // Transform config to legacy format OR enrich payload with config fields
}
```

**Details**:
- Query: `SELECT * FROM agent_configs WHERE user_id = ? AND agent_type = 'scribe'`
- Validate: Config exists and `repositoryOwner`, `repositoryName`, `baseBranch` are set
- Transform: Add `owner`, `repo`, `baseBranch` to payload (or modify validation to accept config fields)

---

### Step 3: Backend - Update Validation Schema

**File**: `backend/src/api/agents.ts`

**Change**: Update `scribePayloadSchema` to accept config-aware fields OR make legacy fields optional when config is present

**Options**:
- **Option A1**: Make `owner`, `repo`, `baseBranch` optional, add `mode` as optional
- **Option A2**: Create separate schema for config-aware payloads
- **Option A3**: Skip validation entirely when `mode === 'from_config'` (validate config existence instead)

**Recommended**: Option A3 (cleanest, validates config instead of payload)

---

### Step 4: Frontend - Remove Confluence Requirement

**File**: `frontend/src/pages/dashboard/agents/DashboardAgentScribePage.tsx`

**Change**: Remove Confluence check from Step 1 Continue button

**Code Location**: Line 414-421

**Before**:
```typescript
disabled={!integrationStatus?.github.connected || !integrationStatus?.confluence.connected}
```

**After**:
```typescript
disabled={!integrationStatus?.github.connected}
```

**Additional Changes**:
- Step 3 (Target Platform): Make Confluence optional, allow `null` or `github_wiki` as valid targets
- Step 3 validation: Only require `targetPlatform` if user selects Confluence
- Config save: Allow `targetPlatform: null` for GitHub-only mode

---

## FILES TO EDIT (EXACT LIST)

### Backend
1. ✅ `backend/src/api/agents.ts`
   - Line 13-22: Update `scribePayloadSchema` (make fields optional or add `mode` support)
   - Line 32-82: Update `submitJobSchema.superRefine` (skip validation for `mode === 'from_config'`)
   - Line 127-146: Add config loading logic before validation

### Frontend
2. ✅ `frontend/src/pages/dashboard/agents/DashboardAgentScribePage.tsx`
   - Line 417: Remove Confluence requirement from Continue button
   - Line 533-618: Update Step 3 to allow GitHub-only (make Confluence optional)
   - Line 614: Update validation to allow `targetPlatform: null`

---

## TESTING CHECKLIST

### Backend Tests
- [ ] Test legacy payload: `{ type: 'scribe', payload: { owner, repo, baseBranch } }` → ✅ Works
- [ ] Test config-aware payload: `{ type: 'scribe', payload: { mode: 'from_config' } }` → ✅ Works (config loaded)
- [ ] Test config-aware payload without config: `{ mode: 'from_config' }` → ❌ Returns 400 (config not found)
- [ ] Test config-aware payload with invalid config (missing fields) → ❌ Returns 400

### Frontend Tests
- [ ] Step 1: Continue button enabled when GitHub connected (Confluence optional)
- [ ] Step 3: Can proceed without selecting Confluence (GitHub-only mode)
- [ ] Step 5: Save config with `targetPlatform: null` → ✅ Works
- [ ] Run Test Job: Creates job successfully with config-aware payload → ✅ Works

---

## ROLLBACK PLAN

If Option A causes issues:
1. Revert `backend/src/api/agents.ts` changes
2. Revert `frontend/src/pages/dashboard/agents/DashboardAgentScribePage.tsx` changes
3. Consider Option B as fallback (but not recommended)

---

## NOTES

- **V1 Requirement**: GitHub-only Scribe must work (Confluence optional)
- **Backward Compatibility**: Legacy payloads (`owner`, `repo`, `baseBranch`) must continue to work
- **Config-Aware Design**: Aligns with existing `AgentOrchestrator.startJob()` config loading
- **Validation Timing**: Config validation happens before job creation (safer than Option B)

