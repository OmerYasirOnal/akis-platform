---
description: "Backend Security & Health Scaffold"
---

# TASK
**Fastify** uygulamasına güvenlik ve sağlık uçları ekle:
- `server.app.ts` içinde `helmet`,`cors`,`rate-limit` kaydı.
- `X-Request-Id` header’ını oku; yoksa üret ve `requestId` olarak bağla.
- Uçlar:
  - `GET /health` → `{status:"ok"}`
  - `GET /ready`  → `{ready:true}`
  - `GET /version` → `{version:"<package.json version>"}`

# FILES
- `backend/src/server.app.ts` (plugin kayıtları, requestId, pino)
- `backend/src/routes/health.ts` (opsiyonel modüler dosya)
- `backend/.env.example` (RATE_LIMIT_* ve CORS_ORIGIN örnekleri)
- Test: `backend/test/health.test.ts` (fastify.inject)

# ACCEPTANCE
- `pnpm -r typecheck && pnpm -r test` yeşil.
- Testler: `/health 200`, `/version` package.json semver döner.

# COMMIT
feat(backend): add security plugins and health/ready/version endpoints