# Documentation Archive

> **Purpose:** Historical documentation and evidence files that are no longer actively referenced but preserved for audit trail and reference.
> **Last Updated:** 2026-01-28 (Gate 5)

---

## Archive Structure

### qa-evidence/
Historical QA evidence files from completed sprints and phases.

| File | Original Date | Sprint/Phase | Reason Archived |
|------|---------------|--------------|-----------------|
| 2025-12-QA_EVIDENCE_PR127_FRONTEND_GATE_FIX.md | 2025-12-27 | S0.4.x | Historical QA evidence, not actively referenced |
| 2025-12-QA_EVIDENCE_FRONTEND_IMPORTS.md | 2025-12-27 | S0.4.x | Historical QA evidence, not actively referenced |
| 2025-12-QA_EVIDENCE_MERGE_GATE_DB_TESTS.md | 2025-12-27 | S0.4.x | Historical QA evidence, not actively referenced |

### debug-plans/
Debug and troubleshooting plans for resolved issues.

| File | Original Date | Issue | Reason Archived |
|------|---------------|-------|-----------------|
| 2026-01-DEBUG_SCRIBE_AI_COOKIE_401_PLAN_V2.md | 2026-01-07 | Scribe AI cookie 401 errors | Issue resolved, debug plan superseded |

### audits/
Historical audit reports consolidated from various locations.

| File | Original Date | Audit Scope | Reason Archived |
|------|---------------|-------------|-----------------|
| 2025-11-26-scribe-pipeline-audit.md | 2025-11-26 | Scribe pipeline architecture | Historical audit, findings incorporated |

### phase-9-2/ (Pre-existing)
QA evidence from Phase 9.2 (brand and theme work).

| File | Phase | Reason Archived |
|------|-------|-----------------|
| QA_EVIDENCE_PHASE_9_2_BRAND.md | Phase 9.2 | Phase complete, evidence captured |

---

## Archive Policy

### When to Archive
- QA evidence files from completed sprints (>30 days old, not actively referenced)
- Debug plans for resolved issues
- Historical audit reports with findings already incorporated
- Superseded documentation versions

### When NOT to Archive
- Current sprint QA evidence
- Active debug plans
- Canonical documentation (BASELINE, ROADMAP, NEXT, etc.)
- Referenced design documents

### Retrieval
All archived files preserve git history. Use `git log --follow <archived-file>` to trace original location and changes.

---

## Archive Operations Log

### Gate 5 (2026-01-28)
- **Moved:** 3 QA evidence files (S0.4.x sprint evidence)
- **Moved:** 1 debug plan (Scribe AI cookie 401 resolved)
- **Moved:** 1 backend audit (consolidated to main archive)
- **Deleted:** 1 duplicate file (docs/academic/00-README 2.md)
- **Git History:** Preserved via `git mv` for all moved files

---

*This archive maintains project audit trail while keeping active documentation organized.*
