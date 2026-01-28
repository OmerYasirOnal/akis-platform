# AKIS Project Management Naming System

> **Generated:** 2026-01-28
> **Purpose:** Professional, readable, consistent naming conventions for planning artifacts

---

## 1. Taxonomy

```
Phase → Milestone → Capability/Epic → Story/Task
```

| Level | Description | Example |
|-------|-------------|---------|
| **Phase** | Major development stage (numbered) | Phase 0.4, Phase 1, Phase 2 |
| **Milestone** | Significant deliverable within a phase | "Phase 1 Functional Complete" |
| **Capability/Epic** | Feature area or large work item | "Scribe Config Dashboard", "Cursor-Inspired UI" |
| **Story/Task** | Individual work items within a capability | S0.4.6-FE-1, S0.4.6-BE-2 |

---

## 2. Technical ID Formats (Immutable)

These IDs are preserved exactly as they exist in the spreadsheet and codebase. **Do not rename or modify.**

### Sprint ID Format
```
S{Phase}.{SubPhase}.{Sprint}
```

| Component | Description | Range |
|-----------|-------------|-------|
| Phase | Major phase number | 0-3 (current scope) |
| SubPhase | Sub-phase within major phase | 0-9 |
| Sprint | Sprint sequence within sub-phase | 1-9 |

**Examples:**
- `S0.4.6` → Phase 0, Sub-phase 4, Sprint 6
- `S1.0.1` → Phase 1, Sub-phase 0, Sprint 1
- `S2.0.1` → Phase 2, Sub-phase 0, Sprint 1

### Task ID Format
```
{SprintID}-{Workstream}-{Sequence}
```

| Workstream | Description |
|------------|-------------|
| `FE` | Frontend |
| `BE` | Backend |
| `DOC` | Documentation |
| `QA` | Quality Assurance |
| `OPS` | Operations/DevOps |
| `API` | API Development |
| `AI` | AI/ML Integration |

**Examples:**
- `S0.4.6-FE-1` → Frontend task 1 in sprint S0.4.6
- `S1.0.1-BE-2` → Backend task 2 in sprint S1.0.1
- `S2.0.1-DOC-1` → Documentation task 1 in sprint S2.0.1

### Evidence Document Format
```
QA_EVIDENCE_{SprintID}.md
```

**Examples:**
- `QA_EVIDENCE_S0.4.6.md`
- `QA_EVIDENCE_S2.0.1.md`

---

## 3. Human-Readable Labels

Every technical ID has a corresponding human-readable label for communication and documentation.

### Phase Labels

| Technical ID | Human Label | Description |
|-------------|-------------|-------------|
| Phase 0.1 | Foundation Setup | Repo and infrastructure |
| Phase 0.2 | Architecture Definition | Scope and design |
| Phase 0.3 | Core Engine Scaffold | Initial engine implementation |
| Phase 0.4 | Web Shell and Basic Engine | Dashboard and basic motor |
| Phase 0.5 | GitHub Integration | Deep GitHub integration |
| Phase 1 | Agent Early Access | Scribe, Trace, Proto MVP |
| Phase 1.5 | Observability Layer | Logging, token tracking, metrics |
| Phase 2 | Production Hosting | OCI deployment, pilots |
| Phase 2.5 | Early Adoption | Real users, marketplace draft |
| Phase 3 | Final Delivery | Brand, content, submission |

### Sprint Labels

| Technical ID | Human Label | Status |
|-------------|-------------|--------|
| S0.4.1 | Landing and Navigation | Done |
| S0.4.2 | OAuth and Auth Endpoints | Done |
| S0.4.3 | Theme and Brand Assets | Done |
| S0.4.4 | Dashboard Layout | Done |
| S0.4.5 | i18n and 404 Fix | Done |
| S0.4.6 | Scribe Config Dashboard | **CONFLICT** |
| S1.0.1 | Scribe Basic Flow | Done |
| S1.0.2 | Trace/Proto MVP Scaffold | Done |
| S1.5.0 | SDTA Document Final | Done |
| S1.5.1 | Job Logging v1 | Done |
| S1.5.2 | Token and Cost Tracking | Done |
| S2.0.1 | Cursor-Inspired UI | In Progress |
| S2.0.2 | Scribe Console Enhancement | Not Started |

### Milestone Labels

| Milestone | Target Date | Owner | Status |
|-----------|-------------|-------|--------|
| Phase 1 Functional Complete | 2025-12-25 | Yasir | **CONFLICT** |
| SDTA Document Ready | 2025-12-26 | Ayşe | Done |
| Project Final Delivery | 2026-03-31 | Yasir | Not Started |

---

## 4. Status Vocabulary (Strict)

Use **only** these status terms. Do not use synonyms or variations.

| Status | Definition | Use When |
|--------|------------|----------|
| **Not Started** | Work has not begun | Sprint/task is queued but not active |
| **In Progress** | Work is actively being done | Sprint/task is currently being worked on |
| **Blocked** | Work is stopped due to dependency | Cannot proceed without external resolution |
| **Done** | Work is complete with evidence | Has QA evidence or verification |
| **Deprecated** | No longer relevant or superseded | Replaced by another item |

### Status Mapping from Legacy Terms

| Old Term | New Term | Notes |
|----------|----------|-------|
| Pending | Not Started | Clarifies nothing has begun |
| Planned | Not Started | Planning complete, execution not started |
| Complete | Done | Requires evidence verification |
| Completed | Done | Requires evidence verification |
| Cancelled | Deprecated | Item is no longer pursued |
| On Hold | Blocked | Identify blocking dependency |
| WIP | In Progress | Standard active work status |

---

## 5. Renaming Map

This map preserves traceability from old labels to new labels.

| Old Label | New Label | Technical ID | Notes |
|-----------|-----------|--------------|-------|
| "Web Shell + Basit Motor" | Web Shell and Basic Engine | Phase 0.4 | Turkish to English |
| "Motor + GitHub Entegrasyonu" | GitHub Integration | Phase 0.5 | Turkish to English |
| "Scribe • Trace • Proto – Early Access" | Agent Early Access | Phase 1 | Simplified |
| "Logging • Token Trace • Time-Saved v1" | Observability Layer | Phase 1.5 | Descriptive |
| "OCI Hosting + Gerçek Pilotlar" | Production Hosting | Phase 2 | Turkish to English |
| "Gerçek Kullanım • Early Users" | Early Adoption | Phase 2.5 | Simplified |
| "Marka • İçerik • Final Teslim" | Final Delivery | Phase 3 | Turkish to English |
| "Scribe temel akış" | Scribe Basic Flow | S1.0.1 | Turkish to English |
| "Job loglama v1" | Job Logging v1 | S1.5.1 | Turkish to English |
| "SDTA dokümanı final" | SDTA Document Final | S1.5.0 | Turkish to English |

---

## 6. Document Naming Convention

### Pattern
```
{CATEGORY}_{SUBJECT}_{QUALIFIER}.md
```

### Categories

| Category | Usage |
|----------|-------|
| `QA` | Quality assurance evidence and notes |
| `PLAN` | Planning and design documents |
| `SPEC` | Technical specifications |
| `GUIDE` | How-to guides and tutorials |
| `REPORT` | Audit reports and analysis |
| `EVIDENCE` | Verification and proof documents |

### Examples

| Filename | Category | Subject | Qualifier |
|----------|----------|---------|-----------|
| `QA_EVIDENCE_S0.4.6.md` | QA | Evidence | S0.4.6 |
| `PLAN_TRACE_DESIGN.md` | Plan | Trace | Design |
| `SPEC_AI_PROVIDER.md` | Spec | AI Provider | — |
| `GUIDE_DEV_SETUP.md` | Guide | Dev | Setup |
| `REPORT_STAGING_READINESS.md` | Report | Staging | Readiness |

---

## 7. Title Writing Guidelines

### Format
```
[Verb] + [Object] + [Context/Qualifier]
```

### Rules
- **Maximum 6-8 words**
- **Start with action verb** (Add, Create, Fix, Update, Remove, Implement)
- **Be specific** about the object
- **Avoid jargon** and abbreviations in titles
- **Include measurable exit criteria** in task descriptions

### Good Examples

| Title | Why It Works |
|-------|--------------|
| "Add Scribe config wizard steps 3-5" | Action + specific object + context |
| "Fix GitHub OAuth token refresh" | Action + specific problem |
| "Create QA evidence for S0.4.6" | Action + deliverable + sprint reference |
| "Update ROADMAP with Phase 2 status" | Action + document + scope |

### Bad Examples

| Title | Problem | Better Version |
|-------|---------|----------------|
| "Dashboard stuff" | Vague, no action | "Implement dashboard layout components" |
| "Fix the bug" | Too generic | "Fix 404 error on settings page" |
| "S0.4.6 work" | No action, no object | "Complete Scribe config dashboard" |
| "Various improvements" | Non-specific | "Improve form validation error messages" |

---

## 8. Do / Don't Guidelines

### DO

- **Use action-oriented titles** (verb + object)
- **Keep titles short** (6-8 words max)
- **Include measurable exit criteria** for every task
- **Preserve technical IDs** exactly as they are
- **Use strict status vocabulary** (5 terms only)
- **Reference sprint IDs** in related documents
- **Update status immediately** when work state changes

### DON'T

- **Duplicate phase names** across documents
- **Use ambiguous status words** (pending, maybe, soon)
- **Create new ID formats** without updating this document
- **Mix Turkish and English** in the same title
- **Use abbreviations** without definition
- **Leave status as "Planned"** when work hasn't started (use "Not Started")
- **Claim "Done"** without QA evidence

---

## 9. Conflict Resolution Protocol

When documents disagree on status or naming:

1. **Flag as CONFLICT** with exact line references
2. **Check QA evidence** for authoritative status
3. **Defer to NEXT.md** as most current (if recently updated)
4. **Update all three planning docs** when conflict is resolved
5. **Log resolution** in DOC_HYGIENE_CHANGELOG.md

---

## 10. Quick Reference Card

```
Sprint ID:    S{Phase}.{SubPhase}.{Sprint}     → S0.4.6
Task ID:      {Sprint}-{Workstream}-{Seq}      → S0.4.6-FE-1
Evidence:     QA_EVIDENCE_{Sprint}.md          → QA_EVIDENCE_S0.4.6.md

Status Terms: Not Started | In Progress | Blocked | Done | Deprecated

Title Format: [Verb] + [Object] + [Context]    → "Add Scribe config wizard"

Taxonomy:     Phase → Milestone → Capability → Task
```

---

*This naming system is canonical. All planning documents must conform to these conventions.*
