# NEXT — Gap Audit (2025-01-08)

## Summary

Comprehensive gap analysis performed across the entire AKIS Platform codebase (frontend, backend, docs, CI/DX). This audit was conducted following Phase 9.1 (Dark Theme Unification & Auth UI) and Phase 9.2 (i18n & Theming Foundations) completions, with focus on identifying blockers and risks for Phase 10 (Next Foundations).

### Key Findings
- **Backend**: Security plugins exist but not fully wired; rate limiting not configured; missing .env.example
- **Frontend**: TypeScript compilation errors blocking production builds; i18n coverage good but missing keys in some areas
- **CI/DX**: Lint and typecheck failures masked by `|| true` flags; no performance budgets enforced
- **Docs**: Missing ENV_SETUP.md; no comprehensive testing guide; accessibility guidelines incomplete
- **Architecture**: Core principles (Fastify + Drizzle + MCP) adhered to; no Prisma or Next.js violations found ✅

## Scorecard

| Area | Status | Key Risks | Confidence |
|------|--------|-----------|------------|
| Backend APIs | 🟡 amber | Security plugins not registered; rate limiting missing; no .env.example | high |
| Frontend UX/i18n/theme | 🟡 amber | TypeScript errors blocking builds; many TODO placeholders; theme toggle exists but needs testing | high |
| Agents Orchestrator/Factory | 🟢 green | Architecture clean; orchestrator properly isolates agents; DI pattern implemented correctly | high |
| DB/Drizzle | 🟢 green | Migrations present; schema complete; no Prisma violations | high |
| CI/DX | 🔴 red | Lint/typecheck failures masked; no bundle size monitoring; missing PR templates for docs | high |
| Docs | 🟡 amber | Good foundation (ROADMAP, UI_DESIGN_SYSTEM, Auth) but missing ENV_SETUP, testing guides, performance budgets doc | high |
| Performance | 🟡 amber | No bundle analysis automated; no Core Web Vitals monitoring; locale lazy-loading not verified | medium |
| A11y | 🟡 amber | Design system has good ARIA guidelines; focus rings defined; but no automated axe tests in CI | medium |
| Security | 🟡 amber | Helmet & CORS plugins exist but not registered in server.app.ts; rate limiting planned but not implemented | high |

## Findings & Tasks

See detailed task lists in:
- `backend/NEXT.md` — Backend-specific gaps (security, env, rate limits)
- `frontend/NEXT.md` — Frontend gaps (TypeScript errors, TODOs, bundle size, a11y automation)
- `docs/NEXT.md` — Documentation gaps (ENV_SETUP, testing guide, perf budgets)

### Cross-Cutting Tasks

#### [Platform] Phase 10 Epic Linkage
- **Why**: All Phase 10 issues need to be tracked under a single epic for milestone management
- **Scope**: GitHub Issues, ROADMAP.md, PHASE10_PLAN.md
- **Acceptance**: 
  - Epic #44 exists and contains checklist of all Phase 10 issues
  - Each issue links back to epic in body text
  - ROADMAP.md updated with issue numbers
- **Impact**: high
- **Effort**: S
- **Confidence**: high
- **Links**: docs/ROADMAP.md:52-72, docs/PHASE10_PLAN.md

#### [CI] Fix Masked Linter/Typecheck Failures
- **Why**: `.github/workflows/ci.yml` uses `|| true` on lint/typecheck steps, allowing failures to pass silently
- **Scope**: .github/workflows/ci.yml lines 81, 85, 113, 117
- **Acceptance**: 
  - Remove `|| true` from backend typecheck step (line 81)
  - Remove `|| true` from backend lint step (line 85)
  - Remove `|| true` from frontend typecheck step (113)
  - Remove `|| true` from frontend lint step (117)
  - Fix all TypeScript/ESLint errors blocking green CI
- **Impact**: high
- **Effort**: M (includes fixing errors)
- **Confidence**: high
- **Links**: .github/workflows/ci.yml:79-122

#### [DX] Create .env.example Files
- **Why**: No .env.example files exist; new contributors don't know what environment variables are required
- **Scope**: backend/.env.example, frontend/.env.example
- **Acceptance**: 
  - backend/.env.example with all keys from backend/src/config/env.ts (database, auth, AI, MCP, GitHub, Atlassian)
  - frontend/.env.example with VITE_API_URL, VITE_ENABLE_DEV_LOGIN
  - README.md setup instructions reference .env.example
  - Values are safe placeholders (no secrets)
- **Impact**: medium
- **Effort**: S
- **Confidence**: high
- **Links**: backend/src/config/env.ts:1-152, README.md:66-69

#### [Docs] Create ENV_SETUP.md
- **Why**: Environment setup is scattered across README and not comprehensive
- **Scope**: docs/ENV_SETUP.md (new file)
- **Acceptance**: 
  - List all backend env vars with descriptions and defaults
  - List all frontend env vars
  - Explain local dev vs. production settings
  - Document fallback behavior (e.g., in-memory sessions when DB unavailable)
  - Link from README.md
- **Impact**: medium
- **Effort**: M
- **Confidence**: high
- **Links**: README.md:66-90, backend/src/config/env.ts

#### [Perf] Document and Enforce Performance Budgets
- **Why**: No documented Core Web Vitals targets or bundle size limits
- **Scope**: docs/PERFORMANCE.md (new), .github/workflows/ci.yml
- **Acceptance**: 
  - docs/PERFORMANCE.md with LCP < 2.5s, CLS < 0.1, INP < 200ms targets
  - Document current frontend bundle sizes (baseline)
  - Add Vite bundle analysis output to CI artifacts
  - Optional: Lighthouse CI or similar for automated checks
- **Impact**: medium
- **Effort**: M
- **Confidence**: medium
- **Links**: docs/ROADMAP.md:69, docs/PHASE10_PLAN.md:8

#### [CI] Add Bundle Size Reporting
- **Why**: No visibility into frontend chunk sizes; risk of bloat
- **Scope**: frontend/vite.config.ts, .github/workflows/ci.yml
- **Acceptance**: 
  - Add vite-plugin-bundle-analyzer or rollup-plugin-visualizer to frontend
  - CI artifacts upload bundle report (JSON + HTML)
  - Document baseline sizes in frontend/NEXT.md or docs/PERFORMANCE.md
- **Impact**: medium
- **Effort**: S
- **Confidence**: high
- **Links**: frontend/vite.config.ts, docs/PERFORMANCE.md

#### [A11y] Automated Accessibility Testing
- **Why**: Design system has good ARIA patterns but no automated verification
- **Scope**: frontend/test, .github/workflows/ci.yml
- **Acceptance**: 
  - Install @axe-core/react or similar
  - Add axe tests to critical pages (Landing, Login, Signup, Dashboard)
  - CI runs axe tests and fails on violations
  - Document findings in frontend/NEXT.md
- **Impact**: medium
- **Effort**: M
- **Confidence**: medium
- **Links**: docs/UI_DESIGN_SYSTEM.md:1238-1278, docs/PHASE10_PLAN.md:11

#### [Code Quality] TODO/FIXME/HACK Harvest
- **Why**: 50+ TODO comments found via `git grep`; many are actionable
- **Scope**: Entire codebase (see backend/NEXT.md and frontend/NEXT.md for lists)
- **Acceptance**: 
  - Review all TODOs
  - Convert actionable items to GitHub issues with `todo` label
  - Remove or defer non-critical TODOs
  - Update NEXT.md with TODO audit status
- **Impact**: low (individually), medium (cumulatively)
- **Effort**: L (batched review)
- **Confidence**: medium
- **Links**: backend/src/services/ai/AIService.ts:112-140, frontend/src/pages/*/*.tsx (multiple files)

#### [Docs] Comprehensive Testing Guide
- **Why**: No centralized testing documentation; test files exist but no guide
- **Scope**: docs/TESTING.md (new file)
- **Acceptance**: 
  - Document backend test setup (Node.js native test runner, tsx)
  - Document frontend test setup (Vitest, @testing-library/react)
  - Example test patterns (unit, integration, e2e if applicable)
  - CI test execution flow
  - Link from CONTRIBUTING.md
- **Impact**: low
- **Effort**: M
- **Confidence**: high
- **Links**: backend/test/*.test.ts, frontend/src/test/*.tsx, CONTRIBUTING.md

#### [Security] Review & Document Security Posture
- **Why**: Helmet and CORS plugins exist but not fully integrated; no rate limiting
- **Scope**: backend/src/plugins/security, backend/src/server.app.ts
- **Acceptance**: 
  - Document current security measures in SECURITY.md or docs/SECURITY.md
  - List what's implemented (CORS, cookie security, Helmet partial)
  - List what's planned (rate limiting, CSP tuning)
  - Reference issue numbers for pending work
- **Impact**: medium
- **Effort**: S
- **Confidence**: high
- **Links**: SECURITY.md, backend/src/plugins/security/*

---

## Next Steps

1. **Create GitHub Issues**: Use `gh issue create` for each task listed above and in package-level NEXT.md files
2. **Link Epic**: Ensure all issues reference Epic #44 (Phase 10 — Next Foundations)
3. **Prioritize**: Mark high-impact, high-confidence tasks as Phase 10.0 blockers
4. **Fix Blocking Errors**: Resolve TypeScript errors in frontend (Login.tsx, AppHeader.tsx) immediately
5. **CI Hardening**: Remove `|| true` and fix all lint/typecheck issues
6. **Documentation Sprint**: Create ENV_SETUP.md, TESTING.md, PERFORMANCE.md

---

## Audit Metadata

- **Date**: 2025-01-08
- **Auditor**: AI Assistant (Gap Audit Task)
- **Scope**: Full codebase (frontend, backend, docs, CI)
- **Method**: Static analysis, file review, git grep for TODOs, architecture compliance check
- **Reference**: Phase 10 Plan (docs/PHASE10_PLAN.md), ROADMAP (docs/ROADMAP.md)
