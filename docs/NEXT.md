# Docs NEXT — Execution Order, Gating Criteria & Gap Audit

> **Schedule Anchor:** `docs/PROJECT_TRACKING_BASELINE.md` (derived from spreadsheet)  
> **Audit Report:** `docs/DOCS_AUDIT_REPORT.md`  
> **Last Updated:** 2025-12-18

---

## Current Focus (2025-12-18)

| Priority | Task | Status | Sprint |
|----------|------|--------|--------|
| **P0** | S0.4.6 Scribe Config Dashboard | 🔄 In Progress | S0.4.6 |
| P1 | Scribe temel akış | 📋 Next | S1.0.1 |
| P2 | Trace/Proto MVP | 📋 Planned | S1.0.2 |
| P3 | Job loglama v1 | 📋 Planned | S1.5.1 |

**Next Milestone:** Phase 1 Functional Complete — **2025-12-25**

---

## Execution Order (Spreadsheet-Aligned)

### Phase 0.4: Web Shell + Basit Motor — CURRENT

**Sprint Range:** S0.4.1 – S0.4.6  
**Dates:** Nov 28, 2025 – Dec 18, 2025

#### S0.4.6 — Scribe Config Dashboard (CURRENT)

| Step | Description | Status |
|------|-------------|--------|
| Step 1 | Pre-flight checks (GitHub connection) | ✅ Complete |
| Step 2 | SearchableSelect for Owner/Repo/Branch | ✅ Complete (verified) |
| Step 3 | Target platform configuration | 🔄 In Progress |
| Step 4 | Advanced options | 📋 Pending |
| Step 5 | Review and save | 📋 Pending |

**Exit Criteria:**
- [x] Step 2 SearchableSelect works (SCRIBE_STEP2_VERIFICATION.md)
- [ ] All 5 steps functional
- [ ] TypeScript/Lint/Tests pass
- [ ] Job creation endpoint connected

---

### Phase 0.5: Motor + GitHub Entegrasyonu — NEXT

**Dates:** Dec 5–12, 2025

**Objective:** Deep GitHub integration for Scribe agent operations.

**Tasks:**
- [ ] GitHub webhook handlers
- [ ] PR creation flow
- [ ] File content retrieval
- [ ] Branch operations

---

### Phase 1: Scribe • Trace • Proto – Early Access

**Dates:** Dec 13–25, 2025  
**Milestone:** Phase 1 Functional Complete (Dec 25)

#### S1.0.1 (Dec 13–19)

| Task | Workstream | Description |
|------|------------|-------------|
| S1.0.1-DOC-1 | Docs | Scribe AgentContract & Playbook |
| S1.0.1-BE-1 | Backend | Orchestrator routing for Scribe |
| S1.0.1-FE-1 | Frontend | Output viewer component |
| S1.0.1-BE-2 | Backend | Reflection step implementation |

#### S1.0.2 (Dec 20–25)

| Task | Workstream | Description |
|------|------------|-------------|
| S1.0.2-FE-1 | Frontend | Trace/Proto MVP scaffolds |
| S1.0.2-FE-2 | Frontend | Job detail UI |
| S1.0.2-QA-1 | QA | Phase 1 kapanış (Sadi Önal sign-off) |

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

## V2 RepoOps Gating Criteria

V2 RepoOps agent development is **BLOCKED** until ALL criteria are green:

| Criterion | Current Status | Required | Gate |
|-----------|----------------|----------|------|
| Phase 1 complete | 🔄 S0.4.6 + S1.0.x | ✅ Dec 25 milestone | Hard |
| Scribe agent stable | 🔄 S0.4.6 | ✅ Production-ready | Hard |
| Trace agent stable | ⚠️ Scaffold | ✅ MVP functional | Hard |
| Proto agent stable | ⚠️ Scaffold | ✅ MVP functional | Hard |
| GitHub MCP adapter | ✅ Functional | ✅ Production-ready | Hard |
| Atlassian MCP adapter | ⚠️ Scaffold | ✅ Production-ready | Soft |
| Job FSM reliable | ✅ 110/110 tests | ✅ No regressions | Hard |
| QA sign-off | 📋 S1.0.2 | ✅ Sadi Önal approval | Hard |

**V2 Start Date:** After Phase 1 complete (earliest Dec 26, 2025)

---

## Known PR References

| PR | Sprint | Description | Status |
|----|--------|-------------|--------|
| **#90** | S0.4.2 + S0.4.4 | Email-based multi-step authentication | ✅ Merged |
| **#93** | S0.4.5 | OAuth + onboarding fix, i18n loading gate | ✅ Merged |
| — | S0.4.6 | Scribe Config Dashboard | 🔄 In Progress |

---

## Recent Updates

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

## Team Assignments (from Spreadsheet)

| Kişi | Rol | Current Focus |
|------|-----|---------------|
| **Yasir** | Product Owner / Tech Lead | S0.4.6 Scribe Config, development |
| **Ayşe** | Research & Documentation Lead | SDTA prep (due Dec 26) |
| **Sadi Önal** | QA & Test Lead | Phase 1 QA (S1.0.2) |

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

*This document tracks immediate next actions and gating criteria. Schedule derived from `AKIS_Proje_Takibi_Profesyonel_SON_guncel_v2.xlsx`.*
