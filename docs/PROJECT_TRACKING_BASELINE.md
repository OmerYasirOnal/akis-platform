# AKIS Platform — Project Tracking Baseline

> **Status:** DRAFT — Missing Primary Source  
> **Last Updated:** 2025-12-18  
> **Branch:** `docs/project-tracking-baseline-s0.4.6`

---

## ⚠️ MISSING SOURCE FILE

**Expected File:** `AKIS Proje Takibi Profesyonel SON guncel v2.xlsx` (or similar spreadsheet)

**Searched Locations:**
- `devagents/` (repo root)
- `devagents/docs/`
- `devagents/.cursor/`
- `akis-platform-devolopment/` (parent directory)

**Resolution Required:**
1. Locate the spreadsheet file from project owner
2. Place in `docs/` or provide as external reference
3. Update this document with extracted data

**Until resolved:** This baseline is reconstructed from existing repo documentation (`ROADMAP.md`, QA notes, commit history).

---

## 1. Phase Overview

| Phase | Name | Epic | Status | Notes |
|-------|------|------|--------|-------|
| 9.1 | Dark Theme Unification & Auth UI | — | ✅ Complete | Solid dark hero, auth pages aligned |
| 9.2 | i18n & Theming Foundations | #24 | 🔄 In Progress | Theme toggle, hi-res logo, lint cleanup |
| 10 | Next Foundations | #44 | 📋 Planned | Settings UX, a11y, performance budgets |

---

## 2. Sprint Tracking

### Sprint S0.4.x Series (Current)

| Sprint ID | Focus | Status | Key Deliverables |
|-----------|-------|--------|------------------|
| S0.4.2 | OAuth Config + Env Schema | ✅ Complete | OAuth endpoints, env validation (PR #90) |
| S0.4.3 | Docs & .cursor Cleanup | ✅ Complete | README sync, Cursor context alignment |
| S0.4.4 | Multi-Step Auth Flow | ✅ Complete | Email verification, consent flows (PR #90) |
| S0.4.5 | GitHub Integration | ✅ Complete | OAuth account linking, token storage |
| S0.4.6 | Scribe Config Dashboard | 🔄 In Progress | Step 1-5 wizard, SearchableSelect |

### Sprint Task IDs (Pattern: `S{version}-{area}-{number}`)

| ID | Description | Status |
|----|-------------|--------|
| S0.4.2-BE-1 | OAuth Environment Schema & Documentation | ✅ Complete |
| S0.4.2-BE-2 | OAuth Endpoints Implementation | ✅ Complete |
| S0.4.2-DOC-2 | Auth Documentation Sync | ✅ Complete |
| S0.4.3-FE-4 | Docs & .cursor cleanup | ✅ Complete |
| S0.4.4-FE-Auth | Cursor-style multi-step auth flows | ✅ Complete |
| S0.4.5-FE-2 | GitHub OAuth UI wiring | ✅ Complete |
| S0.4.6-FE-1 | Scribe Config Step 1-5 wizard | 🔄 In Progress |
| S0.4.6-FE-2 | Scribe SearchableSelect integration | ✅ Complete |

---

## 3. Milestone Dates (Academic Calendar)

| Milestone | Date | Deliverable |
|-----------|------|-------------|
| Demo 1 | 2025-01-26 | Working prototype with core agent functionality |
| Final | 2025-05-22 | Complete platform with all three agents |

**Academic Context:**
- Student: Ömer Yasir ÖNAL (2221221562)
- Department: Computer Engineering
- Advisor: Dr. Öğr. Üyesi Nazlı DOĞAN

---

## 4. Agent Implementation Status

| Agent | Core | Config UI | Job Execution | Tests |
|-------|------|-----------|---------------|-------|
| Scribe | ✅ | 🔄 S0.4.6 | ⚠️ Partial | ✅ |
| Trace | ⚠️ Scaffold | 📋 Planned | 📋 Planned | ⚠️ Partial |
| Proto | ⚠️ Scaffold | 📋 Planned | 📋 Planned | ⚠️ Partial |

**Legend:** ✅ Complete | 🔄 In Progress | ⚠️ Partial | 📋 Planned

---

## 5. Known PR References

| PR | Sprint | Description | Status |
|----|--------|-------------|--------|
| #90 | S0.4.2 + S0.4.4 | Email-based multi-step authentication | ✅ Merged |
| — | S0.4.3 | Docs & .cursor cleanup | ✅ Merged |
| — | S0.4.5 | GitHub OAuth integration | ✅ Merged |
| — | S0.4.6 | Scribe Config Dashboard | 🔄 Open |

---

## 6. Phase Gate Criteria

### Phase 9.2 Exit Criteria
- [ ] i18n scaffold complete (TR/EN lazy-load)
- [ ] Theme toggle functional (dark default, light opt-in)
- [ ] Hi-res logo rollout (@2x/@3x)
- [ ] Lint cleanup complete (ESLint/Prettier aligned)

### Phase 10 Exit Criteria
- [ ] Settings UX refined
- [ ] Accessibility pass (WCAG 2.1 AA)
- [ ] Performance budgets enforced (LCP < 2.5s, CLS < 0.1)
- [ ] ROI widget on Pricing page
- [ ] FAQ accordion on Landing page

---

## 7. V2 Gating Criteria (RepoOps Agent)

**Prerequisites before starting V2 RepoOps:**

| Criterion | Status | Notes |
|-----------|--------|-------|
| Web agents stable | 🔄 | Scribe, Trace, Proto complete + tests |
| MCP adapters reliable | ⚠️ | GitHub MCP functional; Atlassian scaffold only |
| Job FSM proven | ✅ | State machine tested (110/110 tests) |
| Waitlist-only site mode | 📋 | Public site with waitlist (no open signups) |
| QR/Device-link ecosystem | 📋 | Mobile companion linking |

**V2 Start Date:** TBD (after all criteria met)

---

## 8. Execution Order (Canonical)

```
1. Finish Scribe stabilization (S0.4.6)
   └── If real wiring bugs: fix immediately
   └── If cache/restart confusion: document only

2. Phase 9.2 completion
   └── i18n, theming, logo, lint

3. Phase 10 foundations
   └── Settings, a11y, performance, ROI/FAQ

4. Public waitlist-only site mode
   └── Landing + waitlist signup only
   └── No open registration

5. Ecosystem QR/device-link + mobile companion
   └── Cross-device authentication
   └── Mobile app scaffold

6. V2 RepoOps agent (later)
   └── Only when web agents proven stable
   └── Full MCP adapter suite required
```

---

## 9. Document References

| Document | Purpose | Location |
|----------|---------|----------|
| ROADMAP.md | Phase/milestone overview | `docs/ROADMAP.md` |
| CONTEXT_SCOPE.md | Project scope & requirements | `.cursor/context/CONTEXT_SCOPE.md` |
| CONTEXT_ARCHITECTURE.md | Technical architecture | `.cursor/context/CONTEXT_ARCHITECTURE.md` |
| DOCS_AUDIT_REPORT.md | Documentation audit | `docs/DOCS_AUDIT_REPORT.md` |
| NEXT.md | Next actions planning | `docs/NEXT.md` |

---

*This document will be updated when the source spreadsheet is provided. Current data is reconstructed from repository documentation.*

