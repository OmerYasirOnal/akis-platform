# AKIS Platform

**Yapay Zekâ Ajanı İş Akışı Motoru** (AI Agent Workflow Engine)

AKIS Platform, yazılım geliştirme süreçlerindeki tekrarlayan görevleri otomatikleştiren bir otonom ajan platformudur.

---

## 📍 Start Here

> **Hangi dökümana bakmalıyım?** Aşağıdaki kanonik zincir, tüm planlama ve uygulama dokümanlarını birbirine bağlar:

```
docs/PROJECT_TRACKING_BASELINE.md  (schedule anchor, spreadsheet source)
          ↓
docs/ROADMAP.md                    (phase overview)
          ↓
docs/NEXT.md                       (immediate actions + gating)
```

| Amaç | Doküman |
|------|---------|
| Sprint/phase/milestone takibi | [PROJECT_TRACKING_BASELINE.md](docs/PROJECT_TRACKING_BASELINE.md) |
| Faz görünümü & kabul kriterleri | [ROADMAP.md](docs/ROADMAP.md) |
| Anlık aksiyon listesi & gating | [NEXT.md](docs/NEXT.md) |
| Mimari ve teknoloji yığını | [CONTEXT_ARCHITECTURE.md](.cursor/context/CONTEXT_ARCHITECTURE.md) |
| Proje kapsamı & gereksinimler | [CONTEXT_SCOPE.md](.cursor/context/CONTEXT_SCOPE.md) |

---

## Özellikler

- **AKIS Scribe**: Teknik dokümantasyon güncelleme
- **AKIS Trace**: Test otomasyonu üretimi
- **AKIS Proto**: MVP prototipleme

## Canonical Docs

- [Cursor + Codex Strategy](CURSOR_CODEX_STRATEGY.md) – Cursor/Codex kullanım kuralları
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

### Prerequisites

1. **Node.js** ≥ 20
2. **PostgreSQL** database
3. **Docker** (for MCP Gateway)
4. **GitHub Personal Access Token** (for MCP integration)
   - Get from: https://github.com/settings/tokens
   - Required scopes: `repo`, `read:org`

### ⚠️ Security: Never Commit Secrets

All `.env` files are gitignored. Create them from templates:
- `.env.mcp.local` → from `env.mcp.local.example` (for MCP Gateway)
- `backend/.env` → from `backend/.env.example` (for Fastify backend)

**Token Safety Rules**:
- ✅ Use env files (`.env.mcp.local`, `backend/.env`)
- ❌ Never `export GITHUB_TOKEN=...` in shell
- ❌ Never `source .env` in scripts
- ❌ Never commit real tokens

See [docs/GITHUB_MCP_SETUP.md - Token Safety Checklist](docs/GITHUB_MCP_SETUP.md#token-safety-checklist-) for complete security guidance.

### 1. MCP Gateway Setup (Required for GitHub Integration)

**Quick start (recommended):**
```bash
# One-command setup + smoke test
./scripts/mcp-doctor.sh
```

The doctor script will:
- Create `.env.mcp.local` from template if missing
- Guide you to add your GitHub token
- Run automated setup + smoke test
- Provide clear next steps

**Manual setup (alternative):**
```bash
# Copy template and add your GitHub token
cp env.mcp.local.example .env.mcp.local
# Edit .env.mcp.local: GITHUB_TOKEN=ghp_your_actual_token

# Start MCP Gateway
./scripts/mcp-up.sh

# Verify (recommended)
./scripts/mcp-smoke-test.sh

# Gateway: http://localhost:4010/mcp
```

📖 **Detailed setup guide**: See [`docs/GITHUB_MCP_SETUP.md`](docs/GITHUB_MCP_SETUP.md)

### 2. Backend Setup

```bash
cd backend
pnpm install

# Copy template and configure
cp .env.example .env
# Edit .env with your values:
#   DATABASE_URL=postgresql://user:pass@localhost:5433/akis_v2  ⚠️ Port 5433!
#   GITHUB_MCP_BASE_URL=http://localhost:4010/mcp
#   (See .env.example for all options)

# Run database migrations
pnpm db:migrate

# Start development server
pnpm dev
# → http://localhost:3000/health
```

> ⚠️ **Önemli**: Local dev DB portu **5433**'tür (5432 değil!). Port uyuşmazlığı sorunları için [LOCAL_DEV_QUICKSTART.md](docs/local-dev/LOCAL_DEV_QUICKSTART.md) troubleshooting bölümüne bakın.

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
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

## Job Details Diagnostics v1

The Job Details page now includes comprehensive debugging capabilities:

### 🔍 New Diagnostic Features

**1. MCP Gateway URL Badge**
- Shows which MCP Gateway was used for the job
- Visible in job metadata (both success and failure cases)
- Helps identify configuration mismatches (local vs hosted gateway)

**2. Correlation ID**
- Displayed prominently in job metadata
- One-click copy to clipboard
- Use for tracing requests across backend → gateway → GitHub logs

**3. Raw Error Payload (Collapsible)**
- Full structured error details for debugging
- **Safe by default**: Automatically redacts secrets
  - GitHub tokens (ghp_, gho_, ghs_, ghr_, ghu_, github_pat_)
  - npm tokens (ntn_)
  - JWT tokens and Authorization headers
- Includes error code, correlation ID, hints, cause, and stack traces
- Copyable for sharing with support

**4. Structured Error Codes**
- `MCP_UNREACHABLE` → Gateway not running or unreachable
- `MCP_TIMEOUT` → Connection timeout
- `MCP_DNS_FAILED` → Invalid gateway hostname
- `MCP_UNAUTHORIZED` → Invalid/missing GitHub token
- `MCP_FORBIDDEN` → Token lacks required scopes
- `MCP_RATE_LIMITED` → GitHub API rate limit exceeded
- Each error includes actionable hints

### 📋 Verification Script

Run deterministic verification for all MCP scenarios:

```bash
./scripts/verify-mcp-scenarios.sh
```

This script tests:
- **Scenario A**: Gateway DOWN → MCP_UNREACHABLE error
- **Scenario B**: Gateway UP → Dry run succeeds without side effects
- **Scenario C**: Non-dry run → PR creation or structured error

The script provides automated setup/teardown and manual verification instructions for UI testing.

### 📖 Documentation

- [docs/GITHUB_MCP_SETUP.md](docs/GITHUB_MCP_SETUP.md) - Complete MCP setup guide
- [docs/MCP_ENV_SECURITY_IMPLEMENTATION.md](docs/MCP_ENV_SECURITY_IMPLEMENTATION.md) - Security implementation details

## 🧪 API Smoke Test

Backend API'nin düzgün çalıştığını doğrulamak için:

```bash
# DB'yi başlat ve migrationları uygula
./scripts/db-up.sh
export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/akis_v2"
pnpm -C backend db:migrate

# Backend'i başlat (ayrı terminal)
pnpm -C backend dev

# Smoke test'i çalıştır
./scripts/dev-smoke-jobs.sh
```

Bu script şunları test eder:
- `/health` endpoint'i
- Job listeleme (`GET /api/agents/jobs`)
- Job oluşturma (`POST /api/agents/jobs`)
- Job detay (`GET /api/agents/jobs/:id`)
- Job include query (`GET /api/agents/jobs/:id?include=trace,artifacts`)

> 💡 **Troubleshooting**: 500 hatası veya "table not found" görüyorsanız, DB port uyuşmazlığı olabilir. Bkz: [LOCAL_DEV_QUICKSTART.md](docs/local-dev/LOCAL_DEV_QUICKSTART.md#-troubleshooting-db-port-mismatch)

---

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
