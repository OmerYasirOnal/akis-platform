# Docs NEXT — Current TODO & Execution Order

> **Schedule Anchor:** `docs/PROJECT_TRACKING_BASELINE.md` (derived from spreadsheet)
> **Audit Report:** `docs/DOCS_AUDIT_REPORT.md`
> **Last Updated:** 2026-01-28 (Gate 3 Reconciliation)

### Planning Chain

```
docs/PROJECT_TRACKING_BASELINE.md  →  docs/ROADMAP.md  →  docs/NEXT.md (this file)
```

### Gate 3 Reconciliation Status

**Source Documents:**
- `docs/ops/REPO_REALITY_BASELINE.md` (inventory + conflicts)
- `docs/ops/PM_NAMING_SYSTEM.md` (naming + statuses)
- `docs/ops/DOC_HYGIENE_AUDIT.md` (dead links + deprecated refs)

---

## ⚠️ Status Conflicts (Evidence-Driven Reconciliation)

> **IMPORTANT:** The following conflicts exist between canonical planning documents.
> Gate 3 analysis shows these require QA evidence verification before resolution.
> **Status terms updated to PM_NAMING_SYSTEM vocabulary.**

### CONFLICT #1: S0.4.6 (Scribe Config Dashboard) — Completion Status

**Human-Readable Name:** Scribe Config Dashboard (from PM_NAMING_SYSTEM)

| Source | Status Claimed | Line Reference |
|--------|----------------|----------------|
| `PROJECT_TRACKING_BASELINE.md` | Steps 3-5: **Not Started** | Line 15 |
| `ROADMAP.md` | Steps 3-5: **Not Started** | Lines 62-63 |
| `NEXT.md` (this file) | Steps 3-5: **Done** | Lines 173-178 |

**Evidence Required for Resolution:**
1. Check `docs/qa/QA_EVIDENCE_S0.4.6.md` for Steps 3-5 completion proof
2. Verify backend endpoint integration for Steps 3-5
3. Check git commit history for Step 3-5 implementation
4. Run manual QA test for Steps 3-5 functionality

**Current Gate 3 Status:** CONFLICT remains open. No evidence found to auto-resolve.
**Strict Status Vocabulary Applied:** "PENDING" → "Not Started", "COMPLETE" → "Done"

### CONFLICT #2: Current Phase/Sprint Disagreement

**Human-Readable Names:**
- Phase 0.4 = "Web Shell and Basic Engine" (PM_NAMING_SYSTEM)
- Phase 2 = "Production Hosting" (PM_NAMING_SYSTEM)
- S2.0.1 = "Cursor-Inspired UI" (PM_NAMING_SYSTEM)

| Source | Current Phase | Status | Line Reference |
|--------|---------------|--------|----------------|
| `PROJECT_TRACKING_BASELINE.md` | Phase 0.4 (S0.4.6) | In Progress | Lines 14-16 |
| `ROADMAP.md` | Phase 0.4 (S0.4.6) | In Progress | Line 23 |
| `NEXT.md` (this file) | Phase 2 (S2.0.1) | In Progress | Lines 60, 106-110 |

**Evidence Required for Resolution:**
1. Check most recent merged PRs to determine active work phase
2. Review `docs/qa/QA_EVIDENCE_CURSOR_UI_RELEASE.md` for Phase 2 evidence
3. Check backend sprint tags or deployment markers
4. Review team calendar/standup notes for current sprint

**Current Gate 3 Status:** CONFLICT remains open. NEXT.md shows Phase 2 (S2.0.1 "Cursor-Inspired UI") as current, but BASELINE/ROADMAP show Phase 0.4. Likely indicates BASELINE/ROADMAP are 41+ days stale.
**Strict Status Vocabulary Applied:** All use "In Progress"

### CONFLICT #3: Document Staleness (Last Updated)

| Document | Last Updated | Days Stale (from 2026-01-28) | Status |
|----------|--------------|------------------------------|--------|
| `PROJECT_TRACKING_BASELINE.md` | 2025-12-18 | 41 days | High Risk |
| `ROADMAP.md` | 2025-12-18 | 41 days | High Risk |
| `NEXT.md` | 2026-01-28 | 0 days | Current (Gate 3) |

**Evidence Required for Resolution:**
1. Update BASELINE with current sprint status from team/git history
2. Update ROADMAP phase status from QA evidence + merged PRs
3. Establish weekly sync cadence to prevent future staleness

**Current Gate 3 Status:** CONFLICT acknowledged. BASELINE/ROADMAP require update in Gate 4.

---

## 🔍 Verified vs Claimed Status

> **Gate 3 Analysis:** Distinguishing evidence-backed facts from document claims.

### ✅ Evidence-Backed (Verified)

These claims have QA evidence or git commit proof:

| Item | Status | Evidence Source |
|------|--------|-----------------|
| S0.4.2 (OAuth and Auth Endpoints) | Done | PR #90 merged |
| S0.4.5 (i18n and 404 Fix) | Done | PR #93 merged |
| GitHub MCP Adapter | Functional | `docs/GITHUB_MCP_SETUP.md` + backend code |
| Job FSM Tests | 110/110 passing | Git commit history + CI logs |
| S2.0.1 (Cursor-Inspired UI) | In Progress | `docs/qa/QA_EVIDENCE_CURSOR_UI_RELEASE.md` |
| SDTA Document | Done | `docs/academic/03-sdta/SDTA_D2_solution_design_technical_analysis.md` |

### ❓ Claimed Only (No Evidence Found)

These claims appear in docs but lack verifiable evidence in Gate 3:

| Item | Status Claimed | Claimed By | Evidence Gap |
|------|----------------|------------|--------------|
| S0.4.6 Steps 3-5 | Done (NEXT.md) | NEXT.md lines 173-178 | No QA evidence file, no git commit proof |
| Phase 1 Complete | Done (NEXT.md) | NEXT.md line 145 | Conflicts with BASELINE showing Phase 0.4 current |
| Trace Agent MVP | Done (NEXT.md) | NEXT.md line 296 | No QA evidence, "scaffold" per BASELINE |
| Proto Agent MVP | Done (NEXT.md) | NEXT.md line 297 | No QA evidence, "scaffold" per BASELINE |
| Atlassian MCP Adapter | Production-ready (NEXT.md) | NEXT.md line 299 | "Scaffold" per BASELINE |

### 🚨 High-Risk Claims

Items marked "Done" in NEXT.md but contradicted by BASELINE (41 days stale):

1. **S0.4.6 completion** — NEXT claims Done, BASELINE claims Not Started
2. **Current phase** — NEXT claims Phase 2, BASELINE claims Phase 0.4
3. **Trace/Proto MVPs** — NEXT claims functional, BASELINE claims scaffold

**Gate 3 Recommendation:** These high-risk items MUST be verified with QA evidence before updating BASELINE/ROADMAP in Gate 4.

---

## Current TODO List (Reconciled)

> Assuming NEXT.md (2026-01-10) reflects actual progress and Phase 1 is complete.

### P0 — Critical Path (Blockers)

| ID | Task | Status | Sprint | Notes |
|----|------|--------|--------|-------|
| P0-1 | **CONFLICT** Sync S0.4.6 status across all planning docs | 🔴 CONFLICT | — | See Conflict #1 above |
| P0-2 | **CONFLICT** Sync current phase/sprint across all planning docs | 🔴 CONFLICT | — | See Conflict #2 above |
| P0-3 | Cursor-Inspired UI + Liquid Neon Layer | 🔄 In Progress | S2.0.1 | Per NEXT.md 2026-01-10 |
| P0-4 | Scribe Console Enhancement (model selection, job lifecycle) | 📋 Next | S2.0.2 | Per NEXT.md S2.0.2 plan |

### P1 — High Priority (This Sprint)

| ID | Task | Status | Sprint | Notes |
|----|------|--------|--------|-------|
| P1-1 | Jira Integration (MCP-based connect flow) | 📋 Planned | S2.0.2 | Backend dependency |
| P1-2 | Confluence Integration (MCP-based connect flow) | 📋 Planned | S2.0.2 | Backend dependency |
| P1-3 | Settings: Workspace (team/workspace management) | 📋 Planned | S2.0.2 | |
| P1-4 | Settings: Billing (usage metrics, invoices) | 📋 Planned | S2.0.2 | |
| P1-5 | Update `PROJECT_TRACKING_BASELINE.md` to current state | 📋 Planned | — | Stale 41 days |
| P1-6 | Update `ROADMAP.md` to current state | 📋 Planned | — | Stale 41 days |

### P2 — Medium Priority (Backlog)

| ID | Task | Status | Sprint | Notes |
|----|------|--------|--------|-------|
| P2-1 | Create `docs/ENV_SETUP.md` | 📋 Planned | — | Doc gap |
| P2-2 | Create `docs/TESTING.md` | 📋 Planned | — | Doc gap |
| P2-3 | Create `docs/PERFORMANCE.md` | 📋 Planned | — | Doc gap |
| P2-4 | Create `docs/API_USAGE.md` | 📋 Planned | — | Doc gap |

### P3 — Low Priority (Future)

| ID | Task | Status | Sprint | Notes |
|----|------|--------|--------|-------|
| P3-1 | Expand `SECURITY.md` | 📋 Planned | — | Doc gap |
| P3-2 | Phase 10 UX items (GitHub Epic #44) | 📋 Planned | — | Parallel track |

---

## Current Focus (2026-01-28)

| Priority | Task | Status | Sprint |
|----------|------|--------|--------|
| **P0** | 🔴 Resolve planning doc conflicts | CONFLICT | — |
| **P0** | Cursor-Inspired UI + Liquid Neon Layer | 🔄 In Progress | S2.0.1 |
| **P0** | Scribe Console (functional) | 📋 Next | S2.0.2 |
| P1 | Jira/Confluence Integration | 📋 Planned | S2.0.2 |
| P1 | Settings: Workspace & Billing | 📋 Planned | S2.0.2 |

**Next Milestone:** Cursor-Inspired UI Release — **Target: 2026-01-15** (PAST DUE)

---

## 🚀 Cursor-Inspired UI Milestone (S2.0.1)

**Branch:** `feat/ui-cursor-inspired-liquid-neon`  
**Dates:** Jan 10–15, 2026 (Target PAST DUE as of 2026-01-28)

### Shipped (S2.0.1)

| Component | Description | Status |
|-----------|-------------|--------|
| **DashboardLayout** | Cursor-like sidebar navigation with grouped sections | ✅ |
| **LiquidNeonBackground** | AKIS-branded animated gradient blobs | ✅ |
| **Motion Tokens** | Duration, easing, glow, blur tokens in theme | ✅ |
| **Public Pages** | Pricing, Blog, Docs, Learn landing pages | ✅ |
| **IntegrationsHub** | GitHub status + Jira/Confluence placeholders | ✅ |
| **AI Keys Page** | Functional key management (save/delete/activate) | ✅ |
| **API Spec Update** | Multi-provider AI keys documentation | ✅ |
| **QA Documentation** | Rollout notes + evidence checklist | ✅ |

### Remaining (S2.0.1 → S2.0.2)

| Component | Description | Status |
|-----------|-------------|--------|
| Scribe Console Enhancement | Model selection, job lifecycle, result preview | 📋 |
| Jira Integration | MCP-based connect flow (if backend ready) | 📋 |
| Confluence Integration | MCP-based connect flow (if backend ready) | 📋 |
| Settings: Workspace | Team/workspace management UI | 📋 |
| Settings: Billing | Usage metrics and invoices | 📋 |

### Design References

- Master Plan: `docs/ux/AKIS_CURSOR_UI_MASTER_PLAN.md`
- Cursor Reference: `docs/ux/CURSOR_REFERENCE_NOTES.md`
- Liquid Neon Spec: `docs/ux/AKIS_LIQUID_NEON_LAYER.md`
- QA Notes: `docs/qa/QA_NOTES_CURSOR_UI_ROLLOUT.md`

---

## Previous Milestones

### ✅ Phase 1 Complete (Dec 2025) — Per NEXT.md

> **⚠️ CONFLICT:** `PROJECT_TRACKING_BASELINE.md` and `ROADMAP.md` still show S0.4.6 as pending.
> See Conflict #1 above.

| Priority | Task | Status | Sprint |
|----------|------|--------|--------|
| **P0** | Semester Scribe demo readiness | ✅ Complete | S1.0.x |
| **P0** | S0.4.6 Scribe Config Dashboard | 🔴 **CONFLICT** | S0.4.6 |
| P1 | Scribe temel akış | ✅ Complete | S1.0.1 |
| P2 | Trace/Proto MVP scaffolds | ✅ Complete | S1.0.2 |
| P3 | Job logging v1 | ✅ Complete | S1.5.1 |

---

## Execution Order (Canonical — Per Baseline)

> **Note:** This section reflects `PROJECT_TRACKING_BASELINE.md` structure.
> Actual progress may differ — see Conflicts section.

### Phase 0.4: Web Shell + Basit Motor

**Sprint Range:** S0.4.1 – S0.4.6  
**Dates:** Nov 28, 2025 – Dec 18, 2025

#### S0.4.6 — Scribe Config Dashboard

| Step | Description | Status (NEXT.md) | Status (BASELINE/ROADMAP) |
|------|-------------|------------------|---------------------------|
| Step 1 | Pre-flight checks (GitHub connection) | ✅ Complete | ✅ Complete |
| Step 2 | SearchableSelect for Owner/Repo/Branch | ✅ Complete | ✅ Complete |
| Step 3 | Target platform configuration | ✅ Complete | ❓ Pending |
| Step 4 | Advanced options | ✅ Complete | ❓ Pending |
| Step 5 | Review and save | ✅ Complete | ❓ Pending |

**Exit Criteria (Per NEXT.md):**
- [x] Step 2 SearchableSelect works (SCRIBE_STEP2_VERIFICATION.md)
- [x] All 5 steps functional
- [x] TypeScript/Lint/Tests pass
- [x] Job creation endpoint connected
- [x] QA evidence: `docs/qa/QA_EVIDENCE_S0.4.6.md`

---

### Phase 0.5: Motor + GitHub Entegrasyonu

**Dates:** Dec 5–12, 2025

**Objective:** Deep GitHub integration for Scribe agent operations.

**Tasks (Per BASELINE — Status Unknown):**
- [ ] GitHub webhook handlers
- [ ] PR creation flow
- [ ] File content retrieval
- [ ] Branch operations

---

### Phase 1: Scribe • Trace • Proto – Early Access

**Dates:** Dec 13–25, 2025  
**Milestone:** Phase 1 Functional Complete (Dec 25)

#### S1.0.1 (Dec 13–19)

| Task | Workstream | Description | Status |
|------|------------|-------------|--------|
| S1.0.1-DOC-1 | Docs | Scribe AgentContract & Playbook | ✅ (per NEXT.md) |
| S1.0.1-BE-1 | Backend | Orchestrator routing for Scribe | ✅ (per NEXT.md) |
| S1.0.1-FE-1 | Frontend | Output viewer component | ✅ (per NEXT.md) |
| S1.0.1-BE-2 | Backend | Reflection step implementation | ✅ (per NEXT.md) |

#### S1.0.2 (Dec 20–25)

| Task | Workstream | Description | Status |
|------|------------|-------------|--------|
| S1.0.2-FE-1 | Frontend | Trace/Proto MVP scaffolds | ✅ (per NEXT.md) |
| S1.0.2-FE-2 | Frontend | Job detail UI | ✅ (per NEXT.md) |
| S1.0.2-QA-1 | QA | Phase 1 kapanış (Sadi Önal sign-off) | ✅ (per NEXT.md) |

**Exit Criteria:**
- ✅ Scribe job starts from UI
- ✅ Orchestrator routes to correct agent
- ✅ Output viewer displays results
- ✅ Reflection step works
- ✅ QA smoke kanıtı (Sadi Önal)

---

### Phase 1.5: Logging • Token Trace • Time-Saved v1

**Dates:** Dec 26, 2025 – Jan 9, 2026

#### S1.5.0 (Dec 26 only)

| Task | Workstream | Description | Owner |
|------|------------|-------------|-------|
| S1.5.0-DOC-1 | Docs | SDTA dokümanı final + teslim | **Ayşe** |

#### S1.5.1 (Dec 27 – Jan 2)

| Task | Workstream | Description |
|------|------------|-------------|
| S1.5.1-BE-1 | Backend | job_logs table + API |
| S1.5.1-FE-1 | Frontend | Log viewer component |
| S1.5.1-API-1 | API | GET /api/jobs/:id/logs endpoint |

#### S1.5.2 (Jan 3–9)

| Task | Workstream | Description |
|------|------------|-------------|
| S1.5.2-BE-1 | Backend | Token/cost tracking model |
| S1.5.2-FE-1 | Frontend | Time-saved v1 metrikleri UI |

**Exit Criteria:**
- ✅ Log viewer in dashboard
- ✅ job_logs table populated
- ✅ Token/cost per job tracked
- ✅ Time-saved metrics displayed

---

### Phase 2+: Future Phases (Gated)

| Phase | Dates | Focus |
|-------|-------|-------|
| 2 | Jan 10–23, 2026 | OCI Hosting + Gerçek Pilotlar |
| 2.5 | Jan 24 – Feb 21, 2026 | Early Users + Marketplace Taslağı |
| 3 | Feb 22 – Mar 31, 2026 | Marka + İçerik + Final Teslim |

---

### Future Bets (Gated)

These are future proposals only and are not active priorities.

- Snapshot reference: `.cursor/context/AKIS_STATUS_ROADMAP.md`
- Roadmap reference: `docs/ROADMAP.md` (Phase 4+ section)
- Future proposals mirror: `docs/plans/FUTURE_PROPOSALS_PHASE4_5.md`
- Concept memo: `docs/plans/PHASE4_5_FUTURE_BETS_CONCEPT.md`

---

## V2 RepoOps Gating Criteria

V2 RepoOps agent development is **BLOCKED** until ALL criteria are green:

| Criterion | Current Status (per NEXT.md) | Status (per BASELINE) | Required | Gate |
|-----------|------------------------------|----------------------|----------|------|
| Phase 1 complete | ✅ Complete (Dec 2025) | 🔄 S0.4.6 + S1.0.x | ✅ Dec 25 milestone | Hard |
| Scribe agent stable | ✅ Complete | 🔄 S0.4.6 | ✅ Production-ready | Hard |
| Trace agent stable | ✅ MVP (per NEXT.md) | ⚠️ Scaffold | ✅ MVP functional | Hard |
| Proto agent stable | ✅ MVP (per NEXT.md) | ⚠️ Scaffold | ✅ MVP functional | Hard |
| GitHub MCP adapter | ✅ Functional | ✅ Functional | ✅ Production-ready | Hard |
| Atlassian MCP adapter | ⚠️ Scaffold | ⚠️ Scaffold | ✅ Production-ready | Soft |
| Job FSM reliable | ✅ 110/110 tests | ✅ 110/110 tests | ✅ No regressions | Hard |
| QA sign-off | ✅ (per NEXT.md) | 📋 S1.0.2 | ✅ Sadi Önal approval | Hard |

> **⚠️ CONFLICT:** NEXT.md shows V2 gates as mostly met, but BASELINE shows them pending.

**V2 Start Date:** After Phase 1 complete (earliest Dec 26, 2025) — **NOW PAST** if NEXT.md is accurate

---

## Known PR References

| PR | Sprint | Description | Status |
|----|--------|-------------|--------|
| **#90** | S0.4.2 + S0.4.4 | Email-based multi-step authentication | ✅ Merged |
| **#93** | S0.4.5 | OAuth + onboarding fix, i18n loading gate | ✅ Merged |
| — | S0.4.6 | Scribe Config Dashboard | ✅ Complete |

---

## Recent Updates

### ⚠️ [2026-01-28] Reconciliation Audit

**Status:** CONFLICTS IDENTIFIED  
**Action Required:** Team must resolve status conflicts between planning documents.

**Findings:**
1. **S0.4.6 Status Conflict:** NEXT.md shows complete, BASELINE/ROADMAP show pending
2. **Phase Conflict:** NEXT.md at Phase 2, BASELINE/ROADMAP at Phase 0.4
3. **Stale Documents:** BASELINE and ROADMAP not updated since 2025-12-18 (41 days)

**Recommended Actions:**
1. Verify actual S0.4.6 completion status (check code, QA evidence)
2. Update `PROJECT_TRACKING_BASELINE.md` with current state
3. Update `ROADMAP.md` with current state
4. Establish regular sync cadence (weekly recommended)

---

### ✅ [2025-12-18] Spreadsheet Ingestion & Baseline Sync

**Status:** DONE  
**Source:** `AKIS_Proje_Takibi_Profesyonel_SON_guncel_v2.xlsx`

**Actions:**
- Ingested all phases, sprints, milestones from spreadsheet
- Updated `docs/PROJECT_TRACKING_BASELINE.md` with real data
- Synced `docs/ROADMAP.md` with baseline
- Updated `docs/NEXT.md` (this file) with spreadsheet-driven plan
- Updated `docs/DOCS_AUDIT_REPORT.md` with spreadsheet status

---

### ✅ [2025-12-18] Documentation Audit & Baseline

**Status:** DONE

**Files Created/Updated:**
- `docs/PROJECT_TRACKING_BASELINE.md` — Sprint/phase/milestone from spreadsheet
- `docs/DOCS_AUDIT_REPORT.md` — Full documentation audit
- `docs/ROADMAP.md` — Aligned with baseline
- `docs/NEXT.md` — Added gating criteria
- `.cursor/context/CONTEXT_SCOPE.md` — Added planning references

---

### ✅ [2025-12-18] Scribe Step 2 Verification Locked

**Status:** DONE  
**Branch:** `feat/scribe-config-s0.4.6-wip`  
**File:** `SCRIBE_STEP2_VERIFICATION.md`

**Key Finding:** Implementation is complete and correct. Reported issues were cache/restart/route confusion, not code bugs.

---

### ✅ [S0.4.2-DOC-2] Auth Documentation Sync (2025-12-06)

**Status:** DONE (PR #90)

**Files Updated:**
- `.cursor/context/CONTEXT_SCOPE.md` → Authentication section
- `.cursor/context/CONTEXT_ARCHITECTURE.md` → Auth Architecture
- `docs/WEB_INFORMATION_ARCHITECTURE.md` → Fixed auth paths
- `backend/docs/API_SPEC.md` → Fixed endpoint paths
- `backend/docs/Auth.md` → Developer Guide

---

## Documentation Gap Status

### Scorecard (2025-12-18)

| Area | Status | Notes |
|------|--------|-------|
| Planning Docs | 🟢 | Baseline + Roadmap aligned with spreadsheet |
| Architecture Docs | 🟢 | CONTEXT_SCOPE + CONTEXT_ARCHITECTURE canonical |
| UI/UX Docs | 🟢 | UI_DESIGN_SYSTEM.md comprehensive |
| Auth Docs | 🟢 | backend/docs/Auth.md canonical |
| Environment Setup | 🔴 | No ENV_SETUP.md |
| Testing Docs | 🔴 | No TESTING.md |
| Performance Docs | 🔴 | No PERFORMANCE.md |
| CI/CD Docs | 🟡 | Basic coverage |
| API Docs | 🟡 | API_SPEC.md exists, needs usage guide |

### Priority Documentation Tasks

| Priority | Task | Blocker? |
|----------|------|----------|
| P1 | Create `docs/ENV_SETUP.md` | Non-blocking |
| P1 | Create `docs/TESTING.md` | Non-blocking |
| P2 | Create `docs/PERFORMANCE.md` | Non-blocking |
| P2 | Create `docs/API_USAGE.md` | Non-blocking |
| P3 | Expand `SECURITY.md` | Non-blocking |

---

## Team Assignments (from Spreadsheet — NEEDS UPDATE)

> **Note:** This section is based on BASELINE (2025-12-18) and may be outdated.

| Kişi | Rol | Focus (per BASELINE) | Focus (per NEXT.md) |
|------|-----|---------------------|---------------------|
| **Yasir** | Product Owner / Tech Lead | S0.4.6 Scribe Config | Cursor-Inspired UI (S2.0.1) |
| **Ayşe** | Research & Documentation Lead | SDTA prep (due Dec 26) | Unknown (SDTA may be complete) |
| **Sadi Önal** | QA & Test Lead | Phase 1 QA (S1.0.2) | Unknown (Phase 1 QA may be complete) |

---

## Reference Documents

| Document | Purpose |
|----------|---------|
| `docs/PROJECT_TRACKING_BASELINE.md` | Schedule anchor (spreadsheet source) |
| `docs/ROADMAP.md` | Phase overview |
| `docs/DOCS_AUDIT_REPORT.md` | Audit & cleanup plan |
| `.cursor/context/CONTEXT_SCOPE.md` | Scope & requirements |
| `.cursor/context/CONTEXT_ARCHITECTURE.md` | Technical architecture |
| `SCRIBE_STEP2_VERIFICATION.md` | Scribe Step 2 verification |

---

## Quick Reference: Canonical Planning Chain

```
docs/PROJECT_TRACKING_BASELINE.md  (schedule anchor — STALE: 2025-12-18)
          ↓
docs/ROADMAP.md                    (phase overview — STALE: 2025-12-18)
          ↓
docs/NEXT.md                       (this file — UPDATED: 2026-01-28)
```

---

*This document tracks immediate next actions and gating criteria. Schedule derived from `AKIS_Proje_Takibi_Profesyonel_SON_guncel_v2.xlsx`. **⚠️ WARNING:** Conflicts exist between planning documents — see "Status Conflicts" section above.*
