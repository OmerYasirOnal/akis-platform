# QA Evidence Report

**Generated:** 2025-12-25 01:30:00 UTC  
**Branch:** `main` (pre-commit for OpenRouter support)  
**Feature:** Real OpenRouter AI Provider Support

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
| frontend-test | ✅ PASS |
| frontend-build | ✅ PASS |
| API smoke test | ✅ PASS (5/5) |

---

## AI Provider Verification

### Mock Mode (Tests/CI)
```
[AIService] Using mock provider (test environment)
```
✅ All 186 backend tests pass with mock provider

### OpenRouter Mode (Runtime)
```
[AIService] Using openrouter provider
[AIService] Models: default=meta-llama/llama-3.3-70b-instruct:free, 
                    planner=tngtech/deepseek-r1t-chimera:free, 
                    validation=google/gemini-2.0-flash-exp:free
[buildApp] AI Provider: openrouter
```
✅ Backend starts with real OpenRouter models when AI_PROVIDER=openrouter

### Environment Loading Precedence
```
1. Shell exports (highest priority)
2. backend/.env.local (override: true)
3. backend/.env (base defaults)
```
✅ .env.local correctly overrides .env values for AI_PROVIDER

---

## Smoke Test Results

```
🔍 Job API Smoke Test
=====================
1) GET /health             → 200 ✅
2) GET /api/agents/jobs    → 200 ✅
3) POST /api/agents/jobs   → 200 ✅
4) GET /api/agents/jobs/:id → 200 ✅
5) GET /api/agents/jobs/:id?include=trace,artifacts → 200 ✅
=====================
Smoke test complete
```

---

## Test Determinism

| Environment | AI Provider | External API Calls |
|-------------|-------------|-------------------|
| NODE_ENV=test | Always mock | ❌ None |
| NODE_ENV=development + AI_PROVIDER=mock | Mock | ❌ None |
| NODE_ENV=development + AI_PROVIDER=openrouter | Real | ✅ OpenRouter |

---

## Commands

```bash
# Full verification (deterministic, no external calls)
./scripts/verify-local.sh

# Start services with real AI
export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/akis_v2"
pnpm -C backend dev    # Check logs for "Using openrouter provider"
pnpm -C frontend dev

# Smoke test
./scripts/dev-smoke-jobs.sh
```

---

## Files Changed

| File | Change |
|------|--------|
| `backend/src/config/env.ts` | Added OPENROUTER_SITE_URL, OPENROUTER_APP_NAME; Fixed .env.local loading |
| `backend/src/services/ai/AIService.ts` | Force mock in test env; Configurable headers |
| `backend/test/unit/AIService.test.ts` | Updated tests for test-env mock behavior |
| `backend/.env.example` | Added OpenRouter header placeholders |
| `docs/ENV_SETUP.md` | Added AI Provider section |
| `docs/local-dev/LOCAL_DEV_QUICKSTART.md` | Added Real AI (OpenRouter) section |

---

## Known Limitations

- MCP Gateway tests require running gateway at `localhost:4010` (skipped by default)
- Dev login E2E test requires `VITE_ENABLE_DEV_LOGIN=true`
- OpenRouter free tier models may be rate-limited

---

## Quick Start for Real AI

```bash
# 1. Add to backend/.env.local (DO NOT COMMIT!)
AI_PROVIDER=openrouter
AI_API_KEY=sk-or-v1-***

# 2. Start backend
export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/akis_v2"
pnpm -C backend dev

# 3. Check logs for "Using openrouter provider"
```
