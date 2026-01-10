# QA Evidence: Cursor-Inspired UI Release

**Feature Branch:** `feat/ui-cursor-inspired-liquid-neon`  
**Created:** 2026-01-10  
**Status:** In Progress

---

## 1. Screenshot Checklist

### 1.1 Public Pages

| Screenshot | Route | Status | Notes |
|------------|-------|--------|-------|
| Landing Hero | `/` | [ ] Pending | Hero section with logo and CTAs |
| Pricing Cards | `/pricing` | [ ] Pending | 3-tier pricing display |
| Blog Index | `/blog` | [ ] Pending | Article cards grid |
| Docs Landing | `/docs` | [ ] Pending | Documentation sections |
| Learn Landing | `/learn` | [ ] Pending | Tutorial cards |

### 1.2 Dashboard Pages

| Screenshot | Route | Status | Notes |
|------------|-------|--------|-------|
| Dashboard Overview | `/dashboard` | [ ] Pending | Metrics cards, recent jobs |
| Dashboard Sidebar | `/dashboard` | [ ] Pending | Navigation grouping |
| Scribe Console | `/dashboard/scribe` | [ ] Pending | Agent form |
| Scribe Running | `/dashboard/scribe` | [ ] Pending | Job in progress |
| Jobs List | `/dashboard/jobs` | [ ] Pending | Jobs table |
| Job Detail | `/dashboard/jobs/:id` | [ ] Pending | Single job view |
| Integrations Hub | `/dashboard/integrations` | [ ] Pending | Provider cards |
| AI Keys Page | `/dashboard/settings/ai-keys` | [ ] Pending | Key management |
| AI Keys Configured | `/dashboard/settings/ai-keys` | [ ] Pending | Key saved state |

### 1.3 UI States

| Screenshot | State | Status | Notes |
|------------|-------|--------|-------|
| Mobile Navigation | Mobile viewport | [ ] Pending | Hamburger menu |
| Mobile Drawer | Mobile viewport | [ ] Pending | Slide-over drawer |
| Loading State | Any page | [ ] Pending | Spinner visible |
| Error State | Job failed | [ ] Pending | Error display |
| Empty State | No jobs | [ ] Pending | Empty message |
| Reduced Motion | Prefers reduced | [ ] Pending | Animations disabled |

---

## 2. Smoke Test Results

### 2.1 Quick Smoke (5 min)

| Test | Status | Evidence |
|------|--------|----------|
| Homepage loads | [ ] | |
| Navigate to /login | [ ] | |
| Login with test account | [ ] | |
| Dashboard overview loads | [ ] | |
| Navigate to /dashboard/scribe | [ ] | |
| Navigate to /dashboard/settings/ai-keys | [ ] | |
| Navigate to /dashboard/integrations | [ ] | |
| Logout successfully | [ ] | |
| Navigate to /pricing | [ ] | |
| Console errors: none | [ ] | |

### 2.2 Full Smoke (15 min)

| Test | Status | Evidence |
|------|--------|----------|
| Complete signup flow | [ ] | |
| Verify email with code | [ ] | |
| Complete privacy consent | [ ] | |
| Create Scribe job (dry run) | [ ] | |
| View job in jobs list | [ ] | |
| View job detail | [ ] | |
| Save test AI key | [ ] | |
| Delete test AI key | [ ] | |
| Mobile viewport test | [ ] | |
| Reduced motion test | [ ] | |

---

## 3. Non-Regression Verification

### 3.1 Authentication Flows

| Test | Status | Evidence |
|------|--------|----------|
| Signup: Email step | [ ] | |
| Signup: Password step | [ ] | |
| Signup: Verify email | [ ] | |
| Signup: Privacy consent | [ ] | |
| Login: Email step | [ ] | |
| Login: Password step | [ ] | |
| Logout clears session | [ ] | |
| Protected route guard | [ ] | |

### 3.2 Agent Functionality

| Test | Status | Evidence |
|------|--------|----------|
| Scribe job creation | [ ] | |
| Job status polling | [ ] | |
| Job completion | [ ] | |
| AI key missing callout | [ ] | |

---

## 4. CI Verification

### 4.1 Pipeline Status

| Step | Status | Evidence |
|------|--------|----------|
| `pnpm -r typecheck` | [ ] Pending | |
| `pnpm -r lint` | [ ] Pending | |
| `pnpm -r build` | [ ] Pending | |
| `pnpm -r test` | [ ] Pending | |

### 4.2 Build Metrics

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Frontend bundle size | < 500KB | TBD | [ ] |
| Build time | < 60s | TBD | [ ] |
| Test coverage | > 60% | TBD | [ ] |

---

## 5. Performance Check

### 5.1 Lighthouse Scores

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Performance | >= 90 | TBD | [ ] |
| Accessibility | >= 95 | TBD | [ ] |
| Best Practices | >= 90 | TBD | [ ] |
| SEO | >= 90 | TBD | [ ] |

### 5.2 Core Web Vitals

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| LCP | < 2.5s | TBD | [ ] |
| FID | < 100ms | TBD | [ ] |
| CLS | < 0.1 | TBD | [ ] |

---

## 6. Accessibility Check

### 6.1 Automated Checks

| Check | Tool | Status |
|-------|------|--------|
| Color contrast | axe-core | [ ] |
| ARIA labels | axe-core | [ ] |
| Focus indicators | Manual | [ ] |
| Keyboard navigation | Manual | [ ] |
| Screen reader | Manual | [ ] |

### 6.2 Reduced Motion

| Test | Status | Notes |
|------|--------|-------|
| System preference respected | [ ] | |
| Background blobs static | [ ] | |
| Transitions instant | [ ] | |

---

## 7. What Changed Summary

### New Files Created

**Documentation:**
- `docs/ux/AKIS_CURSOR_UI_MASTER_PLAN.md`
- `docs/ux/CURSOR_REFERENCE_NOTES.md`
- `docs/ux/AKIS_LIQUID_NEON_LAYER.md`
- `docs/qa/QA_NOTES_CURSOR_UI_ROLLOUT.md`
- `docs/qa/QA_EVIDENCE_CURSOR_UI_RELEASE.md`

**Frontend Components:**
- `frontend/src/components/layout/DashboardLayout.tsx`
- `frontend/src/components/layout/DashboardSidebar.tsx`
- `frontend/src/components/backgrounds/LiquidNeonBackground.tsx`

**Frontend Pages:**
- `frontend/src/pages/public/PricingPage.tsx`
- `frontend/src/pages/public/BlogIndexPage.tsx`
- `frontend/src/pages/public/DocsLandingPage.tsx`
- `frontend/src/pages/public/LearnLandingPage.tsx`
- `frontend/src/pages/dashboard/integrations/IntegrationsHubPage.tsx`
- `frontend/src/pages/dashboard/settings/DashboardSettingsAiKeysPage.tsx`

### Modified Files

- `docs/UI_DESIGN_SYSTEM.md` - Added motion, glow, blur tokens
- `docs/NEXT.md` - Updated roadmap
- `backend/docs/API_SPEC.md` - Updated AI keys documentation
- `frontend/src/App.tsx` - New routes, lazy loading
- `frontend/src/theme/tokens.ts` - Motion/glow/blur tokens
- `frontend/src/theme/theme.tokens.css` - CSS variables
- `frontend/tailwind.config.js` - New animations

### No Changes To

- Backend API logic
- Authentication flows
- Database schema
- Existing agent functionality

---

## 8. Sign-Off

### QA Sign-Off

- [ ] All non-regression tests pass
- [ ] Full smoke test complete
- [ ] Screenshot evidence collected
- [ ] No P0/P1 bugs

**QA Engineer:** _____________  
**Date:** _____________

### Dev Sign-Off

- [ ] CI passes
- [ ] No console errors
- [ ] Performance budget met

**Developer:** _____________  
**Date:** _____________

### Product Sign-Off

- [ ] Visual design approved
- [ ] User flows correct
- [ ] Content accurate

**Product Manager:** _____________  
**Date:** _____________

---

*This document will be updated as testing progresses.*
