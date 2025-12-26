# QA Evidence — Frontend Gate Fix (ESM Imports / Type-only Imports)

**Date:** 2025-12-26  
**Scope:** PR Gate `frontend-gate` (typecheck + lint + test + build)  
**Goal:** Ensure no Vite/ESM import/export mismatches and TS `verbatimModuleSyntax` compliance.

---

## Symptom (Before)

| Area | Symptom | Status |
|------|---------|--------|
| `pnpm -C frontend build` | TS build failed due to unused `React` value imports and non-type-only imports under `verbatimModuleSyntax` | ❌ |

---

## Fix (What Changed)

| Change | Files | Why |
|--------|-------|-----|
| Remove unused `React` value imports | `frontend/src/components/dashboard/DashboardChat.tsx`, `frontend/src/components/dashboard/ChangelogWidget.tsx`, `frontend/src/components/dashboard/RepoSidebar.tsx` | `tsc -b` fails with TS6133 when `React` value is imported but not used |
| Use type-only imports for API models | `frontend/src/components/dashboard/RepoSidebar.tsx` | `verbatimModuleSyntax` requires `import type` for types (TS1484) |
| Clarify canonical API error contract | `frontend/src/services/api/github-discovery.ts` | Avoid name collision: canonical client error is `ApiError` from `services/api/HttpClient` (re-exported via `services/api/index.ts`) |

---

## Canonical `ApiError` Contract

| Item | Location |
|------|----------|
| Canonical error type | `frontend/src/services/api/HttpClient.ts` (`export interface ApiError extends Error`) |
| Public surface export | `frontend/src/services/api/index.ts` (`export type { ApiError } from './HttpClient'`) |

**Rule:** UI code must use `import type { ApiError }` (type-only) to avoid runtime ESM named-export expectations.

---

## Verification (After)

| Command (PR Gate parity) | Result |
|--------------------------|--------|
| `pnpm -C frontend typecheck` | ✅ PASS |
| `pnpm -C frontend lint` | ✅ PASS |
| `pnpm -C frontend test` | ✅ PASS |
| `pnpm -C frontend build` | ✅ PASS |

---

## Notes

- Build still prints non-blocking Rollup warnings (chunk size / dynamic import) — not a gate failure.


