# Scribe Deep Analysis Enhancement Plan

> **Task ID:** S0.5.3-AGT-8 (Phase C Extension — Agent Reliability)  
> **Priority:** P0 — Demo critical  
> **Created:** 2026-02-12  
> **Deadline:** 2026-02-16 (before scope freeze 21 Feb)  
> **Status:** Completed (2026-02-12, commit b723c2d, PR #302)

---

## Problem Statement

Scribe agent currently produces **shallow, minimal documentation** that doesn't match the expectations for a pilot demo. Evidence from `UnISum-Backend` repo analysis:

| Metric | Current | Target |
|--------|---------|--------|
| Documents Read | 0 | 15-30+ |
| Files Produced | 1 (README only) | 4-8 (README, ARCHITECTURE, API, DEVELOPMENT...) |
| Quality Gate | 33/100 | 70+ |
| Duration | 16s | 60-180s (proportional to repo size) |
| Doc Depth | lite | standard or deep |
| Repo Coverage | Root + 1 level | Full recursive (src/, docs/, config) |

### Root Causes

1. **Frontend doesn't send `docPack` parameter** — Scribe defaults to single-file README mode
2. **Shallow repo scanning** — Only reads root files + 1 level of subdirectories (max 3 files per subdir)
3. **`documentsRead` metric bug** — Files are read but counter is calculated incorrectly
4. **No recursive source analysis** — Doesn't traverse `src/controllers/`, `src/models/`, `src/routes/`, etc.
5. **Chat progress too coarse** — Shows 6 high-level steps but no per-file granularity
6. **No intelligent doc-need detection** — Doesn't analyze repo structure to determine WHICH documents are needed

---

## Enhancement Tasks (5 subtasks)

### Task 1: Backend — Deep Repo Scanning

**WHAT:** Enhance `gatherRepoContext()` in ScribeAgent to perform recursive, deep source code analysis.

**WHERE:** `backend/src/agents/scribe/ScribeAgent.ts` — `gatherRepoContext()` method (lines 434-591)

**CHANGES:**
- Increase `REPO_SCAN_CONFIG.maxFiles` from 50 to 150
- Increase `REPO_SCAN_CONFIG.previewLength` from 4000 to 8000
- Add recursive directory scanning: for each detected source dir (`src/`, `lib/`, `app/`), scan 3 levels deep
- Read ALL `.ts`, `.js`, `.py`, `.go`, `.rs` source files (not just first 3 per dir)
- Read ALL config files: `.*rc`, `*.config.*`, `*.json`, `*.yaml`, `*.yml`
- Add `analyzeSourceStructure()` method that builds a file tree map and identifies:
  - Entry points (main/index files)
  - Route definitions
  - Model/schema definitions
  - Middleware/plugin files
  - Test directories and patterns
- Emit granular trace events for EACH file read: `recordDocRead(path, size, preview)` per file

**RULES:**
- Keep maxBytesPerFile at 20KB to avoid token overflow
- Binary files, node_modules, dist/, .git/ must still be excluded
- Total context size must respect `DOC_DEPTH_LIMITS` (64K max for deep)
- Each file read MUST emit a separate trace event (not batched)

**ESTIMATED SIZE:** ~150 LoC

---

### Task 2: Backend — Intelligent Multi-Doc Generation

**WHAT:** Auto-detect which documents a repo needs and generate them all in one run.

**WHERE:** `backend/src/agents/scribe/ScribeAgent.ts` — `executeWithTools()` method (lines 690-1363), specifically the file target resolution (lines 826-935)

**CHANGES:**
- Add `detectRequiredDocuments()` method that analyzes repo structure to determine needed docs:
  - Has `src/` with multiple modules → needs ARCHITECTURE.md
  - Has API routes/endpoints → needs API.md
  - Has `package.json` with scripts → needs DEVELOPMENT.md
  - Has `Dockerfile` or deploy configs → needs DEPLOYMENT.md
  - Has complex setup (env vars, databases) → needs setup guide
  - Always needs README.md
- When `task.docPack` is NOT explicitly set AND `task.targetPath` is `README.md` (default):
  - Auto-detect appropriate `docPack` level based on repo analysis
  - Small repo (< 10 files) → `readme`
  - Medium repo (10-50 files) → `standard` (README + ARCHITECTURE + API + DEVELOPMENT)
  - Large repo (50+ files) → `full` (all 8 document types)
- Generate each document with its own contract and dedicated AI call
- Emit per-file generation progress: "Generating ARCHITECTURE.md (2/4)..."

**RULES:**
- Each document generation is a separate AI call with the appropriate `DocTypeContract`
- Per-file token budget: `maxOutputTokens / fileCount`
- If any single file generation fails, continue with others (don't abort)
- `documentsRead` metric must correctly count ALL files read during context + generation

**ESTIMATED SIZE:** ~200 LoC

---

### Task 3: Backend — Fix Quality Score Calculation

**WHAT:** Fix the `documentsRead` metric and quality score calculation.

**WHERE:**
- `backend/src/agents/scribe/ScribeAgent.ts` — result metrics (around line 1151)
- `backend/src/services/quality/QualityScoring.ts` — scoring formula

**CHANGES:**
- Track `documentsRead` as the actual count of files read during `gatherRepoContext()` (not the broken formula)
- Add `contextFilesRead` counter that increments for every `getFileContentSafe()` call that returns data
- Pass correct metrics to quality scoring: `{ documentsRead: contextFilesRead, filesProduced: updatedFiles.length, docDepth, passes }`
- Ensure quality scoring rewards deep analysis proportionally

**RULES:**
- `documentsRead` = total unique files read for context (not target files)
- `filesProduced` = files actually generated/updated
- Quality score thresholds: 80+ for deep multi-doc, 60+ for standard, 40+ for lite single-file

**ESTIMATED SIZE:** ~50 LoC

---

### Task 4: Backend — Granular Chat Progress Events

**WHAT:** Emit detailed, step-by-step progress events so the chat/activity UI shows exactly what Scribe is doing.

**WHERE:**
- `backend/src/agents/scribe/ScribeAgent.ts` — throughout `executeWithTools()` and `gatherRepoContext()`

**CHANGES:**
- In `gatherRepoContext()`, emit events for:
  - "Scanning root directory structure..." (with file count)
  - "Detected project type: node-express" 
  - "Reading {filename}..." for EACH file read (with brief content summary)
  - "Analyzing source structure: found {N} controllers, {M} models, {K} routes"
  - "Context gathering complete: {N} files read, {K}KB of source code analyzed"
- In content generation loop, emit events for:
  - "Generating {docType} documentation ({N}/{total})..."
  - "Applying {contractName} contract with {M} required sections"
  - "Content generated for {path}: {lineCount} lines, {sectionCount} sections"
- In review step:
  - "Reviewing {path} for quality compliance..."
  - "Quality review: {score}/100 — {issues found/no issues}"
- In commit step:
  - "Committing {path} to branch {branch}..."
  - "Creating pull request..."
- Use `recordPlanStep()` with `status: 'running'` at start and `status: 'completed'` at end for each sub-step

**RULES:**
- Events MUST be emitted synchronously (await trace calls) — no fire-and-forget
- Each major action gets its own trace event (not batched at the end)
- Keep event messages concise but informative (1-2 sentences max)
- Use `recordInfo()` for intermediate status, `recordPlanStep()` for major phases

**ESTIMATED SIZE:** ~100 LoC

---

### Task 5: Frontend — DocPack UI Controls + Progress Display

**WHAT:** Add UI controls for selecting doc pack level and show granular progress in the agent console.

**WHERE:**
- `frontend/src/pages/dashboard/agents/DashboardAgentScribePage.tsx` — agent console
- `frontend/src/components/agents/` — shared agent UI components

**CHANGES:**
- Add "Documentation Scope" selector in Scribe console settings:
  - Auto-detect (default) — let Scribe analyze and decide
  - README only — single file
  - Standard — README + ARCHITECTURE + API + DEVELOPMENT
  - Full — all 8 document types
- Add "Analysis Depth" selector:
  - Quick — fast, surface-level (lite)
  - Standard — balanced depth (standard)
  - Deep — comprehensive analysis (deep)
- Pass selected `docPack` and `docDepth` in the job payload when running Scribe
- Update activity/chat panel to show per-file progress messages more prominently
- Show file count badge: "Reading: 15/23 files" → "Generating: 2/4 docs"

**RULES:**
- Default selection: "Auto-detect" for scope, "Standard" for depth
- i18n: Add TR/EN keys for all new UI strings
- Must work with existing SSE streaming (no new endpoints needed)
- Settings should be saved per agent-config if user has one

**ESTIMATED SIZE:** ~200 LoC (across 2-3 files)

---

## Implementation Order

```
Task 3 (Fix Quality Score)     ─── Day 1 (quick fix, ~30 min)
    │
Task 1 (Deep Repo Scanning)    ─── Day 1-2 (core improvement)
    │
Task 4 (Granular Progress)     ─── Day 2 (alongside Task 1)
    │
Task 2 (Multi-Doc Generation)  ─── Day 2-3 (builds on Task 1)
    │
Task 5 (Frontend UI Controls)  ─── Day 3 (final polish)
```

## Dependencies

- Task 1 → Task 2 (deep scan feeds multi-doc detection)
- Task 1 → Task 4 (trace events are added during scan refactor)
- Task 3 → independent (can be done first)
- Task 5 → Task 2 (frontend needs backend `docPack` support)

## Verification Criteria

After all tasks complete, running Scribe on `UnISum-Backend` (or similar medium repo) should produce:

- [ ] **4+ documents** generated (README, ARCHITECTURE, API, DEVELOPMENT at minimum)
- [ ] **15+ files read** during context gathering
- [ ] **Quality score 70+** on standard depth
- [ ] **Chat/activity shows 20+ events** with per-file detail
- [ ] **Duration 60-120s** (proportional to repo size, not artificially fast)
- [ ] Each document contains **accurate, grounded content** from actual source files
- [ ] **No hallucinated** features, commands, or configurations
- [ ] PR created with **meaningful diff** (not just a skeleton README)

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Token overflow with deep scan | AI call fails | Cap context at `DOC_DEPTH_LIMITS`, truncate intelligently |
| Slow execution on large repos | Bad UX | Progressive timeout, show progress, allow cancellation |
| GitHub API rate limiting | MCP calls fail | Batch reads, cache directory listings |
| Scope creep beyond S0.5 | Misses deadline | Strict 3-day implementation window, no new features |

---

## Notes

- This enhancement is classified as **Agent Reliability** (Phase C) — not a new feature
- The existing contract/playbook/quality infrastructure is solid; the problem is shallow input analysis
- Scribe already supports `docPack: 'standard'` and `docPack: 'full'` — the code paths exist but aren't triggered
- The `DocContract.ts` already has contracts for all 8 document types — just need to use them
- `resolveDocPackConfig()` correctly resolves multi-pass when `docPack: 'full'` — untested in production

---

*Created as part of S0.5 Phase C Agent Reliability improvements.*
