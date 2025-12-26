# QA Evidence: Phase 2 + UI Modernization (Final)

**Date:** 2025-12-26
**Subject:** Deterministic DB-offline behavior and Real-wired Dashboard UI

## 1. Backend: DB Offline Determinism

**Scenario:** Postgres container STOPPED manually.

### Unit Tests
**Command:** `pnpm test` (backend)  
**Result:** ✅ PASS (150 tests)  
**Evidence:** 150 unit tests passed without any DB connection attempt.

### Integration Tests (Skip Mode)
**Command:** `SKIP_DB_TESTS=true pnpm run test:integration`  
**Result:** ✅ PASS (30 tests, 1 skipped)  
**Evidence:** Trace Persistence & Scribe Config suites explicitly skipped. Health/Discovery/MCP mock tests passed.

### Integration Tests (Fail-Fast Mode)
**Command:** `pnpm run test:integration` (no skip flag)  
**Result:** ✅ FAIL FAST (Correct Contract)  
**Evidence:** 
- Trace Persistence: "Database is unreachable..."
- Scribe Config: "Database is unreachable..."
- Suite aborts immediately, preventing cascading timeouts.

## 2. Backend: DB Online Coverage

**Scenario:** Postgres container STARTED manually.

### Integration Tests (Full)
**Command:** `pnpm run test:integration`  
**Result:** ✅ PASS (36 tests)  
**Evidence:** All DB-dependent suites (Trace Persistence, Scribe Config) ran and passed.

## 3. CI/CD Artifact Configuration

**Status:** Verified  
**Files:** `.github/workflows/pr-gate.yml`, `.github/workflows/ci.yml`
- `pr-gate.yml`: Updated to run `pnpm run test:unit` for maximum determinism.
- `ci.yml`: Runs `pnpm run test:ci` (unit + integration).
- Both upload `backend-tests.log` using `if: always()` to ensure debuggability on failure.

## 4. UI Modernization: Real Wired Dashboard

**Status:** Complete  
**Changes:** 
- `RepoSidebar`: Wired to real `githubDiscoveryApi`. Fetches owners and repos.
- `DashboardChat`: Wired to real `agentsApi.runAgent`. Triggers Scribe Orchestrator.
- `Persistence`: Selected repo is saved to `localStorage`.
- `Error Handling`: Actionable UI errors when backend is unreachable or context missing.

## Verification Summary Table

| Scope | Command | State | Result |
| :--- | :--- | :--- | :--- |
| **Backend Unit** | `pnpm test` | DB Offline | ✅ PASS |
| **Backend Int** | `SKIP_DB_TESTS=true ...` | DB Offline | ✅ PASS |
| **Backend Int** | `pnpm test:integration` | DB Offline | ✅ FAIL (Expected) |
| **Backend Int** | `pnpm test:integration` | DB Online | ✅ PASS |
| **Frontend Qual**| `lint` & `typecheck` | N/A | ✅ PASS |
| **CI Artifacts** | `if: always()` | N/A | ✅ VERIFIED |


