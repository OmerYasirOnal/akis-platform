# AKIS Platform — Yol Haritası ve Kilometre Taşları

> **Kanonik Plan:** [`docs/planning/DELIVERY_PLAN_S0.5_FEB_TO_GRADUATION.md`](planning/DELIVERY_PLAN_S0.5_FEB_TO_GRADUATION.md)  
> **Operasyonel Playbook:** [`docs/planning/AKIS_OPERATIONAL_PLAYBOOK.md`](planning/AKIS_OPERATIONAL_PLAYBOOK.md) (4 Pillar + Moonshot — teyit edilmiş hedef)  
> **Uygulama Haritası:** [`docs/planning/PLAYBOOK_IMPLEMENTATION_MAP.md`](planning/PLAYBOOK_IMPLEMENTATION_MAP.md)  
> **Anlık Eylemler:** [`docs/NEXT.md`](NEXT.md)  
> **Son Güncelleme:** 2026-02-17

---

## Güncel Durum

| Öğe | Değer |
|-----|-------|
| **Aktif Faz** | S0.5 — Staging Düzeltme + Pilot Demo |
| **Sonraki Kilometre Taşı** | M1: Pilot Demo (28 Şubat 2026) |
| **Kapsam** | Scribe / Trace / Proto agent'ları |
| **Ortam** | Staging (staging.akisflow.com) — OCI Free Tier |
| **Durum Sözlüğü** | Tamamlandı / Devam Ediyor / Başlanmadı / Engellendi |

---

## Kilometre Taşları

| Kilometre Taşı | Hedef Tarih | Odak | Durum |
|-----------------|-------------|------|-------|
| **M1: Pilot Demo** | 28 Şubat 2026 | Staging düzeltme + Scribe/Trace/Proto golden path + pilot katılım | **Devam Ediyor** (66/66 görev + Platform Polish 2026-02-17: orphan temizlik, UI transitions, skeleton, log viewer, Docker fullstack, E2E; staging smoke 13/13) |
| **M2: Stabilizasyon** | 31 Mart 2026 | Hata düzeltme, pilot geri bildirim, pg_trgm prototip, tez taslağı | Başlanmadı |
| **M3: Mezuniyet** | Mayıs 2026 | Final rapor, sunum, demo video, teslim paketi | Başlanmadı |

---

## Faz Genel Bakış

### Tamamlanmış Fazlar

| Faz | İsim | Tarih Aralığı | Durum |
|-----|------|---------------|-------|
| 0.1 | Temel Kurulum | 1-7 Kasım 2025 | Tamamlandı |
| 0.2 | Mimari Tanımlama | 8-17 Kasım 2025 | Tamamlandı |
| 0.3 | Çekirdek Motor İskelesi | 18-27 Kasım 2025 | Tamamlandı |
| 0.4 | Web Shell + Temel Motor | 28 Kasım - 4 Aralık 2025 | Tamamlandı |
| 1 | Scribe/Trace/Proto Erken Erişim | 13-25 Aralık 2025 | Tamamlandı |
| 1.5 | Loglama + Gözlemlenebilirlik Katmanı | 26 Aralık 2025 - 9 Ocak 2026 | Tamamlandı |
| 2 | Cursor-Esinli UI + Scribe Konsolu | 10 Ocak - 6 Şubat 2026 | Tamamlandı |

### Aktif Faz

| Faz | İsim | Tarih Aralığı | Durum |
|-----|------|---------------|-------|
| **S0.5** | **Staging Düzeltme + Pilot Demo** | **7-28 Şubat 2026** | **Devam Ediyor** |

**S0.5 Sprint'leri:**

| Sprint | Tarihler | Odak | İş Akışları | İlerleme |
|--------|----------|------|-------------|----------|
| S0.5.0 | 7-9 Şub | Staging base URL düzeltme + trust-proxy + deploy | WS-OPS | ✅ 8/8 görev tamamlandı |
| S0.5.1 | 10-21 Şub | Pilot erişim + agent güvenilirliği | WS-WAITLIST, WS-AGENTS | ✅ 11/11 görev tamamlandı |
| S0.5.2 | 10-23 Şub | Demo UX + RAG araştırma | WS-UX, WS-RAG | ✅ 7/7 görev tamamlandı |
| S0.5.3 | 24-28 Şub | KG kanıt + demo senaryosu + M1 + Live Agent Canvas | WS-QA, WS-UX | ✅ 5/5 görev tamamlandı |

### Gelecek Fazlar

| Faz | İsim | Tarih Aralığı | Durum |
|-----|------|---------------|-------|
| M2 | Stabilizasyon + Akademik Hazırlık | 1-31 Mart 2026 | Başlanmadı |
| M3 | Mezuniyet Teslimi | Nisan-Mayıs 2026 | Başlanmadı |

---

## M1: Pilot Demo — Tamamlanma Kriterleri (28 Şubat 2026)

- [x] Staging'de localhost referansı sıfır (bundle grep kontrolü)
- [x] Health/ready/version endpoint'leri 200 dönüyor
- [x] Agent yönlendirme: `/agents/*` kanonik, eski rotalar yönlendiriliyor
- [x] Hata durumlarında kullanıcıya anlaşılır mesaj
- [x] Logo tüm yüzeylerde güncel (full wordmark korunarak A-mark only favicon + compact UI güncellemesi, 2026-02-11)
- [x] E-posta/şifre kayıt + giriş çalışıyor (staging) — Resend.com domain verified, `noreply@akisflow.com` aktif (2026-02-12)
- [x] OAuth yönlendirmeleri staging alanında çalışıyor — Google + GitHub (2026-02-10)
- [x] Scribe golden path çalışıyor — staging API dry-run completed, plan+preview+critiques+diagnostics (2026-02-12)
- [x] Trace golden path çalışıyor — staging API completed, testPlan+coverageMatrix+artifacts (2026-02-12)
- [x] Proto golden path çalışıyor — staging API completed, artifacts+critique+reflectionChecks (2026-02-12)
- [x] Pilot katılım akışı çalışıyor (2026-02-09)
- [x] Demo senaryosu yazılmış (2026-02-09) — prova bekliyor
- [x] KG kanıt dokümanı mevcut (2026-02-09)

---

## M2: Stabilizasyon + 4 Pillar MVP — Tamamlanma Kriterleri (31 Mart 2026)

> **Stratejik Hedef:** [`docs/planning/AKIS_OPERATIONAL_PLAYBOOK.md`](planning/AKIS_OPERATIONAL_PLAYBOOK.md)  
> **Uygulama Haritası:** [`docs/planning/PLAYBOOK_IMPLEMENTATION_MAP.md`](planning/PLAYBOOK_IMPLEMENTATION_MAP.md)  
> **Vizyon:** [`docs/planning/SOCIAL_PLATFORM_VISION.md`](planning/SOCIAL_PLATFORM_VISION.md)

### Tamamlanma Kriterleri

- [ ] Pilot geri bildirimleri toplanmış ve sınıflandırılmış
- [ ] P0/P1 hatalar sıfır
- [ ] Golden path başarı oranı %90+
- [ ] Tez taslağı: giriş + literatür + yöntem
- [ ] Demo videosu kaydedilmiş (5-10 dk)
- [ ] **P1 (Knowledge Integrity): Groundedness score + cite-or-block enforcement MVP**
- [ ] **P2 (Agent Verification): Scribe verification gates (4 metrik + eşik)**
- [ ] **P3 (Freshness): Freshness scheduler + GitHub releases sinyal toplama**
- [ ] **P4 (UI/UX Integrity): Citation badge + confidence indicator + freshness label bileşenleri**

### M2 Sprint Planı (Playbook 4 Pillar)

> 22 görev, 3 sprint'e dağıtılmış. Detaylar → [`PLAYBOOK_IMPLEMENTATION_MAP.md`](planning/PLAYBOOK_IMPLEMENTATION_MAP.md)

| Sprint | Tarih | Odak | Görev Sayısı |
|--------|-------|------|-------------|
| Sprint 1 (Hafta 1-2) | 1-14 Mart | P1: GroundednessScorer + ClaimDecomposer; P2: VerificationGateEngine + ScribeGates + RiskProfiles | 5 |
| Sprint 2 (Hafta 2-3) | 10-21 Mart | P1: ConflictDetector + CiteOrBlock; P2: Trace/ProtoGates; P3: Scheduler + GitHubReleases; P4: Citation/Confidence/Freshness/Conflict UI | 11 |
| Sprint 3 (Hafta 3-4) | 17-31 Mart | P1: RAG integration; P2: Orchestrator gate; P3: CVE + Approval workflow; P4: Inline provenance | 5 |

### M2-RAG: Semantic Retrieval Entegrasyonu

> **Plan:** [`docs/planning/RAG_INTEGRATION_PLAN_M2.md`](planning/RAG_INTEGRATION_PLAN_M2.md)  
> **Prototip:** `~/my_small_llm/` (tamamlandı 2026-02-12)

| Görev | Açıklama | Durum |
|-------|----------|-------|
| M2-RAG-1 | Python RAG microservice (FastAPI + FAISS + sentence-transformers) | Başlanmadı |
| M2-RAG-2 | Hybrid semantic + keyword search (`KnowledgeRetrievalService` genişletme) | Tamamlandı (2026-02-16) |
| M2-RAG-3 | RAG Evaluation UI (5 boyutlu kalite + halüsinasyon tespiti) | Tamamlandı (2026-02-16) |
| M2-RAG-4 | Knowledge Base yönetim UI (upload, indeks, semantic search test) | Tamamlandı (2026-02-16) |

### M2 — 4 Pillar Görevleri

| Görev ID | Pillar | Görev | Durum |
|----------|--------|-------|-------|
| M2-KI-1 | P1 | GroundednessScorer service (claim extraction + evidence matching + 0-1 score) | Tamamlandı (2026-02-15) |
| M2-KI-2 | P1 | ClaimDecomposer utility (AI-powered atomic claim extraction) | Tamamlandı (2026-02-15) |
| M2-KI-3 | P1 | ConflictDetector service (kaynak çakışma tespiti) | Tamamlandı (2026-02-15) |
| M2-KI-4 | P1 | Cite-or-block gate (AgentOrchestrator enforcement) | Tamamlandı (2026-02-15) |
| M2-KI-5 | P1 | RAG microservice entegrasyonu | Tamamlandı (2026-02-16) |
| M2-VF-1 | P2 | VerificationGateEngine service (configurable thresholds) | Tamamlandı (2026-02-15) |
| M2-VF-2 | P2 | Scribe verification gates (4 metrik + eşik) | Tamamlandı (2026-02-15) |
| M2-VF-3 | P2 | Trace verification gates (3 metrik + eşik) | Tamamlandı (2026-02-15) |
| M2-VF-4 | P2 | Proto verification gates (3 metrik + eşik) | Tamamlandı (2026-02-15) |
| M2-VF-5 | P2 | Orchestrator gate integration (completeJob check) | Tamamlandı (2026-02-15) |
| M2-VF-6 | P2 | Agent risk profile config (P0/P1/P2 → gate strictness) | Tamamlandı (2026-02-15) |
| M2-FP-1 | P3 | FreshnessScheduler (stale knowledge detection) | Tamamlandı (2026-02-15) |
| M2-FP-2 | P3 | GitHub Releases sinyal (MCP adapter genişletme) | Tamamlandı (2026-02-16) |
| M2-FP-3 | P3 | CVE/Security Advisory sinyal entegrasyonu | Tamamlandı (2026-02-16) |
| M2-FP-5 | P3 | Knowledge approval workflow (API + UI) | Tamamlandı (2026-02-16) |
| M2-UI-1 | P4 | CitationBadge component (4 state) | Tamamlandı (2026-02-15) |
| M2-UI-2 | P4 | ConfidenceIndicator component (0-100 + renk) | Tamamlandı (2026-02-15) |
| M2-UI-3 | P4 | FreshnessLabel component (tarih + stale/fresh) | Tamamlandı (2026-02-15) |
| M2-UI-4 | P4 | ConflictWarning component (turuncu uyarı) | Tamamlandı (2026-02-15) |
| M2-UI-5 | P4 | ArtifactPreview inline citation + provenance | Başlanmadı |
| M2-UI-6 | P4 | i18n: citation/confidence/freshness key'leri | Tamamlandı (2026-02-15) |

### M2+ Spike: Career Assistant (Freelance Automation)

> **Spec:** [`carreer_assistant/docs/CAREER_ASSISTANT_SPEC.md`](../carreer_assistant/docs/CAREER_ASSISTANT_SPEC.md)
> **Mimari:** [`carreer_assistant/docs/FREELANCE_AGENT_ARCHITECTURE.md`](../carreer_assistant/docs/FREELANCE_AGENT_ARCHITECTURE.md)

| Görev ID | Görev | Durum |
|----------|-------|-------|
| M2-CA-0 | Spec dokümanları + proje iskelesi + şablonlar | Tamamlandı (2026-02-13) |
| M2-CA-1 | Skorlama motoru (6 boyut) + sert filtreler + günlük limitler | Tamamlandı (2026-02-13) |
| M2-CA-2 | Platform adaptörleri (Upwork GraphQL, Freelancer REST, Fiverr/Bionluk/LinkedIn browser) | Tamamlandı (2026-02-13) |
| M2-CA-3 | AI entegrasyonu (OpenAI proposal üretimi, PersonaEngine) | Tamamlandı (2026-02-13) |
| M2-CA-4 | Telegram bildirim botu + onay workflow | Tamamlandı (2026-02-13) |
| M2-CA-5 | CLI aracı (discover, score, apply, status, profile, approve) + 63 test | Tamamlandı (2026-02-13) |
| M2-CA-6 | Platform API credential'ları + gerçek entegrasyon testi | Başlanmadı |
| M2-CA-7 | AKIS AgentFactory entegrasyonu (CareerAgent olarak kayıt) | Başlanmadı |

### S0.5.4 Spike: AKIS Workstream Marketplace MVP

> **PRD:** [`docs/marketplace/PRD.md`](marketplace/PRD.md)  
> **Mimari:** [`docs/marketplace/MARKETPLACE_ARCHITECTURE.md`](marketplace/MARKETPLACE_ARCHITECTURE.md)  
> **Runbook:** [`docs/marketplace/HOW_TO_RUN_MVP.md`](marketplace/HOW_TO_RUN_MVP.md)

| Görev ID | Görev | Durum |
|----------|-------|-------|
| S0.5.4-MKT-1 | Marketplace ürün doküman paketi + karar kilitleri | Tamamlandı (2026-02-13) |
| S0.5.4-MKT-2 | Backend schema/migration + API (`/api/profile`, `/api/jobs`, `/api/jobs/ingest`, `/api/match/run`, `/api/match`, `/api/proposals/generate`) | Tamamlandı (2026-02-13) |
| S0.5.4-MKT-3 | Frontend routes (`/marketplace`, `/app`, `/app/onboarding`, `/app/jobs`, `/app/matches`, `/app/proposals`) | Tamamlandı (2026-02-13) |
| S0.5.4-MKT-4 | Explainability + trust safeties (`matches.explanation`, `audit_log`, proposal feature flag) | Tamamlandı (2026-02-13) |
| S0.5.4-MKT-5 | Quality gates + smoke doğrulama + HOW_TO_RUN_MVP | Tamamlandı (2026-02-13) |

---

## M3: Mezuniyet — Tamamlanma Kriterleri (Mayıs 2026)

- [ ] Final rapor tamamlanmış ve onaylanmış
- [ ] Sunum slaytları (15-20 slayt)
- [ ] Demo videosu final versiyonu
- [ ] Canlı demo en az 2 kez prova edilmiş
- [ ] Teslim paketi: kod + dokümanlar + video + sunum

---

## Kapsam Kuralları

### Kapsam İçi (S0.5)
- Scribe, Trace, Proto agent'ları
- Staging güvenilirliği + base URL doğruluğu
- Pilot katılım UX (minimal)
- Geri bildirim yakalama
- Hafif RAG (bağlam paketleri; pg_trgm Mart)

### Kapsam Dışı
- Developer / Coder agent
- Yeni entegrasyonlar (Slack, Teams)
- RBAC / yönetici paneli
- Fiyatlandırma/faturalandırma uygulaması
- Auth yeniden tasarımı
- Ağır vector DB / harici RAG servisleri
- Üretim ortamı (staging yeterli)
- Mobil uygulama

---

## Mimari Kısıtlamalar (Pazarlık Edilemez)

| Bileşen | Teknoloji | Kural |
|---------|-----------|-------|
| Backend | Fastify + TypeScript + Drizzle | Express/Nest/Prisma yasak |
| Frontend | React + Vite + Tailwind | SSR/Next.js yok |
| Veritabanı | PostgreSQL 16 | OCI Free Tier |
| Entegrasyonlar | Sadece MCP adaptörleri | Doğrudan vendor SDK yok |
| Kimlik Doğrulama | Mevcut JWT + e-posta/şifre + OAuth | Yeniden tasarlanmayacak |
| Dağıtım | OCI VM + Caddy + Docker Compose | Tek VM staging |

---

## Referans Dokümanlar

| Doküman | Amaç |
|---------|------|
| [`docs/planning/DELIVERY_PLAN_S0.5_FEB_TO_GRADUATION.md`](planning/DELIVERY_PLAN_S0.5_FEB_TO_GRADUATION.md) | Kanonik plan (tek doğru kaynak) |
| [`docs/planning/AKIS_OPERATIONAL_PLAYBOOK.md`](planning/AKIS_OPERATIONAL_PLAYBOOK.md) | Operasyonel hedef doküman (4 Pillar + Moonshot) |
| [`docs/planning/PLAYBOOK_IMPLEMENTATION_MAP.md`](planning/PLAYBOOK_IMPLEMENTATION_MAP.md) | Playbook → codebase gap analizi + aksiyon planı |
| [`docs/planning/WBS_EXPORT_S0.5.xlsx_compatible.md`](planning/WBS_EXPORT_S0.5.xlsx_compatible.md) | WBS + CSV |
| [`docs/planning/RESEARCH_BRIEF_S0.5_STAGING_RAG_AGENTS.md`](planning/RESEARCH_BRIEF_S0.5_STAGING_RAG_AGENTS.md) | Araştırma notu |
| [`docs/NEXT.md`](NEXT.md) | Anlık eylem öğeleri |
| [`docs/planning/RAG_INTEGRATION_PLAN_M2.md`](planning/RAG_INTEGRATION_PLAN_M2.md) | M2 RAG entegrasyon planı |
| [`docs/PROJECT_TRACKING_BASELINE.md`](PROJECT_TRACKING_BASELINE.md) | Geçmiş takvim çapası |
| [`docs/deploy/OCI_STAGING_RUNBOOK.md`](deploy/OCI_STAGING_RUNBOOK.md) | Staging operasyonları |
| [`carreer_assistant/docs/CAREER_ASSISTANT_SPEC.md`](../carreer_assistant/docs/CAREER_ASSISTANT_SPEC.md) | Career Assistant + Freelance Automation (M2+ spike) |
| [`docs/marketplace/PRD.md`](marketplace/PRD.md) | AKIS Workstream Marketplace MVP ürün/mimari paketi |

---

*Yol haritası, kanonik plan ile senkronize tutulur. Detay ve görev takibi için NEXT.md ve WBS tablosuna başvurun.*
