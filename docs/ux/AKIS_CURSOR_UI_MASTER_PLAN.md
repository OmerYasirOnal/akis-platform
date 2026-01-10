# AKIS Cursor-Inspired UI Master Plan

**Version:** 1.0  
**Created:** 2026-01-10  
**Status:** In Progress  
**Owner:** Frontend Team

---

## 1. Executive Summary

This plan delivers a professional, Cursor-inspired UI layer for AKIS Platform, combining modern dashboard patterns with AKIS's distinctive "Liquid Neon" visual identity. The implementation prioritizes performance on OCI Free Tier, accessibility compliance, and zero disruption to existing authentication and agent flows.

### Key Constraints

| Constraint | Specification |
|------------|---------------|
| **Architecture** | SPA only (React + Vite) — no SSR |
| **Auth Flows** | Unchanged — existing multi-step signup/login preserved |
| **Integrations** | MCP-only external integrations — no direct vendor SDKs |
| **Infrastructure** | Minimal dependencies for OCI Free Tier (4 OCPU, 24GB RAM) |
| **Backend** | No redesign — additive endpoints only if strictly required |

### Reference Documents

- `.cursor/context/CONTEXT_SCOPE.md` — Project scope and requirements
- `.cursor/context/CONTEXT_ARCHITECTURE.md` — Technical architecture
- `docs/WEB_INFORMATION_ARCHITECTURE.md` — Site structure and user flows
- `docs/UI_DESIGN_SYSTEM.md` — Visual tokens and component patterns
- `backend/docs/Auth.md` — Authentication architecture
- `backend/docs/API_SPEC.md` — API endpoint specifications
- `docs/NEXT.md` — Roadmap and milestone tracking

---

## 2. Scope Definition

### 2.1 In Scope

**Dashboard Shell:**
- Cursor-like left sidebar with grouped navigation
- Card-based content area with responsive grid
- Liquid Neon background layer (opt-in, performance-safe)
- Mobile-responsive hamburger navigation

**Dashboard Pages:**
- Overview (metrics cards, recent jobs, quick actions)
- Jobs List (table view with filters)
- Scribe Console (model selection, job lifecycle, logs)
- Integrations Hub (GitHub status, Jira/Confluence placeholders)
- Settings: Profile, Workspace, AI Keys, Billing, Notifications

**Public Pages (Marketing):**
- Enhanced Landing Page
- Pricing Page (3-tier cards)
- Blog Index (placeholder articles)
- Docs Landing (quick start navigation)
- Learn Landing (tutorial cards)

**Visual Layer:**
- AKIS Liquid Neon background effects
- Motion tokens and animations (CSS-first)
- Glow effects for accent elements
- `prefers-reduced-motion` support

### 2.2 Out of Scope

- Backend API redesign
- Auth flow changes (signup/login/logout)
- New agent types (Trace, Proto remain scaffold)
- Real Jira/Confluence connect flows (placeholder only)
- Server-side rendering
- Heavy animation libraries (Three.js, GSAP)

---

## 3. Architecture Alignment

### 3.1 Frontend Architecture

```
frontend/
├── src/
│   ├── components/
│   │   ├── layout/           # Shell components
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── DashboardSidebar.tsx
│   │   │   └── DashboardHeader.tsx
│   │   ├── backgrounds/      # Visual layer
│   │   │   └── LiquidNeonBackground.tsx
│   │   └── ...
│   ├── pages/
│   │   ├── dashboard/
│   │   │   ├── DashboardOverviewPage.tsx
│   │   │   ├── agents/
│   │   │   │   └── ScribeConsolePage.tsx
│   │   │   ├── integrations/
│   │   │   │   ├── IntegrationsHubPage.tsx
│   │   │   │   └── GitHubIntegrationPage.tsx
│   │   │   └── settings/
│   │   │       └── DashboardSettingsAiKeysPage.tsx
│   │   └── public/
│   │       ├── PricingPage.tsx
│   │       ├── BlogIndexPage.tsx
│   │       ├── DocsLandingPage.tsx
│   │       └── LearnLandingPage.tsx
│   └── ...
```

### 3.2 Routing Strategy

**Protected Routes (require auth):**
```
/dashboard                    → DashboardOverviewPage
/dashboard/jobs               → JobsListPage
/dashboard/jobs/:id           → JobDetailPage
/dashboard/scribe             → ScribeConsolePage
/dashboard/agents/scribe      → (redirect to /dashboard/scribe)
/dashboard/integrations       → IntegrationsHubPage
/dashboard/integrations/:id   → Integration detail pages
/dashboard/settings           → (redirect to /settings/profile)
/dashboard/settings/profile   → DashboardSettingsProfilePage
/dashboard/settings/ai-keys   → DashboardSettingsAiKeysPage
/dashboard/settings/...       → Other settings pages
```

**Public Routes (no auth required):**
```
/                   → LandingPage (enhanced)
/pricing            → PricingPage
/blog               → BlogIndexPage
/docs               → DocsLandingPage
/learn              → LearnLandingPage
/about              → AboutAKIS (existing)
/legal/terms        → LegalTermsPage (existing)
/legal/privacy      → LegalPrivacyPage (existing)
```

**Auth Routes (unchanged):**
```
/login              → LoginEmail
/login/password     → LoginPassword
/signup             → SignupEmail
/signup/password    → SignupPassword
/signup/verify-email → SignupVerifyEmail
/auth/welcome-beta  → WelcomeBeta
/auth/privacy-consent → PrivacyConsent
```

### 3.3 Backend Dependencies

All frontend features use existing backend endpoints:

| Feature | Endpoint | Status |
|---------|----------|--------|
| Job creation | `POST /api/agents/jobs` | Existing |
| Job status | `GET /api/agents/jobs/:id` | Existing |
| Jobs list | `GET /api/agents/jobs` | Existing |
| Model allowlist | `GET /api/agents/configs/scribe/models` | Existing |
| AI key status | `GET /api/settings/ai-keys/status` | Existing |
| AI key save | `PUT /api/settings/ai-keys` | Existing |
| AI key delete | `DELETE /api/settings/ai-keys` | Existing |
| Active provider | `PUT /api/settings/ai-provider/active` | Existing |
| GitHub discovery | `GET /api/integrations/github/repos` | Existing |
| Auth | Multi-step auth endpoints | Existing |

---

## 4. Delivery Phases

### Phase 1: Documentation (Days 1-2)

**Deliverables:**
- [x] `docs/ux/AKIS_CURSOR_UI_MASTER_PLAN.md` (this document)
- [ ] `docs/ux/CURSOR_REFERENCE_NOTES.md`
- [ ] `docs/ux/AKIS_LIQUID_NEON_LAYER.md`
- [ ] `docs/qa/QA_NOTES_CURSOR_UI_ROLLOUT.md`
- [ ] Update `docs/UI_DESIGN_SYSTEM.md` with motion/glow tokens

**Exit Criteria:**
- All spec documents reviewed and committed
- Design tokens defined and documented

### Phase 2: Foundation (Days 2-3)

**Deliverables:**
- [ ] Feature branch `feat/ui-cursor-inspired-liquid-neon`
- [ ] Motion/glow tokens in `frontend/src/theme/`
- [ ] `LiquidNeonBackground.tsx` component
- [ ] Dashboard shell layout components

**Exit Criteria:**
- Branch created with initial commits
- Tokens implemented and Tailwind extended
- Background component respects reduced-motion

### Phase 3: Dashboard Implementation (Days 3-5)

**Deliverables:**
- [ ] `DashboardLayout.tsx` with sidebar
- [ ] Enhanced `DashboardOverviewPage.tsx`
- [ ] Functional `ScribeConsolePage.tsx`
- [ ] `IntegrationsHubPage.tsx` with GitHub status
- [ ] Functional AI Keys management UI

**Exit Criteria:**
- Dashboard navigation works end-to-end
- Scribe Console can create and monitor jobs
- AI keys can be saved/deleted/activated

### Phase 4: Public Pages (Days 5-6)

**Deliverables:**
- [ ] `PricingPage.tsx`
- [ ] `BlogIndexPage.tsx`
- [ ] `DocsLandingPage.tsx`
- [ ] `LearnLandingPage.tsx`
- [ ] Enhanced Landing Page

**Exit Criteria:**
- All public pages render without errors
- Responsive design verified
- AKIS-appropriate placeholder content

### Phase 5: QA and Documentation (Day 7)

**Deliverables:**
- [ ] `docs/qa/QA_EVIDENCE_CURSOR_UI_RELEASE.md`
- [ ] Screenshot evidence pack
- [ ] Updated `docs/NEXT.md`
- [ ] Updated `backend/docs/API_SPEC.md`

**Exit Criteria:**
- All smoke tests pass
- CI green (typecheck, lint, build, test)
- Non-regression verified

---

## 5. Technical Specifications

### 5.1 Liquid Neon Visual Layer

**Implementation Approach:**
- CSS-only animations (no JavaScript animation frames in production)
- GPU-accelerated properties only (`transform`, `opacity`)
- Blurred gradient blobs with AKIS accent color (#07D1AF)
- Maximum 5 animated elements per view

**Performance Budget:**
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- No animation jank (60fps)
- Total blob opacity sum: < 0.5 (subtle, not distracting)

**Accessibility:**
- Respects `prefers-reduced-motion: reduce`
- Global toggle in localStorage (`akis-reduced-motion`)
- Focus states remain visible over background

### 5.2 Dashboard Shell Structure

```tsx
// DashboardLayout.tsx structure
<div className="flex min-h-screen bg-ak-bg">
  {/* Optional Liquid Neon Background */}
  <LiquidNeonBackground enabled={!reducedMotion} />
  
  {/* Sidebar */}
  <aside className="hidden lg:block w-72 border-r border-ak-border bg-ak-surface">
    <DashboardSidebar />
  </aside>
  
  {/* Main Content */}
  <main className="flex-1">
    <DashboardHeader />
    <div className="px-6 py-8">
      <Outlet />
    </div>
  </main>
</div>
```

### 5.3 Component Patterns

**Card Pattern (Cursor-inspired):**
```tsx
className="
  bg-ak-surface-2 
  border border-ak-border 
  rounded-2xl 
  p-6 
  shadow-lg
  transition-all duration-200
  hover:-translate-y-1 
  hover:shadow-xl
"
```

**Navigation Item Pattern:**
```tsx
className={cn(
  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
  isActive
    ? "bg-ak-surface-2 text-ak-text-primary"
    : "text-ak-text-secondary hover:bg-ak-surface hover:text-ak-text-primary"
)}
```

---

## 6. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Animation performance on OCI | Medium | High | CSS-only, `will-change` sparingly, testing on low-spec device |
| Accessibility regression | Low | High | Automated a11y checks, manual screen reader testing |
| Auth flow breakage | Low | Critical | No changes to auth routes, comprehensive smoke tests |
| Bundle size increase | Medium | Medium | Code splitting, lazy loading, tree shaking verification |
| Mobile responsiveness issues | Medium | Medium | Mobile-first design, breakpoint testing |

---

## 7. Acceptance Criteria

### 7.1 Functional Criteria

- [ ] Dashboard renders without console errors
- [ ] All navigation links work correctly
- [ ] Scribe Console can create jobs
- [ ] Scribe Console shows job status updates
- [ ] AI Keys can be saved, deleted, and activated
- [ ] Integrations hub shows GitHub connection status
- [ ] Public pages render with appropriate content

### 7.2 Non-Functional Criteria

- [ ] Lighthouse performance score >= 90
- [ ] WCAG AA compliance (contrast, focus states)
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] `prefers-reduced-motion` respected
- [ ] CI passes: typecheck, lint, build, test

### 7.3 Non-Regression Criteria

- [ ] Signup flow works end-to-end
- [ ] Login flow works end-to-end
- [ ] Privacy consent gating functions
- [ ] Dashboard entry requires authentication
- [ ] Existing Scribe job flow unchanged
- [ ] Logout clears session correctly

---

## 8. Rollback Strategy

### 8.1 Code Rollback

```bash
# Revert to pre-feature state
git revert --no-commit HEAD~N..HEAD
git commit -m "chore: rollback cursor-ui feature"
```

### 8.2 Feature Flag (if needed)

```tsx
// Feature flag for gradual rollout
const USE_NEW_DASHBOARD = import.meta.env.VITE_FEATURE_NEW_DASHBOARD === 'true';

// In App.tsx
{USE_NEW_DASHBOARD ? <NewDashboardLayout /> : <LegacyDashboardShell />}
```

### 8.3 Database Considerations

**No database migrations required.** All changes are frontend-only. Backend endpoints are existing and unchanged.

---

## 9. Timeline

| Phase | Duration | Target Dates |
|-------|----------|--------------|
| Documentation | 2 days | Days 1-2 |
| Foundation | 1.5 days | Days 2-3 |
| Dashboard | 2 days | Days 3-5 |
| Public Pages | 1.5 days | Days 5-6 |
| QA & Docs | 1 day | Day 7 |
| **Total** | **7 days** | |

---

## 10. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Page load time | < 2s | Lighthouse |
| Accessibility score | >= 95 | Lighthouse |
| Mobile usability | 100% | Manual testing |
| Auth flow completion | 100% | Smoke tests |
| Job creation success | 100% | Integration tests |

---

## Appendix A: Commit Strategy

```
docs: add cursor-inspired UI master plan and specs
chore(frontend): add motion and glow tokens to theme
feat(frontend): implement liquid neon background component
feat(frontend): create dashboard layout with sidebar
feat(frontend): implement scribe console with job lifecycle
feat(frontend): add integrations hub and detail pages
feat(frontend): implement ai keys management ui
feat(frontend): create public pages (pricing, blog, docs, learn)
fix(frontend): routing adjustments for new pages
docs: update API spec and add QA evidence
docs: update roadmap with shipped milestone
```

---

## Appendix B: File Change Summary

**New Files:**
- `docs/ux/AKIS_CURSOR_UI_MASTER_PLAN.md`
- `docs/ux/CURSOR_REFERENCE_NOTES.md`
- `docs/ux/AKIS_LIQUID_NEON_LAYER.md`
- `docs/qa/QA_NOTES_CURSOR_UI_ROLLOUT.md`
- `docs/qa/QA_EVIDENCE_CURSOR_UI_RELEASE.md`
- `frontend/src/components/layout/DashboardLayout.tsx`
- `frontend/src/components/layout/DashboardSidebar.tsx`
- `frontend/src/components/backgrounds/LiquidNeonBackground.tsx`
- `frontend/src/pages/public/PricingPage.tsx`
- `frontend/src/pages/public/BlogIndexPage.tsx`
- `frontend/src/pages/public/DocsLandingPage.tsx`
- `frontend/src/pages/public/LearnLandingPage.tsx`
- `frontend/src/pages/dashboard/integrations/IntegrationsHubPage.tsx`

**Modified Files:**
- `docs/UI_DESIGN_SYSTEM.md`
- `docs/NEXT.md`
- `backend/docs/API_SPEC.md`
- `frontend/src/theme/tokens.ts`
- `frontend/src/theme/theme.tokens.css`
- `frontend/src/App.tsx`
- `frontend/src/app/DashboardShell.tsx` (or replaced by new layout)
- `frontend/src/pages/dashboard/settings/DashboardSettingsAiKeysPage.tsx`

---

*Last updated: 2026-01-10*
