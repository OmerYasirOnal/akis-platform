# QA Evidence Report

**Generated:** 2025-12-20 13:15 UTC  
**Branch:** `main`  
**Commit:** `a39e0d6` (HEAD)  
**Docker:** Available  
**Postgres:** Running (127.0.0.1:5433)

---

## Summary

| Gate | Command | Status | Notes | Evidence |
|------|---------|--------|-------|----------|
| **install** | `pnpm install` | ✅ PASS | Workspace deps current | (pre-run sanity) |
| **db-up** | `./scripts/db-up.sh` | ✅ PASS | Postgres ready, port 5433 listening | stdout captured |
| **migrations** | `pnpm -C backend db:migrate` | ✅ PASS | Drizzle migrations applied | /tmp/backend-migrate.log |
| **backend-typecheck** | `pnpm -C backend typecheck` | ✅ PASS | Zero errors | exit=0 |
| **backend-lint** | `pnpm -C backend lint` | ✅ PASS | Zero errors | exit=0 |
| **backend-test** | `pnpm -C backend test` (DATABASE_URL set) | ✅ PASS | **129/129 tests passed** | /tmp/backend-test.log |
| **frontend-typecheck** | `pnpm -C frontend typecheck` | ✅ PASS | Zero errors | exit=0 |
| **frontend-lint** | `pnpm -C frontend lint` | ✅ PASS | Zero errors | exit=0 |
| **frontend-test** | `pnpm -C frontend test` | ✅ PASS | **34/34 tests passed** | vitest output |
| **frontend-build** | `pnpm -C frontend build` | ✅ PASS | Production build complete | dist/ artifact |

---

## CI Evidence (source of truth)

**Latest main CI run:**
- **Run ID**: `20392738136`
- **Head SHA**: `a39e0d63cbc6e618843e781f1114b6126f12b0a5`
- **Status**: ✅ **success**
- **URL**: https://github.com/OmerYasirOnal/akis-platform-devolopment/actions/runs/20392738136

---

## Commands

```bash
# Full verification (Docker + Postgres required)
./scripts/db-up.sh
cd backend && pnpm db:migrate
cd backend && export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/akis_v2" && pnpm test
cd frontend && pnpm test && pnpm build

# Individual gates
pnpm -C backend lint
pnpm -C backend typecheck
pnpm -C frontend lint
pnpm -C frontend typecheck
```

---

## Known Limitations

- MCP Gateway verification **not run** in this QA session (requires `.env.mcp.local` with valid token)
- Scribe E2E runtime verification (live backend+frontend+MCP) **not performed** (requires manual UI or API smoke)
- `./scripts/verify-local.sh` script has bash 3.x compatibility issue (associative arrays) on macOS

---

## Notes

**All automated quality gates passed.** Backend tests include DB-dependent integration tests (all green). Frontend tests are stable and deterministic.

**Logs available in:**
- `/tmp/backend-test.log` (129 tests, 46 suites)
- Inline command outputs (this session)

---

**Status**: ✅ **ALL GATES PASS**  
**Last Updated**: 2025-12-20 by QA automation
