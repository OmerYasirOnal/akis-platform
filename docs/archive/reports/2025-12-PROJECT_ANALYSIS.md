# 🔍 AKIS Platform - Kapsamlı Proje Analizi

**Analiz Tarihi:** 2025-12-23  
**Analizi Yapan:** Antigravity AI  
**Proje Adı:** AKIS Platform — Yapay Zekâ Ajanı İş Akışı Motoru

---

## 📊 Executive Summary

**AKIS Platform**, yazılım geliştirme süreçlerindeki tekrarlayan görevleri otomatikleştiren bir **AI Agent Workflow Engine**'dir. Proje, bir **bitirme projesi** olarak geliştirilmekte olup, **Ömer Yasir Önal** tarafından yürütülmektedir.

### 🎯 Projenin Amacı
Yazılım ekiplerinin:
1. **Dokümantasyon güncelleme** (Scribe Agent)
2. **Test otomasyonu üretimi** (Trace Agent)  
3. **MVP prototipleme** (Proto Agent)

görevlerini otomatikleştirerek **zaman kazandırmak** ve ekiplerin **yüksek katma değerli işlere** odaklanmasını sağlamak.

---

## 🏗️ Mimari Genel Bakış

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐  │
│  │ Dashboard UI│  │ Auth Context│  │ Pages & Components          │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  Backend (Fastify + Node.js)                        │
│  ┌─────────────┐  ┌───────────────────────────────────────────────┐ │
│  │  REST API   │  │              Agent Orchestrator               │ │
│  └─────────────┘  │  ┌──────────┐ ┌──────────┐ ┌──────────┐      │ │
│                   │  │  Scribe  │ │  Trace   │ │  Proto   │      │ │
│                   │  └──────────┘ └──────────┘ └──────────┘      │ │
│                   └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Services Layer                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │MCP Adapters │  │Auth Service │  │  AI Service │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
└─────────────────────────────────────────────────────────────────────┘
         │                                    │
         ▼                                    ▼
┌─────────────────────┐              ┌─────────────────────┐
│ External Services   │              │     Database        │
│ • GitHub MCP Server │              │ PostgreSQL + Drizzle│
│ • Jira/Confluence   │              └─────────────────────┘
│ • OpenRouter/LLM    │
└─────────────────────┘
```

---

## 📁 Proje Yapısı

| Klasör | Açıklama | Teknoloji |
|--------|----------|-----------|
| `frontend/` | React SPA Dashboard | React 19, Vite 7, Tailwind CSS 4 |
| `backend/` | API Server & Agent Engine | Fastify 4, Drizzle ORM, PostgreSQL |
| `mcp-gateway/` | MCP Gateway for GitHub | Node.js JSON-RPC Bridge |
| `docs/` | Proje Dokümantasyonu | 40+ markdown dosya |
| `scripts/` | Otomasyon Scriptleri | Bash (mcp-doctor, pr-autoflow) |

---

## 🤖 Agent Sistemi

### 1. AKIS Scribe (📝)
**Durum:** ✅ Aktif geliştirme (S0.4.6)

- Kod değişikliklerini analiz ederek teknik dokümantasyonu günceller
- GitHub entegrasyonu: Branch oluşturma, dosya commit, PR açma
- Dry-run modu ve Write modu destekler
- MCP protokolü üzerinden çalışır

### 2. AKIS Trace (🧪)
**Durum:** 📋 MVP Planlandı (S1.0.2)

- Jira biletlerinden kabul kriterleri çıkarır
- Test senaryoları üretir
- Otomasyon test koduna (Cucumber) dönüştürür

### 3. AKIS Proto (🚀)
**Durum:** 📋 MVP Planlandı (S1.0.2)

- Gereksinimlerden çalışan prototip üretir
- Analiz → Tasarım → Kod → Test pipeline'ı
- End-to-end MVP oluşturma

---

## 📈 Mevcut İlerleme Durumu

### Phase Durumları

| Faz | Durum | Açıklama |
|-----|-------|----------|
| 0.1 – 0.3 | ✅ Tamamlandı | Temeller, Mimari, Çekirdek Motor |
| **0.4** | **🔄 Devam Ediyor** | Web Shell + Basit Motor (S0.4.6) |
| 0.5 | 📋 Planlandı | Motor + GitHub Entegrasyonu |
| 1 | 📋 Planlandı | Scribe • Trace • Proto – Early Access |
| 1.5 | 📋 Planlandı | Logging • Token Trace • Time-Saved v1 |
| 2+ | 📋 Gelecek | OCI Hosting, Early Users, Final Teslim |

### Mevcut Sprint: S0.4.6 — Scribe Config Dashboard

| Adım | Açıklama | Durum |
|------|----------|-------|
| Step 1 | Pre-flight checks (GitHub connection) | ✅ Tamamlandı |
| Step 2 | SearchableSelect for Owner/Repo/Branch | ✅ Tamamlandı |
| Step 3 | Target platform configuration | 🔄 Devam Ediyor |
| Step 4 | Advanced options | 📋 Bekliyor |
| Step 5 | Review and save | 📋 Bekliyor |

---

## 🎯 Kritik Kilometre Taşları

| Milestone | Tarih | Sorumlu | Durum |
|-----------|-------|---------|-------|
| **Phase 1 Functional Complete** | 2025-12-25 | Yasir | 📋 2 gün kaldı |
| SDTA hazır | 2025-12-26 | Ayşe | 📋 Planlandı |
| Proje bitiş hedefi | 2026-03-31 | Yasir | 📋 Uzun vadeli |

---

## 💻 Teknoloji Stack

### Backend
- **Runtime:** Node.js ≥ 20
- **Framework:** Fastify 4.26
- **ORM:** Drizzle ORM 0.33
- **Database:** PostgreSQL
- **Auth:** JWT + bcryptjs
- **Validation:** Zod

### Frontend
- **Framework:** React 19.1
- **Build Tool:** Vite 7.1
- **Styling:** Tailwind CSS 4.1
- **Routing:** React Router 7.9
- **Testing:** Vitest + Playwright + Testing Library

### Infrastructure
- **Target:** OCI Free Tier (4 OCPU, 24GB RAM ARM)
- **Container:** Docker Compose (MCP Gateway)
- **CI/CD:** GitHub Actions

---

## ✅ Tamamlanan Özellikler

### Kimlik Doğrulama & Kullanıcı Yönetimi
- [x] Çok adımlı e-posta/şifre kayıt sistemi (Cursor tarzı)
- [x] 6 haneli e-posta doğrulama kodu
- [x] JWT tabanlı session yönetimi (7 gün geçerli)
- [x] GitHub OAuth entegrasyonu
- [x] Veri paylaşım onayı (GDPR uyumu)

### MCP Gateway & GitHub Entegrasyonu
- [x] HTTP-to-stdio bridge (JSON-RPC)
- [x] Docker Compose orchestration
- [x] mcp-doctor.sh otomasyon scripti
- [x] Structured error codes (MCP_UNREACHABLE, MCP_TIMEOUT, etc.)
- [x] Correlation ID tracking

### Job Execution & Observability
- [x] Step-by-step execution trace
- [x] Documents read tracking
- [x] Files produced/modified logging
- [x] Tabbed Job Details UI (Overview | Timeline | Documents | Files | Plan | Audit | Raw)
- [x] Secret redaction (güvenlik)

### CI/CD
- [x] GitHub Actions workflow
- [x] Backend: PostgreSQL 16 service, pnpm cache, Drizzle migrations
- [x] Frontend: npm, typecheck, lint, test
- [x] akis-pr-autoflow.sh otomasyon scripti

---

## 📊 Test Durumu

| Alan | Test Sayısı | Durum |
|------|-------------|-------|
| Backend | 133 | ✅ Geçiyor |
| Frontend | Stable | ✅ Deterministik polling |
| Lint/Typecheck | - | ✅ Sıfır hata |

---

## 🔮 Gelecek Planlar (Roadmap)

### Kısa Vadeli (Bu Hafta — 2025-12-25)
1. S0.4.6 Steps 3-5 tamamlama
2. Phase 1 Functional Complete milestone'u
3. Scribe temel akış (Orchestrator routing + UI output)

### Orta Vadeli (Ocak 2026)
1. Job loglama v1
2. Token/cost tracking
3. Time-saved v1 metrikleri
4. OCI hosting + pilotlar

### Uzun Vadeli (Mart 2026)
1. Early users programı
2. Marketplace taslağı
3. Marka, içerik, final teslim

---

## 🚨 Risk Analizi

| Risk | Seviye | Açıklama |
|------|--------|----------|
| Zaman Kısıtı | 🟡 Orta | Phase 1 milestone 2 gün içinde |
| Kaynak Kısıtı | 🟡 Orta | 2 kişilik ekip, sıfır bütçe |
| Teknik Borç | 🟢 Düşük | Yakın zamanda refactoring yapıldı |
| Dokümantasyon | 🟢 Düşük | Kapsamlı dokümantasyon mevcut |

---

## 💡 Değerlendirme & Öneriler

### 👍 Güçlü Yönler

1. **Mükemmel Dokümantasyon:** 40+ markdown dosya, detaylı planning chain
2. **Sağlam Mimari:** Modular Monolith + Central Orchestrator, OCI optimize
3. **Modern Tech Stack:** Fastify, Drizzle, React 19, Vite 7
4. **Güvenlik Bilinçli:** JWT, bcrypt, secret redaction, rate limiting
5. **CI/CD Otomasyonu:** GitHub Actions + custom scripts

### 🎯 İyileştirme Önerileri

1. **E2E Test Coverage:** Playwright testleri henüz tam kurulu değil
2. **Trace & Proto MVP:** Scribe'dan sonra hızlıca başlanmalı
3. **Error Handling:** Daha kapsamlı kullanıcı-dostu hata mesajları
4. **Performance Budgets:** Core Web Vitals monitoring

### 📌 Şu Anda Yapılması Gerekenler

1. **S0.4.6 Step 3-5** → Target platform, advanced options, review
2. **Phase 1 Milestone** → 25 Aralık deadline
3. **SDTA Dokümanı** → Ayşe, 26 Aralık

---

## 🏁 Sonuç

**AKIS Platform** iyi planlanmış, modern teknolojilerle geliştirilmiş ve kapsamlı dokümantasyona sahip bir projedir. **Phase 0.4** içindeki S0.4.6 sprint'i devam etmekte olup, **2 gün içinde Phase 1 milestone**'una ulaşılması hedeflenmektedir.

Proje, OCI Free Tier kısıtları göz önünde bulundurularak optimize edilmiş lightweight bir mimariye sahiptir. GitHub MCP entegrasyonu çalışır durumda ve Scribe agent temel işlevselliğe sahip.

**Genel Değerlendirme:** 🟢 **İyi durumda, planına uygun ilerliyor.**

---

*Bu analiz, proje dokümantasyonu, kaynak kodları ve konfigürasyon dosyaları incelenerek hazırlanmıştır.*
