# Frontend NEXT — Gap Audit (2025-01-08)

## Summary

Frontend audit focused on React SPA architecture, i18n/theme foundations, UX polish, performance budgets, and accessibility. Core findings: React + Vite + Tailwind architecture is clean (no Next.js violations ✅), i18n (TR/EN) is well-implemented, theme toggle exists and works, BUT TypeScript compilation errors block production builds, many TODO placeholders exist, and no automated a11y/performance tests.

### Architecture Compliance ✅
- ✅ React (Vite SPA) — no Next.js or SSR found
- ✅ Tailwind CSS with design tokens (`ak-*` colors)
- ✅ i18n scaffolded (TR/EN locales, I18nProvider, useI18n hook)
- ✅ ThemeProvider with dark/light toggle (localStorage persistence)
- ✅ React Router v7 (no frameworks layered on top)

## Scorecard

| Area | Status | Key Risks | Confidence |
|------|--------|-----------|------------|
| Build/Compilation | 🔴 red | TypeScript errors in Login.tsx and AppHeader.tsx blocking `npm run build` | high |
| i18n Coverage | 🟢 green | TR/EN locales exist with good key coverage for agents, auth, status; translations appear complete | high |
| Theme Toggle | 🟢 green | ThemeProvider functional, dark mode default, light mode opt-in, localStorage persistence | high |
| Design System | 🟢 green | UI_DESIGN_SYSTEM.md comprehensive; tokens in theme/tokens.ts; Button/Input components consistent | high |
| UX Polish | 🟡 amber | Many TODO placeholders in pages (AboutPage, PricingPage, LandingPage, etc.); content gaps | high |
| Accessibility | 🟡 amber | Focus rings, ARIA labels present in design system; RouteGuards handle auth redirects; but no automated axe tests | medium |
| Performance | 🟡 amber | No bundle size monitoring; no Core Web Vitals CI checks; lazy-loading status unknown | medium |
| Route Guards | 🟢 green | ProtectedRoute and RequireRole implemented; login redirects work | high |
| Motion/Animations | 🟡 amber | MotionProvider exists; routeTransitions.ts present; prefers-reduced-motion support unclear | medium |

## Findings & Tasks

### [Frontend/Blocker] Fix TypeScript Compilation Errors
- **Why**: `npm run build` fails with TypeScript errors in Login.tsx and AppHeader.tsx
- **Scope**: 
  - frontend/src/pages/Login.tsx:82 — Type '"sm"' not assignable to ButtonSize
  - frontend/src/layouts/AppHeader.tsx:23 — 'devLoginEnabled' declared but never used
- **Acceptance**: 
  - Fix Login.tsx button size type error (change "sm" to "md" or update Button.tsx to accept "sm")
  - Fix AppHeader.tsx unused variable (remove or use devLoginEnabled)
  - `npm run build` succeeds without errors
  - Verify no new TS errors in CI
- **Impact**: high (blocks deployment)
- **Effort**: S
- **Confidence**: high
- **Links**: frontend/src/pages/Login.tsx:82, frontend/src/layouts/AppHeader.tsx:23

### [Frontend/UX] Resolve TODO Placeholders (Batch)
- **Why**: 40+ TODO comments in frontend pages (AboutPage, PricingPage, LandingPage, etc.); many are content placeholders
- **Scope**: frontend/src/pages/*.tsx (see list below)
- **Acceptance**: 
  - Review each TODO and categorize: critical (P0), nice-to-have (P1), defer (P2)
  - Convert P0 items to GitHub issues with `content`, `frontend`, `phase:10.0` labels
  - Update pages with minimal placeholder content or remove TODOs with comments
  - Document content roadmap in docs/CONTENT_ROADMAP.md (optional)
- **Impact**: medium (UX completeness)
- **Effort**: L (batched review + content writing)
- **Confidence**: medium
- **Links** (sample):
  - frontend/src/pages/AboutPage.tsx:6 — "TODO: add leadership bios, timeline, and values"
  - frontend/src/pages/PricingPage.tsx:59 — "TODO: add ROI calculator widget"
  - frontend/src/pages/PricingPage.tsx:109-111 — "TODO: Lifetime discount messaging, Beta feedback program, Migration support"
  - frontend/src/pages/LandingPage.tsx:121-123 — "TODO: partner logos, weekly hours saved, coverage uplift"
  - frontend/src/pages/StatusPage.tsx:6 — "TODO: embed status.akis.dev or third-party status widget"
  - frontend/src/pages/agents/AgentScribePage.tsx:13 — "TODO: expand with full feature copy, demo media, CTA buttons"
  - frontend/src/pages/agents/AgentTracePage.tsx:13 — "TODO: describe Trace value proposition, test generation pipeline"
  - frontend/src/pages/agents/AgentProtoPage.tsx:13 — "TODO: outline Proto's spec-to-MVP flow, scaffolding outputs"
  - frontend/src/pages/dashboard/*.tsx (multiple) — "TODO: wire real data, API integration"

### [Frontend/Feature] ROI Widget (Pricing Page)
- **Why**: Epic #45 (Phase 10 — ROI widget) planned; placeholder exists but not implemented
- **Scope**: frontend/src/pages/PricingPage.tsx, frontend/src/components/pricing/ (new)
- **Acceptance**: 
  - Create ROI calculator component (inputs: team size, avg hourly rate, automation hours saved)
  - Calculate ROI (e.g., cost savings per month)
  - Integrate into PricingPage.tsx (below pricing tiers)
  - Add analytics events (e.g., "roi_calculator_used")
  - Document in UI_DESIGN_SYSTEM.md
- **Impact**: medium (marketing/conversion)
- **Effort**: M
- **Confidence**: high
- **Links**: frontend/src/pages/PricingPage.tsx:59-120, docs/PHASE10_PLAN.md:13, Epic #45

### [Frontend/Feature] FAQ Accordion (Landing Page)
- **Why**: Epic #46 (Phase 10 — FAQ accordion) planned; placeholder exists but not implemented
- **Scope**: frontend/src/pages/LandingPage.tsx, frontend/src/components/common/Accordion.tsx (new)
- **Acceptance**: 
  - Create accessible Accordion component (ARIA: expanded, controls, hidden)
  - Populate FAQ content (5-10 common questions about AKIS Platform)
  - Integrate into LandingPage.tsx (near bottom, above footer)
  - Ensure keyboard navigation (Enter/Space to toggle)
  - Document in UI_DESIGN_SYSTEM.md
- **Impact**: medium (marketing/SEO)
- **Effort**: M
- **Confidence**: high
- **Links**: frontend/src/pages/LandingPage.tsx:273, docs/PHASE10_PLAN.md:14, Epic #46

### [Frontend/A11y] Automated Accessibility Testing
- **Why**: Design system has ARIA guidelines but no automated verification; risk of regressions
- **Scope**: frontend/test, .github/workflows/ci.yml
- **Acceptance**: 
  - Install @axe-core/react or jest-axe
  - Add axe tests to critical pages: LandingPage, Login, Signup, Dashboard
  - CI runs axe tests and fails on violations (WCAG 2.1 AA level)
  - Document axe setup in docs/TESTING.md
  - Fix any violations found
- **Impact**: medium (a11y compliance)
- **Effort**: M
- **Confidence**: medium
- **Links**: frontend/test/*.tsx, docs/UI_DESIGN_SYSTEM.md:1238-1278, docs/PHASE10_PLAN.md:11

### [Frontend/A11y] Verify Reduced-Motion Support
- **Why**: MotionProvider and routeTransitions.ts exist; prefers-reduced-motion CSS present but not verified
- **Scope**: frontend/src/motion/, frontend/src/index.css
- **Acceptance**: 
  - Add prefers-reduced-motion media query to index.css (if not present)
  - Test with OS-level reduced motion enabled (macOS: Accessibility → Display → Reduce Motion)
  - Verify animations disable or shorten significantly
  - Document in docs/UI_DESIGN_SYSTEM.md (section 6.3 or 11.3)
- **Impact**: low (a11y edge case)
- **Effort**: S
- **Confidence**: medium
- **Links**: frontend/src/motion/*, docs/UI_DESIGN_SYSTEM.md:1412-1422

### [Frontend/Perf] Add Bundle Size Analysis
- **Why**: No visibility into chunk sizes; risk of bloat as features grow
- **Scope**: frontend/vite.config.ts, .github/workflows/ci.yml
- **Acceptance**: 
  - Add rollup-plugin-visualizer or vite-plugin-bundle-analyzer
  - Generate bundle report in CI (upload as artifact)
  - Document baseline sizes in frontend/NEXT.md or docs/PERFORMANCE.md
  - Set budget thresholds (e.g., main chunk < 200 KB gzipped)
- **Impact**: medium
- **Effort**: S
- **Confidence**: high
- **Links**: frontend/vite.config.ts, docs/PERFORMANCE.md

### [Frontend/Perf] Verify Locale Lazy-Loading
- **Why**: i18n locales (en.json, tr.json) exist; unclear if they're lazy-loaded or bundled in main chunk
- **Scope**: frontend/src/i18n/*, frontend/vite.config.ts
- **Acceptance**: 
  - Inspect bundle analysis to confirm locales are separate chunks
  - If bundled in main, refactor to dynamic imports (e.g., `import('./locales/en.json')`)
  - Verify locale loading doesn't block initial render
  - Document in README.i18n.md
- **Impact**: low (performance edge case)
- **Effort**: M
- **Confidence**: medium
- **Links**: frontend/src/i18n/locales/*.json, frontend/README.i18n.md

### [Frontend/Perf] Lighthouse/Core Web Vitals CI
- **Why**: No automated performance testing; risk of regressions
- **Scope**: .github/workflows/ci.yml (new job: lighthouse-ci)
- **Acceptance**: 
  - Add Lighthouse CI action (or similar) to GitHub workflow
  - Run on production build (vite build + vite preview)
  - Fail CI if LCP > 2.5s, CLS > 0.1, or INP > 200ms
  - Generate Lighthouse report as artifact
  - Document thresholds in docs/PERFORMANCE.md
- **Impact**: medium (performance governance)
- **Effort**: M
- **Confidence**: medium
- **Links**: .github/workflows/ci.yml, docs/PERFORMANCE.md, docs/PHASE10_PLAN.md:12

### [Frontend/DX] Create .env.example
- **Why**: No frontend/.env.example; new contributors don't know VITE_API_URL or VITE_ENABLE_DEV_LOGIN
- **Scope**: frontend/.env.example (new file)
- **Acceptance**: 
  - Document VITE_API_URL (default: http://localhost:3000)
  - Document VITE_ENABLE_DEV_LOGIN (default: false)
  - Add comments explaining each var
  - Link from frontend/README.md
- **Impact**: low
- **Effort**: S
- **Confidence**: high
- **Links**: frontend/src/app/RouteGuards.tsx:6-8, frontend/src/services/api/auth.ts:3-6

### [Frontend/Theme] Document Light Mode Tokens
- **Why**: ThemeProvider has dark/light toggle; UI_DESIGN_SYSTEM.md mentions future light mode colors but not finalized
- **Scope**: frontend/src/theme/tokens.ts, docs/UI_DESIGN_SYSTEM.md
- **Acceptance**: 
  - Define light mode color tokens (ak-bg-light, ak-surface-light, ak-text-primary-light, etc.)
  - Add to tokens.ts (conditional on theme)
  - Test light mode thoroughly (contrast ratios, readability)
  - Update UI_DESIGN_SYSTEM.md section 10.3
- **Impact**: low (future feature)
- **Effort**: M
- **Confidence**: medium
- **Links**: docs/UI_DESIGN_SYSTEM.md:1340-1350, frontend/src/theme/tokens.ts

### [Frontend/Content] Settings UX Refinement
- **Why**: Epic #49 (Phase 10 — Settings UX refinement) planned; no specific issues yet
- **Scope**: frontend/src/pages/dashboard/settings/*.tsx
- **Acceptance**: 
  - Review settings pages (Profile, Billing, API Keys, Integrations)
  - Identify UX friction points (confusing labels, missing validation, etc.)
  - Create specific issues for each improvement
  - Update ROADMAP.md with links
- **Impact**: medium (user retention)
- **Effort**: M (discovery + fixes)
- **Confidence**: medium
- **Links**: frontend/src/pages/dashboard/settings/*.tsx, docs/PHASE10_PLAN.md:10, Epic #49

---

## Performance Baseline (To Be Measured)

### Bundle Size (Unknown — Need Analysis)
- **Main chunk**: ? KB (gzipped)
- **Vendor chunk**: ? KB (gzipped)
- **Locale chunks**: ? KB each (if lazy-loaded)

### Core Web Vitals (Unknown — Need Lighthouse)
- **LCP (Largest Contentful Paint)**: Target < 2.5s
- **CLS (Cumulative Layout Shift)**: Target < 0.1
- **INP (Interaction to Next Paint)**: Target < 200ms

**Action**: Run `npm run build` → `npm run preview` → Lighthouse audit → document results in docs/PERFORMANCE.md

---

## TODO Harvest (Frontend)

Total TODOs found: 40+

**Critical (P0) — Content/Feature Blockers:**
- PricingPage.tsx:59 — ROI widget (Epic #45)
- LandingPage.tsx:273 — FAQ accordion (Epic #46)
- LandingPage.tsx:121-123 — Social proof metrics (partner logos, weekly hours saved, coverage uplift)

**Nice-to-Have (P1) — Content Polish:**
- AboutPage.tsx:6 — Leadership bios, timeline, values
- ChangelogPage.tsx:6 — Release notes automation
- IntegrationsPage.tsx:6 — Integration cards (GitHub, Jira, Confluence)
- StatusPage.tsx:6 — Status widget embed

**Defer (P2) — Feature Enhancements:**
- agents/AgentScribePage.tsx:13, 23-25, 49 — Feature copy, demo media, testimonials
- agents/AgentTracePage.tsx:13, 23-25 — Test generation pipeline details
- agents/AgentProtoPage.tsx:13, 23-25, 49 — Spec-to-MVP flow, usage scenarios
- dashboard/*.tsx (multiple) — Wire real API data, health checks, playbook YAML editor

**Low Priority (Defer):**
- PagePlaceholder.tsx:37, 45 — Generic "TODO" items in placeholder component

---

## Audit Metadata

- **Date**: 2025-01-08
- **Scope**: Frontend codebase (src/, public/, test/)
- **Method**: Static file analysis, dependency audit, architecture pattern review, TODO harvest
- **Confidence**: High for architecture and i18n; medium for performance (unmeasured baseline)

