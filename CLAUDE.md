# AKIS Platform — Claude Code Guide

## Proje Ozeti

AKIS (Adaptive Knowledge Integrity System), bir **AI Agent Workflows Engine**'dir. Yazilim gelistirme surecinde "fikir → kod → test" zincirini 3 AI agent workflow'u ile otomatize eder. Ayni zamanda universite bitirme projesidir.

**Tez Temasi:** Knowledge Integrity & Agent Verification
**Hedef:** Kullanicinin serbest metin fikrini yapilandirilmis spec'e cevirip, MVP scaffold uretip, otomatik e2e testleri yazan sequential agent workflow.

## Mimari: Sequential Agent Workflow

```
[Kullanici fikri — serbest metin]
       |
   SCRIBE ("Dusun ve yaz")
   Fikri structured spec dokumanlarina cevirir
   Kullanici spec'i UI'da gorur ve onaylar <-- human-in-the-loop
       |
   PROTO ("Insa et")
   Onaylanan spec'ten MVP scaffold uretir
   GitHub'a push eder (branch: proto/scaffold-{timestamp})
       |
   TRACE ("Dogrula")
   Proto'nun push ettigi branch'teki kodu GitHub'dan okur
   O koda ozel Playwright otomasyon testleri yazar
```

### Dogrulama Zinciri (Tez temasyla ortusur)
- Scribe spec uretiyor → INSAN dogruluyor (human-in-the-loop)
- Proto kod uretiyor → TRACE dogruluyor (automated verification)
- Trace test yaziyor → Testler OTOMATIK calisip dogruluyor

## Agent Tanimlari

### SCRIBE — Spec Writer (Idea-to-Spec)
- **Rol:** Business analyst — fikri yapilandirir
- **Input:** `ScribeInput` { idea, context, targetStack, existingRepo? }
- **Output:** `ScribeOutput` { spec: StructuredSpec, rawMarkdown, confidence, clarificationsAsked }
- **Spec Formati:**
  - Problem Statement → Ne cozuluyor?
  - User Stories → As a [role], I want [feature], so that [benefit]
  - Acceptance Criteria → Given/When/Then
  - Technical Constraints → Stack, kisitlar, bagimliliklar
  - Out of Scope → Ne yapilmayacak?

### PROTO — MVP Builder
- **Rol:** Onaylanan spec'ten calisir MVP scaffold uretir
- **Input:** `ProtoInput` { spec: StructuredSpec, repoName, repoVisibility, owner, dryRun? }
- **Output:** `ProtoOutput` { ok, branch, repo, repoUrl, files[], prUrl?, setupCommands[] }

### TRACE — Test Writer (Dogrulayici)
- **Rol:** Proto'nun urettigi GERCEK kodu GitHub'dan okuyup Playwright testleri yazar
- **Input:** `TraceInput` { repoOwner, repo, branch, spec?, dryRun? }
- **Output:** `TraceOutput` { ok, testFiles[], coverageMatrix, testSummary }

### Inter-Agent Contract (Veri Akisi)
```
ScribeInput (idea) → ScribeClarification (questions) → user answers → ScribeOutput (StructuredSpec)
→ [User Approval] → ProtoInput (spec + repoName) → ProtoOutput (branch + files + repoUrl)
→ TraceInput (repo + branch) → TraceOutput (testFiles + coverageMatrix)
```

## Pipeline FSM (Durum Makinesi)
```
scribe_clarifying → scribe_generating → awaiting_approval
→ proto_building → trace_testing → completed | completed_partial
Her adimda → failed (retryable) | cancelled
```

## Kritik Kurallar

### ASLA Yapilmayacaklar
- ASLA .env, .env.local veya herhangi bir .env dosyasini degistirme veya olusturma
- ASLA mevcut dosyalari .legacy.ts backup olmadan silme veya uzerine yazma
- ASLA scope disi ozellik ekleme: piri, rag_system, career_assistant, landing page, pricing
- ASLA kaldirilmis agent davranislarini geri getirme (Scribe'in eski repo tarama ozelligi KALDIRILDI)
- ASLA agent'larin birbirini dogrudan cagirmasina izin verme
- ASLA Proto'ya yapilandirilmamis serbest metin verme (sadece Scribe spec'i alir)
- ASLA Trace'e serbest metin spec verme (sadece Proto output'u alir)

### Mimari Kurallari
- Tum agent iletisimi PipelineOrchestrator uzerinden — agent'lar birbirini cagirmaz
- temperature=0 tum agent prompt'lari icin
- Model-agnostic prompt'lar — model-spesifik syntax yok
- Tool'lar orchestrator tarafindan inject edilir — agent'lar DB/MCP client'larini kendileri olusturmaz
- AKIS branding'i koru (renkler, logolar) — pipeline/docs/BRAND.md referans

### Bitirme Projesi Kapsami (4 Sac Ayagi)
1. Knowledge Integrity Core — hallucination testi, citation-first mimari, conflict detection
2. Agent Verification Framework — Scribe/Trace/Proto bazli verification gate'leri
3. Freshness & Update Pipeline — otomatik sinyal toplama + insan onayi
4. UI/UX Integrity Layer — confidence score'lari, citation'lar, verification gostergeleri

Bu 4 sac ayagindan CIKILMAMALI.

## Tech Stack

| Katman | Teknoloji |
|--------|-----------|
| Frontend | React 19 + Vite 7 SPA (Tailwind 4, React Router 7) |
| Backend | Fastify 4 + TypeScript |
| Database | PostgreSQL + Drizzle ORM |
| AI Provider | Anthropic (claude-sonnet-4-6), OpenAI, OpenRouter destegi |
| Entegrasyonlar | GitHub API (MCP adapter uzerinden) |
| Test | Vitest (unit), Playwright (e2e) |

**Mimari Kisitlamalar:**
- Backend: Fastify + TypeScript, PostgreSQL + Drizzle. Express, NestJS, Prisma, Next.js YASAK.
- Frontend: React SPA + Vite. SSR framework YASAK.
- Entegrasyonlar: Dis sistemler MCP adapter'lar uzerinden (dogrudan vendor SDK'lari yok).

## Repo Yapisi

```
devagents/
├── pipeline/                          YENi — tum pipeline gelistirmesi burada
│   ├── backend/
│   │   ├── agents/
│   │   │   ├── scribe/               ScribeAgent.ts, prompts/, schemas/
│   │   │   ├── proto/                ProtoAgent.ts, prompts/
│   │   │   └── trace/                TraceAgent.ts, prompts/
│   │   ├── core/
│   │   │   ├── contracts/            PipelineTypes.ts, PipelineSchemas.ts, PipelineErrors.ts
│   │   │   ├── orchestrator/         PipelineOrchestrator.ts
│   │   │   └── pipeline-factory.ts
│   │   ├── adapters/                  GitHubMCPAdapter.ts, GitHubRESTAdapter.ts
│   │   ├── db/                       pipeline-schema.ts, migrations/
│   │   └── api/                      pipeline.routes.ts, pipeline.plugin.ts
│   ├── frontend/
│   │   ├── components/               9 React component (PipelineProgress, ChatMessage, SpecPreviewCard, ...)
│   │   ├── pages/                    PipelinePage.tsx
│   │   └── types.ts                  Frontend type mirror'lari
│   └── docs/                         PIPELINE_CONTRACT.md, BRAND.md
├── frontend/                          React 19 + Vite 7 SPA (mevcut UI)
├── backend/                           Fastify 4 + TypeScript (mevcut altyapi — reference + import only)
├── mcp-gateway/                       MCP adapter layer
├── scripts/                           Local dev helper'lari (DB, vb.)
└── docs/                              Product + architecture referanslari
```

### Aktif Gelistirme
Tum yeni pipeline gelistirmesi `pipeline/` dizininde yapilir.
`backend/src/` ve `frontend/src/` dosyalari DOGRUDAN degistirilmez — mevcut utility'ler import edilir.

## API Endpoint'leri

| Method | Path | Islem |
|--------|------|-------|
| POST | `/api/pipelines` | Pipeline baslat (kullanici fikri) |
| GET | `/api/pipelines` | Pipeline gecmisini listele |
| GET | `/api/pipelines/:id` | Pipeline durumunu getir |
| POST | `/api/pipelines/:id/message` | Scribe'a mesaj gonder (soruya yanit) |
| POST | `/api/pipelines/:id/approve` | Spec'i onayla → Proto baslatilir |
| POST | `/api/pipelines/:id/reject` | Spec'i reddet → Scribe yeniden sorar |
| POST | `/api/pipelines/:id/retry` | Basarisiz adimi tekrar dene |
| POST | `/api/pipelines/:id/skip-trace` | Trace'i atla → completed_partial |
| DELETE | `/api/pipelines/:id` | Pipeline'i iptal et |

## Hata Yonetimi

Tum hatalar `PipelineError` tipinde: code, message (Turkce), technicalDetail, retryable, recoveryAction.
- Retry politikasi: Max 3 deneme, backoff: [5s, 15s, 30s]. Stage timeout: 5 dakika.
- Hata kodlari: pipeline/backend/core/contracts/PipelineErrors.ts

## Local Gelistirme Ortami

### Onkosullar
1. PostgreSQL (Docker): `./scripts/db-up.sh`
2. Node.js 20+, pnpm

### Backend Baslatma (DEV_MODE)
```bash
cd backend
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/akis_v2 \
  DEV_MODE=true \
  npx tsx watch src/server.ts
```
- `DEV_MODE=true`: Auth bypass (otomatik dev user), AI key .env'den alinir
- `DATABASE_URL` override zorunlu — .env'deki staging URL local'de calismaz

### Frontend Baslatma
```bash
pnpm -C frontend dev
```
- Vite dev server: http://localhost:5173
- Pipeline UI: http://localhost:5173/pipeline
- Vite proxy `/auth/*` ve `/api/*` isteklerini `localhost:3000`'a yonlendirir

## Canonical Commands

### Frontend (`pnpm -C frontend`)

| Task | Command |
|------|---------|
| Dev server | `pnpm -C frontend dev` |
| Build | `pnpm -C frontend build` |
| Typecheck | `pnpm -C frontend typecheck` |
| Lint | `pnpm -C frontend lint` |
| Test | `pnpm -C frontend test` |
| Format | `pnpm -C frontend format` |

### Backend (`pnpm -C backend`)

| Task | Command |
|------|---------|
| Dev server | `pnpm -C backend dev` |
| Build | `pnpm -C backend build` |
| Typecheck | `pnpm -C backend typecheck` |
| Lint | `pnpm -C backend lint` |
| Unit tests | `pnpm -C backend test:unit` |
| Integration tests | `pnpm -C backend test:integration` |
| DB migrate | `pnpm -C backend db:migrate` |
| DB studio | `pnpm -C backend db:studio` |
| Format | `pnpm -C backend format` |

### Quality Gate (commit oncesi)
```bash
pnpm -C backend typecheck && pnpm -C backend lint && pnpm -C backend test:unit && pnpm -C backend build
pnpm -C frontend typecheck && pnpm -C frontend lint && pnpm -C frontend test && pnpm -C frontend build
```

## AI Provider Yapilandirmasi

Desteklenen provider'lar: `anthropic`, `openai`, `openrouter`, `mock`
- API key prefix'e gore auto-detect: `sk-ant-` → anthropic, `sk-or-` → openrouter, `sk-` → openai
- Model prefix'e gore auto-detect: `claude-` → anthropic
- Default model: `claude-sonnet-4-6` (Anthropic), `gpt-4o-mini` (OpenAI)

## UI/UX Yonergesi

- "Liquid-glass / frosted surfaces" temasi korunmali
- Sert beyaz yerine notral/tinted yuzeyler (design token'lardan)
- CSS token'lar: `bg-white/[0.03]`, `backdrop-blur-sm`, `border-white/[0.06]`
- Tema degiskenleri: `--ak-bg`, `--ak-surface`, `--ak-surface-2`, `--ak-primary`, `--ak-text-primary`, `--ak-text-secondary`
- Marka renkleri: bg `#0A1215`, primary accent `#07D1AF` (teal), danger `#FF6B6B`

## Loglama Kurallari

- Polling endpoint'lerinde spam yok: `/api/agents/jobs/running`, `/health`, `/ready`
- `request.routeOptions?.url` kullan (deprecated `request.routerPath` degil)
- Anlamli log'lar: job lifecycle, step event'leri, validation hatalari

## Commit Kurallari

- Prefix: `feat()`, `fix()`, `refactor()`, `docs()`, `chore()`
- Co-author: `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`
- Mantiksal parcalar, monolitik dump'lar degil

## Koruma Kuyrallari

- Hatalari lint kurallarini devre disi birakarak susturma — tamamen gerekcelenmeden
- Minimum kod yorumu (sadece acik olmayan mantik)
- Kucuk, dogru, okunabilir degisiklikler tercih et
- Commit oncesi her zaman typecheck + build calistir
