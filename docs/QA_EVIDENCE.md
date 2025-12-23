# QA Evidence Report

**Generated:** 2025-12-24 00:55:00 UTC  
**Branch:** `chore/local-e2e-qa-devex`  
**Commit:** `8a32ba2`

---

## Summary

| Gate | Status |
|------|--------|
| install | ✅ PASS |
| db-up | ✅ PASS |
| migrations | ✅ PASS |
| backend-typecheck | ✅ PASS |
| backend-lint | ✅ PASS |
| backend-test | ✅ PASS (186 tests) |
| frontend-typecheck | ✅ PASS |
| frontend-lint | ✅ PASS |
| frontend-test | ✅ PASS (44 tests) |
| frontend-build | ✅ PASS |
| API smoke test | ✅ PASS (5/5 endpoints) |
| Playwright e2e | ✅ PASS (4/5, 1 skipped) |
| UI click-through | ✅ PASS |

---

## Environment

| Component | Version/Value |
|-----------|---------------|
| Node.js | v20.19.5 |
| pnpm | v9.15.9 |
| Docker | v29.1.3 |
| PostgreSQL | Port 5433 |
| Backend | Port 3000 |
| Frontend | Port 5173 |

---

## Test Results

### Backend Tests
- **Total:** 186 tests
- **Passed:** 186
- **Failed:** 0
- **Duration:** ~12s

### Frontend Tests
- **Total:** 44 tests
- **Passed:** 44
- **Failed:** 0
- **Duration:** ~4s

### API Smoke Test (`./scripts/dev-smoke-jobs.sh`)
```
1) GET /health             → 200 ✅
2) GET /api/agents/jobs    → 200 ✅
3) POST /api/agents/jobs   → 200 ✅ (job created)
4) GET /api/agents/jobs/:id → 200 ✅
5) GET /api/agents/jobs/:id?include=trace,artifacts → 200 ✅
```

### Playwright E2E (`frontend/tests/e2e/local-smoke.spec.ts`)
```
✓ homepage loads correctly (1.6s)
✓ login page is accessible (519ms)
- dev login works (if enabled) [SKIPPED - env not set]
✓ health endpoint is accessible (489ms)
✓ jobs API returns 200 (20ms)
```

---

## UI Click-Through Verification

Manual browser verification via MCP browser extension:

| Page | Status | Notes |
|------|--------|-------|
| Homepage (`/`) | ✅ | Landing page loads, navigation works |
| Login (`/login`) | ✅ | Auto-login in dev mode |
| Dashboard (`/dashboard`) | ✅ | Overview stats, quick actions visible |
| Jobs List (`/dashboard/jobs`) | ✅ | Table renders, filters work |
| Job Detail (`/dashboard/jobs/:id`) | ✅ | All tabs load (Overview, Timeline, Documents, Files) |
| Scribe Config (`/dashboard/agents/scribe`) | ✅ | Configuration visible, Run Now button enabled |

---

## Screenshots

| File | Description |
|------|-------------|
| `frontend/test-results/screenshots/01-homepage.png` | Landing page |
| `frontend/test-results/screenshots/02-login-page.png` | Login page |
| `frontend/test-results/screenshots/03-scribe-page.png` | Scribe configuration |

---

## Commands

```bash
# Full verification
./scripts/verify-local.sh

# Individual gates
pnpm -C backend install && pnpm -C frontend install
./scripts/db-up.sh
export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/akis_v2"
pnpm -C backend db:migrate
pnpm -C backend typecheck && pnpm -C backend lint && pnpm -C backend test
pnpm -C frontend typecheck && pnpm -C frontend lint && pnpm -C frontend test && pnpm -C frontend build

# API smoke test
./scripts/dev-smoke-jobs.sh

# Playwright e2e
pnpm -C frontend exec playwright test local-smoke
```

---

## Known Limitations

- MCP Gateway verification is optional (not blocking for core development)
- Integration tests require PostgreSQL running on port 5433
- Frontend build produces a static artifact in `frontend/dist/`
- `VITE_ENABLE_DEV_LOGIN` must be set for dev login e2e test

---

## Notes

- All logs available in `/tmp/verify-*.log` for this run
- DB port standardized to 5433 (not 5432)
- `drizzle.config.ts` now prioritizes shell-exported `DATABASE_URL`
