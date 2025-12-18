# Documentation Archive

> **Last Updated:** 2025-12-18  
> **Cleanup Branch:** `docs/project-tracking-baseline-s0.4.6`

This folder contains superseded, deprecated, or historical documentation that is kept for reference only. **Do not edit files here**—they are frozen records.

---

## Archive Structure

```
docs/archive/
├── README.md                      # This file
├── backend-project-deep-audit-report.md
├── DEV_COOKIE_VERIFICATION.md
├── repository-docs-audit.md
├── repository-docs-cleanup-log.md
├── deprecated/
│   └── AUTH_GITHUB_INTEGRATION.md
├── phase-9-2/
│   ├── PHASE_9_2_BRAND_MIGRATION_NOTES.md
│   └── QA_EVIDENCE_PHASE_9_2_BRAND.md
└── qa-notes/
    ├── QA_NOTES_AUTH_S0.4.4.md
    └── QA_NOTES_S0.4.2_OAUTH.md
```

---

## Archived Files

### Phase 9.2 Materials (`phase-9-2/`)

| File | Original Location | Reason | Date |
|------|-------------------|--------|------|
| `PHASE_9_2_BRAND_MIGRATION_NOTES.md` | `docs/` | Phase complete, superseded by `docs/BRAND_GUIDE.md` | 2025-12-18 |
| `QA_EVIDENCE_PHASE_9_2_BRAND.md` | `docs/` | Phase complete, evidence captured | 2025-12-18 |

### QA Notes (`qa-notes/`)

| File | Original Location | Reason | Date |
|------|-------------------|--------|------|
| `QA_NOTES_AUTH_S0.4.4.md` | `docs/` | Implementation complete (PR #90), notes absorbed into `backend/docs/Auth.md` | 2025-12-18 |
| `QA_NOTES_S0.4.2_OAUTH.md` | `docs/` | Implementation complete (PR #90), notes absorbed into `backend/docs/Auth.md` | 2025-12-18 |

### Deprecated (`deprecated/`)

| File | Original Location | Reason | Date |
|------|-------------------|--------|------|
| `AUTH_GITHUB_INTEGRATION.md` | `docs/` | Superseded by `backend/docs/Auth.md` and `backend/docs/API_SPEC.md` | 2025-12-18 |

### Other Archived Files

| File | Original Location | Reason | Date |
|------|-------------------|--------|------|
| `DEV_COOKIE_VERIFICATION.md` | `docs/` | Debugging notes, superseded by `backend/docs/Auth.md` | 2025-12-18 |
| `backend-project-deep-audit-report.md` | `docs/archive/` | Legacy audit, architecture evolved | Pre-existing |
| `repository-docs-audit.md` | `docs/` | Previous audit, superseded by `docs/DOCS_AUDIT_REPORT.md` | 2025-12-18 |
| `repository-docs-cleanup-log.md` | `docs/` | Previous cleanup log, superseded by this cleanup | 2025-12-18 |

---

## Deleted Files (Not Archived)

The following files were permanently deleted as they were exact duplicates or no longer relevant:

| File | Reason |
|------|--------|
| `docs/Auth.md` | Duplicate of `backend/docs/Auth.md` |
| `docs/CONTEXT_SCOPE.md` | Stale copy of `.cursor/context/CONTEXT_SCOPE.md` |
| `docs/PR_DRAFTS/phase-9-2-brand.md` | PR merged, draft no longer needed |
| `docs/PHASE10_PLAN.md` | Content consolidated into `docs/ROADMAP.md` Phase 10 section |
| `docs/README.theme.md` | Content merged into `docs/UI_DESIGN_SYSTEM.md` |
| `docs/PROJECT_SCOPE_REQUIREMENTS_SECTIONS_2_4_5_6.md` | Partial scope doc, superseded by `.cursor/context/CONTEXT_SCOPE.md` |

---

## Canonical Document Chain

For current documentation, see the canonical chain:

```
docs/PROJECT_TRACKING_BASELINE.md  →  docs/ROADMAP.md  →  docs/NEXT.md
```

- **PROJECT_TRACKING_BASELINE.md**: Sprint/phase/milestone schedule (source: spreadsheet)
- **ROADMAP.md**: High-level phase overview
- **NEXT.md**: Immediate actions + gap audit

---

*This archive was created as part of the documentation canonicalization effort (Sprint S0.4.6).*

