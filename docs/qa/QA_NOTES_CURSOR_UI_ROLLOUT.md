# QA Notes: Cursor-Inspired UI Rollout

**Version:** 1.0  
**Created:** 2026-01-10  
**Feature Branch:** `feat/ui-cursor-inspired-liquid-neon`  
**Owner:** QA Team

---

## 1. Overview

This document defines the QA checkpoints, smoke tests, and rollback procedures for the Cursor-inspired UI rollout. The focus is on non-regression of existing functionality while validating new features.

---

## 2. Required Checkpoints

### 2.1 CI Gate Requirements

Each phase must pass CI before proceeding:

```bash
# CI Commands (must all pass)
pnpm -r typecheck    # TypeScript compilation
pnpm -r lint         # ESLint
pnpm -r build        # Production build
pnpm -r test         # Unit/integration tests
```

### 2.2 Phase Checkpoints

| Phase | Checkpoint | Criteria |
|-------|------------|----------|
| Phase 1 (Docs) | Documentation Review | All docs committed, no broken links |
| Phase 2 (Foundation) | Tokens Implemented | Tailwind extended, tokens functional |
| Phase 3 (Dashboard) | Dashboard Navigation | All routes accessible, no console errors |
| Phase 4 (Public Pages) | Public Pages Render | All pages render, responsive design works |
| Phase 5 (QA) | Full Smoke Test | All smoke tests pass |

---

## 3. Non-Regression Test Matrix

### 3.1 Authentication Flows

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| **Signup: Email Entry** | Go to `/signup`, enter valid email | Navigate to password step | [ ] |
| **Signup: Password Set** | Enter valid password (8+ chars) | Navigate to verify step | [ ] |
| **Signup: Email Verification** | Enter valid 6-digit code | Account activated, redirect to beta welcome | [ ] |
| **Signup: Privacy Consent** | Complete consent step | Redirect to dashboard | [ ] |
| **Login: Email Entry** | Go to `/login`, enter existing email | Navigate to password step | [ ] |
| **Login: Password** | Enter correct password | Login success, redirect to dashboard | [ ] |
| **Login: Wrong Password** | Enter incorrect password | Error message, stay on page | [ ] |
| **Logout** | Click logout in dashboard | Session cleared, redirect to homepage | [ ] |
| **Protected Route Guard** | Visit `/dashboard` without auth | Redirect to `/login` | [ ] |

### 3.2 Privacy Consent Gating

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| **New User Consent Gate** | Complete signup, skip consent | Blocked from dashboard until consent given | [ ] |
| **Existing User Consent** | Login with user who gave consent | Direct access to dashboard | [ ] |

### 3.3 Dashboard Entry

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| **Dashboard Load** | Login and navigate to `/dashboard` | Overview page loads, no errors | [ ] |
| **Dashboard Sidebar** | View sidebar on desktop | All nav items visible, correct routes | [ ] |
| **Dashboard Mobile** | View on mobile viewport | Hamburger menu works, drawer opens | [ ] |

### 3.4 Scribe Agent Flow

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| **Scribe Console Load** | Navigate to `/dashboard/scribe` | Console renders with form | [ ] |
| **Repository Selection** | Select owner/repo/branch | Dropdowns populate from API | [ ] |
| **AI Key Missing Callout** | No AI key configured | Warning callout with link to settings | [ ] |
| **Job Creation** | Submit valid Scribe job | Job created, status shows pending | [ ] |
| **Job Status Polling** | Wait for job completion | Status updates (running → completed/failed) | [ ] |
| **Job Detail View** | Click on job | Detail page shows logs, artifacts | [ ] |

### 3.5 AI Keys Management

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| **AI Keys Page Load** | Navigate to `/dashboard/settings/ai-keys` | Page loads with provider cards | [ ] |
| **Key Status Display** | View status for OpenAI/OpenRouter | Shows "Configured" or "Not Configured" | [ ] |
| **Save API Key** | Enter valid key, click save | Key saved, shows last4 | [ ] |
| **Delete API Key** | Click delete, confirm | Key removed, status updated | [ ] |
| **Set Active Provider** | Toggle between providers | Active provider updated | [ ] |
| **Invalid Key Rejection** | Enter invalid key format | Validation error shown | [ ] |

### 3.6 Navigation Responsiveness

| Test Case | Viewport | Expected Result | Status |
|-----------|----------|-----------------|--------|
| **Desktop Layout** | 1280px+ | Sidebar visible, full content area | [ ] |
| **Tablet Layout** | 768px-1024px | Collapsed sidebar or hidden | [ ] |
| **Mobile Layout** | < 768px | Hamburger menu, drawer navigation | [ ] |
| **Mobile Drawer** | < 768px | Opens/closes correctly, all links work | [ ] |

### 3.7 Reduced Motion Behavior

| Test Case | Setup | Expected Result | Status |
|-----------|-------|-----------------|--------|
| **System Preference** | Set OS to reduce motion | Animations disabled | [ ] |
| **Manual Toggle** | Toggle in settings (if available) | Animations disabled | [ ] |
| **Background Blobs** | Reduced motion ON | Blobs static or hidden | [ ] |
| **Transitions** | Reduced motion ON | Instant state changes | [ ] |

---

## 4. Smoke Test Script

### 4.1 Quick Smoke (5 minutes)

```markdown
1. [ ] Homepage loads without errors
2. [ ] Navigate to /login
3. [ ] Login with test account
4. [ ] Dashboard overview loads
5. [ ] Navigate to /dashboard/scribe
6. [ ] Navigate to /dashboard/settings/ai-keys
7. [ ] Navigate to /dashboard/integrations
8. [ ] Logout successfully
9. [ ] Navigate to /pricing (public page)
10. [ ] Check browser console - no errors
```

### 4.2 Full Smoke (15 minutes)

Include Quick Smoke plus:

```markdown
11. [ ] Complete full signup flow (new email)
12. [ ] Verify email with code
13. [ ] Complete privacy consent
14. [ ] Create Scribe job (dry run)
15. [ ] View job in jobs list
16. [ ] View job detail page
17. [ ] Save test AI key
18. [ ] Delete test AI key
19. [ ] Test mobile viewport (all pages)
20. [ ] Test with prefers-reduced-motion
```

---

## 5. Screenshot Evidence Checklist

Required screenshots for release evidence:

### 5.1 Public Pages

| Screenshot | Route | Description |
|------------|-------|-------------|
| [ ] Landing Hero | `/` | Hero section with logo and CTA |
| [ ] Pricing Cards | `/pricing` | 3-tier pricing display |
| [ ] Blog Index | `/blog` | Blog listing page |
| [ ] Docs Landing | `/docs` | Documentation entry page |
| [ ] Learn Landing | `/learn` | Tutorial listing page |

### 5.2 Dashboard Pages

| Screenshot | Route | Description |
|------------|-------|-------------|
| [ ] Dashboard Overview | `/dashboard` | Main dashboard with metrics |
| [ ] Scribe Console | `/dashboard/scribe` | Agent console with form |
| [ ] Scribe Running | `/dashboard/scribe` | Job in running state |
| [ ] Jobs List | `/dashboard/jobs` | Jobs table view |
| [ ] Job Detail | `/dashboard/jobs/:id` | Single job details |
| [ ] Integrations Hub | `/dashboard/integrations` | Integration status cards |
| [ ] AI Keys Page | `/dashboard/settings/ai-keys` | Provider cards and form |
| [ ] AI Keys Configured | `/dashboard/settings/ai-keys` | Key saved state |

### 5.3 States

| Screenshot | State | Description |
|------------|-------|-------------|
| [ ] Mobile Navigation | Mobile viewport | Hamburger menu open |
| [ ] Loading State | Any page | Spinner/skeleton visible |
| [ ] Error State | Job failed | Error display |
| [ ] Empty State | No jobs | Empty state message |

---

## 6. Rollback Plan

### 6.1 Code Rollback

**Immediate Rollback (< 5 minutes):**

```bash
# If feature branch not yet merged
git checkout main

# If feature branch merged, revert the merge commit
git revert -m 1 <merge-commit-sha>
git push origin main
```

**Selective Rollback:**

```bash
# Revert specific commits
git revert <commit-sha-1> <commit-sha-2> ...
git push origin main
```

### 6.2 Feature Flag Rollback

If feature flags are implemented:

```bash
# In .env or environment config
VITE_FEATURE_NEW_DASHBOARD=false
```

### 6.3 Database Rollback

**Not Required.** This initiative has no database migrations. All changes are frontend-only.

### 6.4 Rollback Verification

After rollback, verify:

1. [ ] Old dashboard shell renders
2. [ ] All auth flows work
3. [ ] Existing Scribe flow works
4. [ ] No console errors
5. [ ] CI passes

---

## 7. CI/CD Integration

### 7.1 Pre-Merge Checks

```yaml
# .github/workflows/pr-gate.yml additions (if needed)
- name: Frontend Type Check
  run: pnpm --filter frontend typecheck

- name: Frontend Lint
  run: pnpm --filter frontend lint

- name: Frontend Build
  run: pnpm --filter frontend build

- name: Frontend Tests
  run: pnpm --filter frontend test
```

### 7.2 Post-Merge Verification

After merge to main:

1. Staging deployment triggers
2. Smoke test staging environment
3. If passing, approve production deployment

---

## 8. Known Issues and Mitigations

| Issue | Likelihood | Mitigation |
|-------|------------|------------|
| Animation jank on low-spec | Medium | CSS-only, reduced blob count |
| Mobile layout breaks | Low | Extensive breakpoint testing |
| Auth flow disruption | Very Low | No auth code changes |
| API endpoint mismatch | Low | Use existing endpoints only |

---

## 9. Sign-Off Requirements

### 9.1 QA Sign-Off

- [ ] All non-regression tests pass
- [ ] Full smoke test pass
- [ ] Screenshot evidence collected
- [ ] No P0/P1 bugs open

### 9.2 Dev Sign-Off

- [ ] CI passes (typecheck, lint, build, test)
- [ ] No console errors in production build
- [ ] Performance budget met

### 9.3 Product Sign-Off

- [ ] Visual design matches specs
- [ ] User flows work as expected
- [ ] Content is accurate

---

*This document should be updated as testing progresses. All checkboxes must be checked before release approval.*
