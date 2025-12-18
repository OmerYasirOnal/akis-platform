# AKIS Platform

**Yapay Zekâ Ajanı İş Akışı Motoru** (AI Agent Workflow Engine)

AKIS Platform, yazılım geliştirme süreçlerindeki tekrarlayan görevleri otomatikleştiren bir otonom ajan platformudur.

## Özellikler

- **AKIS Scribe**: Teknik dokümantasyon güncelleme
- **AKIS Trace**: Test otomasyonu üretimi
- **AKIS Proto**: MVP prototipleme

## Canonical Docs

- [CONTEXT_SCOPE (.cursor)](.cursor/context/CONTEXT_SCOPE.md) – problemin tanımı ve hedefler
- [CONTEXT_ARCHITECTURE (.cursor)](.cursor/context/CONTEXT_ARCHITECTURE.md) – mimari kararlar ve teknoloji yığını
- [UI_DESIGN_SYSTEM](docs/UI_DESIGN_SYSTEM.md) – tasarım token'ları ve komponent kuralları
- [WEB_INFORMATION_ARCHITECTURE](docs/WEB_INFORMATION_ARCHITECTURE.md) – site yapısı ve kullanıcı akışları
- [ROADMAP](docs/ROADMAP.md) – faz ve teslimat planı
- [constraints](docs/constraints.md) – OCI Free Tier ve platform kısıtları
- [Backend API Spec](backend/docs/API_SPEC.md) – Fastify uç noktaları ve sözleşmeler
- [Agent Workflows](backend/docs/AGENT_WORKFLOWS.md) – Plan→Execute→Reflect→Validate yaşam döngüsü

## Teknoloji Stack

- **Backend**: Fastify + TypeScript (Node ≥ 20)
- **Database**: PostgreSQL + Drizzle ORM
- **Frontend**: React (Vite SPA, Next.js kullanılmıyor) + Tailwind CSS
- **Integrations**: MCP (Model Context Protocol) adapters

## Güncel Durum (2025-12-18)

| Phase | Status | Description |
|-------|--------|-------------|
| 0.1–0.3 | ✅ Complete | Temeller, Mimari, Çekirdek Motor |
| **0.4** | **🔄 In Progress** | Web Shell + Basit Motor (S0.4.6 current) |
| 0.5 | 📋 Planned | Motor + GitHub Entegrasyonu |
| 1 | 📋 Planned | Scribe • Trace • Proto – Early Access |

**Next Milestone:** Phase 1 Functional Complete — **2025-12-25** (Scribe job UI'dan çalışır)

---

## Project Tracking & Execution

### Canonical Planning Sources

| Document | Purpose |
|----------|---------|
| [PROJECT_TRACKING_BASELINE.md](docs/PROJECT_TRACKING_BASELINE.md) | Sprint/phase/milestone schedule (from spreadsheet) |
| [NEXT.md](docs/NEXT.md) | Immediate actions + gating criteria |
| [ROADMAP.md](docs/ROADMAP.md) | Phase overview |

### Branch Separation Policy

| Branch | Purpose | Status |
|--------|---------|--------|
| `feat/scribe-config-s0.4.6-wip` | Scribe Config Dashboard implementation | 🔄 Active |
| `docs/project-tracking-baseline-s0.4.6` | Documentation & planning updates | 🔄 Active |
| `main` | Stable production code | Protected |

**Scribe Step 2 Status:** Implementation is complete and correct. The reported "manual text inputs" issue was caused by cache/dev-server restart/route confusion, not a code bug. See `SCRIBE_STEP2_VERIFICATION.md` for details.

### Execution Order

```
CURRENT: S0.4.6 Scribe Config Dashboard
    └── SearchableSelect verified ✅
    └── Steps 3-5 pending

NEXT (by Dec 25): Phase 1 Functional Complete
    └── Scribe temel akış
    └── Trace/Proto MVP
    └── QA kanıtı

THEN (by Jan 9): Phase 1.5
    └── Job loglama v1
    └── Token/cost tracking

LATER: V2 RepoOps (gated on Phase 1 complete)
```

---

## Roadmap & Milestones

Güncel kilometre taşları ve kabul notları [docs/ROADMAP.md](docs/ROADMAP.md) belgesinde takip ediliyor.  
Sprint detayları [docs/PROJECT_TRACKING_BASELINE.md](docs/PROJECT_TRACKING_BASELINE.md) belgesinde.

### Critical Milestones

| Milestone | Date | Owner |
|-----------|------|-------|
| Phase 1 Functional Complete | 2025-12-25 | Yasir |
| SDTA hazır | 2025-12-26 | Ayşe |
| Proje bitiş hedefi | 2026-03-31 | Yasir |

### Phase İzleme (GitHub Issues)

- [Epic] [#24 Phase 9.2 — i18n & Theming Foundations](https://github.com/OmerYasirOnal/akis-platform-devolopment/issues/24)
- [Epic] [#44 Phase 10 — Next Foundations](https://github.com/OmerYasirOnal/akis-platform-devolopment/issues/44)

## Quickstart

### Backend

```bash
cd backend
pnpm install

# Set up environment
cp .env.example .env
# Edit .env with your values (especially DATABASE_URL)

# Run development server
pnpm dev

# The server will start on http://localhost:3000 (default port)
# Health check: http://localhost:3000/health
# Frontend default port: 5173 (Vite)
```

### Ortak Ortam Değişkenleri

| Anahtar | Açıklama | Varsayılan |
| --- | --- | --- |
| `FRONTEND_URL` | SPA kök URL'si; CORS ve yönlendirmeler için kullanılır | `http://localhost:5173` |
| `BACKEND_URL` / `VITE_API_URL` | REST API taban URL'si; frontend istekleri için önerilen `VITE_API_URL` | `http://localhost:3000` |
| `CORS_ORIGINS` | Virgülle ayrılmış izin verilen origin listesi (credentials=true) | `http://localhost:5173` |
| `NODE_ENV` | Çalışma modu (`development`, `production`, `test`) | `development` |
| `AUTH_COOKIE_NAME` | Oturum çerezi adı | `akis_sid` |
| `AUTH_COOKIE_MAXAGE` | Oturum çerezi max-age (saniye cinsinden) | `604800` (7 gün) |
| `AUTH_COOKIE_SAMESITE` | SameSite politikası (`Lax` önerildi) | `Lax` |
| `AUTH_COOKIE_SECURE` | HTTPS üzerinde secure bayrağı (prod ortamında zorunlu) | `false` (yalnızca lokal) |
| `AUTH_COOKIE_DOMAIN` | Opsiyonel domain sabitlemesi | — |

### Local Dev Hızlı Komutlar

```bash
# Backend
cd backend && pnpm dev

# Frontend
cd frontend && npm run dev
```

### Komutlar

- `pnpm dev` - Development server (watch mode)
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm typecheck` - TypeScript type checking
- `pnpm db:generate` - Generate Drizzle migrations
- `pnpm db:migrate` - Run database migrations
- `pnpm db:studio` - Open Drizzle Studio

### Frontend

```bash
cd frontend
npm install

# Set up environment
cp .env.example .env

# Run development server
npm run dev

# The frontend will start on http://localhost:5173 (default port)
```

## CI/CD

Proje GitHub Actions ile otomatik test edilir. Her push ve pull request'te CI workflow çalışır.

**Not:** PR açınca split jobs (backend/frontend) çalışır; Postgres 16 service ile testler koşturulur.

### CI Konfigürasyonu

- **Node.js**: 22.12.0
- **Backend Job**:
  - PostgreSQL 16 service (test veritabanı: `akis_v2_test`)
  - pnpm ile bağımlılık yönetimi ve cache optimizasyonu
  - Drizzle migration'ları (`db:generate` ve `db:migrate`)
  - Typecheck, lint ve test adımları
  - `DATABASE_URL` test veritabanına işaret eder
- **Frontend Job**:
  - npm ile bağımlılık yönetimi
  - Typecheck, lint ve test adımları

### Branch Protection

`main` branch için branch protection kuralları aktif edilmelidir:
- "Require status checks to pass before merging" seçeneği aktif olmalı
- `backend` ve `frontend` job'ları required status check olarak eklenmelidir

Bu ayarlar GitHub repository Settings > Branches > Branch protection rules üzerinden yapılır.

## Dokümantasyon

Detaylı dokümantasyon için [docs/](docs/) klasörüne bakın.

## Lisans

MIT License - Bkz. [LICENSE](LICENSE) dosyası.

