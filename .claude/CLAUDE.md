# AKIS Platform v0.2.0 — Claude Code Guide

> **Bu dosya bu projedeki TÜM Claude oturumları için birincil referanstır.**
> **Her oturumda İLK bu dosyayı oku, sonra çalışmaya başla.**

## Proje Özeti

AKIS (Adaptive Knowledge Integrity System), bir **AI Agent Workflows Engine**'dir. Yazılım geliştirme sürecinde "fikir → kod → test" zincirini 3 AI agent workflow'u ile otomatize eder. Aynı zamanda üniversite bitirme projesidir.

- **Versiyon:** 0.2.0
- **Tez Teması:** Knowledge Integrity & Agent Verification
- **Öğrenci:** Ömer Yasir Önal (2221221562)
- **Danışman:** Dr. Öğr. Üyesi Nazlı Doğan
- **Üniversite:** Fatih Sultan Mehmet Vakıf Üniversitesi (FSMVÜ)
- **Tez Deadline:** 1 Mayıs 2026
- **Repo:** `OmerYasirOnal/akis-platform-devolopment` (private)

## Mimari: Sequential Agent Pipeline

```
[Kullanıcı fikri — serbest metin]
       │
   SCRIBE ("Düşün ve yaz")
   Fikri structured spec dokümanlarına çevirir
   Kullanıcı spec'i UI'da görür ve onaylar ← human-in-the-loop
       │
   PROTO ("İnşa et")
   Onaylanan spec'ten MVP scaffold üretir
   GitHub'a push eder (branch: proto/scaffold-{timestamp})
       │
   TRACE ("Doğrula")
   Proto'nun push ettiği branch'teki kodu GitHub'dan okur
   O koda özel Playwright otomasyon testleri yazar
```

### Doğrulama Zinciri (Tez temasıyla örtüşür)
- Scribe spec üretiyor → İNSAN doğruluyor (human-in-the-loop)
- Proto kod üretiyor → TRACE doğruluyor (automated verification)
- Trace test yazıyor → Testler OTOMATİK çalışıp doğruluyor

## Pipeline FSM (Durum Makinesi)
```
scribe_clarifying → scribe_generating → awaiting_approval
→ proto_building → trace_testing → completed | completed_partial
Her adımda → failed (retryable) | cancelled
```

## Agent Tanımları

### SCRIBE — Spec Writer
- **Rol:** Business analyst — fikri yapılandırır
- **Input:** `ScribeInput` { idea, context, targetStack, existingRepo? }
- **Output:** `ScribeOutput` { spec: StructuredSpec, rawMarkdown, confidence, clarificationsAsked }

### PROTO — MVP Builder
- **Rol:** Onaylanan spec'ten çalışır MVP scaffold üretir
- **Input:** `ProtoInput` { spec: StructuredSpec, repoName, repoVisibility, owner, dryRun? }
- **Output:** `ProtoOutput` { ok, branch, repo, repoUrl, files[], prUrl?, setupCommands[] }

### TRACE — Test Writer
- **Rol:** Proto'nun ürettiği GERÇEK kodu GitHub'dan okuyup Playwright testleri yazar
- **Input:** `TraceInput` { repoOwner, repo, branch, spec?, dryRun? }
- **Output:** `TraceOutput` { ok, testFiles[], coverageMatrix, testSummary }

---

## Tech Stack

| Katman | Teknoloji |
|--------|-----------|
| Frontend | React 19 + Vite 7 SPA (Tailwind 4, React Router 7) |
| Backend | Fastify 4 + TypeScript |
| Database | PostgreSQL + Drizzle ORM |
| AI Provider | Anthropic (claude-sonnet-4-6) |
| GitHub Entegrasyon | GitHub REST API (pipeline), OAuth (kullanıcı login) |
| Test | Vitest (unit), Playwright (e2e) |
| Deployment | OCI ARM64, Docker Compose, Caddy |

### Mimari Kısıtlamalar
- Backend: Fastify + TypeScript, PostgreSQL + Drizzle. Express, NestJS, Prisma, Next.js YASAK.
- Frontend: React SPA + Vite. SSR framework YASAK.
- Agent'lar birbirini doğrudan çağırmaz — tüm iletişim PipelineOrchestrator üzerinden.
- temperature=0 tüm agent prompt'ları için.
- Tool'lar orchestrator tarafından inject edilir — agent'lar DB/API client'larını kendileri oluşturmaz.

---

## Ortam Değişkenleri ve Key'ler

### `.env` Yapısı
Secret'lar `~/.env.d/` klasöründe merkezi tutulur, proje dizinlerinde symlink ile bağlanır.

### Key Haritası

| Env Variable | Ne İçin | Nerede Kullanılıyor |
|---|---|---|
| `GITHUB_TOKEN` | Pipeline repo/push/PR | `pipeline/adapters/GitHubRESTAdapter.ts` |
| `GITHUB_OAUTH_CLIENT_ID` | GitHub ile login | `api/auth.oauth.ts` |
| `GITHUB_OAUTH_CLIENT_SECRET` | GitHub ile login | `api/auth.oauth.ts` |
| `GOOGLE_OAUTH_CLIENT_ID` | Google ile login | `api/auth.oauth.ts` |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Google ile login | `api/auth.oauth.ts` |
| `ANTHROPIC_API_KEY` / `AI_API_KEY` | Agent Claude API çağrısı | `config/env.ts` → tüm agent'lar |
| `AUTH_JWT_SECRET` | Session token imzalama | `services/auth/jwt.ts` |
| `AI_KEY_ENCRYPTION_KEY` | Token şifreleme | `services/auth/OAuthTokenCrypto.ts` |
| `RESEND_API_KEY` | E-posta gönderimi | `services/email/` |
| `DATABASE_URL` | PostgreSQL bağlantısı | `db/client.ts` |

### OAuth Callback Mantığı
- Callback URL'ler `.env`'de TANIMLANMAZ — kod `FRONTEND_URL`'den üretir
- Pattern: `${FRONTEND_URL}/auth/oauth/${provider}/callback`
- Local: `http://localhost:5173/auth/oauth/google/callback`
- Staging: `https://staging.akisflow.com/auth/oauth/google/callback`

### Dış Servis Panelleri
- **Google Cloud:** AKIS projesi (akis-492505) → Credentials
- **GitHub OAuth:** Settings → Developer settings → OAuth Apps → AKIS (Local Dev)
- **Anthropic:** console.anthropic.com → API Keys
- **Resend:** resend.com/api-keys

---

## Mevcut Durum — v0.2.0 (Nisan 2026)

### Tamamlanan
- Pipeline: Scribe → Proto → Trace tam çalışıyor
- Platform repo guard: Pipeline çıktıları AKIS reposuna push edilemez
- Dev Mode: Chat-based iterative geliştirme
- Staging: `staging.akisflow.com`
- OAuth: GitHub + Google login
- CI/CD: GitHub Actions (ci, pr-gate, staging deploy)
- Tez dokümanı tamamlandı

### Bilinen Sorunlar
1. Reject flow regeneration tetikliyor (inline edit olmalı)
2. ProtoAgent hardcoded React+Vite
3. Trace ayrı branch oluşturuyor
4. InMemoryPipelineStore aktif (PostgreSQL şeması var ama kullanılmıyor)

---

## Kritik Kurallar

### ASLA Yapılmayacaklar
- ASLA `.env` dosyalarını değiştirme veya oluşturma
- ASLA dosyaları backup olmadan silme
- ASLA scope dışı özellik ekleme
- ASLA agent'ların birbirini doğrudan çağırmasına izin verme
- ASLA pipeline çıktılarını platform repo'suna (`akis-platform-devolopment`) push etme

### Kod Kalitesi
- Commit öncesi: `typecheck + lint + test:unit + build`
- Commit prefix: `feat()`, `fix()`, `refactor()`, `docs()`, `chore()`
- Co-author: `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`

---

## Mock Test Sistemi

### AI Mock
- `AI_PROVIDER=mock` → `MockAIService` aktif
- Mock cevapları `backend/src/services/ai/__fixtures__/` altında JSON
- Her agent'ın çıktı formatına uygun deterministik fixture'lar
- Gerçek API sadece `AI_PROVIDER=anthropic` ile açıkça istendiğinde

### GitHub Mock
- `GitHubServiceLike` interface → mock kolay
- Test'lerde in-memory mock — gerçek GitHub'a push yok

### Kural
```
pnpm test:unit  → DAIMA mock
pnpm test:e2e   → DAIMA mock
Manuel test     → .env'den kontrol
```

---

## Local Geliştirme

### Backend: `cd devagents/backend && pnpm dev` (port 3000)
### Frontend: `cd devagents/frontend && pnpm dev` (port 5173)

---

## Öğrenilmiş Dersler
- Reject ≠ Regenerate (inline edit olmalı)
- Pipeline çıktıları ASLA platform repo'suna push edilmemeli
- 1329 unit test 4 runtime bug yakalayamadı — E2E şart
- Claude API cevapları: `extractJson` + `sanitizeJsonControlChars` + `repairJson()`
- Trace timeout: 10dk, diğerleri: 5dk

---

## UI/UX
- "Liquid-glass / frosted surfaces" teması
- bg `#0A1215`, primary `#07D1AF` (teal), danger `#FF6B6B`
