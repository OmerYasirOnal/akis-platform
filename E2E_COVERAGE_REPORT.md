# E2E Coverage Report — qa/e2e-and-agent-contracts

> Generated: 2026-02-09
> Branch: `qa/e2e-and-agent-contracts`

## Summary

| Metric | Before | After |
|--------|--------|-------|
| Total E2E specs | 4 files | 7 files |
| Total E2E tests | 16 tests | **47 tests** |
| Unit tests | 77 tests | **83 tests** |
| Flaky tests | unknown | **0** |
| CI status | Red (pnpm not found) | **Green** |

## Coverage Matrix

### Auth Suite (12 tests — unchanged)

| Spec | Tests | Status |
|------|-------|--------|
| `auth-login-flow.spec.ts` | 4 | PASS |
| `auth-signup-flow.spec.ts` | 4 | PASS |
| `auth-deep-links.spec.ts` | 4 | PASS |

### Trace Console Suite (10 tests — NEW)

| ID | Test | Coverage |
|----|------|----------|
| T1 | Page renders heading + core elements | Route load |
| T2 | Run button enables when spec entered | Form interaction |
| T3 | Logs and Results tabs visible | Tab rendering |
| T4 | Logs empty state | Empty state |
| T5 | Results tab empty state | Empty state |
| T6 | Happy path: submit → running → completed | Full job lifecycle |
| T7 | Backend 500 on submit | Error handling |
| T8 | Job failure shows error message | Failure state |
| T9 | After completion, Run Trace re-enabled | Re-run capability |
| T10 | Deep link returns SPA HTML | SPA routing |

### Proto Console Suite (12 tests — EXPANDED from 4)

| ID | Test | Coverage |
|----|------|----------|
| P1 | Page renders heading + core elements | Route load |
| P2 | Run button enables when requirements entered | Form interaction |
| P3 | Logs and Artifacts tabs visible | Tab rendering |
| P4 | Logs empty state | Empty state |
| P5 | Artifacts tab empty state | Empty state |
| P6 | AI keys status gate before submission | Provider check |
| P7 | Happy path: pending → running → completed + artifacts | Full lifecycle |
| P8 | Backend 500 on submit | Error handling |
| P9 | Job failure shows error message | Failure state |
| P10 | After completion, Run Proto re-enabled | Re-run capability |
| P11 | Deep link returns SPA HTML | SPA routing |
| P12 | Tech Stack optional input visible | UI element |

### Navigation & Route Guards Suite (8 tests — NEW)

| ID | Test | Coverage |
|----|------|----------|
| N1 | Sidebar shows Agents group (Scribe, Trace, Proto) | Sidebar nav |
| N2 | Clicking Trace navigates correctly | Client-side routing |
| N3 | Clicking Proto navigates correctly | Client-side routing |
| G1 | Unauthenticated /dashboard → /login | Route guard |
| G2 | Unauthenticated /dashboard/trace → /login | Route guard |
| G3 | Unauthenticated /dashboard/proto → /login | Route guard |
| G4 | Authenticated deep link /dashboard/trace | Deep link |
| G5 | Authenticated deep link /dashboard/proto | Deep link |

## CI Root Cause & Fix

**Symptom:** `pnpm: not found` (exit code 127) in E2E step.

**Root cause:** `playwright.config.ts` webServer command was `pnpm dev` but CI workflow (`ci.yml`) installs dependencies with `npm ci` and does not install pnpm for the frontend job.

**Fix:** Changed `playwright.config.ts` webServer command to `npm run dev`.

## Bug Fix — Log Preservation

**Symptom:** "Starting workflow" and "Job submitted" log entries disappeared during job polling.

**Root cause:** `pollJobStatus` in both Trace and Proto consoles replaced all logs with trace events from the backend response (`setLogs(newLogs)`), wiping manually-added entries.

**Fix:** Changed to `setLogs((prev) => { const manualLogs = prev.filter(...); return [...manualLogs, ...traceLogs]; })` to preserve start/submit log entries.

## Anti-Flake Measures

- All mock responses use deterministic data (no random values)
- Sidebar selectors scoped to `aside nav` to avoid mobile/desktop duplication
- Timeouts set appropriately (15s for polling lifecycle, 10s for submissions)
- Proto tests account for auto-switch to Artifacts tab on completion
- Single shared mock helper (`mock-dashboard-apis.ts`) eliminates copy-paste drift

### Getting Started Card Suite (5 tests — NEW, S0.5.2-UX-3)

| ID | Test | Coverage |
|----|------|----------|
| GS1 | Card renders with 3 onboarding steps | Dashboard overview |
| GS2 | AI keys step completed when configured | API integration |
| GS3 | Dismiss button hides card | UI interaction |
| GS4 | Dismissed state persists across navigation | localStorage |
| GS5 | Step links point to correct destinations | Navigation |

## Quality Gates (Local)

| Check | Result |
|-------|--------|
| `npm run typecheck` | PASS |
| `npm run lint` | PASS (2 pre-existing warnings) |
| `npm test` (83 unit) | PASS |
| `npm run build` | PASS |
| E2E (47 tests) | **PASS** — 0 flaky |
