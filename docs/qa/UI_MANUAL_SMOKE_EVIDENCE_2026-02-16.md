# UI M2 Manual Smoke Evidence (2026-02-16)

**Date (UTC):** 2026-02-16  
**Executor:** Codex  
**Scope:** UI M2+ stabilization closure (`/agents*`, `/dashboard/jobs/:id`)  
**Branch:** `codex/docs-m2-closure-sync-2026-02-16`

---

## 1) Local Quality Gates

### Frontend typecheck
```bash
npm -C frontend run typecheck
```
Result: **PASS**

### Frontend unit/integration tests
```bash
npm -C frontend run test
```
Result: **PASS** (`59 files`, `602 tests`)

### Target E2E pack
```bash
npm -C frontend run test:e2e -- \
  tests/e2e/auth-login-flow.spec.ts \
  tests/e2e/navigation-guards.spec.ts \
  tests/e2e/scribe-console.spec.ts \
  tests/e2e/trace-console.spec.ts \
  tests/e2e/proto-console.spec.ts \
  tests/e2e/agents-hub-ui.spec.ts
```
Result: **PASS** (`50/50`)

---

## 2) Backend Regression Safety Net

### Backend typecheck
```bash
npm -C backend run typecheck
```
Result: **PASS**

### Backend unit tests
```bash
npm -C backend run test
```
Result: **PASS** (`1302/1302`)

---

## 3) Staging OAuth-Only Smoke

### Health
```bash
curl -sf https://staging.akisflow.com/health
```
Observed:
```json
{"status":"ok","timestamp":"2026-02-16T10:21:15.314Z"}
```

### Version
```bash
curl -sf https://staging.akisflow.com/version
```
Observed:
```json
{"version":"0.1.0","name":"akis-backend","commit":"ee5041f","buildTime":"2026-02-16T09:07:59Z","environment":"production","startTime":"2026-02-16T09:11:54.275Z"}
```

### GitHub OAuth redirect
```bash
curl -sI https://staging.akisflow.com/auth/oauth/github | rg -i "^http/|^date:|^location:"
```
Observed:
- `HTTP/2 302`
- `location: https://github.com/login/oauth/authorize?...redirect_uri=https%3A%2F%2Fstaging.akisflow.com%2Fauth%2Foauth%2Fgithub%2Fcallback...`

Result: **PASS**

---

## 4) UI M2+ Specific Fix Evidence

- `frontend/tests/e2e/agents-hub-ui.spec.ts` stabilize edildi:
  - auth mock pattern genişletme (`/auth/me*`, `/api/auth/me*`)
  - smart-automations route matcher daraltma (module collision fix)
  - locale-tolerant selectors
- `frontend/tests/e2e/helpers/mock-dashboard-apis.ts` auth mock route’ları robust hale getirildi.

---

## 5) Docs Integrity

```bash
node scripts/check_docs_references.mjs
```
Result: **PASS** (`broken reference = 0`)

---

## 6) Open Items

- Bu pakette staging’de tam authenticated mutation walkthrough yapılmadı (test kullanıcı credential gerektirir).
- Bu turda canlı staging deploy tetiklenmedi; yalnızca governance + smoke kanıtı güncellendi.

