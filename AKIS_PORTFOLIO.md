# AKIS — PORTFOLIO REPO + README

.env dosyalarına ASLA dokunma. API çağrısı YAPMA.

---

## AMAÇ

Public portfolio repo'yu güncelle. Profesyonel README, mimari diyagram, ekran görüntüsü referansları.

**Repo:** `OmerYasirOnal/akis-platform-portfolio` (public mirror)

---

## ADIM 0 — MEVCUT PORTFOLIO REPO'YU KONTROL ET

```bash
# Portfolio repo var mı ve nerede?
find /Users -maxdepth 4 -name "akis-platform-portfolio" -type d 2>/dev/null | head -3
# Yoksa: private repo'nun yapısını kullan
ls -la /Users/omeryasironal/Projects/bitirme_projesi/akis-platform-devolopment/devagents/
```

---

## ADIM 1 — README.md OLUŞTUR

Proje root'unda kapsamlı README.md oluştur:

```markdown
# AKIS Platform

**Adaptive Knowledge Integrity System** — Yapay Zeka Tabanlı Etkileşimli Yazılım Geliştirme Platformu

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://typescriptlang.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://reactjs.org)
[![Fastify](https://img.shields.io/badge/Fastify-4-black?logo=fastify)](https://fastify.io)
[![Claude API](https://img.shields.io/badge/Claude_API-Sonnet_4.6-orange)](https://anthropic.com)

---

## Nedir?

AKIS, kullanıcının doğal dilde anlattığı bir fikri otomatik olarak çalışır durumda bir yazılım projesine dönüştüren AI-tabanlı bir platformdur. Üç özelleştirilmiş AI ajan sıralı bir pipeline ile çalışır:

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

- 🤖 **3 AI Ajan Pipeline** — Scribe → Proto → Trace sıralı çalışma
- 👤 **İnsan Kapısı** — Spec onayı ile kalite kontrolü
- 📡 **Gerçek Zamanlı İzleme** — SSE ile canlı ajan aktivite akışı
- 🖥️ **Canlı Önizleme** — StackBlitz ile tarayıcıda çalışan uygulama
- 📁 **Kod Görüntüleyici** — Syntax highlighted dosya inceleme
- 🔀 **GitHub Entegrasyonu** — Otomatik repo oluşturma, branch, PR
- 🌐 **Türkçe Arayüz** — Tamamen Türkçeleştirilmiş kullanıcı deneyimi
- 📊 **Ajan Metrikleri** — Performans, güven skoru, başarı oranı
- 🎨 **Modern UI** — Glassmorphism toast, responsive panel layout

---

## Mimari

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                │
│  Dashboard │ Chat │ Preview │ Code Viewer │ File Manager │
├─────────────────────────────────────────────────────────┤
│                SSE Activity Stream                       │
├─────────────────────────────────────────────────────────┤
│                 Backend (Fastify + TypeScript)            │
│  Pipeline API │ Auth │ GitHub Service │ AI Service       │
├─────────────────────────────────────────────────────────┤
│            Pipeline Orchestrator                         │
│  ┌──────┐    ┌──────┐    ┌──────┐    ┌──────┐          │
│  │Scribe│ →  │Human │ →  │Proto │ →  │Trace │          │
│  │Agent │    │Gate  │    │Agent │    │Agent │          │
│  └──────┘    └──────┘    └──────┘    └──────┘          │
├─────────────────────────────────────────────────────────┤
│  PostgreSQL │ Claude API (Sonnet 4.6) │ GitHub API       │
└─────────────────────────────────────────────────────────┘
```

---

## Teknolojiler

**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, StackBlitz SDK
**Backend:** Fastify, TypeScript, Drizzle ORM, PostgreSQL
**AI:** Anthropic Claude API (Sonnet 4.6 / Haiku 4.5)
**DevOps:** Docker, Caddy, OCI ARM64
**Test:** Vitest (1329 backend + 275 frontend test)

---

## Kurulum

### Gereksinimler
- Node.js 20+
- Docker & Docker Compose
- Anthropic API anahtarı
- GitHub OAuth uygulaması

### Hızlı Başlangıç

```bash
# Repo'yu klonla
git clone https://github.com/OmerYasirOnal/akis-platform-portfolio.git
cd akis-platform-portfolio

# Veritabanını başlat
docker compose up -d db

# Backend
cd backend
cp .env.example .env  # API anahtarlarını düzenle
npm install
npm run dev

# Frontend (ayrı terminal)
cd frontend
npm install
npm run dev
```

Tarayıcıda: `http://localhost:5173`

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
Scribe.output → { spec: StructuredSpec, confidence: number, reviewNotes: ReviewNotes }
Proto.input   → { spec: StructuredSpec, repoName: string }
Proto.output  → { branch: string, repo: string, files: FileInfo[], verificationReport: Report }
Trace.input   → { repoOwner: string, repo: string, branch: string, spec: StructuredSpec }
Trace.output  → { testFiles: TestFile[], coverageMatrix: CoverageMatrix, traceability: Traceability[] }
```

---

## Tez Bilgileri

**Üniversite:** Fatih Sultan Mehmet Vakıf Üniversitesi
**Bölüm:** Bilgisayar Mühendisliği
**Öğrenci:** Ömer Yasir Önal (2221221562)
**Danışman:** Dr. Öğr. Üyesi Nazlı Doğan
**Tema:** LLM Ajanları ile Yapay Zeka Tabanlı Etkileşimli Yazılım Geliştirme Platformu

---

## Lisans

Bu proje Fatih Sultan Mehmet Vakıf Üniversitesi Bilgisayar Mühendisliği Bölümü bitirme projesi kapsamında geliştirilmiştir.
```

---

## ADIM 2 — .env.example OLUŞTUR

```bash
# backend/.env.example
cat > backend/.env.example << 'EOF'
# AKIS Backend Environment Variables
# Copy this file to .env and fill in your values

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/akis_v2

# Anthropic AI
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Auth
JWT_SECRET=your-jwt-secret-here
AUTH_COOKIE_SECURE=false

# Development
DEV_MODE=true
NODE_ENV=development
PORT=3000
EOF
```

**DİKKAT:** .env dosyasına DOKUNMA. Sadece .env.example oluştur.

---

## ADIM 3 — DOCS KLASÖRÜ

```
docs/
├── ARCHITECTURE.md    — Teknik mimari detayları
├── PIPELINE.md        — Pipeline akış detayları  
├── AGENTS.md          — Ajan prompt stratejileri
└── DEPLOYMENT.md      — Deploy adımları
```

Her dokümanı kısa ama bilgilendirici yaz (her biri 50-100 satır).

---

## ADIM 4 — BUILD KONTROL

```bash
cd frontend && npx tsc --noEmit && npm run build && echo "✓ FE" || echo "✗ FE"
cd ../backend && npx tsc --noEmit && echo "✓ BE" || echo "✗ BE"
```

```
## Portfolio Raporu
- README.md: ✓/✗
- .env.example: ✓/✗  
- docs/ARCHITECTURE.md: ✓/✗
- docs/PIPELINE.md: ✓/✗
- docs/AGENTS.md: ✓/✗
- docs/DEPLOYMENT.md: ✓/✗
- Build: ✓/✗
```
