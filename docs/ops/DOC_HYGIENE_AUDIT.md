# Documentation Hygiene Audit Plan

> **Generated:** 2026-01-28
> **Branch:** `docs/restructure-2026-01`
> **Input:** `docs/ops/REPO_REALITY_BASELINE.md`

---

## 1. Audit Methodology

### Classification Rules (Conservative Default)

```
KEEP > ARCHIVE > DELETE
```

| Action | Criteria | Default |
|--------|----------|---------|
| **KEEP** | Document is referenced, maintained, or provides unique value | Yes (default) |
| **ARCHIVE** | Document is historical, superseded, or rarely accessed but has reference value | Only with evidence |
| **DELETE** | Document is unreferenced AND redundant AND clearly superseded with replacement | Only with strong evidence |

### Pre-Execution Checks
1. Run link integrity check before any file move
2. Verify git history is preserved
3. Confirm replacement document exists before marking DELETE

---

## 2. Keep List (Must-Not-Touch)

These documents are canonical and must never be archived or deleted.

### Canonical Planning Chain
| Document | Path | Reason |
|----------|------|--------|
| PROJECT_TRACKING_BASELINE.md | docs/ | Schedule anchor from spreadsheet |
| ROADMAP.md | docs/ | Phase overview and milestones |
| NEXT.md | docs/ | Immediate actions and execution order |

### Context Documents
| Document | Path | Reason |
|----------|------|--------|
| CONTEXT_ARCHITECTURE.md | .cursor/context/ | Technical architecture mandate |
| CONTEXT_SCOPE.md | .cursor/context/ | Project scope and requirements |
| AKIS_STATUS_ROADMAP.md | .cursor/context/ | Status snapshot |

### Backend Canonical Docs
| Document | Path | Reason |
|----------|------|--------|
| API_SPEC.md | backend/docs/ | REST API specification |
| Auth.md | backend/docs/ | Authentication architecture |
| AGENT_WORKFLOWS.md | backend/docs/ | Agent system architecture |

### Design System
| Document | Path | Reason |
|----------|------|--------|
| UI_DESIGN_SYSTEM.md | docs/ | Design tokens and components |
| WEB_INFORMATION_ARCHITECTURE.md | docs/ | Site structure and flows |
| BRAND_GUIDE.md | docs/ | Brand guidelines |

### Integration Docs
| Document | Path | Reason |
|----------|------|--------|
| GITHUB_MCP_SETUP.md | docs/ | GitHub MCP configuration |
| GITHUB_OAUTH_SETUP.md | docs/ | GitHub OAuth setup |
| ATLASSIAN_OAUTH_SETUP.md | docs/integrations/ | Atlassian integration |
| MCP_ENV_SECURITY_IMPLEMENTATION.md | docs/ | MCP security |

### Agent Docs
| Document | Path | Reason |
|----------|------|--------|
| SCRIBE_V2_CONTRACT_FIRST.md | docs/ | Scribe contract spec |
| PLAYBOOK_RESEARCH_SUMMARY.md | docs/agents/scribe/ | Playbook research |
| SCRIBE_PR_FACTORY_V1.md | docs/agents/scribe/ | PR factory spec |

### Setup & Ops
| Document | Path | Reason |
|----------|------|--------|
| DEV_SETUP.md | docs/ | Development setup |
| ENV_SETUP.md | docs/ | Environment configuration |
| LOCAL_DEV_QUICKSTART.md | docs/local-dev/ | Quick start guide |
| constraints.md | docs/ | OCI constraints |

### Deployment
| Document | Path | Reason |
|----------|------|--------|
| DEPLOYMENT_STRATEGY.md | docs/deploy/ | Deployment strategy |
| RUNBOOK_OCI.md | docs/deploy/ | OCI runbook |
| OCI_STAGING_RUNBOOK.md | docs/deploy/ | Staging runbook |

---

## 3. Archive Plan

### Target Structure
```
docs/archive/
├── README.md                    # Archive index (update)
├── qa-evidence/                 # Older QA evidence files
│   ├── 2025-12-QA_EVIDENCE_PR127_FRONTEND_GATE_FIX.md
│   ├── 2025-12-QA_EVIDENCE_FRONTEND_IMPORTS.md
│   └── 2025-12-QA_EVIDENCE_MERGE_GATE_DB_TESTS.md
├── debug-plans/                 # Debug and troubleshooting plans
│   └── 2026-01-DEBUG_SCRIBE_AI_COOKIE_401_PLAN_V2.md
└── audits/                      # Backend audit (already archived)
    └── 2025-11-26-scribe-pipeline-audit.md
```

### Files to Archive

| Current Path | Archive Path | Reason |
|--------------|--------------|--------|
| docs/QA_EVIDENCE_PR127_FRONTEND_GATE_FIX.md | docs/archive/qa-evidence/2025-12-QA_EVIDENCE_PR127_FRONTEND_GATE_FIX.md | Historical QA evidence, not referenced |
| docs/QA_EVIDENCE_FRONTEND_IMPORTS.md | docs/archive/qa-evidence/2025-12-QA_EVIDENCE_FRONTEND_IMPORTS.md | Historical QA evidence, not referenced |
| docs/QA_EVIDENCE_MERGE_GATE_DB_TESTS.md | docs/archive/qa-evidence/2025-12-QA_EVIDENCE_MERGE_GATE_DB_TESTS.md | Historical QA evidence, not referenced |
| docs/qa/DEBUG_SCRIBE_AI_COOKIE_401_PLAN_V2.md | docs/archive/debug-plans/2026-01-DEBUG_SCRIBE_AI_COOKIE_401_PLAN_V2.md | Debug plan, issue resolved |
| backend/docs/audit/2025-11-26-scribe-pipeline-audit.md | docs/archive/audits/2025-11-26-scribe-pipeline-audit.md | Historical audit, consolidate archives |

---

## 4. Delete Plan

### Files to Delete

| File | Reason | Replacement | Risk |
|------|--------|-------------|------|
| docs/academic/00-README 2.md | Duplicate of 00-README.md | docs/academic/00-README.md | Low |

**Total DELETE candidates:** 1

---

## 5. Dead Link Inventory

### Links Requiring Fix

| Dead Link | Found In | Correct Path | Fix Required |
|-----------|----------|--------------|--------------|
| `docs/Auth.md` | DOCS_AUDIT_REPORT.md, NEXT.md, WEB_INFORMATION_ARCHITECTURE.md, CONTEXT_ARCHITECTURE.md | `backend/docs/Auth.md` | Yes |
| `docs/API_SPEC.md` | DOCS_AUDIT_REPORT.md, NEXT.md, README.md, WEB_INFORMATION_ARCHITECTURE.md, CONTEXT_ARCHITECTURE.md | `backend/docs/API_SPEC.md` | Yes |
| `docs/PHASE10_PLAN.md` | DOCS_AUDIT_REPORT.md, ROADMAP.md | File does not exist (deprecated) | Remove reference |
| `docs/CONTEXT_SCOPE.md` | DOCS_AUDIT_REPORT.md | `.cursor/context/CONTEXT_SCOPE.md` | Yes |
| `docs/QA_EVIDENCE_PHASE_9_2_BRAND.md` | DOCS_AUDIT_REPORT.md | `docs/archive/phase-9-2/QA_EVIDENCE_PHASE_9_2_BRAND.md` | Yes |

### Files Requiring Link Updates

| File | Dead Links to Fix |
|------|-------------------|
| docs/DOCS_AUDIT_REPORT.md | 5 dead links |
| docs/NEXT.md | 2 dead links |
| docs/README.md | 1 dead link |
| docs/WEB_INFORMATION_ARCHITECTURE.md | 2 dead links |
| docs/ROADMAP.md | 1 dead link |
| .cursor/context/CONTEXT_ARCHITECTURE.md | 2 dead links |

---

## 6. Update Plan

### Documents Requiring Content Updates

| Document | Update Required | Priority |
|----------|-----------------|----------|
| docs/PROJECT_TRACKING_BASELINE.md | Sync with current sprint status (41 days stale) | P0 |
| docs/ROADMAP.md | Sync phase status, update milestone dates | P0 |
| .cursor/context/CONTEXT_ARCHITECTURE.md | Verify tech stack, fix dead links | P1 |
| .cursor/context/CONTEXT_SCOPE.md | Update agent reality status | P1 |
| docs/DOCS_AUDIT_REPORT.md | Fix all dead links | P1 |
| docs/README.md | Fix dead link to API_SPEC.md | P2 |

---

## 7. Execution Sequence

### Phase A: Link Fixes (Pre-requisite)
1. Fix dead links in DOCS_AUDIT_REPORT.md
2. Fix dead links in NEXT.md
3. Fix dead links in README.md
4. Fix dead links in WEB_INFORMATION_ARCHITECTURE.md
5. Fix dead links in ROADMAP.md
6. Fix dead links in CONTEXT_ARCHITECTURE.md

### Phase B: Archive Operations
1. Create archive subdirectories if needed
2. Move QA evidence files to docs/archive/qa-evidence/
3. Move debug plan to docs/archive/debug-plans/
4. Move backend audit to docs/archive/audits/
5. Update docs/archive/README.md with new entries

### Phase C: Delete Operations
1. Delete docs/academic/00-README 2.md

### Phase D: Content Updates
1. Update PROJECT_TRACKING_BASELINE.md (Gate 3)
2. Update ROADMAP.md (Gate 3)
3. Update CONTEXT_ARCHITECTURE.md (Gate 4)
4. Update CONTEXT_SCOPE.md (Gate 4)

---

## 8. Verification Checklist

### Pre-Execution
- [ ] All archive target directories exist
- [ ] Git status is clean before starting
- [ ] Backup/branch exists for rollback

### Post-Execution
- [ ] No broken internal links (grep verification)
- [ ] All archived files accessible in new location
- [ ] Archive README.md updated
- [ ] Git history preserved for all moved files
- [ ] TypeScript build still passes

---

## 9. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking external links | Low | Medium | Only internal docs affected |
| Losing file history | Low | High | Use `git mv` for moves |
| Missing referenced content | Medium | Medium | Archive instead of delete |
| Merge conflicts | Low | Low | Work on isolated branch |

---

## 10. Summary

| Action | Count | Files |
|--------|-------|-------|
| **KEEP** | 60+ | Canonical and referenced documents |
| **UPDATE** | 7 | Planning chain, context docs, dead links |
| **ARCHIVE** | 5 | Old QA evidence, debug plan, audit |
| **DELETE** | 1 | Duplicate README in academic/ |
| **FIX LINKS** | 13 | Dead links across 6 files |

---

*This audit plan follows the conservative KEEP > ARCHIVE > DELETE principle. All operations will be logged in DOC_HYGIENE_CHANGELOG.md.*
