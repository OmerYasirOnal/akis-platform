# AKIS Platform — Roadmap & Milestones

> **Schedule Anchor:** `docs/PROJECT_TRACKING_BASELINE.md` (canonical markdown; spreadsheet is a local planning artifact)
> **Last Updated:** 2026-01-28 (Gate 3 Reconciliation)

### Planning Chain

```
docs/PROJECT_TRACKING_BASELINE.md  (schedule anchor, canonical markdown)
          ↓
docs/ROADMAP.md                    (this file: phase overview)
          ↓
docs/NEXT.md                       (immediate actions + gating)
```

### Gate 3 Reconciliation Status

**Source Documents:**
- `docs/ops/REPO_REALITY_BASELINE.md` (inventory + conflicts)
- `docs/ops/PM_NAMING_SYSTEM.md` (naming + statuses)
- `docs/ops/DOC_HYGIENE_AUDIT.md` (dead links)

**Applied Changes:**
- Status vocabulary updated to PM_NAMING_SYSTEM (Not Started / In Progress / Blocked / Done / Deprecated)
- Human-readable names added from PM_NAMING_SYSTEM
- Broken link to `docs/PHASE10_PLAN.md` removed (file deprecated)
- Conflicts flagged for Gate 4 resolution

---

## Current Status (2026-01-28 Gate 3)

> **⚠️ CONFLICT:** This section reflects stale data (41 days old). See CONFLICT section below.

| Phase | Status | Key Deliverable | Human-Readable Name |
|-------|--------|-----------------|---------------------|
| 0.1–0.3 | Done | Foundation, Architecture, Core Engine | Foundation Setup |
| **0.4** | **In Progress** (CONFLICT) | Web Shell + Basic Motor (S0.4.6) | Web Shell and Basic Engine |
| 0.5 | Not Started | GitHub Integration | GitHub Integration |
| 1 | Not Started (CONFLICT) | Scribe • Trace • Proto | Agent Early Access |

**Next Milestone:** Phase 1 Functional Complete — **2025-12-25** (PAST DUE)

**Status Vocabulary Updated:** PM_NAMING_SYSTEM applied (Complete → Done, Planned → Not Started)

---

## ⚠️ Status Conflicts (Gate 3 Analysis)

> **IMPORTANT:** These conflicts were identified during Gate 3 reconciliation with ops docs.
> Resolution requires QA evidence verification in Gate 4.

### CONFLICT #1: S0.4.6 Completion Status

| Source | Status Claimed | Line Reference |
|--------|----------------|----------------|
| ROADMAP.md (this file) | Steps 3-5: Not Started | Lines 85-86 |
| NEXT.md | Steps 3-5: Done | Lines 173-178 |
| PROJECT_TRACKING_BASELINE.md | Steps 3-5: Not Started | Line 15 |

**Evidence Required:** Check `docs/qa/QA_EVIDENCE_S0.4.6.md` for Steps 3-5 completion proof.

### CONFLICT #2: Current Phase Disagreement

| Source | Current Phase | Line Reference |
|--------|---------------|----------------|
| ROADMAP.md (this file) | Phase 0.4 (Web Shell) | Line 46 |
| NEXT.md | Phase 2 (Cursor-Inspired UI, S2.0.1) | Lines 106-110 |
| PROJECT_TRACKING_BASELINE.md | Phase 0.4 | Lines 14-16 |

**Evidence Required:** Verify actual current phase from recent PRs and QA evidence.

**Gate 3 Status:** Conflicts left open. No auto-resolution without evidence. Gate 4 must handle.

---

## Phase Overview

| Phase | Name (Original) | Human-Readable Name (PM_NAMING_SYSTEM) | Tarih Aralığı | Status |
|-------|-----------------|----------------------------------------|---------------|--------|
| 0.1 | Temeller (Repo & Altyapı) | Foundation Setup | Nov 1–7, 2025 | Done |
| 0.2 | Mimari & Kapsam | Architecture Definition | Nov 8–17, 2025 | Done |
| 0.3 | Çekirdek Motor İskeleti | Core Engine Scaffold | Nov 18–27, 2025 | Done |
| 0.4 | Web Shell + Basit Motor | Web Shell and Basic Engine | Nov 28 – Dec 4, 2025 | In Progress (CONFLICT) |
| 0.5 | Motor + GitHub Entegrasyonu | GitHub Integration | Dec 5–12, 2025 | Not Started |
| 1 | Scribe • Trace • Proto – Early Access | Agent Early Access | Dec 13–25, 2025 | Not Started (CONFLICT) |
| 1.5 | Logging • Token Trace • Time-Saved v1 | Observability Layer | Dec 26, 2025 – Jan 9, 2026 | Not Started |
| 2 | OCI Hosting + Gerçek Pilotlar | Production Hosting | Jan 10–23, 2026 | Not Started (CONFLICT) |
| 2.5 | Gerçek Kullanım • Early Users • Marketplace | Early Adoption | Jan 24 – Feb 21, 2026 | Not Started |
| 3 | Marka • İçerik • Final Teslim | Final Delivery | Feb 22 – Mar 31, 2026 | Not Started |

**Gate 3 Updates:**
- Status vocabulary updated: ✅→Done, 🔄→In Progress, 📋→Not Started (PM_NAMING_SYSTEM)
- Human-readable names added for clarity
- Conflicts flagged for Gate 4 resolution

---

## 🔍 Verified vs Claimed Status

> **Gate 3 Analysis:** Evidence-backed facts vs document claims for roadmap items.

### ✅ Evidence-Backed (Verified)

| Item | Status | Evidence Source |
|------|--------|-----------------|
| Phase 0.1-0.3 | Done | Historical git commits, merged PRs |
| S0.4.2 (OAuth) | Done | PR #90 merged |
| S0.4.5 (i18n + 404) | Done | PR #93 merged |
| S1.5.0 (SDTA Document) | Done | `docs/academic/03-sdta/` exists |

### ❓ Claimed Only (No Evidence Found)

| Item | Status Claimed | Claimed By | Evidence Gap |
|------|----------------|------------|--------------|
| S0.4.6 Steps 3-5 | Done | NEXT.md | No QA evidence for Steps 3-5 |
| Phase 1 (S1.0.1, S1.0.2) | Done | NEXT.md | ROADMAP shows Not Started |
| Phase 1.5 (S1.5.1, S1.5.2) | Done | NEXT.md | ROADMAP shows Not Started |
| Phase 2 (S2.0.1) | In Progress | NEXT.md | ROADMAP shows Not Started |

### 🚨 High-Risk Items

Items with conflicting status between NEXT.md and ROADMAP.md:
1. **S0.4.6** — NEXT claims Done, ROADMAP claims Not Started
2. **Current Phase** — NEXT claims Phase 2, ROADMAP claims Phase 0.4
3. **Phase 1 Completion** — NEXT claims Done (Dec 2025), ROADMAP shows Not Started

**Gate 3 Recommendation:** Verify these items with QA evidence before updating BASELINE in Gate 4.

---

## Phase 0.4 — Web Shell + Basit Motor (Current)

**Sprint Range:** S0.4.1 – S0.4.6

### Completed Sprints
- [x] **S0.4.1** — Landing & ana navigasyon
- [x] **S0.4.2** — OAuth config & auth endpoints (PR #90)
- [x] **S0.4.3** — Light/Dark tema, brand assets
- [x] **S0.4.4** — Dashboard layout, Cursor-style auth UI (PR #90)
- [x] **S0.4.5** — i18n cleanup, 404 fix (PR #93)

### Current Sprint (Gate 3 Status)
- [ ] **S0.4.6** — Scribe Config Dashboard (Human: "Scribe Config Dashboard")
  - [x] Step 2: SearchableSelect integration (verified with QA evidence)
  - [ ] Steps 3-5: Target platform, advanced options, review (CONFLICT — NEXT.md claims Done, no evidence found)

---

## Phase 1 — Scribe • Trace • Proto – Early Access

**Target:** 2025-12-13 to 2025-12-25  
**Milestone:** Phase 1 Functional Complete (2025-12-25)

### Sprints
| Sprint | Human-Readable Name | Dates | Goal | Status |
|--------|---------------------|-------|------|--------|
| S1.0.1 | Scribe Basic Flow | Dec 13–19 | Orchestrator routing + UI output + reflection | Not Started (CONFLICT) |
| S1.0.2 | Trace/Proto MVP Scaffold | Dec 20–25 | Trace/Proto MVP + job detail UI + Phase 1 close | Not Started (CONFLICT) |

### Exit Criteria (DoD)
- [ ] Scribe job starts from UI
- [ ] Orchestrator routing functional
- [ ] Output viewer displays results
- [ ] Reflection step works
- [ ] QA smoke evidence (Sadi Önal sign-off)

**Gate 3 Update:** NEXT.md claims these as Done, but conflicts with BASELINE showing Not Started. Checkboxes remain unchecked pending evidence verification in Gate 4.

---

## Phase 1.5 — Logging • Token Trace • Time-Saved v1

**Target:** 2025-12-26 to 2026-01-09

### Sprints
| Sprint | Human-Readable Name | Dates | Goal | Status |
|--------|---------------------|-------|------|--------|
| S1.5.0 | SDTA Document Final | Dec 26 | SDTA document final + delivery (Ayşe) | Done (Verified) |
| S1.5.1 | Job Logging v1 | Dec 27 – Jan 2 | job_logs + log viewer + logs endpoint | Not Started (CONFLICT) |
| S1.5.2 | Token and Cost Tracking | Jan 3–9 | Token/cost tracking + time-saved v1 metrics | Not Started (CONFLICT) |

### Exit Criteria (DoD)
- [ ] Log viewer in dashboard
- [ ] job_logs table populated
- [ ] Token/cost tracking per job
- [ ] Time-saved v1 metrics displayed

**Gate 3 Update:** S1.5.0 verified as Done (academic doc exists). S1.5.1/S1.5.2 status unclear, pending Gate 4 verification.

---

## Phase 2 — OCI Hosting + Gerçek Pilotlar

**Target:** 2026-01-10 to 2026-01-23

### Sprints
| Sprint | Human-Readable Name | Dates | Goal | Status |
|--------|---------------------|-------|------|--------|
| S2.0.1 | Cursor-Inspired UI | Jan 10–16 | Cursor-inspired UI + Liquid Neon Layer | In Progress (CONFLICT) |
| S2.0.2 | Scribe Console Enhancement | Jan 17–23 | Model selection, job lifecycle, result preview | Not Started |

### Exit Criteria (DoD)
- [ ] Cursor-inspired UI components complete
- [ ] Liquid Neon background implemented
- [ ] Scribe console enhanced with model selection
- [ ] Job lifecycle UI functional

**Gate 3 Update:** S2.0.1 shown as "In Progress" per NEXT.md and QA_EVIDENCE_CURSOR_UI_RELEASE.md. Original sprint goals (OCI resource setup) appear to have shifted to UI work. Requires clarification in Gate 4.

---

## Phase 2.5 — Gerçek Kullanım • Early Users • Marketplace Taslağı

**Target:** 2026-01-24 to 2026-02-21

### Sprints
| Sprint | Human-Readable Name | Dates | Focus | Status |
|--------|---------------------|-------|-------|--------|
| S2.5.1 | Early Users Program | Jan 24–30 | Early users program launch | Not Started |
| S2.5.2 | Usage Metrics Implementation | Jan 31 – Feb 6 | Usage metrics implementation | Not Started |
| S2.5.3 | Pricing Page UI | Feb 7–13 | Pricing page UI design | Not Started |
| S2.5.4 | Workflow Templates | Feb 14–21 | Workflow templates creation | Not Started |

**Gate 3 Update:** All marked "Not Started" per PM_NAMING_SYSTEM vocabulary.

---

## Phase 3 — Marka • İçerik • Final Teslim

**Target:** 2026-02-22 to 2026-03-31  
**Milestone:** Proje bitiş hedefi (2026-03-31)

### Sprints
| Sprint | Human-Readable Name | Dates | Focus | Status |
|--------|---------------------|-------|-------|--------|
| S3.0.1 | Brand Finalization | Feb 22 – Mar 7 | Brand finalization (logo, colors, tokens) | Not Started |
| S3.0.2 | Content Creation | Mar 8–21 | Content creation (Medium, LinkedIn posts) | Not Started |
| S3.0.3 | Final Delivery | Mar 22–31 | Final demo, report, presentation, submission | Not Started |

### Exit Criteria (DoD)
- [ ] Brand guideline v1 complete
- [ ] Medium + LinkedIn content published
- [ ] Final report submitted
- [ ] Demo video + rehearsal complete
- [ ] Presentation slides ready

**Gate 3 Update:** All marked "Not Started" per PM_NAMING_SYSTEM vocabulary.

---

## Phase 10 — Next Foundations (GitHub Epic #44)

> **Note:** Phase 10 runs in parallel with core development as a UX/performance improvement track.
> **Gate 3 Update:** Reference to `docs/PHASE10_PLAN.md` removed (file does not exist, deprecated per DOC_HYGIENE_AUDIT).
> Content consolidated into this section per historical audit reports.

### Goals
- Settings UX: Kullanıcı/account konfigürasyonlarında daha az sürtünme, daha fazla rehberlik
- Accessibility: Dark/light tema ve yeni bileşenlerde WCAG 2.1 AA uyumu
- Performance: Core Web Vitals için ölçülebilir bütçeler ve otomasyon
- Marketing: Pricing ROI widget'ı ve Landing FAQ akordeonu ile daha net değer önerisi

### Work Items (GitHub Issues)

| Issue | Title | Status |
|-------|-------|--------|
| #49 | Settings UX refinement | Not Started |
| #47 | Accessibility pass (global) | Not Started |
| #48 | Performance budgets & monitoring | Not Started |
| #45 | ROI widget (Pricing) | Not Started |
| #46 | FAQ accordion (Landing) | Not Started |

**Gate 3 Update:** Status vocabulary updated (📋 Planned → Not Started)

### Acceptance Gates
- `npm run lint`, `npm run typecheck`, `npm run build` root seviyesinde yeşil
- Lighthouse / WebPageTest: LCP < 2.5s, CLS < 0.1, INP < 200ms
- Erişilebilirlik: axe, keyboard traversal kritik akışlarda engel üretmiyor
- Yeni bileşenlerin analytics olayları ve dokümantasyonu güncel

### Out of Scope
- Backend auth yeniden yazımı veya MCP adapter yatırımı
- Mobil native uygulama yüzeyleri
- Pricing stratejisinde metin/plan değişiklikleri (yalnızca UI bileşenleri)

---

## Critical Milestones

| Milestone | Date | Owner |
|-----------|------|-------|
| **Phase 1 Functional Complete** | 2025-12-25 | Yasir |
| **SDTA hazır** | 2025-12-26 | Ayşe |
| **Proje bitiş hedefi** | 2026-03-31 | Yasir |

---

## Execution Order (Canonical)

```
NOW (Phase 0.4):
1. Complete S0.4.6 Scribe Config Dashboard
   └── SearchableSelect verified ✅
   └── Steps 3-5 pending

NEXT (Phase 0.5 + 1):
2. Motor + GitHub Entegrasyonu
3. Scribe temel akış (S1.0.1)
4. Trace/Proto MVP + Phase 1 kapanış (S1.0.2)
   └── Milestone: Phase 1 Functional Complete (Dec 25)

THEN (Phase 1.5):
5. SDTA dokümanı final (Ayşe, Dec 26)
6. Job loglama v1
7. Token/cost tracking

FUTURE:
8. OCI Hosting + pilotlar (Phase 2)
9. Early users + marketplace (Phase 2.5)
10. Marka + içerik + final teslim (Phase 3)
```

---

## V2 Gating Criteria

V2 RepoOps agent development starts only after:

| Criterion | Required Status |
|-----------|-----------------|
| Phase 1 complete | Scribe/Trace/Proto functional |
| MCP adapters ready | GitHub + Atlassian production-ready |
| Job FSM reliable | Tests passing, no regressions |
| QA sign-off | Sadi Önal approval |

---

## Reference Documents

| Document | Purpose |
|----------|---------|
| `docs/PROJECT_TRACKING_BASELINE.md` | Schedule anchor (canonical markdown) |
| `docs/NEXT.md` | Immediate actions |
| `.cursor/context/CONTEXT_SCOPE.md` | Scope & requirements |
| `.cursor/context/CONTEXT_ARCHITECTURE.md` | Technical architecture |

---

## Phase 4+ (Proposed, Gated)

These phases are proposals only and do not change the baseline schedule.

**Gate:** Start only after Phase 1 production demo + Phase 2 hosting baseline.

**References:** `docs/plans/PHASE4_5_FUTURE_BETS_CONCEPT.md`, `docs/plans/FUTURE_PROPOSALS_PHASE4_5.md`

| Phase | Focus | Status | Gate |
|-------|-------|--------|------|
| 4 | Premium Quality RAG System (self-hosted OCI, open-source LLM + advanced RAG) | Proposed | Phase 1 production demo + Phase 2 hosting baseline |
| 5 | AKIS Operator / Device-Link (secure tunnel + controlled computer operations) | Proposed | Phase 1 production demo + Phase 2 hosting baseline |

---

*Roadmap is canonical markdown; spreadsheets are local planning artifacts and may be out of date.*
