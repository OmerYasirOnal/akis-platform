# AKIS Platform

**Adaptive Knowledge Integrity System** — Yapay Zeka Tabanlı Etkileşimli Yazılım Geliştirme Platformu

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://typescriptlang.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![Fastify](https://img.shields.io/badge/Fastify-4-black?logo=fastify)](https://fastify.io)
[![Claude API](https://img.shields.io/badge/Claude_API-Sonnet_4.6-orange)](https://anthropic.com)

---

## Nedir?

AKIS, kullanıcının doğal dilde anlattığı bir fikri otomatik olarak çalışır durumda bir yazılım projesine dönüştüren AI tabanlı bir platformdur. Üç özelleştirilmiş AI ajan sıralı bir pipeline ile çalışır:

```
Fikir → [Scribe] → Spec → [İnsan Onayı] → [Proto] → Kod → [Trace] → Testler → ✓ Proje
```

### Ajanlar

| Ajan | Rol | Girdi | Çıktı |
|------|-----|-------|-------|
| **Scribe** | Spec Yazıcı | Kullanıcı fikri | Yapılandırılmış spesifikasyon (Problem Tanımı, Kullanıcı Hikayeleri, Kabul Kriterleri) |
| **Proto** | MVP Oluşturucu | Onaylanmış spec | GitHub'a push edilmiş çalışır scaffold |
| **Trace** | Test Yazıcı | Proto'nun kodu | Playwright E2E testleri + kapsam matrisi |

### Doğrulama Zinciri

AKIS'in temel farkı "Knowledge Integrity" yaklaşımıdır:

1. **Scribe** → Öz-sorgulama + öz-inceleme ile spec doğrular
2. **İnsan Kapısı** → Kullanıcı spec'i onaylar veya reddeder
3. **Proto** → Spec uyumu + scaffold bütünlüğü kontrolü
4. **Trace** → AC-Test izlenebilirlik matrisi

Her adım hem kendi çıktısını doğrular hem de girdisine bağlılığını kanıtlar.

---

## Özellikler

- **3 AI Ajan Pipeline** — Scribe → Proto → Trace sıralı çalışma
- **İnsan Kapısı** — Spec onayı ile kalite kontrolü
- **Gerçek Zamanlı İzleme** — SSE ile canlı ajan aktivite akışı
- **Canlı Önizleme** — StackBlitz ile tarayıcıda çalışan uygulama
- **Kod Görüntüleyici** — Syntax highlighted dosya inceleme
- **GitHub Entegrasyonu** — Otomatik repo oluşturma, branch, PR
- **Türkçe Arayüz** — Tamamen Türkçeleştirilmiş kullanıcı deneyimi
- **Ajan Metrikleri** — Performans, güven skoru, başarı oranı
- **Modern UI** — Glassmorphism toast, responsive panel layout

---

## Mimari

```
┌─────────────────────────────────────────────────────────┐
│                  Frontend (React 19 + Vite 7)           │
│  Dashboard │ Chat │ Preview │ Code Viewer │ File Manager│
├─────────────────────────────────────────────────────────┤
│                  SSE Activity Stream                    │
├─────────────────────────────────────────────────────────┤
│               Backend (Fastify 4 + TypeScript)          │
│  Pipeline API │ Auth │ GitHub Service │ AI Service      │
├─────────────────────────────────────────────────────────┤
│              Pipeline Orchestrator                      │
│  ┌──────┐    ┌──────┐    ┌──────┐    ┌──────┐         │
│  │Scribe│ →  │Human │ →  │Proto │ →  │Trace │         │
│  │Agent │    │Gate  │    │Agent │    │Agent │         │
│  └──────┘    └──────┘    └──────┘    └──────┘         │
├─────────────────────────────────────────────────────────┤
│  PostgreSQL │ Claude API (Sonnet 4.6) │ GitHub API      │
└─────────────────────────────────────────────────────────┘
```

---

## Teknolojiler

| Katman | Teknoloji |
|--------|-----------|
| **Frontend** | React 19, TypeScript, Vite 7, Tailwind CSS 4, StackBlitz SDK |
| **Backend** | Fastify 4, TypeScript, Drizzle ORM, PostgreSQL 16 |
| **AI** | Anthropic Claude API (Sonnet 4.6), OpenAI, OpenRouter |
| **DevOps** | Docker, Caddy, OCI ARM64 (Free Tier) |
| **Test** | Vitest (1329 backend unit test), Playwright (E2E) |

---

## Kurulum

### Gereksinimler

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose
- Anthropic API anahtarı
- GitHub OAuth uygulaması (opsiyonel)

### Hızlı Başlangıç

```bash
# Repo'yu klonla
git clone https://github.com/OmerYasirOnal/akis-platform-portfolio.git
cd akis-platform-portfolio

# Veritabanını başlat
./scripts/db-up.sh

# Backend
cd backend
cp .env.example .env   # API anahtarlarını düzenle
pnpm install
pnpm dev               # http://localhost:3000

# Frontend (ayrı terminal)
cd frontend
pnpm install
pnpm dev               # http://localhost:5173
```

Tarayıcıda: `http://localhost:5173/dashboard`

---

## Pipeline Akışı

1. **Fikir Gir** → "Kişisel finans takip uygulaması"
2. **Scribe Sorar** → 3-4 clarification sorusu (wizard ile yanıtla)
3. **Spec Üretilir** → Problem Tanımı, Kullanıcı Hikayeleri, Kabul Kriterleri
4. **İnsan Onaylar** → Spec'i incele, onayla veya reddet
5. **Proto Oluşturur** → React scaffold + GitHub push
6. **Trace Yazar** → Playwright E2E testleri
7. **Sonuç** → Çalışır uygulama + testler + canlı önizleme

---

## Inter-Agent Contract

```typescript
// Scribe çıktısı → Proto girdisi
Scribe.output → { spec: StructuredSpec, confidence: number, reviewNotes: ReviewNotes }
Proto.input   → { spec: StructuredSpec, repoName: string }

// Proto çıktısı → Trace girdisi
Proto.output  → { branch: string, repo: string, files: FileInfo[], verificationReport: Report }
Trace.input   → { repoOwner: string, repo: string, branch: string, spec: StructuredSpec }
Trace.output  → { testFiles: TestFile[], coverageMatrix: CoverageMatrix, traceability: Traceability[] }
```

---

## Proje Yapısı

```
devagents/
├── backend/                   Fastify 4 + TypeScript
│   └── src/
│       ├── pipeline/          Pipeline kodu (agents, orchestrator, contracts)
│       │   ├── agents/        Scribe, Proto, Trace ajanları
│       │   ├── core/          Orchestrator, FSM, error handling
│       │   └── adapters/      GitHub MCP/REST adapter'ları
│       ├── api/               REST API route'ları
│       ├── db/                Drizzle ORM schema
│       └── services/          AI, email, auth servisleri
├── frontend/                  React 19 + Vite 7 SPA
│   └── src/
│       ├── pages/dashboard/   Overview, Workflows, Agents, Settings
│       ├── components/        Chat, Preview, StatusBadge, Pipeline
│       └── services/api/      HTTP client'lar
├── mcp-gateway/               MCP adapter layer
├── deploy/                    Docker, Caddy, deploy script'leri
└── docs/                      Mimari ve API dokümantasyonu
```

---

## Tez Bilgileri

| | |
|---|---|
| **Üniversite** | Fatih Sultan Mehmet Vakıf Üniversitesi |
| **Bölüm** | Bilgisayar Mühendisliği |
| **Öğrenci** | Ömer Yasir Önal (2221221562) |
| **Danışman** | Dr. Öğr. Üyesi Nazlı Doğan |
| **Tema** | LLM Ajanları ile Yapay Zeka Tabanlı Etkileşimli Yazılım Geliştirme Platformu |

---

## Lisans

Bu proje Fatih Sultan Mehmet Vakıf Üniversitesi Bilgisayar Mühendisliği Bölümü bitirme projesi kapsamında geliştirilmiştir.
