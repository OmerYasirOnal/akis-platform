# AKIS Pipeline — Staging Deploy Plan

## Mevcut Altyapi

| Bilesken | Teknoloji |
|----------|-----------|
| Hosting | OCI Free Tier (ARM64 Ampere A1) |
| Domain | staging.akisflow.com |
| Proxy | Caddy 2 (auto TLS) |
| Backend | Docker — Fastify 4 + TypeScript |
| Frontend | Static Vite build (Caddy serve) |
| Database | PostgreSQL 16 (Docker container) |
| MCP Gateway | Node.js HTTP-to-stdio bridge (always-on) |
| CI/CD | GitHub Actions (ci.yml + deploy) |
| Registry | GHCR (ghcr.io) |

## Branch Stratejisi

| Branch | Hedef | Durum |
|--------|-------|-------|
| `main` | Production (`akisflow.com`) | Dokunma |
| `staging` | Staging deploy | Aktif deployment hedefi |
| `dev/pipeline-migration` | Aktif gelistirme | Su anki branch |

## Deploy Adimlari

### 1. Pre-deploy Checklist
- [ ] Backend typecheck gecti: `pnpm -C backend typecheck`
- [ ] Backend lint gecti: `pnpm -C backend lint`
- [ ] Backend unit tests gecti: `pnpm -C backend test:unit`
- [ ] Backend build gecti: `pnpm -C backend build`
- [ ] Frontend typecheck gecti: `pnpm -C frontend typecheck`
- [ ] Frontend lint gecti: `pnpm -C frontend lint`
- [ ] Frontend tests gecti: `pnpm -C frontend test`
- [ ] Frontend build gecti: `pnpm -C frontend build`
- [ ] Mevcut fix'ler korunuyor: async approve, 2s polling, extractJson, sanitizeJsonControlChars, DEV_MODE auth bypass

### 2. Pipeline Ozgu Kontroller
- [ ] `GitHubMCPAdapter` yeni dosya mevcut: `pipeline/backend/adapters/GitHubMCPAdapter.ts`
- [ ] `server.app.ts` GitHub stub yerine real adapter kullanıyor (GITHUB_MCP_BASE_URL + GITHUB_TOKEN sartli)
- [ ] Pipeline factory, types, orchestrator tutarli
- [ ] Use case dokumani tamam: `docs/USE_CASES.md`

### 3. Staging .env Gereksinimleri
Staging VM'de asagidaki env var'larin set edilmis olmasi gerekiyor:
```
GITHUB_MCP_BASE_URL=http://mcp-gateway:3100   # Docker network icinden
GITHUB_TOKEN=ghp_...                           # GitHub PAT (repo, read:org scope)
```
Bu olmadan pipeline GitHub stub ile calismaya devam eder (scaffold uretilir ama push edilmez).

### 4. Merge ve Deploy
```bash
# 1. dev/pipeline-migration → staging merge
git checkout staging
git merge dev/pipeline-migration --no-ff -m "feat(pipeline): real GitHub integration + use cases"

# 2. Push staging branch
git push origin staging

# 3. GitHub Actions workflow trigger (manual dispatch)
# Actions: ci.yml → quality gates → deploy (manual confirm_deploy=deploy)
```

### 5. Post-deploy Dogrulama
- [ ] `https://staging.akisflow.com/health` → 200 OK
- [ ] `https://staging.akisflow.com/ready` → tum servisler saglikli
- [ ] Login calisiyor (DEV_MODE veya OAuth)
- [ ] `/pipeline` sayfasi aciliyor
- [ ] Yeni pipeline baslatilabiliyor (Scribe calisiyor)
- [ ] Scribe spec uretiyor ve onay bekliyor
- [ ] Spec onayi sonrasi Proto calisiyor
- [ ] Startup log'da `Pipeline GitHub: REAL (MCP Gateway)` gorunuyor

### 6. Scope Disi Sayfalar

Frontend'de scope disi sayfalar mevcut ancak suan zarar vermiyor:
- Landing page (`/`) — giris noktasi, kalabilir
- Pricing (`/pricing`) — statik sayfa, islevsel degil
- Blog, Learn, Marketplace — statik sayfalar
- Eski agent sayfalari (`/agents/scribe`, `/agents/trace`, `/agents/proto`) — eski UI, yeni pipeline ile karismaz

**Oneri:** Bu sayfalari simdilik birakabiliriz. Pipeline (`/pipeline`) ayri bir route ve eski sayfalarla catismiyor. Tez demosunda sadece `/pipeline` route'u gosterilecek.

## Geri Donus Plani

Sorun cikarsa:
```bash
# Staging'de onceki commit'e don
ssh staging-vm "cd /opt/akis && git checkout HEAD~1 && docker compose up -d --build"
```

## Notlar
- MCP Gateway Docker container olarak `mcp-gateway` servisinde calisiyor (staging compose'da always-on)
- PostgreSQL migration'lari otomatik calisiyor (container startup)
- Pipeline state su an in-memory — staging restart'ta pipeline state kaybolur (PostgreSQL store gelecek migration'da)
