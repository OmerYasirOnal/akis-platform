# AKIS — Teknik Mimari

## Genel Bakış

AKIS, modüler monolit mimarisi üzerine inşa edilmiş bir AI ajan orkestrasyon platformudur. Frontend bir React SPA, backend ise Fastify tabanlı bir TypeScript sunucusudur.

## Katmanlar

### Frontend (React 19 + Vite 7)

- **SPA**: Tek sayfa uygulama, Vite dev server + production build
- **Routing**: React Router 7 ile client-side routing
- **Styling**: Tailwind CSS 4, custom design token'lar (`--ak-*` prefix)
- **State**: React hooks + local state (global store yok)
- **API**: `HttpClient` wrapper ile fetch-based REST calls
- **SSE**: `usePipelineStream` hook ile gerçek zamanlı ajan aktivite akışı
- **i18n**: Türkçe/İngilizce, `tr.ts` + `tr.json` ile

### Backend (Fastify 4 + TypeScript)

- **Framework**: Fastify 4 plugin mimarisi
- **ORM**: Drizzle ORM + PostgreSQL 16
- **Auth**: Cookie-based session (JWT), OAuth (GitHub, Google)
- **AI Service**: Provider-agnostic (Anthropic, OpenAI, OpenRouter, mock)
- **Pipeline**: `backend/src/pipeline/` altında konsolide

### Pipeline Orchestrator

Merkezi orkestratör tüm ajan iletişimini yönetir:

```
PipelineOrchestrator
├── FSM (Finite State Machine)
│   scribe_clarifying → scribe_generating → awaiting_approval
│   → proto_building → trace_testing → completed | completed_partial
├── ScribeAgent  — AI ile spec üretimi
├── ProtoAgent   — AI ile scaffold üretimi + GitHub push
├── TraceAgent   — AI ile Playwright test yazımı
└── Adapters
    ├── GitHubMCPAdapter  — MCP gateway üzerinden
    └── GitHubRESTAdapter — Doğrudan REST API
```

### Veritabanı

PostgreSQL 16 + Drizzle ORM. Ana tablolar:

- `users` — Kullanıcı hesapları
- `pipelines` — Pipeline durumu, conversation, spec, output
- `ai_usage` — Token kullanım takibi

### MCP Gateway

Model Context Protocol adapter layer. GitHub API çağrılarını standart MCP formatına çevirir.

## Güvenlik

- Cookie-based auth (HttpOnly, Secure, SameSite=Lax)
- AI API key'leri AES-256 ile şifreli DB'de saklanır
- Rate limiting (Fastify plugin)
- CORS origin kontrolü
- Caddy ile otomatik HTTPS (Let's Encrypt)
