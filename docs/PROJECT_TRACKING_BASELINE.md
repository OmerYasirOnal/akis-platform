# AKIS Platform — Project Tracking Baseline

> **Source:** `AKIS_Proje_Takibi_Profesyonel_SON_guncel_v2.xlsx`  
> **Last Updated:** 2025-12-18  
> **Branch:** `docs/project-tracking-baseline-s0.4.6`

---

## Current Focus (2025-12-18)

| Status | Area | Details |
|--------|------|---------|
| ✅ DONE | Phase 0.1–0.3 | Temeller, Mimari & Kapsam, Çekirdek Motor İskeleti |
| 🔄 IN PROGRESS | Phase 0.4 | Web Shell + Basit Motor (S0.4.1–S0.4.5 sprints) |
| ⚠️ CURRENT | S0.4.6 | Scribe Config Dashboard — Step 2 verified, Steps 3-5 pending |
| 📋 NEXT | Phase 0.5 | Motor + GitHub Entegrasyonu (2025-12-05 — 2025-12-12) |
| 🎯 MILESTONE | 2025-12-25 | Phase 1 Functional Complete — Scribe job UI'dan çalışır |

**Blockers:** None (Scribe Step 2 "manual input" issue was cache/restart confusion, not code bug)

---

## 1. Team Roles

| Kişi | Rol | Odak Alanı |
|------|-----|------------|
| Yasir | Product Owner / Tech Lead | Mimari, backend/frontend geliştirme, DevOps, ürün kararları |
| Ayşe | Research & Documentation Lead | Literatür taraması, çözüm tasarımı dokümanları, UX metinleri |
| Sadi Önal | QA & Test Lead / Reviewer | Test planı, smoke/e2e doğrulama, kod/mimari review, risk analizi |

---

## 2. Phases (Roadmap)

| Faz_ID | Faz Adı | Başlangıç | Bitiş | Durum |
|--------|---------|-----------|-------|-------|
| 0.1 | Temeller (Repo & Altyapı) | 2025-11-01 | 2025-11-07 | ✅ TAMAMLANDI |
| 0.2 | Mimari & Kapsam | 2025-11-08 | 2025-11-17 | ✅ TAMAMLANDI |
| 0.3 | Çekirdek Motor İskeleti | 2025-11-18 | 2025-11-27 | ✅ TAMAMLANDI |
| 0.4 | Web Shell + Basit Motor | 2025-11-28 | 2025-12-04 | 🔄 DEVAM EDİYOR |
| 0.5 | Motor + GitHub Entegrasyonu | 2025-12-05 | 2025-12-12 | 📋 PLANLANDI |
| 1 | Scribe • Trace • Proto – Early Access | 2025-12-13 | 2025-12-25 | 📋 PLANLANDI |
| 1.5 | Logging • Token Trace • Time-Saved v1 | 2025-12-26 | 2026-01-09 | 📋 PLANLANDI |
| 2 | OCI Hosting + Gerçek Pilotlar | 2026-01-10 | 2026-01-23 | 📋 PLANLANDI |
| 2.5 | Gerçek Kullanım • Early Users • Marketplace Taslağı | 2026-01-24 | 2026-02-21 | 📋 PLANLANDI |
| 3 | Marka • İçerik • Final Teslim | 2026-02-22 | 2026-03-31 | 📋 PLANLANDI |

### Phase Exit Criteria (DoD)

| Phase | Ana Çıktı |
|-------|-----------|
| 1 | Scribe çalışır + UI'dan job başlatma + output viewer + reflection + QA kanıtı |
| 1.5 | Log viewer + job_logs + token/cost + time-saved v1 |
| 2 | OCI kaynakları + CI/CD + health-check/monitoring + pilotlar |
| 3 | Marka + içerik + final teslim paketleri |

---

## 3. Sprints

| Sprint | Başlangıç | Bitiş | Hedef |
|--------|-----------|-------|-------|
| S0.4.1 | 2025-11-28 | 2025-12-05 | Landing & ana navigasyon |
| S0.4.2 | 2025-12-01 | 2025-12-07 | OAuth config & auth endpoints |
| S0.4.3 | 2025-11-29 | 2025-12-03 | Light/Dark tema, brand assets |
| S0.4.4 | 2025-12-03 | 2025-12-08 | Dashboard layout, Cursor-style auth UI |
| S0.4.5 | 2025-12-09 | 2025-12-10 | i18n cleanup, 404 fix |
| **S0.4.6** | 2025-12-11 | 2025-12-18 | **Scribe Config Dashboard (current)** |
| S1.0.1 | 2025-12-13 | 2025-12-19 | Scribe temel akış (Orchestrator routing + UI output) |
| S1.0.2 | 2025-12-20 | 2025-12-25 | Trace/Proto MVP + job detail UI + Phase 1 kapanış |
| S1.5.0 | 2025-12-26 | 2025-12-26 | SDTA dokümanı final + teslim |
| S1.5.1 | 2025-12-27 | 2026-01-02 | Job loglama v1 (job_logs + log viewer) |
| S1.5.2 | 2026-01-03 | 2026-01-09 | Token/cost tracking + time-saved v1 metrikleri |
| S2.0.1 | 2026-01-10 | 2026-01-16 | OCI prep |
| S2.0.2 | 2026-01-17 | 2026-01-23 | Pilotlar |
| S2.5.1 | 2026-01-24 | 2026-01-30 | Early users |
| S2.5.2 | 2026-01-31 | 2026-02-06 | Usage metrics |
| S2.5.3 | 2026-02-07 | 2026-02-13 | Pricing page |
| S2.5.4 | 2026-02-14 | 2026-02-21 | Workflow templates |
| S3.0.1 | 2026-02-22 | 2026-03-07 | Brand finalization |
| S3.0.2 | 2026-03-08 | 2026-03-21 | Content (Medium, LinkedIn) |
| S3.0.3 | 2026-03-22 | 2026-03-31 | Final demo & teslim |

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

### S0.4.6 Tasks (CURRENT)

| ID | Workstream | Başlık | Status |
|----|------------|--------|--------|
| S0.4.6-FE-1 | Frontend | Scribe Config Step 1-5 wizard | 🔄 In Progress |
| S0.4.6-FE-2 | Frontend | Scribe SearchableSelect integration | ✅ Complete (verified in SCRIBE_STEP2_VERIFICATION.md) |

---

## 6. Known PR References

| PR | Sprint | Description | Status |
|----|--------|-------------|--------|
| **#90** | S0.4.2 + S0.4.4 | Email-based multi-step authentication + OAuth endpoints | ✅ Merged |
| **#93** | S0.4.5 | OAuth + onboarding fix, i18n loading gate | ✅ Merged |
| — | S0.4.6 | Scribe Config Dashboard | 🔄 In Progress (`feat/scribe-config-s0.4.6-wip`) |

---

## 7. Execution Order (Canonical)

```
CURRENT:
1. ✅ Complete S0.4.6 Scribe Config Dashboard
   └── Step 2 verified (SearchableSelect works)
   └── Steps 3-5 remaining

NEXT (Phase 1 - by 2025-12-25):
2. S1.0.1: Scribe temel akış
   └── Orchestrator routing
   └── UI output viewer
   └── Reflection adımı

3. S1.0.2: Phase 1 kapanış
   └── Trace/Proto MVP scaffolds
   └── Job detail UI
   └── QA kanıtı (Sadi Önal)

THEN (Phase 1.5 - by 2026-01-09):
4. S1.5.0: SDTA dokümanı final (Ayşe)
5. S1.5.1: Job loglama v1
6. S1.5.2: Token/cost tracking + time-saved metrikleri

FUTURE (Phase 2+):
7. OCI Hosting + pilotlar (Phase 2)
8. Early users + marketplace taslağı (Phase 2.5)
9. Marka + içerik + final teslim (Phase 3)
```

---

## 8. V2 Gating Criteria (RepoOps Agent)

V2 RepoOps development starts only when ALL criteria are met:

| Criterion | Current Status | Required |
|-----------|----------------|----------|
| Scribe agent stable | 🔄 S0.4.6 + S1.0.x | ✅ Phase 1 complete |
| Trace agent stable | 📋 S1.0.2 | ✅ MVP functional |
| Proto agent stable | 📋 S1.0.2 | ✅ MVP functional |
| GitHub MCP adapter | ✅ Functional | ✅ Production-ready |
| Atlassian MCP adapter | ⚠️ Scaffold | ✅ Production-ready |
| Job FSM reliable | ✅ 110/110 tests | ✅ Maintained |
| QA sign-off | 📋 S1.0.2 | ✅ Sadi Önal approval |

**V2 Start:** After Phase 1 complete (earliest 2025-12-26)

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
