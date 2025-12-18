# Docs NEXT — Gap Audit, Execution Order & Gating Criteria

> **Schedule Anchor:** `docs/PROJECT_TRACKING_BASELINE.md`  
> **Audit Report:** `docs/DOCS_AUDIT_REPORT.md`

---

## Execution Order (Phase-by-Phase)

### Phase 1: Scribe Stabilization (S0.4.6) — CURRENT

**Status:** 🔄 In Progress

**Objective:** Complete Scribe agent configuration UI and ensure Step 1-5 wizard is fully functional.

**Tasks:**
- [x] Step 1: Pre-flight checks (GitHub connection)
- [x] Step 2: SearchableSelect for Owner/Repo/Branch
- [ ] Step 3: Target platform configuration
- [ ] Step 4: Advanced options
- [ ] Step 5: Review and save

**Exit Criteria:**
- All 5 steps functional
- TypeScript/Lint/Tests pass
- No cache/restart confusion (documented in SCRIBE_STEP2_VERIFICATION.md)

---

### Phase 2: Complete Phase 9.2 (i18n & Theming)

**Status:** 📋 Queued

**Objective:** Finalize i18n infrastructure, theme toggle, and visual polish.

**Tasks:**
- [ ] i18n scaffold (TR/EN locales)
- [ ] Theme toggle (dark default, light opt-in)
- [ ] Hi-res logo rollout (@2x/@3x)
- [ ] Spotlight effects (GPU-friendly)
- [ ] Lint cleanup (ESLint/Prettier)

**Exit Criteria:**
- Locale switching works without FOUC
- Theme persists in localStorage
- CI lint/build green

---

### Phase 3: Complete Phase 10 (Next Foundations)

**Status:** 📋 Queued

**Objective:** Settings UX, accessibility, performance budgets, marketing components.

**Tasks:**
- [ ] #49 Settings UX refinement
- [ ] #47 Accessibility pass (WCAG 2.1 AA)
- [ ] #48 Performance budgets (LCP < 2.5s, CLS < 0.1, INP < 200ms)
- [ ] #45 ROI widget on Pricing page
- [ ] #46 FAQ accordion on Landing page

**Exit Criteria:**
- Lighthouse score ≥ 90
- Keyboard navigation complete
- axe-core shows no critical issues

---

### Phase 4: Public Waitlist-Only Site Mode

**Status:** 📋 Planned

**Objective:** Launch public-facing site with waitlist signup only (no open registration).

**Tasks:**
- [ ] Landing page finalized
- [ ] Waitlist signup form (email capture)
- [ ] Email confirmation flow
- [ ] Analytics integration
- [ ] SEO meta tags + sitemap

**Exit Criteria:**
- Site accessible at production URL
- Waitlist entries stored in database
- No access to dashboard without invite

---

### Phase 5: Ecosystem QR/Device-Link + Mobile Companion

**Status:** 📋 Planned

**Objective:** Enable cross-device authentication and mobile app scaffold.

**Tasks:**
- [ ] QR code generation for device linking
- [ ] Mobile companion app scaffold
- [ ] Push notification integration
- [ ] Cross-device session sync

**Exit Criteria:**
- Users can scan QR to link devices
- Mobile app can receive job notifications
- Session remains valid across devices

---

### Phase 6: V2 RepoOps Agent (LATER)

**Status:** 🚫 Gated

**Objective:** Advanced repository operations agent for code review, refactoring, etc.

**Gating Criteria (ALL must be met):**

| Criterion | Current Status | Required |
|-----------|----------------|----------|
| Scribe agent stable | 🔄 S0.4.6 in progress | ✅ Complete + tested |
| Trace agent stable | ⚠️ Scaffold only | ✅ Complete + tested |
| Proto agent stable | ⚠️ Scaffold only | ✅ Complete + tested |
| GitHub MCP adapter | ✅ Functional | ✅ Production-ready |
| Atlassian MCP adapter | ⚠️ Scaffold only | ✅ Production-ready |
| Job FSM reliable | ✅ 110/110 tests | ✅ Maintained |
| Waitlist site live | 📋 Planned | ✅ Launched |
| Mobile companion | 📋 Planned | ✅ QR linking works |

**Start Date:** TBD (only after all criteria green)

---

## Recent Updates

### ✅ [2025-12-18] Documentation Audit & Baseline

**Status:** DONE  
**Scope:** Created canonical planning documents

**Files Created/Updated:**
- `docs/PROJECT_TRACKING_BASELINE.md` — Sprint/phase/milestone schedule anchor
- `docs/DOCS_AUDIT_REPORT.md` — Full documentation audit with cleanup plan
- `docs/ROADMAP.md` — Aligned with baseline, added execution order
- `docs/NEXT.md` — Added gating criteria (this file)
- `.cursor/context/CONTEXT_SCOPE.md` — Added references to new canonical sources

---

### ✅ [2025-12-18] Scribe Step 2 Verification Locked

**Status:** DONE  
**Branch:** `feat/scribe-config-s0.4.6-wip`  
**File:** `SCRIBE_STEP2_VERIFICATION.md`

**Key Finding:** Implementation is complete and correct. Reported issues were due to cache/restart/route confusion, not code bugs.

---

### ✅ [S0.4.2-DOC-2] Auth Documentation Sync Completed (2025-12-06)

**Status:** DONE  
**Scope:** Synced all canonical documentation with email-based multi-step authentication flow (implemented in PR #90)

**Files Updated:**
- `.cursor/context/CONTEXT_SCOPE.md` → Added "Authentication & Onboarding" section
- `.cursor/context/CONTEXT_ARCHITECTURE.md` → Updated Section 7 "Auth Architecture"
- `docs/WEB_INFORMATION_ARCHITECTURE.md` → Fixed all `/api/auth/*` paths to `/auth/*`
- `backend/docs/API_SPEC.md` → Fixed all auth endpoint paths
- `backend/docs/Auth.md` → Added Section 15 "Developer Guide"

---

## Documentation Gap Status

### Scorecard (Updated 2025-12-18)

| Area | Status | Notes |
|------|--------|-------|
| Architecture Docs | 🟢 | CONTEXT_SCOPE.md + CONTEXT_ARCHITECTURE.md canonical |
| UI/UX Docs | 🟢 | UI_DESIGN_SYSTEM.md comprehensive |
| Auth Docs | 🟢 | backend/docs/Auth.md canonical (PR #90 complete) |
| Planning Docs | 🟢 | PROJECT_TRACKING_BASELINE.md + ROADMAP.md aligned |
| Environment Setup | 🔴 | No ENV_SETUP.md |
| Testing Docs | 🔴 | No TESTING.md |
| Performance Docs | 🔴 | No PERFORMANCE.md |
| CI/CD Docs | 🟡 | Basic coverage, no troubleshooting guide |
| API Docs | 🟡 | API_SPEC.md exists, no usage guide |

### Priority Tasks (Documentation)

1. **[Critical]** Create `docs/ENV_SETUP.md` — Environment variable guide
2. **[Critical]** Create `docs/TESTING.md` — Test running and writing guide
3. **[Critical]** Create `docs/PERFORMANCE.md` — Core Web Vitals targets
4. **[High]** Create `docs/API_USAGE.md` — API usage examples
5. **[Medium]** Expand `SECURITY.md` — Threat model and checklist

---

## Reference Documents

| Document | Purpose | Location |
|----------|---------|----------|
| PROJECT_TRACKING_BASELINE.md | Schedule anchor | `docs/PROJECT_TRACKING_BASELINE.md` |
| DOCS_AUDIT_REPORT.md | Audit & cleanup plan | `docs/DOCS_AUDIT_REPORT.md` |
| ROADMAP.md | Phase overview | `docs/ROADMAP.md` |
| CONTEXT_SCOPE.md | Scope & requirements | `.cursor/context/CONTEXT_SCOPE.md` |
| CONTEXT_ARCHITECTURE.md | Technical architecture | `.cursor/context/CONTEXT_ARCHITECTURE.md` |

---

*This document tracks immediate next actions and gating criteria. Refer to PROJECT_TRACKING_BASELINE.md for the canonical schedule.*
