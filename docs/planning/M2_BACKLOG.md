# M2 Backlog — Stabilization & Academic Preparation

> **Milestone:** M2 (1-31 March 2026)
> **Status:** Not Started
> **Parent:** [DELIVERY_PLAN_S0.5_FEB_TO_GRADUATION.md](DELIVERY_PLAN_S0.5_FEB_TO_GRADUATION.md)

---

## Carried Forward from S0.5 (TODO(M2) Items)

| ID | Area | Description | Source File | Priority |
|----|------|-------------|-------------|----------|
| M2-SEC-1 | Security | Encrypt integration tokens at rest (similar to AI key AES-256-GCM) | `backend/src/api/integrations.ts:225` | High |
| M2-ORCH-1 | Orchestrator | Implement full execution continuation after approval (PR-1 Phase 2) | `backend/src/core/orchestrator/AgentOrchestrator.ts:1378` | Medium |
| M2-PLAY-1 | Agent Playbook | Implement retry logic for retryable playbook steps | `backend/src/core/contracts/AgentPlaybook.ts:47` | Medium |
| M2-UI-1 | Frontend | Plan upgrades and managed key allocation for AI providers page | `frontend/src/pages/dashboard/settings/DashboardSettingsAiProvidersPage.tsx:57` | Low |

---

## New M2 Tasks

### Stability & Bug Fixes

| ID | Description | Priority |
|----|-------------|----------|
| M2-QA-1 | Triage and fix P0/P1 bugs from pilot feedback | High |
| M2-QA-2 | Re-run Codex M1 QA with valid auth session (Phase 2/3 were blocked by 401) | High |
| M2-QA-3 | Complete all manual checks in REGRESSION_CHECKLIST (sections 3-7, 10) | Medium |

### RAG / Knowledge System

| ID | Description | Priority |
|----|-------------|----------|
| M2-RAG-1 | Evaluate pg_trgm full-text search for repo content retrieval | Medium |
| M2-RAG-2 | Create `knowledge_chunks` table + pg_trgm index if evaluation positive | Medium |
| M2-RAG-3 | Basic retrieval endpoint for agent context augmentation | Low |

### Test Coverage Expansion

| ID | Description | Priority |
|----|-------------|----------|
| M2-TEST-1 | Atlassian service tests (Jira/Confluence MCP adapters) | Medium |
| M2-TEST-2 | Frontend test coverage for remaining untested pages (auth, settings, smart automations) | Low |
| M2-TEST-3 | Integration tests for studio API routes | Low |

### Academic / Thesis

| ID | Description | Priority |
|----|-------------|----------|
| M2-THESIS-1 | Thesis outline: Introduction + Literature + Method chapters | High |
| M2-THESIS-2 | Demo video recording (5-10 minutes, staging walkthrough) | High |
| M2-THESIS-3 | Expand literature reviews with empirical data from M1 pilot | Medium |

### Infrastructure

| ID | Description | Priority |
|----|-------------|----------|
| M2-OPS-1 | MCP Gateway Docker image in CI/CD pipeline | Medium |
| M2-OPS-2 | Staging deploy after docs-final-sync PR merge | High |
| M2-OPS-3 | Performance profiling of agent execution on OCI Free Tier | Low |

---

## Definition of Done (M2)

- [ ] Pilot feedback triaged into GitHub Issues
- [ ] P0/P1 bugs at zero
- [ ] Golden path success rate >= 90%
- [ ] pg_trgm retrieval prototype (optional, time-dependent)
- [ ] Thesis outline: intro + literature + method chapters
- [ ] Demo video recorded (5-10 min)

---

*This backlog is derived from code TODOs, test audit gaps, and DELIVERY_PLAN M2 criteria.*
