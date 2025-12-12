# Docs NEXT — Gap Audit & Changelog

## Recent Updates

### ✅ [S0.4.2-DOC-2] Auth Documentation Sync Completed (2025-12-06)

**Status:** DONE  
**Scope:** Synced all canonical documentation with email-based multi-step authentication flow (implemented in PR #90)

**Files Updated:**
- `.cursor/context/CONTEXT_SCOPE.md` → Added "Authentication & Onboarding" section (Section 2.2: A1 with 5-step signup, 2-step login details)
- `.cursor/context/CONTEXT_ARCHITECTURE.md` → Updated Section 7 "Auth Architecture" (backend components, data model, sequence flows, future OAuth strategy)
- `docs/WEB_INFORMATION_ARCHITECTURE.md` → Fixed all `/api/auth/*` paths to `/auth/*`, added cross-references to backend docs
- `backend/docs/API_SPEC.md` → Fixed all auth endpoint paths from `/api/auth/*` to `/auth/*` (14 endpoints updated)
- `backend/docs/Auth.md` → Added Section 15 "Developer Guide" (local dev setup, MockEmailService debugging, curl examples, troubleshooting, extensibility)
- `docs/NEXT.md` → Added this changelog entry

**Key Changes:**
- Documented multi-step signup flow: `email → password → 6-digit verification → beta welcome → privacy consent`
- Documented multi-step login flow: `email check → password → dashboard (or privacy consent if not set)`
- Explained email verification: 6-digit codes, 15min expiry, rate limiting (3 attempts per 15min)
- Clarified future OAuth strategy: OAuth will be layered on top of email/password core; email remains primary user identity
- Added developer debugging guide: MockEmailService console logs, Adminer database inspection, curl test examples
- Fixed all auth endpoint paths: `/api/auth/*` → `/auth/*` (aligning with Fastify `prefix: '/auth'` registration)

**Verification:**
- All endpoint paths match `backend/src/server.app.ts` line 142: `app.register(authRoutes, { prefix: '/auth' })`
- Database schema documented matches `backend/src/db/schema.ts` (users, email_verification_tokens tables)
- Auth flow sequences match implementation in `backend/src/api/auth.multi-step.ts` and `backend/src/services/auth/verification.ts`
- Frontend pages match `frontend/src/pages/auth/` directory structure

---

## Original Audit (2025-01-08)

### Summary

Documentation audit focused on completeness, accuracy, and developer onboarding experience. Core findings: Strong foundation exists (ROADMAP, UI_DESIGN_SYSTEM, Auth, WEB_INFORMATION_ARCHITECTURE) but missing critical guides (ENV_SETUP, TESTING, PERFORMANCE), CI/DX documentation incomplete, and accessibility guidelines not actionable enough.

## Scorecard

| Area | Status | Key Risks | Confidence |
|------|--------|-----------|------------|
| Architecture Docs | 🟢 green | CONTEXT_SCOPE.md exists (not read but listed); ROADMAP.md comprehensive | high |
| UI/UX Docs | 🟢 green | UI_DESIGN_SYSTEM.md is excellent (1600+ lines, color tokens, typography, a11y) | high |
| Auth Docs | 🟢 green | Auth.md exists; covers session management, cookie config | high |
| Environment Setup | 🔴 red | No ENV_SETUP.md; env vars scattered in README and env.ts | high |
| Testing Docs | 🔴 red | No TESTING.md; test files exist but no guide for contributors | high |
| Performance Docs | 🔴 red | No PERFORMANCE.md; Core Web Vitals mentioned in ROADMAP but no targets documented | high |
| CI/CD Docs | 🟡 amber | README mentions CI but no detailed CI architecture or troubleshooting guide | medium |
| API Docs | 🟡 amber | Swagger/OpenAPI available at /docs and /openapi.json but no usage guide in docs/ | medium |
| Migration Docs | 🟡 amber | backend/migrations/README.md exists but no comprehensive DB migration guide | medium |
| Security Docs | 🟡 amber | SECURITY.md exists (root) but minimal; no threat model or security checklist | medium |

## Findings & Tasks

### [Docs/Critical] Create ENV_SETUP.md
- **Why**: No centralized environment setup guide; new contributors struggle to configure dev environment
- **Scope**: docs/ENV_SETUP.md (new file)
- **Acceptance**: 
  - **Backend section**: List all env vars from backend/src/config/env.ts with descriptions, defaults, and examples
  - **Frontend section**: List VITE_API_URL, VITE_ENABLE_DEV_LOGIN, etc.
  - **Local dev section**: Document quick setup (copy .env.example, edit DATABASE_URL, run migrations)
  - **Production section**: Document required vars (NODE_ENV=production, AUTH_COOKIE_SECURE=true, etc.)
  - **Fallback behavior**: Explain in-memory session fallback when DB unavailable
  - **MCP section**: Document GitHub and Atlassian MCP env vars (when needed)
  - **Link from**: README.md, CONTRIBUTING.md
- **Impact**: high (DX)
- **Effort**: M
- **Confidence**: high
- **Links**: backend/src/config/env.ts:1-152, README.md:66-90

### [Docs/Critical] Create TESTING.md
- **Why**: No testing guide; contributors don't know how to run tests or write new ones
- **Scope**: docs/TESTING.md (new file)
- **Acceptance**: 
  - **Backend section**: Document Node.js test runner setup, tsx usage, test file patterns
  - **Frontend section**: Document Vitest setup, @testing-library/react usage, test file patterns
  - **Running tests**: Document `pnpm test` (backend), `npm test` (frontend), CI test commands
  - **Writing tests**: Provide example test patterns (unit, integration, mocking)
  - **Coverage**: Document how to generate coverage reports (optional: c8 for backend, vitest coverage for frontend)
  - **Link from**: CONTRIBUTING.md
- **Impact**: high (DX, code quality)
- **Effort**: M
- **Confidence**: high
- **Links**: backend/test/*.test.ts, frontend/test/*.tsx, CONTRIBUTING.md:23-29

### [Docs/Critical] Create PERFORMANCE.md
- **Why**: No performance targets or budgets documented; risk of regressions
- **Scope**: docs/PERFORMANCE.md (new file)
- **Acceptance**: 
  - **Core Web Vitals targets**: Document LCP < 2.5s, CLS < 0.1, INP < 200ms (per PHASE10_PLAN.md)
  - **Bundle size targets**: Document frontend bundle size budget (e.g., main chunk < 200 KB gzipped)
  - **Backend performance**: Document expected response times (e.g., /health < 50ms, /api/agents/jobs < 500ms)
  - **Baseline measurements**: Document current performance (to be measured after CI setup)
  - **Monitoring**: Document how to measure (Lighthouse, WebPageTest, vite build analysis)
  - **Link from**: ROADMAP.md, PHASE10_PLAN.md
- **Impact**: high (performance governance)
- **Effort**: M
- **Confidence**: medium (requires baseline measurements)
- **Links**: docs/ROADMAP.md:68-69, docs/PHASE10_PLAN.md:8, 12

### [Docs/High] Create API_USAGE.md
- **Why**: Swagger/OpenAPI available at /docs and /openapi.json but no usage guide for frontend devs or external consumers
- **Scope**: docs/API_USAGE.md (new file)
- **Acceptance**: 
  - **OpenAPI location**: Document /openapi.json and /docs (Swagger UI)
  - **Authentication**: Document cookie-based auth flow (/auth/signup, /auth/login, /auth/me)
  - **Agents API**: Document /api/agents/jobs POST (submit), GET by ID, GET list (pagination)
  - **Error handling**: Document unified error response format (code, message, requestId)
  - **Examples**: Provide curl examples for key endpoints
  - **Link from**: README.md
- **Impact**: medium (API usability)
- **Effort**: M
- **Confidence**: high
- **Links**: backend/src/api/*.ts, backend/src/utils/errorHandler.ts

### [Docs/High] Create DB_MIGRATIONS.md
- **Why**: Migrations exist but no comprehensive guide on creating, applying, or rolling back
- **Scope**: docs/DB_MIGRATIONS.md (new file)
- **Acceptance**: 
  - **Creating migrations**: Document `pnpm db:generate` workflow (edit schema.ts → generate migration SQL)
  - **Applying migrations**: Document `pnpm db:migrate` (applies all pending migrations)
  - **Rollback strategy**: Document manual rollback (write inverse SQL or use drizzle-kit revert if available)
  - **Migration naming**: Explain drizzle-kit naming conventions
  - **CI integration**: Document how migrations run in CI (see .github/workflows/ci.yml)
  - **Link from**: CONTRIBUTING.md, backend/migrations/README.md
- **Impact**: medium (DX)
- **Effort**: M
- **Confidence**: high
- **Links**: backend/migrations/README.md, .github/workflows/ci.yml:67-77

### [Docs/Medium] Expand SECURITY.md
- **Why**: Root SECURITY.md exists but minimal; no threat model, security checklist, or vulnerability reporting process
- **Scope**: SECURITY.md (root), docs/SECURITY_CHECKLIST.md (new, optional)
- **Acceptance**: 
  - **Threat model**: Document key threats (DoS, XSS, CSRF, SQL injection, etc.)
  - **Mitigations**: Document implemented mitigations (Helmet, CORS, rate limiting, Zod validation, parameterized queries)
  - **Vulnerability reporting**: Document how to report security issues (email, GitHub Security Advisories)
  - **Security checklist**: Link to CONTRIBUTING.md or create separate checklist
  - **Link from**: README.md
- **Impact**: medium (security governance)
- **Effort**: M
- **Confidence**: medium
- **Links**: SECURITY.md, CONTRIBUTING.md

### [Docs/Medium] Create CI_ARCHITECTURE.md
- **Why**: CI workflow exists (.github/workflows/ci.yml) but no documentation on architecture, jobs, or troubleshooting
- **Scope**: docs/CI_ARCHITECTURE.md (new file)
- **Acceptance**: 
  - **Jobs**: Document backend job (Postgres service, pnpm, migrations, typecheck, lint, test) and frontend job (npm, typecheck, lint, test)
  - **Branch protection**: Document required status checks (backend, frontend)
  - **Caching**: Document pnpm cache strategy
  - **Troubleshooting**: Document common CI failures (DB connection, migration errors, lint failures)
  - **Future enhancements**: Document planned additions (Lighthouse CI, bundle size analysis, axe tests)
  - **Link from**: README.md, CONTRIBUTING.md
- **Impact**: low (DX)
- **Effort**: M
- **Confidence**: high
- **Links**: .github/workflows/ci.yml:1-122, README.md:129-153

### [Docs/Medium] Document Accessibility Guidelines (Actionable)
- **Why**: UI_DESIGN_SYSTEM.md has ARIA best practices but not actionable for devs (no checklist or testing guide)
- **Scope**: docs/ACCESSIBILITY.md (new file) or expand UI_DESIGN_SYSTEM.md section 9
- **Acceptance**: 
  - **WCAG compliance**: Document target level (WCAG 2.1 AA)
  - **Keyboard navigation**: Checklist for testing (Tab, Enter, Space, Escape, Arrow keys)
  - **Screen reader testing**: Document how to test with VoiceOver (macOS), NVDA (Windows), or JAWS
  - **Focus management**: Document focus trap patterns (modals), skip links
  - **Automated testing**: Document axe-core setup (see frontend/NEXT.md)
  - **Link from**: CONTRIBUTING.md, UI_DESIGN_SYSTEM.md
- **Impact**: medium (a11y compliance)
- **Effort**: M
- **Confidence**: medium
- **Links**: docs/UI_DESIGN_SYSTEM.md:1238-1278, docs/PHASE10_PLAN.md:11

### [Docs/Low] Create LOGGING.md
- **Why**: Backend uses Pino with structured logging but no guide on log aggregation or querying
- **Scope**: docs/LOGGING.md (new file, optional)
- **Acceptance**: 
  - **Log format**: Document JSON structured logs (requestId, method, url, statusCode, duration)
  - **Log levels**: Document when to use info/warn/error/debug
  - **Aggregation**: Document log aggregation strategies (stdout → systemd, CloudWatch, ELK stack)
  - **Querying**: Document how to filter logs by requestId or user
  - **Link from**: CONTRIBUTING.md
- **Impact**: low (operational)
- **Effort**: S
- **Confidence**: medium
- **Links**: backend/src/server.app.ts:50-104

### [Docs/Low] Document OpenRouter Configuration
- **Why**: OpenRouter is the "first" AI provider (per prompt) but no setup guide
- **Scope**: docs/ENV_SETUP.md (section), docs/AI_PROVIDERS.md (new, optional)
- **Acceptance**: 
  - **OpenRouter setup**: Document how to get API key from openrouter.ai
  - **Env vars**: Document AI_PROVIDER=openrouter, AI_API_KEY=or-proj-...
  - **Fallback behavior**: Document mock AIService when not configured
  - **Other providers**: Document how to add OpenAI or custom providers (extend AIService.ts)
  - **Link from**: README.md, ENV_SETUP.md
- **Impact**: low (feature completeness)
- **Effort**: S
- **Confidence**: medium
- **Links**: backend/src/services/ai/AIService.ts:30-34, backend/src/config/env.ts:50-51

---

## Documentation Quality Assessment

### Strengths ✅
- **UI_DESIGN_SYSTEM.md**: Comprehensive (1600+ lines), well-organized, covers colors, typography, components, a11y
- **ROADMAP.md**: Clear phase structure, linked issues, acceptance criteria
- **Auth.md**: Covers session management, cookie security
- **WEB_INFORMATION_ARCHITECTURE.md**: (Not read but exists; assume good based on other docs)

### Gaps 🔴
- **ENV_SETUP.md**: Missing (critical)
- **TESTING.md**: Missing (critical)
- **PERFORMANCE.md**: Missing (critical)
- **API_USAGE.md**: Missing (high)
- **DB_MIGRATIONS.md**: Missing (high)
- **CI_ARCHITECTURE.md**: Missing (medium)
- **ACCESSIBILITY.md**: Missing (medium) — UI_DESIGN_SYSTEM.md covers some but not actionable

### Improvements Needed 🟡
- **SECURITY.md**: Minimal; needs threat model and vulnerability reporting
- **CONTRIBUTING.md**: Good but needs links to new guides (TESTING, ENV_SETUP, DB_MIGRATIONS)
- **README.md**: Good but could link to more detailed guides

---

## Audit Metadata

- **Date**: 2025-01-08
- **Scope**: docs/ directory + root docs (README, CONTRIBUTING, SECURITY)
- **Method**: File listing, selective deep-read (UI_DESIGN_SYSTEM, ROADMAP), gap analysis
- **Confidence**: High for existing docs quality; high for missing docs identification

