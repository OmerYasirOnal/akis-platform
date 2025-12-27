# AKIS Platform — Roadmap & Milestones

> **Schedule Anchor:** `docs/PROJECT_TRACKING_BASELINE.md` (canonical markdown; spreadsheet is a local planning artifact)  
> **Last Updated:** 2025-12-18

### Planning Chain

```
docs/PROJECT_TRACKING_BASELINE.md  (schedule anchor, canonical markdown)
          ↓
docs/ROADMAP.md                    (this file: phase overview)
          ↓
docs/NEXT.md                       (immediate actions + gating)
```

---

## Current Status (2025-12-18)

| Phase | Status | Key Deliverable |
|-------|--------|-----------------|
| 0.1–0.3 | ✅ Complete | Temeller, Mimari, Çekirdek Motor |
| **0.4** | **🔄 In Progress** | Web Shell + Basit Motor (S0.4.6 current) |
| 0.5 | 📋 Planned | Motor + GitHub Entegrasyonu |
| 1 | 📋 Planned | Scribe • Trace • Proto – Early Access |

**Next Milestone:** Phase 1 Functional Complete — **2025-12-25** (Scribe job UI'dan çalışır)

---

## Phase Overview

| Faz | Adı | Tarih Aralığı | Durum |
|-----|-----|---------------|-------|
| 0.1 | Temeller (Repo & Altyapı) | Nov 1–7, 2025 | ✅ |
| 0.2 | Mimari & Kapsam | Nov 8–17, 2025 | ✅ |
| 0.3 | Çekirdek Motor İskeleti | Nov 18–27, 2025 | ✅ |
| 0.4 | Web Shell + Basit Motor | Nov 28 – Dec 4, 2025 | 🔄 |
| 0.5 | Motor + GitHub Entegrasyonu | Dec 5–12, 2025 | 📋 |
| 1 | Scribe • Trace • Proto – Early Access | Dec 13–25, 2025 | 📋 |
| 1.5 | Logging • Token Trace • Time-Saved v1 | Dec 26, 2025 – Jan 9, 2026 | 📋 |
| 2 | OCI Hosting + Gerçek Pilotlar | Jan 10–23, 2026 | 📋 |
| 2.5 | Gerçek Kullanım • Early Users • Marketplace Taslağı | Jan 24 – Feb 21, 2026 | 📋 |
| 3 | Marka • İçerik • Final Teslim | Feb 22 – Mar 31, 2026 | 📋 |

---

## Phase 0.4 — Web Shell + Basit Motor (Current)

**Sprint Range:** S0.4.1 – S0.4.6

### Completed Sprints
- [x] **S0.4.1** — Landing & ana navigasyon
- [x] **S0.4.2** — OAuth config & auth endpoints (PR #90)
- [x] **S0.4.3** — Light/Dark tema, brand assets
- [x] **S0.4.4** — Dashboard layout, Cursor-style auth UI (PR #90)
- [x] **S0.4.5** — i18n cleanup, 404 fix (PR #93)

### Current Sprint
- [ ] **S0.4.6** — Scribe Config Dashboard
  - [x] Step 2: SearchableSelect integration (verified)
  - [ ] Steps 3-5: Target platform, advanced options, review

---

## Phase 1 — Scribe • Trace • Proto – Early Access

**Target:** 2025-12-13 to 2025-12-25  
**Milestone:** Phase 1 Functional Complete (2025-12-25)

### Sprints
| Sprint | Dates | Goal |
|--------|-------|------|
| S1.0.1 | Dec 13–19 | Scribe temel akış (Orchestrator routing + UI output) + reflection |
| S1.0.2 | Dec 20–25 | Trace/Proto MVP + job detail UI + Phase 1 kapanış |

### Exit Criteria (DoD)
- ✅ Scribe job starts from UI
- ✅ Orchestrator routing functional
- ✅ Output viewer displays results
- ✅ Reflection step works
- ✅ QA smoke kanıtı (Sadi Önal sign-off)

---

## Phase 1.5 — Logging • Token Trace • Time-Saved v1

**Target:** 2025-12-26 to 2026-01-09

### Sprints
| Sprint | Dates | Goal |
|--------|-------|------|
| S1.5.0 | Dec 26 | SDTA dokümanı final + teslim (Ayşe) |
| S1.5.1 | Dec 27 – Jan 2 | Job loglama v1 (job_logs + log viewer + logs endpoint) |
| S1.5.2 | Jan 3–9 | Token/cost tracking + time-saved v1 metrikleri |

### Exit Criteria (DoD)
- ✅ Log viewer in dashboard
- ✅ job_logs table populated
- ✅ Token/cost tracking per job
- ✅ Time-saved v1 metrics displayed

---

## Phase 2 — OCI Hosting + Gerçek Pilotlar

**Target:** 2026-01-10 to 2026-01-23

### Sprints
| Sprint | Dates | Goal |
|--------|-------|------|
| S2.0.1 | Jan 10–16 | OCI resource setup |
| S2.0.2 | Jan 17–23 | CI/CD + health-check/monitoring + pilotlar |

### Exit Criteria (DoD)
- ✅ OCI kaynakları provisioned
- ✅ CI/CD pipeline functional
- ✅ Health-check and monitoring active
- ✅ Initial pilot users onboarded

---

## Phase 2.5 — Gerçek Kullanım • Early Users • Marketplace Taslağı

**Target:** 2026-01-24 to 2026-02-21

### Sprints
| Sprint | Dates | Focus |
|--------|-------|-------|
| S2.5.1 | Jan 24–30 | Early users program |
| S2.5.2 | Jan 31 – Feb 6 | Usage metrics implementation |
| S2.5.3 | Feb 7–13 | Pricing page UI |
| S2.5.4 | Feb 14–21 | Workflow templates |

---

## Phase 3 — Marka • İçerik • Final Teslim

**Target:** 2026-02-22 to 2026-03-31  
**Milestone:** Proje bitiş hedefi (2026-03-31)

### Sprints
| Sprint | Dates | Focus |
|--------|-------|-------|
| S3.0.1 | Feb 22 – Mar 7 | Brand finalization (logo, colors, tokens) |
| S3.0.2 | Mar 8–21 | Content (Medium yazıları, LinkedIn posts) |
| S3.0.3 | Mar 22–31 | Final demo, rapor, sunum, teslim |

### Exit Criteria (DoD)
- ✅ Brand guideline v1 complete
- ✅ Medium + LinkedIn içerikleri published
- ✅ Final rapor submitted
- ✅ Demo video + prova complete
- ✅ Sunum slaytları ready

---

## Phase 10 — Next Foundations (GitHub Epic #44)

> **Note:** Phase 10 runs in parallel with core development as a UX/performance improvement track.  
> **Source:** Consolidated from `docs/PHASE10_PLAN.md` (now deprecated, see audit report).

### Goals
- Settings UX: Kullanıcı/account konfigürasyonlarında daha az sürtünme, daha fazla rehberlik
- Accessibility: Dark/light tema ve yeni bileşenlerde WCAG 2.1 AA uyumu
- Performance: Core Web Vitals için ölçülebilir bütçeler ve otomasyon
- Marketing: Pricing ROI widget'ı ve Landing FAQ akordeonu ile daha net değer önerisi

### Work Items (GitHub Issues)

| Issue | Title | Status |
|-------|-------|--------|
| #49 | Settings UX refinement | 📋 Planned |
| #47 | Accessibility pass (global) | 📋 Planned |
| #48 | Performance budgets & monitoring | 📋 Planned |
| #45 | ROI widget (Pricing) | 📋 Planned |
| #46 | FAQ accordion (Landing) | 📋 Planned |

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
