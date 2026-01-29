# AKIS Documentation Reality Baseline

> **Generated:** 2026-01-28
> **Branch:** `docs/restructure-2026-01`
> **Purpose:** Single source of truth for documentation inventory

---

## 1. Canonical Planning Chain

The authoritative planning documents follow this hierarchy:

```
docs/PROJECT_TRACKING_BASELINE.md  →  docs/ROADMAP.md  →  docs/NEXT.md
        (schedule anchor)              (phase overview)    (immediate actions)
```

| Path | Purpose | Owner | Last Updated | Referenced-by | Canonical | Action | Risk |
|------|---------|-------|--------------|---------------|-----------|--------|------|
| docs/PROJECT_TRACKING_BASELINE.md | Schedule anchor from spreadsheet | Yasir | 2025-12-18 | NEXT, ROADMAP, README, DOCS_AUDIT_REPORT, CONTEXT_SCOPE, AKIS_STATUS_ROADMAP | Yes | Update | High |
| docs/ROADMAP.md | Phase overview and milestones | Yasir | 2025-12-27 | NEXT, BASELINE, README, DOCS_AUDIT_REPORT, CONTEXT_SCOPE, AKIS_STATUS_ROADMAP | Yes | Update | High |
| docs/NEXT.md | Immediate TODO and execution order | Yasir | 2026-01-28 | README, DOCS_AUDIT_REPORT | Yes | Keep | Low |

---

## 2. Status Conflicts (Planning Chain)

### CONFLICT #1: S0.4.6 Completion Status

| Source | Line Reference | Status Claimed |
|--------|----------------|----------------|
| PROJECT_TRACKING_BASELINE.md | Line 15 | "S0.4.6 \| Scribe Config Dashboard — Step 2 verified, Steps 3-5 pending" |
| ROADMAP.md | Lines 62-63 | "[ ] Steps 3-5: Target platform, advanced options, review" |
| NEXT.md | Lines 173-178 | Steps 3-5 marked **Complete** |

**Evidence Required:** Verify actual S0.4.6 completion via code/QA evidence.

### CONFLICT #2: Current Phase/Sprint

| Source | Line Reference | Current Phase |
|--------|----------------|---------------|
| PROJECT_TRACKING_BASELINE.md | Lines 14-16 | Phase 0.4 (S0.4.6) |
| ROADMAP.md | Line 23 | Phase 0.4 (S0.4.6) |
| NEXT.md | Line 36 | Phase 2 (S2.0.1) |

**Evidence Required:** Determine actual current phase from code state.

### CONFLICT #3: Document Staleness

| Document | Last Updated | Days Stale (from 2026-01-28) |
|----------|--------------|------------------------------|
| PROJECT_TRACKING_BASELINE.md | 2025-12-18 | 41 days |
| ROADMAP.md | 2025-12-27 | 32 days |
| NEXT.md | 2026-01-28 | 0 days (current) |

---

## 3. Context Documents (.cursor/context/)

| Path | Purpose | Owner | Last Updated | Referenced-by | Canonical | Action | Risk |
|------|---------|-------|--------------|---------------|-----------|--------|------|
| .cursor/context/CONTEXT_ARCHITECTURE.md | Technical architecture and stack | Yasir | 2025-12-12 | BASELINE, ROADMAP, NEXT, README, DOCS_AUDIT_REPORT, WEB_IA, CONTEXT_SCOPE, Auth.md | Yes | Update | Med |
| .cursor/context/CONTEXT_SCOPE.md | Project scope and requirements | Yasir | 2025-12-27 | BASELINE, ROADMAP, NEXT, README, AKIS_STATUS_ROADMAP | Yes | Update | Med |
| .cursor/context/AKIS_STATUS_ROADMAP.md | Status snapshot (quick reference) | Yasir | — | — | Yes | Update | Low |
| .cursor/context/README.md | Bootstrap guide for context files | — | — | — | No | Keep | Low |

---

## 4. Backend Documentation (backend/docs/)

| Path | Purpose | Owner | Last Updated | Referenced-by | Canonical | Action | Risk |
|------|---------|-------|--------------|---------------|-----------|--------|------|
| backend/docs/API_SPEC.md | REST API specification | Yasir | 2026-01-10 | — | Yes | Keep | Low |
| backend/docs/Auth.md | Authentication architecture | Yasir | 2025-12-23 | CONTEXT_ARCHITECTURE | Yes | Keep | Low |
| backend/docs/AGENT_WORKFLOWS.md | Agent system architecture | Yasir | 2025-11-26 | — | Yes | Keep | Low |
| backend/docs/audit/2025-11-26-scribe-pipeline-audit.md | Scribe pipeline audit | Yasir | 2025-11-26 | — | No | Archive | Low |

---

## 5. Core Documentation (docs/ root)

### Planning & Status

| Path | Purpose | Owner | Last Updated | Referenced-by | Canonical | Action | Risk |
|------|---------|-------|--------------|---------------|-----------|--------|------|
| docs/README.md | Main repo intro and doc index | Yasir | — | — | Yes | Update | Low |
| docs/PROJECT_STATUS.md | Current project status | — | — | — | No | Update | Low |
| docs/PROJECT_ANALYSIS_2025-12-23.md | Deep project analysis | Yasir | 2025-12-23 | — | No | Keep | Low |
| docs/DOCS_AUDIT_REPORT.md | Documentation audit report | Yasir | 2025-12-18 | NEXT | No | Update | Low |

### Setup & Configuration

| Path | Purpose | Owner | Last Updated | Referenced-by | Canonical | Action | Risk |
|------|---------|-------|--------------|---------------|-----------|--------|------|
| docs/DEV_SETUP.md | Development environment setup | Yasir | 2026-01-10 | — | Yes | Keep | Low |
| docs/ENV_SETUP.md | Environment variables | Yasir | 2026-01-10 | — | Yes | Keep | Low |
| docs/constraints.md | OCI Free Tier constraints | — | — | — | Yes | Keep | Low |
| docs/glossary.md | Project terminology | — | — | — | No | Keep | Low |

### Design & UX

| Path | Purpose | Owner | Last Updated | Referenced-by | Canonical | Action | Risk |
|------|---------|-------|--------------|---------------|-----------|--------|------|
| docs/UI_DESIGN_SYSTEM.md | Design tokens and components | Yasir | 2026-01-10 | CONTEXT_ARCHITECTURE | Yes | Keep | Low |
| docs/WEB_INFORMATION_ARCHITECTURE.md | Site structure and flows | Yasir | 2026-01-06 | CONTEXT_ARCHITECTURE | Yes | Keep | Low |
| docs/BRAND_GUIDE.md | Brand guidelines | — | — | — | Yes | Keep | Low |
| docs/BRAND_ASSET_INVENTORY.md | Brand assets catalog | — | — | — | No | Keep | Low |

### Integration Documentation

| Path | Purpose | Owner | Last Updated | Referenced-by | Canonical | Action | Risk |
|------|---------|-------|--------------|---------------|-----------|--------|------|
| docs/GITHUB_OAUTH_SETUP.md | GitHub OAuth configuration | — | — | — | Yes | Keep | Low |
| docs/GITHUB_MCP_SETUP.md | GitHub MCP setup | Yasir | 2025-12-20 | — | Yes | Keep | Low |
| docs/MCP_ENV_SECURITY_IMPLEMENTATION.md | MCP security implementation | — | — | — | Yes | Keep | Low |
| docs/API_GITHUB_DISCOVERY.md | GitHub API discovery | — | — | — | No | Keep | Low |
| docs/integrations/ATLASSIAN_OAUTH_SETUP.md | Atlassian OAuth setup | — | — | — | Yes | Keep | Low |

### Agent Documentation

| Path | Purpose | Owner | Last Updated | Referenced-by | Canonical | Action | Risk |
|------|---------|-------|--------------|---------------|-----------|--------|------|
| docs/SCRIBE_MVP_CONTRACT_FIRST.md | Scribe MVP contract-first design | — | — | — | Yes | Keep | Low |
| docs/agents/scribe/PLAYBOOK_RESEARCH_SUMMARY.md | Scribe playbook research | — | — | — | Yes | Keep | Low |
| docs/agents/scribe/SCRIBE_PR_FACTORY_V1.md | Scribe PR factory spec | — | — | — | Yes | Keep | Low |

### Observability

| Path | Purpose | Owner | Last Updated | Referenced-by | Canonical | Action | Risk |
|------|---------|-------|--------------|---------------|-----------|--------|------|
| docs/OBSERVABILITY_BACKLOG.md | Observability tasks | — | — | — | No | Keep | Low |
| docs/OBSERVABILITY_TRACE_SPEC.md | Trace/telemetry spec | — | — | — | No | Keep | Low |

### CI/CD & Deployment

| Path | Purpose | Owner | Last Updated | Referenced-by | Canonical | Action | Risk |
|------|---------|-------|--------------|---------------|-----------|--------|------|
| docs/CI_AUTOMATION.md | CI automation workflows | — | — | — | No | Keep | Low |
| docs/deploy/DEPLOYMENT_STRATEGY.md | Deployment strategy | — | — | — | Yes | Keep | Low |
| docs/deploy/RUNBOOK_OCI.md | OCI deployment runbook | — | — | — | Yes | Keep | Low |
| docs/deploy/OCI_STAGING_RUNBOOK.md | OCI staging deployment | — | — | — | Yes | Keep | Low |
| docs/deploy/AKISFLOW_DOMAIN_STRATEGY.md | Domain and routing | — | — | — | No | Keep | Low |

### API & Technical Specs

| Path | Purpose | Owner | Last Updated | Referenced-by | Canonical | Action | Risk |
|------|---------|-------|--------------|---------------|-----------|--------|------|
| docs/AI_RESPONSE_SCHEMA.md | AI response schema | — | — | — | No | Keep | Low |
| docs/FEEDBACK_API.md | Feedback API spec | — | — | — | No | Keep | Low |

---

## 6. QA Documentation (docs/qa/)

| Path | Purpose | Owner | Last Updated | Referenced-by | Canonical | Action | Risk |
|------|---------|-------|--------------|---------------|-----------|--------|------|
| docs/qa/QA_EVIDENCE_S0.4.6.md | S0.4.6 sprint QA evidence | Sadi Önal | 2025-12-28 | NEXT | Yes | Keep | Low |
| docs/qa/QA_EVIDENCE_CURSOR_UI_RELEASE.md | Cursor UI release QA | Sadi Önal | 2026-01-10 | — | Yes | Keep | Low |
| docs/qa/QA_NOTES_CURSOR_UI_ROLLOUT.md | Cursor UI rollout notes | Sadi Önal | 2026-01-10 | NEXT | Yes | Keep | Low |
| docs/qa/QA_EVIDENCE_STAGING_SMOKE_PACK.md | Staging smoke tests | Sadi Önal | 2026-01-22 | — | Yes | Keep | Low |
| docs/qa/DEMO_READINESS_PR170.md | Demo readiness checklist | — | 2026-01-10 | — | No | Keep | Low |
| docs/qa/DEMO_READY_FINAL.md | Final demo sign-off | — | 2026-01-10 | — | No | Keep | Low |
| docs/qa/POST_MERGE_SANITY_20260110.md | Post-merge validation | — | 2026-01-10 | — | No | Keep | Low |
| docs/qa/ATLAS_OAUTH_SMOKE.md | Atlassian OAuth smoke | — | 2026-01-10 | — | No | Keep | Low |
| docs/qa/FINAL_VERIFICATION_ATLASSIAN_OAUTH.md | OAuth final verification | — | 2026-01-10 | — | No | Keep | Low |
| docs/qa/DEBUG_SCRIBE_AI_COOKIE_401_PLAN_V2.md | Debug plan | — | 2026-01-07 | — | No | Archive | Low |

---

## 7. UX Documentation (docs/ux/)

| Path | Purpose | Owner | Last Updated | Referenced-by | Canonical | Action | Risk |
|------|---------|-------|--------------|---------------|-----------|--------|------|
| docs/ux/AKIS_CURSOR_UI_MASTER_PLAN.md | Cursor-inspired UI master plan | Yasir | — | NEXT | Yes | Keep | Low |
| docs/ux/AKIS_LIQUID_NEON_LAYER.md | Liquid Neon background spec | Yasir | — | NEXT | Yes | Keep | Low |
| docs/ux/CURSOR_REFERENCE_NOTES.md | Cursor reference for UI | Yasir | — | NEXT | No | Keep | Low |
| docs/ux/SCRIBE_SINGLE_PAGE_CONSOLE.md | Scribe console UI design | Yasir | — | — | No | Keep | Low |

---

## 8. Future Plans (docs/plans/)

| Path | Purpose | Owner | Last Updated | Referenced-by | Canonical | Action | Risk |
|------|---------|-------|--------------|---------------|-----------|--------|------|
| docs/plans/PHASE4_5_FUTURE_BETS_CONCEPT.md | Phase 4-5 concept memo | — | — | NEXT | No | Keep | Low |
| docs/plans/FUTURE_PROPOSALS_PHASE4_5.md | Phase 4-5 proposals | — | — | NEXT | No | Keep | Low |

---

## 9. Academic Documentation (docs/academic/)

| Path | Purpose | Owner | Last Updated | Referenced-by | Canonical | Action | Risk |
|------|---------|-------|--------------|---------------|-----------|--------|------|
| docs/academic/00-README.md | Academic docs index | Ayşe | — | — | No | Keep | Low |
| docs/academic/00-README 2.md | Duplicate README | — | — | — | No | Delete | Low |
| docs/academic/SDTA_TECHNICAL_SNAPSHOT.md | SDTA technical snapshot | Ayşe | — | — | No | Keep | Low |
| docs/academic/03-sdta/SDTA_D2_solution_design_technical_analysis.md | SDTA document (Turkish) | Ayşe | — | — | Yes | Keep | Low |

---

## 10. Archive (docs/archive/)

| Path | Purpose | Owner | Last Updated | Referenced-by | Canonical | Action | Risk |
|------|---------|-------|--------------|---------------|-----------|--------|------|
| docs/archive/README.md | Archive index | — | 2025-12-18 | — | No | Keep | Low |
| docs/archive/backend-project-deep-audit-report.md | Backend audit report | — | 2025-12-04 | — | No | Keep | Low |
| docs/archive/repository-docs-audit.md | Docs audit report | — | 2025-12-18 | — | No | Keep | Low |
| docs/archive/repository-docs-cleanup-log.md | Docs cleanup log | — | 2025-12-18 | — | No | Keep | Low |
| docs/archive/DEV_COOKIE_VERIFICATION.md | Cookie verification notes | — | 2025-12-18 | — | No | Keep | Low |
| docs/archive/deprecated/AUTH_GITHUB_INTEGRATION.md | Old GitHub auth | — | 2025-12-18 | — | No | Keep | Low |
| docs/archive/phase-9-2/PHASE_9_2_BRAND_MIGRATION_NOTES.md | Phase 9.2 notes | — | 2025-12-18 | — | No | Keep | Low |
| docs/archive/phase-9-2/QA_EVIDENCE_PHASE_9_2_BRAND.md | Phase 9.2 QA | — | 2025-12-18 | — | No | Keep | Low |
| docs/archive/qa-notes/QA_NOTES_AUTH_S0.4.4.md | Auth QA notes | — | 2025-12-18 | — | No | Keep | Low |
| docs/archive/qa-notes/QA_NOTES_S0.4.2_OAUTH.md | OAuth QA notes | — | 2025-12-18 | — | No | Keep | Low |

---

## 11. Releases & Reports

| Path | Purpose | Owner | Last Updated | Referenced-by | Canonical | Action | Risk |
|------|---------|-------|--------------|---------------|-----------|--------|------|
| docs/releases/2025-11-26-logout-fix-summary.md | Logout fix release | — | — | — | No | Keep | Low |
| docs/releases/2025-11-26-logout-release-summary.md | Release summary | — | — | — | No | Keep | Low |
| docs/reports/STAGING_READINESS_REPO_AUDIT.md | Staging readiness audit | — | — | — | No | Keep | Low |

---

## 12. Miscellaneous QA Evidence (docs/ root)

| Path | Purpose | Owner | Last Updated | Referenced-by | Canonical | Action | Risk |
|------|---------|-------|--------------|---------------|-----------|--------|------|
| docs/QA_EVIDENCE.md | General QA evidence | — | — | — | No | Keep | Low |
| docs/QA_SCRIBE_S0.4.6_MANUAL.md | Manual QA for S0.4.6 | — | — | — | No | Keep | Low |
| docs/QA_SCRIBE_AUTOMATION.md | Scribe automation QA | — | — | — | No | Keep | Low |
| docs/QA_TEST_AUTOMATION_HANDOFF.md | QA automation handoff | — | — | — | No | Keep | Low |
| docs/QA_EVIDENCE_PR127_FRONTEND_GATE_FIX.md | PR127 evidence | — | — | — | No | Archive | Low |
| docs/QA_EVIDENCE_FRONTEND_IMPORTS.md | Frontend imports evidence | — | — | — | No | Archive | Low |
| docs/QA_EVIDENCE_MERGE_GATE_DB_TESTS.md | Merge gate DB tests | — | — | — | No | Archive | Low |
| docs/QA_EVIDENCE_PHASE2_DB_DETERMINISM.md | Phase 2 DB determinism | — | — | — | No | Keep | Low |

---

## 13. Local Development

| Path | Purpose | Owner | Last Updated | Referenced-by | Canonical | Action | Risk |
|------|---------|-------|--------------|---------------|-----------|--------|------|
| docs/local-dev/LOCAL_DEV_QUICKSTART.md | Quick start guide | — | — | — | Yes | Keep | Low |

---

## 14. Missing Directories (Created This Session)

| Directory | Purpose | Status |
|-----------|---------|--------|
| docs/ops/ | Operational documentation | Created (empty) |
| docs/ai/ | AI strategy documentation | Created (empty) |

---

## 15. Inventory Summary

| Category | File Count | Canonical | Action: Keep | Action: Update | Action: Archive | Action: Delete |
|----------|------------|-----------|--------------|----------------|-----------------|----------------|
| Planning Chain | 3 | 3 | 1 | 2 | 0 | 0 |
| Context (.cursor) | 4 | 3 | 1 | 3 | 0 | 0 |
| Backend Docs | 4 | 3 | 3 | 0 | 1 | 0 |
| Core Docs | 20+ | 12 | 18 | 2 | 0 | 0 |
| QA Docs | 10 | 4 | 9 | 0 | 1 | 0 |
| UX Docs | 4 | 2 | 4 | 0 | 0 | 0 |
| Plans | 2 | 0 | 2 | 0 | 0 | 0 |
| Academic | 4 | 1 | 3 | 0 | 0 | 1 |
| Archive | 10 | 0 | 10 | 0 | 0 | 0 |
| Releases/Reports | 3 | 0 | 3 | 0 | 0 | 0 |
| Root QA Evidence | 8 | 0 | 5 | 0 | 3 | 0 |
| Local Dev | 1 | 1 | 1 | 0 | 0 | 0 |
| **TOTAL** | **73+** | **29** | **60** | **7** | **5** | **1** |

---

## 16. Critical Actions Required

### Priority 0 (Blocking)
1. **Resolve CONFLICT #1:** S0.4.6 completion status divergence
2. **Resolve CONFLICT #2:** Current phase/sprint disagreement (0.4 vs 2)
3. **Update stale docs:** PROJECT_TRACKING_BASELINE.md (41 days), ROADMAP.md (32 days)

### Priority 1 (High)
4. Update CONTEXT_ARCHITECTURE.md (47 days stale)
5. Update CONTEXT_SCOPE.md to reflect agent reality

### Priority 2 (Medium)
6. Archive old QA evidence files to docs/archive/qa-evidence/
7. Delete duplicate file: docs/academic/00-README 2.md

---

*This baseline was generated programmatically from git history and file inspection. All dates and references verified as of 2026-01-28.*
