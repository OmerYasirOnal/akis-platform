# QA Evidence: Merge Gate DB Behavior

**Date:** 2025-12-26  
**Subject:** Deterministic behavior of DB-dependent tests in merge gates

## 1. Unit Tests (Clean, No DB)

**Command:** `cd backend && pnpm test`  
**Expectation:** Should run unit tests only and PASS without needing database.

```text
> akis-backend@0.1.0 test /Users/omeryasironal/Desktop/bitirme_projesi/akis-platform-devolopment/devagents/backend
> pnpm run test:unit


> akis-backend@0.1.0 test:unit /Users/omeryasironal/Desktop/bitirme_projesi/akis-platform-devolopment/devagents/backend
> NODE_ENV=test SKIP_MCP_TESTS=true SKIP_DB_TESTS=true node --test --import dotenv/config --import tsx test/unit/*.test.ts

...
✔ PlanGenerator (5.208125ms)
...
ℹ tests 150
ℹ suites 49
ℹ pass 150
ℹ fail 0
```

## 2. Integration Tests (Skip Logic)

**Command:** `cd backend && SKIP_DB_TESTS=true pnpm run test:integration`  
**Expectation:** Should skip DB-dependent tests with clear messages, preserving other integration tests (like Health/Discovery).

```text
[MCP Tests] SKIPPED: Set MCP_GATEWAY_URL or GITHUB_MCP_BASE_URL to run these tests
[MCP Tests] Example: MCP_GATEWAY_URL=http://localhost:4010 pnpm test
...
✔ Health Endpoints (56.145583ms)
...
﹣ Scribe config-aware job creation (0.424709ms) # SKIP
[Trace Persistence] SKIPPED: SKIP_DB_TESTS is set
▶ Trace Persistence
  ✔ should persist all explainability trace event types (0.280292ms)
  ✔ should persist reasoning event with summary fields (0.135333ms)
  ✔ should persist tool_call event with asked/did/why fields (0.078125ms)
  ✔ should handle trace flush without errors (0.120875ms)
✔ Trace Persistence (2.276542ms)
ℹ tests 31
ℹ suites 17
ℹ pass 30
ℹ fail 0
ℹ cancelled 0
ℹ skipped 1
```

## Conclusion

The merge gates are now stable for environments without Docker:
1. `pnpm test` is safe by default (unit only).
2. `pnpm run test:ci` (used in CI) enables full suite but can be controlled via `SKIP_DB_TESTS`.
3. Connectivity checks fail fast instead of timing out if misconfigured.
