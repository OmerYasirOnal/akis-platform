# fix(scribe): enable GitHub-only mode and fix job validation (S0.4.6)

## Summary
This PR enables Scribe to run without Confluence (V1 requirement) and fixes backend test environment issues that were blocking development.

## Problem Statement
1. **Backend tests failing**: `pnpm test` crashed with `NODE_ENV='test pnpm test'` validation error due to `bash -lc` shell pollution
2. **Schema drift**: Integration test used obsolete `isVerified` field instead of `emailVerified`
3. **Confluence requirement**: Scribe wizard blocked users at Step 1 if Confluence wasn't connected
4. **Job creation validation**: Config-aware payloads (`mode: 'from_config'`) needed backend support

## Solution

### Backend Changes
- **Test script fix**: Simplified `package.json` test script to use direct `NODE_ENV=test node --test` invocation, removing `bash -lc` wrapper
- **Schema alignment**: Updated test fixtures to use correct `emailVerified` field and `status: 'active'`
- **Config-aware validation**: Added conditional validation in `agents.ts` (lines 45-239) that:
  - Detects `mode: 'from_config'` in payload
  - Loads user's Scribe configuration from database
  - Validates completeness before job creation
  - Maintains backward compatibility with legacy payloads
- **Auth utility**: Added `requireAuth` helper for protected routes

### Frontend Changes
- **GitHub-only path**: Step 1 Continue button now only requires GitHub (Confluence optional)
- **Scribe wizard**: Comprehensive 5-step configuration flow
- **SearchableSelect**: GitHub discovery component for owner/repo/branch selection
- **Config-aware jobs**: Frontend sends `{mode: 'from_config', dryRun: true/false}` payload

## Testing

### Automated Tests ✅
```bash
# Backend (all green)
$ cd backend && pnpm test
# tests 85
# pass 85
# fail 0

# Typecheck (both pass)
$ pnpm -r typecheck
✅ Backend: No errors
✅ Frontend: No errors
```

### Manual QA Evidence
- [x] GitHub-only path: Step 1 Continue button enabled without Confluence
- [x] Config save: Wizard completes and saves configuration
- [x] Job creation: POST `/api/agents/jobs` returns 200 with `jobId`
- [x] Jobs list: Created job appears in GET `/api/agents/jobs`
- [x] Confluence gating: Warning shown when selecting Confluence target without connection

**Network Evidence** (documented in `docs/QA_SCRIBE_S0.4.6_MANUAL.md`):
- Config-aware payload validation works correctly
- Legacy payload (owner/repo/baseBranch) remains backward compatible
- Error messages are actionable (e.g., "Scribe configuration not found. Please configure...")

## Breaking Changes
None - fully backward compatible. Legacy job payloads continue to work without modification.

## Files Changed
```
Backend:
- package.json (test script simplification)
- test/integration/scribe-config-aware.test.ts (new test, schema fixes)
- src/api/agents.ts (config-aware validation)
- src/db/schema.ts (agentConfigs table)
- src/utils/auth.ts (new auth helper)

Frontend:
- pages/dashboard/agents/DashboardAgentScribePage.tsx (wizard + GitHub-only)
- components/common/SearchableSelect.tsx (new component)
- services/api/agent-configs.ts (config API)
- services/api/github-discovery.ts (GitHub discovery API)

Documentation:
- docs/QA_SCRIBE_S0.4.6_MANUAL.md (QA checklist)
- docs/MINIMUM_FIX_PLAN_SCRIBE_VALIDATION.md (fix strategy)
- docs/TRACE_MAP_SCRIBE_JOB_VALIDATION_BUG.md (trace analysis)
- .cursor/plans/scribe_github_only_fix_plan.md (implementation plan)
```

## Reviewer Focus Points

1. **Test script change** (`backend/package.json:14`): Is NODE_ENV now deterministically set to `"test"`?
2. **Schema alignment** (`scribe-config-aware.test.ts`): Do test fixtures match current schema?
3. **Validation logic** (`agents.ts:45-239`): Does config-aware vs legacy branching work correctly?
4. **UI gating** (`DashboardAgentScribePage.tsx:463`): Is Confluence truly optional?
5. **Backward compat**: Can legacy payloads still create jobs without regression?

## Deployment Notes
- No database migrations required (agentConfigs schema already deployed)
- No environment variable changes needed
- Feature is opt-in (existing users unaffected until they configure Scribe)

## Follow-up Work (Out of Scope)
- [ ] E2E automated tests for Scribe wizard flow
- [ ] Job execution logic (orchestrator implementation)
- [ ] Confluence integration (when target=confluence)
- [ ] Scheduled triggers (currently manual-only)

---

**Branch**: `fix/scribe-github-only-and-job-run-s0.4.6`  
**Base**: `main`  
**Commits**: 3 (test fix, feature impl, docs)

**Ready for Review** ✅

