# AKIS Platform — Documentation Audit Report

> **Audit Date:** 2025-12-18  
> **Scope:** All docs in `docs/`, `.cursor/`, `backend/docs/`  
> **Branch:** `docs/project-tracking-baseline-s0.4.6`

---

## 1. Canonical Set (Single Source of Truth)

The following documents should be treated as **authoritative** sources:

### Core Planning & Tracking

| Document | Purpose | Location |
|----------|---------|----------|
| PROJECT_TRACKING_BASELINE.md | Sprint/phase/milestone schedule | `docs/PROJECT_TRACKING_BASELINE.md` |
| ROADMAP.md | High-level phase overview | `docs/ROADMAP.md` |
| NEXT.md | Immediate actions + gap audit | `docs/NEXT.md` |

### Architecture & Scope

| Document | Purpose | Location |
|----------|---------|----------|
| CONTEXT_SCOPE.md | Project scope, requirements, constraints | `.cursor/context/CONTEXT_SCOPE.md` |
| CONTEXT_ARCHITECTURE.md | Technical architecture, MCP patterns | `.cursor/context/CONTEXT_ARCHITECTURE.md` |
| constraints.md | OCI Free Tier constraints | `docs/constraints.md` |

### API & Implementation

| Document | Purpose | Location |
|----------|---------|----------|
| API_SPEC.md | REST API endpoints reference | `backend/docs/API_SPEC.md` |
| Auth.md (backend) | JWT auth implementation details | `backend/docs/Auth.md` |
| AGENT_WORKFLOWS.md | Agent lifecycle, FSM states | `backend/docs/AGENT_WORKFLOWS.md` |

### UI & Design

| Document | Purpose | Location |
|----------|---------|----------|
| UI_DESIGN_SYSTEM.md | Colors, typography, components | `docs/UI_DESIGN_SYSTEM.md` |
| WEB_INFORMATION_ARCHITECTURE.md | Site structure, page flows | `docs/WEB_INFORMATION_ARCHITECTURE.md` |
| BRAND_GUIDE.md | Logo usage, brand assets | `docs/BRAND_GUIDE.md` |

### Cursor Context

| Document | Purpose | Location |
|----------|---------|----------|
| rules.mdc | Cursor enforcement rules | `.cursor/rules/rules.mdc` |
| DoD.md | Definition of Done checklist | `.cursor/checklists/DoD.md` |
| Security.md | Security checklist | `.cursor/checklists/Security.md` |
| Performance.md | Performance checklist | `.cursor/checklists/Performance.md` |

---

## 2. Duplicates & Deprecated Documents

### Duplicates (Same Content, Multiple Locations)

| File | Duplicate Of | Rationale | Action |
|------|--------------|-----------|--------|
| `docs/Auth.md` | `backend/docs/Auth.md` | Frontend-only mock auth doc; backend has full implementation | DELETE `docs/Auth.md` |
| `docs/CONTEXT_SCOPE.md` | `.cursor/context/CONTEXT_SCOPE.md` | Appears to be stale copy | DELETE `docs/CONTEXT_SCOPE.md` |

### Deprecated (Outdated/Superseded)

| File | Superseded By | Rationale | Action |
|------|---------------|-----------|--------|
| `docs/archive/backend-project-deep-audit-report.md` | Current architecture docs | Legacy audit, architecture evolved | KEEP in archive (reference only) |
| `docs/QA_NOTES_S0.4.2_OAUTH.md` | `backend/docs/Auth.md` | Implementation complete, notes absorbed | KEEP for historical reference |
| `docs/QA_NOTES_AUTH_S0.4.4.md` | `backend/docs/Auth.md` | Implementation complete, notes absorbed | KEEP for historical reference |
| `docs/PHASE_9_2_BRAND_MIGRATION_NOTES.md` | `docs/BRAND_GUIDE.md` | Migration complete | MOVE to archive |
| `docs/QA_EVIDENCE_PHASE_9_2_BRAND.md` | — | Phase complete, evidence captured | MOVE to archive |
| `docs/DEV_COOKIE_VERIFICATION.md` | `backend/docs/Auth.md` | Debugging notes, not canonical | MOVE to archive |
| `docs/PR_DRAFTS/phase-9-2-brand.md` | — | PR merged | DELETE |

### Files to Keep (Active Reference)

| File | Purpose | Status |
|------|---------|--------|
| `docs/glossary.md` | Term definitions | ✅ Active |
| `docs/repository-docs-audit.md` | Previous audit record | ✅ Reference |
| `docs/repository-docs-cleanup-log.md` | Cleanup changelog | ✅ Reference |
| `docs/releases/*.md` | Release notes | ✅ Active |

---

## 3. Conflicts & Inconsistencies

### Conflicts with PROJECT_TRACKING_BASELINE.md

| Area | Baseline Says | Conflicting Doc | Resolution |
|------|---------------|-----------------|------------|
| Sprint IDs | S0.4.x format | ROADMAP.md uses Phase 9.x only | Update ROADMAP to include sprint IDs |
| Phase 10 items | #44-#49 | PHASE10_PLAN.md has same | Consolidate into ROADMAP.md |
| Auth status | S0.4.4 complete | docs/Auth.md shows Phase 9.1 mock | DELETE docs/Auth.md |

### API Path Inconsistencies

| Document | Auth Path | Correct Path |
|----------|-----------|--------------|
| `docs/Auth.md` | `/api/auth/*` | `/auth/*` |
| `backend/docs/API_SPEC.md` | `/auth/*` | ✅ Correct |
| `docs/WEB_INFORMATION_ARCHITECTURE.md` | `/auth/*` | ✅ Correct (fixed in S0.4.2-DOC-2) |

**Resolution:** Already fixed in S0.4.2-DOC-2; delete conflicting `docs/Auth.md`.

### Phase Numbering Confusion

| System | Current | Notes |
|--------|---------|-------|
| Epics | Phase 9.1, 9.2, 10 | High-level milestones |
| Sprints | S0.4.x | Incremental work items |

**Resolution:** Both systems valid. ROADMAP uses phases; PROJECT_TRACKING_BASELINE uses sprints. Cross-reference in both.

---

## 4. Rename/Restructure Plan

### File Operations Required

```bash
# DELETE - Duplicates
rm docs/Auth.md
rm docs/CONTEXT_SCOPE.md
rm docs/PR_DRAFTS/phase-9-2-brand.md

# ARCHIVE - Superseded docs
mkdir -p docs/archive/phase-9-2
mv docs/PHASE_9_2_BRAND_MIGRATION_NOTES.md docs/archive/phase-9-2/
mv docs/QA_EVIDENCE_PHASE_9_2_BRAND.md docs/archive/phase-9-2/
mv docs/DEV_COOKIE_VERIFICATION.md docs/archive/

# ARCHIVE - QA Notes (keep for reference)
mkdir -p docs/archive/qa-notes
# Keep in place but mark as historical

# NO CHANGE - These are canonical
# .cursor/context/CONTEXT_SCOPE.md
# .cursor/context/CONTEXT_ARCHITECTURE.md
# backend/docs/Auth.md
# backend/docs/API_SPEC.md
# docs/UI_DESIGN_SYSTEM.md
# docs/WEB_INFORMATION_ARCHITECTURE.md
```

### Directory Structure After Cleanup

```
docs/
├── archive/
│   ├── backend-project-deep-audit-report.md
│   ├── DEV_COOKIE_VERIFICATION.md
│   └── phase-9-2/
│       ├── PHASE_9_2_BRAND_MIGRATION_NOTES.md
│       └── QA_EVIDENCE_PHASE_9_2_BRAND.md
├── brand/
│   └── legacy/
├── releases/
│   └── *.md
├── BRAND_ASSET_INVENTORY.md
├── BRAND_GUIDE.md
├── constraints.md
├── DOCS_AUDIT_REPORT.md          # This file
├── glossary.md
├── NEXT.md
├── PHASE10_PLAN.md               # Consider merging into ROADMAP.md
├── PROJECT_SCOPE_REQUIREMENTS_SECTIONS_2_4_5_6.md
├── PROJECT_TRACKING_BASELINE.md  # New canonical source
├── QA_NOTES_AUTH_S0.4.4.md       # Historical
├── QA_NOTES_S0.4.2_OAUTH.md      # Historical
├── README.md
├── README.theme.md
├── repository-docs-audit.md
├── repository-docs-cleanup-log.md
├── ROADMAP.md
├── UI_DESIGN_SYSTEM.md
└── WEB_INFORMATION_ARCHITECTURE.md

backend/docs/
├── AGENT_WORKFLOWS.md
├── API_SPEC.md
├── audit/
│   └── *.md
└── Auth.md                       # Canonical auth implementation

.cursor/
├── checklists/
│   ├── DoD.md
│   ├── Performance.md
│   └── Security.md
├── context/
│   ├── CONTEXT_ARCHITECTURE.md   # Canonical architecture
│   ├── CONTEXT_SCOPE.md          # Canonical scope
│   └── README.md
├── prompts/
│   └── *.md
└── rules/
    └── rules.mdc
```

---

## 5. Immediate Next Actions

### Execution Order (Priority)

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. FINISH SCRIBE STABILIZATION (S0.4.6)                         │
│    └── If real wiring bugs remain: fix immediately              │
│    └── If cache/restart confusion only: document in             │
│        SCRIBE_STEP2_VERIFICATION.md (✅ DONE)                   │
├─────────────────────────────────────────────────────────────────┤
│ 2. EXECUTE DOCS CLEANUP                                         │
│    └── Delete duplicates: docs/Auth.md, docs/CONTEXT_SCOPE.md   │
│    └── Archive superseded: PHASE_9_2_*, DEV_COOKIE_*            │
│    └── Update ROADMAP.md with baseline alignment                │
├─────────────────────────────────────────────────────────────────┤
│ 3. PUBLIC WAITLIST-ONLY SITE MODE                               │
│    └── Landing page + waitlist signup only                      │
│    └── No open registration until V1 stable                     │
│    └── Marketing site separate from app dashboard               │
├─────────────────────────────────────────────────────────────────┤
│ 4. ECOSYSTEM QR/DEVICE-LINK + MOBILE COMPANION                  │
│    └── Cross-device authentication flow                         │
│    └── QR code linking for mobile app                           │
│    └── Mobile app scaffold (React Native or similar)            │
├─────────────────────────────────────────────────────────────────┤
│ 5. V2 REPOOPS AGENT (LATER)                                     │
│    └── Only when web agents proven stable                       │
│    └── Gating: Scribe/Trace/Proto complete + tests              │
│    └── Gating: MCP adapters reliable (GitHub + Atlassian)       │
│    └── Gating: Job FSM proven (110+ tests passing)              │
│    └── Gating: Waitlist site launched                           │
└─────────────────────────────────────────────────────────────────┘
```

### V2 RepoOps Gating Criteria (Explicit)

Before starting V2 RepoOps agent development:

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

---

## 6. Document Cross-Reference Map

### Planning Chain

```
PROJECT_TRACKING_BASELINE.md (schedule anchor)
    ↓
ROADMAP.md (phase overview)
    ↓
NEXT.md (immediate actions)
    ↓
CONTEXT_SCOPE.md (constraints & requirements)
```

### Technical Chain

```
CONTEXT_ARCHITECTURE.md (high-level design)
    ↓
AGENT_WORKFLOWS.md (agent lifecycle)
    ↓
API_SPEC.md (endpoints)
    ↓
Auth.md (backend/docs/) (auth implementation)
```

### UI Chain

```
UI_DESIGN_SYSTEM.md (tokens & components)
    ↓
WEB_INFORMATION_ARCHITECTURE.md (pages & flows)
    ↓
BRAND_GUIDE.md (visual identity)
```

---

## 7. Summary

### Actions for This PR

1. ✅ Created `docs/PROJECT_TRACKING_BASELINE.md`
2. ✅ Created `docs/DOCS_AUDIT_REPORT.md` (this file)
3. 🔄 Update `docs/ROADMAP.md` (align with baseline)
4. 🔄 Update `docs/NEXT.md` (add gating criteria)
5. 🔄 Update `.cursor/context/CONTEXT_SCOPE.md` (add refs)

### Follow-up Actions (Separate PRs)

1. Execute file operations (delete/archive)
2. Consolidate PHASE10_PLAN.md into ROADMAP.md
3. Review and update QA_NOTES files as historical

---

*This audit establishes the canonical documentation set and cleanup plan. Execute file operations only after this PR is reviewed and merged.*

