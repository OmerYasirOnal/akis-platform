# Remove Scribe Demo Mode + Docs Cleanup + API Updates

## Summary

This PR removes the Scribe "demo mode" feature entirely and cleans up outdated documentation. Scribe now **always** runs real workflows via the orchestrator, real services (AIService + MCP adapters), and requires genuine GitHub OAuth connection.

## Motivation

**Why remove demo mode?**
- Demo mode created maintenance burden (separate code paths, mock data)
- Caused confusion between real and simulated behavior
- Not aligned with production architecture (always use real integrations)
- Documentation drift: demo mode QA notes were outdated

**Why cleanup docs?**
- 14+ time-expired QA evidence documents (S0.4.6 specific)
- Bug-specific trace maps that are resolved
- Phase-specific presentation guides (semester-limited scope)
- Keeps docs/ focused on current canonical information

## Changes

### 🗑️ Deleted Files (Frontend)

**Demo Mode Infrastructure:**
- `frontend/src/services/agents/scribe/demoScribeRunner.ts` (260 lines)
- `frontend/src/services/agents/scribe/useDemoScribeRunner.ts`
- `frontend/src/services/agents/scribe/index.ts`
- `frontend/src/components/dashboard/DashboardChat.tsx` (unused stub component)

### ✏️ Modified Files (Frontend)

**`DashboardAgentScribePage.tsx`** (601 → 669 lines)
- ❌ Removed: Demo mode UI (badge, mock data fallbacks)
- ✅ Added: Real backend integration
  - `agentsApi.runAgent()` job submission
  - `agentsApi.getJob()` polling with 2s interval
  - Trace events → log extraction
  - Real-time job status monitoring
- ❌ Removed: Fallback GitHub owner/repo/branch data
- ✅ Added: User guidance to `/dashboard/integrations` when GitHub not connected

**`services/api/agents.ts`**
- ✅ Updated: `runAgent(object)` instead of `runAgent(type, payload)`
- ✅ Updated: `getJob(jobId, options?)` with `include` parameter
- ✅ Added: `trace` and `artifacts` fields to `JobDetail` type
- ✅ Added: Type safety with `RunAgentRequest` and `GetJobOptions`

**`useAgentRunner.ts`**
- ✅ Fixed: API call signature to match new agents API

**`DashboardAgentScribePage.test.tsx`**
- ✅ Updated: "Demo mode" test → "Error notice" test
- ✅ Updated: Expectations to match real backend behavior

### 📚 Updated Docs

**`backend/docs/API_SPEC.md`**
- ✅ Updated Scribe payload: `owner`, `repo`, `baseBranch` (required)
- ✅ Documented optional fields: `targetPath`, `dryRun`, `featureBranch`, `taskDescription`
- ✅ Added example JSON payload

**`docs/WEB_INFORMATION_ARCHITECTURE.md`**
- ✅ Updated: Scribe page description (single-page console with real-time monitoring)
- ✅ Clarified: No demo mode, all operations connect to real backend
- ✅ Updated: Layout shows configuration panel + glass box console with tabs

### 🗑️ Deleted Docs (30+ files, ~10K lines)

**QA Evidence (time-expired):**
- `docs/EVIDENCE_S0.4.6_*.md` (3 files)
- `docs/READY_TO_PR_REPORT_S0.4.6.md`
- `docs/qa/evidence/s0.4.6/` (9 images, HAR, JSON)
- `docs/qa/QA_EVIDENCE_SCRIBE_OPENAI_METRICS_DEMO.md`
- `docs/qa/QA_NOTES_SCRIBE_SINGLE_PAGE_DEMO.md`

**Implementation Reports (specific fixes):**
- `docs/IMPLEMENTATION_REPORT_SCRIBE_FIX.md`
- `docs/MINIMUM_FIX_PLAN_SCRIBE_VALIDATION.md`
- `docs/PR_DESCRIPTION_SCRIBE_FIX.md`

**Trace Maps (bug-specific, resolved):**
- `docs/TRACE_MAP_S0.4.6_FINAL.md`
- `docs/TRACE_MAP_S0.4.6_RUNTIME_404.md`
- `docs/TRACE_MAP_SCRIBE_JOB_VALIDATION_BUG.md`

**Phase/Semester-Specific:**
- `docs/presentations/SEMESTER1_SCRIBE_DEMO_*.md` (2 files)
- `docs/phase1-runtime-proof/` (directory)
- `docs/phase2-feedback-loop/` (directory)
- `docs/SCRIBE_E2E_REPORT.md`
- `docs/SCRIBE_IMPROVEMENT_PLAN.md`

## Testing

### ✅ Quality Gates (All Passed)

```bash
pnpm -r typecheck  # ✅ PASS (frontend, backend, mcp-gateway)
pnpm -r lint       # ✅ PASS
pnpm -r build      # ✅ PASS
frontend tests     # ✅ 42 tests passed
```

### Manual Testing

- ✅ `/dashboard/agents/scribe` loads without demo mode UI
- ✅ GitHub owner/repo/branch dropdowns load from real API
- ✅ Error message shown when GitHub not connected
- ✅ "Run Scribe" button submits real job to backend
- ✅ Job polling works (logs update in real-time)
- ✅ Preview and Diff tabs show real artifacts

## Breaking Changes

⚠️ **BREAKING CHANGE:** Scribe demo mode removed

**Impact:**
- Users **must** connect GitHub OAuth at `/dashboard/integrations` before using Scribe
- No fallback mock data for owners/repos/branches
- All Scribe jobs require real GitHub token

**Migration:**
- Existing users: No action needed (if GitHub already connected)
- New users: Must complete GitHub OAuth flow before using Scribe

## What Was NOT Changed

✅ **Preserved (Intentionally):**
- Test infrastructure mock data (for unit tests)
- Backend `MockAIService` and `MockEmailService` (test/dev helpers)
- i18n strings containing "demo" (marketing copy)
- `ProtoAgent` mock implementation (agent itself is prototype)
- Canonical docs: `API_SPEC.md`, `Auth.md`, `AGENT_WORKFLOWS.md`, `ROADMAP.md`, etc.

## Checklist

- [x] Code changes reviewed
- [x] Tests passing (42 tests)
- [x] Lint passing (no errors)
- [x] Typecheck passing (all packages)
- [x] Build passing (all packages)
- [x] Documentation updated (API_SPEC, WEB_INFORMATION_ARCHITECTURE)
- [x] Outdated docs deleted (30+ files)
- [x] Breaking changes documented
- [x] Conventional commit format used

## Related Issues

- Closes: N/A (cleanup task, no specific issue)
- Related: Architecture compliance (no demo mode in production code)

## Screenshots

### Before (Demo Mode):
- Demo Mode badge visible
- Mock data fallback for GitHub repos
- Stub responses in console

### After (Real Integration):
- No demo mode UI
- Real GitHub API calls
- Live job polling with trace events
- Error guidance when GitHub not connected

---

**Commit:** `chore(scribe): remove demo mode + cleanup outdated docs + API updates`  
**Branch:** `chore/scribe-no-demo-docs-cleanup`  
**Files Changed:** 38 files, +293/-10,368 lines

