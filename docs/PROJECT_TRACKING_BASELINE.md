# AKIS Platform — Project Tracking Baseline

> **Source:** `AKIS_Proje_Takibi_Profesyonel_SON_guncel_v2.xlsx`
> **Last Updated:** 2026-01-29 (Gate 4 Reality Lock)
> **Branch:** `docs/restructure-2026-01`

### Gate 4 Reality Lock — All Conflicts Resolved

**Conflicts Resolved (Evidence-Based):**
- ✅ CONFLICT #1 (S0.4.6 status): **RESOLVED** → Done (QA_EVIDENCE_S0.4.6.md verified Steps 1-5)
- ✅ CONFLICT #2 (Current phase): **RESOLVED** → Phase 2 (S2.0.1) In Progress (QA_EVIDENCE_CURSOR_UI_RELEASE.md)
- ✅ CONFLICT #3 (Document staleness): **RESOLVED** → All three planning docs now current (2026-01-29)

**Evidence Sources:**
- `docs/qa/QA_EVIDENCE_S0.4.6.md` (2025-12-27, PASS)
- `docs/qa/QA_EVIDENCE_CURSOR_UI_RELEASE.md` (2026-01-10, In Progress)
- `docs/ops/PM_NAMING_SYSTEM.md` (status vocabulary)

**Applied Changes:**
- Updated current phase to Phase 2 (S2.0.1) based on QA evidence
- Updated S0.4.6 status to Done (Steps 1-5) with QA proof
- Applied PM_NAMING_SYSTEM status vocabulary throughout
- Added human-readable names for phases/sprints
- Flagged unresolved items requiring future verification

---

## Current Focus (2026-01-28 Gate 4)

| Status | Area | Details | Human-Readable Name |
|--------|------|---------|---------------------|
| Done | Phase 0.1–0.3 | Foundation, Architecture, Core Engine | Foundation Setup |
| Done | Phase 0.4 | Web Shell + Basic Motor (S0.4.1–S0.4.6 complete) | Web Shell and Basic Engine |
| Done | S0.4.6 | Scribe Config Dashboard (Steps 1-5 verified) | Scribe Config Dashboard |
| **In Progress** | **Phase 2 (S2.0.1)** | **Cursor-Inspired UI + Liquid Neon Layer** | **Production Hosting (UI Track)** |
| Not Started | Phase 0.5 | GitHub Integration (original plan, superseded by Phase 2) | GitHub Integration |
| **PAST DUE** | Phase 1 | Scribe • Trace • Proto (milestone 2025-12-25 missed) | Agent Early Access |

**Blockers:** None

**Gate 4 Evidence-Based Updates:**
- S0.4.6 marked **Done** per `QA_EVIDENCE_S0.4.6.md` (2025-12-27, PASS, Steps 1-5 complete)
- Current phase updated to **Phase 2 (S2.0.1)** per `QA_EVIDENCE_CURSOR_UI_RELEASE.md` (2026-01-10, In Progress)
- Phase 1 milestone (2025-12-25) flagged as **PAST DUE** (no QA sign-off found)
- Status vocabulary updated to PM_NAMING_SYSTEM (Done / In Progress / Not Started)

---

## 1. Team Roles

| Kişi | Rol | Odak Alanı |
|------|-----|------------|
| Yasir | Product Owner / Tech Lead | Mimari, backend/frontend geliştirme, DevOps, ürün kararları |
| Ayşe | Research & Documentation Lead | Literatür taraması, çözüm tasarımı dokümanları, UX metinleri |
| Sadi Önal | QA & Test Lead / Reviewer | Test planı, smoke/e2e doğrulama, kod/mimari review, risk analizi |

---

## 2. Phases (Roadmap)

| Phase | Name (Original) | Human-Readable Name | Başlangıç | Bitiş | Status |
|-------|-----------------|---------------------|-----------|-------|--------|
| 0.1 | Temeller (Repo & Altyapı) | Foundation Setup | 2025-11-01 | 2025-11-07 | Done |
| 0.2 | Mimari & Kapsam | Architecture Definition | 2025-11-08 | 2025-11-17 | Done |
| 0.3 | Çekirdek Motor İskeleti | Core Engine Scaffold | 2025-11-18 | 2025-11-27 | Done |
| 0.4 | Web Shell + Basit Motor | Web Shell and Basic Engine | 2025-11-28 | 2025-12-27 | Done (Extended) |
| 0.5 | Motor + GitHub Entegrasyonu | GitHub Integration | 2025-12-05 | 2025-12-12 | Not Started (Superseded) |
| 1 | Scribe • Trace • Proto – Early Access | Agent Early Access | 2025-12-13 | 2025-12-25 | Not Started (PAST DUE) |
| 1.5 | Logging • Token Trace • Time-Saved v1 | Observability Layer | 2025-12-26 | 2026-01-09 | Partial (SDTA Done) |
| **2** | **OCI Hosting + Gerçek Pilotlar** | **Production Hosting** | **2026-01-10** | **2026-01-23** | **In Progress (UI Track)** |
| 2.5 | Gerçek Kullanım • Early Users • Marketplace | Early Adoption | 2026-01-24 | 2026-02-21 | Not Started |
| 3 | Marka • İçerik • Final Teslim | Final Delivery | 2026-02-22 | 2026-03-31 | Not Started |

**Gate 4 Updates:**
- Phase 0.4 extended to 2025-12-27 (S0.4.6 closeout)
- Phase 0.5 superseded by Phase 2 work (GitHub integration deferred)
- Phase 1 milestone missed (2025-12-25), no QA sign-off found
- Phase 1.5: S1.5.0 (SDTA Document) Done, S1.5.1/S1.5.2 status unknown
- Phase 2 (S2.0.1) In Progress per QA_EVIDENCE_CURSOR_UI_RELEASE.md
- Status vocabulary: PM_NAMING_SYSTEM applied (Done / In Progress / Not Started / Partial)

### Phase Exit Criteria (DoD)

| Phase | Ana Çıktı |
|-------|-----------|
| 1 | Scribe çalışır + UI'dan job başlatma + output viewer + reflection + QA kanıtı |
| 1.5 | Log viewer + job_logs + token/cost + time-saved v1 |
| 2 | OCI kaynakları + CI/CD + health-check/monitoring + pilotlar |
| 3 | Marka + içerik + final teslim paketleri |

---

## 3. Sprints

| Sprint | Human-Readable Name | Başlangıç | Bitiş | Goal | Status | Notes |
|--------|---------------------|-----------|-------|------|--------|-------|
| S0.4.1 | Landing and Navigation | 2025-11-28 | 2025-12-05 | Landing & ana navigasyon | Done | |
| S0.4.2 | OAuth and Auth Endpoints | 2025-12-01 | 2025-12-07 | OAuth config & auth endpoints | Done | |
| S0.4.3 | Theme and Brand Assets | 2025-11-29 | 2025-12-03 | Light/Dark tema, brand assets | Done | |
| S0.4.4 | Dashboard Layout | 2025-12-03 | 2025-12-08 | Dashboard layout, Cursor-style auth UI | Done | |
| S0.4.5 | i18n and 404 Fix | 2025-12-09 | 2025-12-10 | i18n cleanup, 404 fix | Done | |
| **S0.4.6** | **Scribe Config Dashboard** | 2025-12-11 | 2025-12-27 | Scribe Config Dashboard | **Done** | *QA verified 2025-12-27* |
| S1.0.1 | Scribe Basic Flow | 2025-12-13 | 2025-12-19 | Scribe temel akış | Not Started | *PAST DUE (2025-12-19)* |
| S1.0.2 | Trace/Proto MVP Scaffold | 2025-12-20 | 2025-12-25 | Trace/Proto MVP + job detail UI | Not Started | *PAST DUE (2025-12-25)* |
| S1.5.0 | SDTA Document Final | 2025-12-26 | 2025-12-26 | SDTA dokümanı final + teslim | Done | *Verified at docs/academic/03-sdta/* |
| S1.5.1 | Job Logging v1 | 2025-12-27 | 2026-01-02 | Not Started | *Evidence missing: docs/qa/QA_EVIDENCE_S1.5.1.md* |
| S1.5.2 | Token and Cost Tracking | 2026-01-03 | 2026-01-09 | Not Started | *Evidence missing: docs/qa/QA_EVIDENCE_S1.5.2.md* |
| **S2.0.1** | **Cursor-Inspired UI** | **2026-01-10** | **2026-01-16** | **Cursor-Inspired UI + Liquid Neon Layer** | **In Progress** | *QA started 2026-01-10* |
| S2.0.2 | Scribe Console Enhancement | 2026-01-17 | 2026-01-23 | Model selection, job lifecycle, result preview | Not Started | |
| S2.5.1 | Early Users Program | 2026-01-24 | 2026-01-30 | Early users program launch | Not Started | |
| S2.5.2 | Usage Metrics Implementation | 2026-01-31 | 2026-02-06 | Usage metrics implementation | Not Started | |
| S2.5.3 | Pricing Page UI | 2026-02-07 | 2026-02-13 | Pricing page UI design | Not Started | |
| S2.5.4 | Workflow Templates | 2026-02-14 | 2026-02-21 | Workflow templates creation | Not Started | |
| S3.0.1 | Brand Finalization | 2026-02-22 | 2026-03-07 | Brand finalization | Not Started | |
| S3.0.2 | Content Creation | 2026-03-08 | 2026-03-21 | Content (Medium, LinkedIn) | Not Started | |
| S3.0.3 | Final Delivery | 2026-03-22 | 2026-03-31 | Final demo & teslim | Not Started | |

**Gate 4 Sprint Status Updates (Vocabulary Normalized):**
- S0.4.1-S0.4.5: All marked Done (historical completion verified)
- S0.4.6: Done per QA_EVIDENCE_S0.4.6.md (2025-12-27 PASS)
- S1.0.1, S1.0.2: Not Started, flagged PAST DUE (milestone 2025-12-25 missed)
- S1.5.0: Done (SDTA document exists at docs/academic/03-sdta/)
- S1.5.1, S1.5.2: Not Started (evidence missing: QA_EVIDENCE_S1.5.1.md, QA_EVIDENCE_S1.5.2.md)
- S2.0.1: In Progress per QA_EVIDENCE_CURSOR_UI_RELEASE.md (2026-01-10)
- S2.0.2+: Not Started (future sprints)

**Vocabulary Compliance:** All statuses use PM_NAMING_SYSTEM (Not Started / In Progress / Blocked / Done / Deprecated). "Unknown" replaced with "Not Started" + explicit evidence gap notes.

---

## 4. Critical Milestones

| Milestone | Tarih | Açıklama | Sorumlu |
|-----------|-------|----------|---------|
| Phase 1 Functional Complete | **2025-12-25** | Scribe job UI'dan çalışır; Orchestrator routing + output viewer + reflection + QA smoke kanıtı | Yasir |
| SDTA hazır | **2025-12-26** | Çözüm Tasarımı ve Teknik Analiz Dokümanı: son revizyon + teslim paketi | Ayşe |
| Proje bitiş hedefi | **2026-03-31** | Mart 2026 sonuna kadar faz 3 teslimleri tamam | Yasir |

---

## 5. Sprint Task Details (S0.4.x Series - Current)

### S0.4.1 Tasks

| ID | Workstream | Başlık | Plan_Bitiş | Gerçek_Bitiş | Not |
|----|------------|--------|------------|--------------|-----|
| S0.4.1-DOC-1 | Docs | AKIS LLM Model Strategy v1 | 2025-12-05 | — | |
| S0.4.1-DOC-2 | Docs | Site metin taslağı (v1) | 2025-11-30 | ✅ 2025-11-30 | |
| S0.4.1-FE-1 | Frontend | Landing & ana navigasyon | 2025-11-30 | ✅ 2025-11-30 | 1 Saat'de bitirildi |
| S0.4.1-FE-2 | Frontend | Docs & footer içerikleri | 2025-11-30 | ✅ 2025-11-30 | |
| S0.4.1-FE-3 | Frontend | Pricing & Agents içerik geçişi | 2025-11-30 | ✅ 2025-11-30 | |

### S0.4.2 Tasks

| ID | Workstream | Başlık | Plan_Bitiş | Gerçek_Bitiş | Not |
|----|------------|--------|------------|--------------|-----|
| S0.4.2-BE-1 | Backend | GitHub & Google OAuth config | 2025-12-02 | ✅ 2025-12-02 | Tahmini 1 Saat |
| S0.4.2-BE-2 | Backend | OAuth Signup/Login endpoint'leri | 2025-12-02 | ✅ 2025-12-02 | Tahmini 1 Saat |
| S0.4.2-FE-1 | Frontend | Sosyal giriş UI'ı | 2025-12-02 | ✅ 2025-12-02 | Tahmini 1 Saat |
| **S0.4.2-DOC-2** | Docs | Cursor-style Auth UX & Docs v1 | 2025-12-07 | ✅ 2025-12-06 | **PR #90** kapsamında güncellendi |

### S0.4.3 Tasks

| ID | Workstream | Başlık | Plan_Bitiş | Gerçek_Bitiş | Not |
|----|------------|--------|------------|--------------|-----|
| S0.4.3-FE-1 | Frontend | Light/Dark tema toggler | 2025-11-30 | ✅ 2025-11-30 | |
| S0.4.3-FE-2 | Frontend | Tema kalıcılığı & varsayılan | 2025-12-02 | ✅ 2025-12-02 | Tahmini 30 Dk |
| S0.4.3-FE-3 | Frontend | Metinlerin tek yerden yönetimi | 2025-12-03 | ✅ 2025-12-02 | Tahmini 30 Dk |
| S0.4.3-FE-4 | Frontend | Repository cleanup & docs restructuring | 2025-12-01 | ✅ 2025-01-04 | Tahmini 30 Dk |
| S0.4.3-FE-5 | Frontend | Final brand asset pack | 2025-12-15 | ✅ 2025-01-04 | Tahmini 2 Saat |

### S0.4.4 Tasks

| ID | Workstream | Başlık | Plan_Bitiş | Gerçek_Bitiş | Not |
|----|------------|--------|------------|--------------|-----|
| S0.4.4-FE-1 | Frontend | Dashboard layout & navigation | 2025-12-04 | ✅ 2025-12-03 | Tahmini 30 Dk |
| S0.4.4-FE-2 | Frontend | Integrations sayfası iskeleti | 2025-12-04 | ✅ 2025-12-03 | Tahmini 1 Saat |
| S0.4.4-FE-3 | Frontend | Profile Settings sayfası | 2025-12-04 | ✅ 2025-12-03 | Tahmini 30 Dk |
| S0.4.4-FE-4 | Frontend | Agents Configure sayfası | 2025-12-04 | ✅ 2025-12-03 | |
| S0.4.4-FE-5 | Frontend | Cursor-style email auth UI | 2025-12-07 | ✅ 2025-12-06 | Tahmini 3 Saat |
| **S0.4.4-QA-1** | QA | Auth akışları QA | 2025-12-08 | ✅ 2025-12-12 | **PR #90** QA Sadi Önal tarafından yapıldı |

### S0.4.5 Tasks

| ID | Workstream | Başlık | Plan_Bitiş | Gerçek_Bitiş | Not |
|----|------------|--------|------------|--------------|-----|
| S0.4.5-FE-2 | Frontend | i18n TR çeviri eksikleri & fallback | 2025-12-10 | ✅ 2025-12-14 | PR #93 ile fix |
| S0.4.5-FE-3 | Frontend | Frontend 404 uyarısı giderme | 2025-12-10 | ✅ 2025-12-14 | Console temizliği doğrulandı |

### S0.4.6 Tasks (DONE)

| ID | Workstream | Başlık | Status |
|----|------------|--------|--------|
| S0.4.6-FE-1 | Frontend | Scribe Config Step 1-5 wizard | Done (QA verified 2025-12-27) |
| S0.4.6-FE-2 | Frontend | Scribe SearchableSelect integration | Done (verified in SCRIBE_STEP2_VERIFICATION.md) |

**Gate 4 Evidence:** `docs/qa/QA_EVIDENCE_S0.4.6.md` (2025-12-27, Status: PASS)
- Steps 1-5 wizard completes with validation
- GitHub discovery endpoints functional
- Save & Create Job works correctly
- Dry-run and live jobs tested
- Jobs list shows created jobs

---

## 6. Known PR References

| PR | Sprint | Description | Status |
|----|--------|-------------|--------|
| **#90** | S0.4.2 + S0.4.4 | Email-based multi-step authentication + OAuth endpoints | Merged (Done) |
| **#93** | S0.4.5 | OAuth + onboarding fix, i18n loading gate | Merged (Done) |
| — | S0.4.6 | Scribe Config Dashboard (feat/s0.4.6-closeout) | Done (QA verified 2025-12-27) |
| — | S2.0.1 | Cursor-Inspired UI + Liquid Neon (feat/ui-cursor-inspired-liquid-neon) | In Progress (QA started 2026-01-10) |

**Gate 4 Update:** Added S2.0.1 PR reference per QA_EVIDENCE_CURSOR_UI_RELEASE.md

---

## 7. Execution Order (Canonical - Gate 4 Updated)

```
DONE (Phase 0.4):
✅ S0.4.1-S0.4.5: Web shell, OAuth, theme, dashboard, i18n (Complete)
✅ S0.4.6: Scribe Config Dashboard Steps 1-5 (Complete, QA verified 2025-12-27)

DONE (Phase 1.5 Partial):
✅ S1.5.0: SDTA document final (Ayşe) (Complete, verified at docs/academic/03-sdta/)

CURRENT (Phase 2 - by 2026-01-23):
🔄 S2.0.1: Cursor-Inspired UI + Liquid Neon Layer (In Progress, QA started 2026-01-10)
   └── Cursor-inspired UI components
   └── Liquid Neon background layer
   └── Responsive design updates

NEXT (Phase 2 Continuation):
📋 S2.0.2: Scribe Console Enhancement (Not Started)
   └── Model selection UI
   └── Job lifecycle controls
   └── Result preview enhancements

PAST DUE / NEEDS CLARIFICATION (Phase 1):
⚠️ S1.0.1: Scribe Basic Flow (Not Started, due 2025-12-19)
   └── Orchestrator routing
   └── UI output viewer
   └── Reflection step
⚠️ S1.0.2: Trace/Proto MVP Scaffold (Not Started, due 2025-12-25)
   └── Trace/Proto MVP scaffolds
   └── Job detail UI
   └── QA sign-off (Sadi Önal) - NOT FOUND

NOT STARTED (Phase 1.5 - Evidence Missing):
📋 S1.5.1: Job Logging v1 (Not Started, evidence missing: docs/qa/QA_EVIDENCE_S1.5.1.md)
📋 S1.5.2: Token/Cost Tracking (Not Started, evidence missing: docs/qa/QA_EVIDENCE_S1.5.2.md)

FUTURE (Phase 2.5+):
📋 Phase 2.5: Early users + usage metrics + pricing + templates
📋 Phase 3: Brand + content + final delivery
```

**Gate 4 Notes (Vocabulary Normalized):**
- Phase 1 (S1.0.1, S1.0.2) missed milestone (2025-12-25), no QA sign-off found
- Current work jumped to Phase 2 (S2.0.1 UI track) while Phase 1 incomplete
- S1.5.1, S1.5.2 marked Not Started (evidence missing: QA_EVIDENCE_S1.5.1.md, QA_EVIDENCE_S1.5.2.md)
- Execution order shows actual vs. planned divergence
- All statuses comply with PM_NAMING_SYSTEM vocabulary

---

## 8. V2 Gating Criteria (RepoOps Agent)

V2 RepoOps development starts only when ALL criteria are met:

| Criterion | Current Status (Gate 4) | Required | Gap |
|-----------|-------------------------|----------|-----|
| Scribe agent stable | Partial (S0.4.6 Done, S1.0.x Not Started) | Phase 1 complete | S1.0.1, S1.0.2 missing |
| Trace agent stable | Not Started (S1.0.2 Not Started) | MVP functional | No MVP evidence |
| Proto agent stable | Not Started (S1.0.2 Not Started) | MVP functional | No MVP evidence |
| GitHub MCP adapter | Functional | Production-ready | None |
| Atlassian MCP adapter | Scaffold (per BASELINE) | Production-ready | Production work required |
| Job FSM reliable | 110/110 tests passing | Maintained | None |
| QA sign-off | NOT FOUND | Sadi Önal approval | No Phase 1 QA sign-off |

**V2 Start:** BLOCKED - Phase 1 incomplete (earliest 2025-12-26 target missed)

**Gate 4 Assessment:** 3/7 criteria met (GitHub MCP, Job FSM, Scribe partial). Phase 1 work (S1.0.1, S1.0.2) and QA sign-off are critical blockers for V2.

---

## 9. Notes

- Gorevler sayfası sprint/phase bazlı planı tek kaynaktan yönetir.
- Dokümantasyon ve araştırma işleri **Ayşe**; test/QA kanıt işleri **Sadi Önal**; geliştirme işleri **Yasir** sorumluluğunda takip edilir.
- Spreadsheet raw dosyası `.gitignore`'da tutulacak (internal notes içerebilir).

---

## 10. Document References

| Document | Purpose |
|----------|---------|
| `docs/ROADMAP.md` | Phase/milestone overview (synced with this baseline) |
| `docs/NEXT.md` | Immediate actions + gating criteria |
| `.cursor/context/CONTEXT_SCOPE.md` | Project scope & requirements |
| `.cursor/context/CONTEXT_ARCHITECTURE.md` | Technical architecture |
| `docs/DOCS_AUDIT_REPORT.md` | Documentation audit |
| `SCRIBE_STEP2_VERIFICATION.md` | Scribe Step 2 implementation verification |

---

*This baseline is derived from the official project tracking spreadsheet. Task IDs preserved exactly as in source.*
