# QA Report — 2026-01-31

Branch: `feat/scribe-docpack-generator`

## 1. Repo Hygiene

| Check | Result | Evidence |
|-------|--------|----------|
| Git status clean | PASS | Only `backend/pnpm-workspace.yaml` untracked (not ours) |
| Backend typecheck | PASS | `pnpm -C backend typecheck` — 0 errors |
| Frontend typecheck | PASS | `pnpm -C frontend typecheck` — 0 errors |
| Backend build | PASS | `pnpm -C backend build` — clean |
| Frontend build | PASS | `pnpm -C frontend build` — 499.94 kB bundle |
| Backend unit tests | PASS | 201/201 pass, 0 fail (8 new tests added) |
| Frontend tests | PASS | 51/51 pass across 9 test files |

## 2. Feature Verification

### B) Sidebar Overlay — PASS

**File:** `frontend/src/components/layout/DashboardLayout.tsx`

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Backdrop blur + dim | PASS | `bg-black/60 backdrop-blur-sm` CSS applied |
| Body scroll lock | PASS | `document.body.style.overflow = 'hidden'` when open, cleanup on unmount |
| Click outside closes | PASS | `onClick={closeMobileMenu}` on overlay div |
| Z-index ordering | PASS | overlay z-40, sidebar z-50, header z-20 |
| Smooth transition | PASS | `transition-opacity duration-200` + `pointer-events-none` when closed |
| Desktop unaffected | PASS | Overlay has `lg:hidden` class |

### C) Job Detail Redesign — PASS

**File:** `frontend/src/pages/JobDetailPage.tsx`

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Reduced to 3-4 sections | PASS | Overview, Activity, Outputs, Quality (Scribe-only) |
| Advanced toggle | PASS | Plan/Feedback/Audit/Raw behind collapsible `<button>` |
| No hardcoded metrics | PASS | grep for placeholder/fake/dummy/mock returns 0 hits (only `/100` label) |
| Quality score from real data | PASS | `computeScribeQuality()` reads from `job.payload`, `traces`, `artifacts`, `job.ai` |
| Scribe-only Quality tab | PASS | `{isScribe && <SectionTab id="quality" ...>}` |
| Duration from real timestamps | PASS | `formatDuration(job.createdAt, job.updatedAt)` |
| Repository from payload | PASS | `typeof payload.owner === 'string'` guard |

**Quality Score Breakdown (transparent):**
- Target coverage: `targetsProduced / targetsConfigured * 30` (from real artifacts)
- Files analyzed: `documentsRead.length * 2` (from real `doc_read` artifacts)
- Docs generated: `filesProduced.length * 5` (from real `file_created` artifacts)
- Analysis depth: from `job.payload.docDepth` (real config)
- Multi-pass: from `docPack === 'full' || docDepth === 'deep'` (real config)

**Note:** Multi-pass flag reflects *configured* behavior, not trace evidence of a second pass. Acceptable for MVP — config triggers multi-pass in backend (`resolveDocPackConfig` verified).

### D) Persistent RunBar — PASS (after fix)

**File:** `frontend/src/components/layout/RunBar.tsx`

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Appears on job start | PASS | CustomEvent `akis-job-started` dispatched from Scribe page |
| Persists across refresh | PASS | localStorage `akis-runbar-jobs` + `loadStoredJobs()` on init |
| API reconciliation | PASS | Polls `agentsApi.getRunningJobs()` every 8s |
| Running → completed transition | PASS (fixed) | Detects missing jobs from API and marks as completed locally |
| Status badge | PASS | Spinner for running, green/red badge for completed/failed |
| Multiple jobs | PASS | Expandable drawer, max 5 |
| Sidebar-aware positioning | PASS (fixed) | `lg:left-56` only on `/dashboard` routes |
| Mounted in both layouts | PASS | DashboardLayout + AgentsLayout |
| Bottom padding for content | PASS | `pb-16` on main content areas |

**Bugs found and fixed:**
1. Job transition gap: running jobs disappearing from API were lost from bar. Fixed by detecting and marking as completed.
2. Left offset on AgentsLayout (no sidebar): Fixed by checking `location.pathname`.

### E) Scribe Depth Control — PASS

| Requirement | Status | Evidence |
|-------------|--------|----------|
| UI depth selector (lite/standard/deep) | PASS | Already in DashboardAgentScribePage.tsx |
| UI pack selector (readme/standard/full) | PASS | Already implemented |
| Backend schema validation | PASS | `docDepth: z.enum(['lite', 'standard', 'deep'])` |
| analyzeLastNCommits schema | PASS | `z.number().int().min(1).max(100).optional()` |
| analyzeLastNCommits in task context | PASS | Added to `ScribeTaskContext` interface |
| Multi-pass for deep/full | PASS | `resolveDocPackConfig`: `passes = 2` when `docPack === 'full' || docDepth === 'deep'` |
| Token budget display | PASS | lite ~4K, standard ~16K, deep ~64K shown in UI |
| Schema tests | PASS | 8 new tests: valid/invalid/boundary cases all pass |

### F) Production Deploy — PASS

| Requirement | Status | Evidence |
|-------------|--------|----------|
| docker-compose.yml valid | PASS | Caddy + Backend + PostgreSQL + MCP (optional) with health checks |
| Caddyfile routes | PASS | `/api/*` → backend, `/auth/*` → backend, SPA fallback |
| TLS ready | PASS | Caddy auto-obtains Let's Encrypt cert via `$DOMAIN` env var |
| RUNBOOK smoke tests | PASS | Bash script testing health, ready, frontend, API, plans |
| OCI deployment checklist | PASS | Docker install, env, firewall, DNS, deploy, verify, Stripe |
| Database backup | PASS | `pg_dump` command documented |
| Rollback procedure | PASS | `BACKEND_VERSION=previous-tag` documented |

## 3. Test Summary

| Suite | Tests | Pass | Fail |
|-------|-------|------|------|
| Backend unit | 201 | 201 | 0 |
| Frontend Vitest | 51 | 51 | 0 |
| **Total** | **252** | **252** | **0** |

## 4. Commits on Branch

| Hash | Message |
|------|---------|
| `3081098` | fix(layout): add backdrop blur and scroll lock to mobile sidebar overlay |
| `09de092` | refactor(jobs): redesign job detail with fewer tabs and truthful metrics |
| `f7710db` | feat(ux): add persistent RunBar for job progress across pages |
| `093801c` | feat(scribe): add analyzeLastNCommits validation to job schema |
| `c04e8af` | docs(deploy): expand RUNBOOK with smoke tests and OCI checklist |
| `af8b28f` | fix(runbar): handle job state transitions and sidebar-aware positioning |
| `0ac4ca7` | feat(scribe): add analyzeLastNCommits to task context with tests |

## 5. Checklist

- [x] Backend typecheck + build + 201 tests pass
- [x] Frontend typecheck + build + 51 tests pass
- [x] Sidebar overlay: blur, dim, scroll lock, click-to-close
- [x] Job detail: 3-4 sections, no fake metrics, Scribe quality score
- [x] RunBar: persistent, reconciles, handles state transitions
- [x] Scribe depth: lite/standard/deep + packs + analyzeLastNCommits validated
- [x] Deploy: docker-compose, Caddyfile, RUNBOOK with smoke tests
- [x] PR opened
