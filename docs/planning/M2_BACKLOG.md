# M2 Backlog — Stabilization & Academic Preparation

> **Milestone:** M2 (1-31 March 2026)
> **Status:** In Progress (M2 Core + Closure active)
> **Last Updated:** 2026-02-16
> **Parent:** [DELIVERY_PLAN_S0.5_FEB_TO_GRADUATION.md](DELIVERY_PLAN_S0.5_FEB_TO_GRADUATION.md)

---

## Carried Forward from S0.5 (TODO(M2) Items)

| ID | Area | Description | Source File | Priority | Status |
|----|------|-------------|-------------|----------|--------|
| M2-SEC-1 | Security | Encrypt integration tokens at rest (strict-block write when encryption key is missing, legacy plaintext read fallback) | `backend/src/api/integrations.ts` | High | Tamamlandı (2026-02-16) |
| M2-ORCH-1 | Orchestrator | Implement full execution continuation after approval (`requiresApproval` opt-in, placeholder result kaldırıldı) | `backend/src/core/orchestrator/AgentOrchestrator.ts` | Medium | Tamamlandı (2026-02-16) |
| M2-PLAY-1 | Agent Playbook | Implement deterministic retry logic for retryable playbook steps (default retry=1) | `backend/src/core/contracts/AgentPlaybook.ts` | Medium | Tamamlandı (2026-02-16) |
| M2-UI-1 | Frontend | Plan upgrades and managed key allocation for AI providers page | `frontend/src/pages/dashboard/settings/DashboardSettingsAiProvidersPage.tsx` | Low | Başlanmadı |

---

## New M2 Tasks

### Stability & Bug Fixes

| ID | Description | Priority | Status |
|----|-------------|----------|--------|
| M2-QA-1 | Triage and fix P0/P1 bugs from pilot feedback | High | Devam Ediyor |
| M2-QA-2 | Re-run Codex M1 QA with valid auth session (Phase 2/3 were blocked by 401) | High | Kısmi Tamamlandı (2026-02-16: manual UI smoke + staging E2E + fallback test gates; real authenticated full mutation turu açık) |
| M2-QA-3 | Complete all manual checks in REGRESSION_CHECKLIST (sections 3-7, 10) | Medium | Devam Ediyor |

### RAG / Knowledge System

| ID | Description | Priority | Status |
|----|-------------|----------|--------|
| M2-RAG-1 | Evaluate pg_trgm full-text search for repo content retrieval | Medium | Başlanmadı |
| M2-RAG-2 | Create `knowledge_chunks` table + pg_trgm index if evaluation positive | Medium | Kapsam Dışı (bu closure turunda yeni DB migration yok) |
| M2-RAG-3 | Basic retrieval endpoint for agent context augmentation | Low | Tamamlandı (2026-02-16, hybrid retrieval path aktif) |

### Test Coverage Expansion

| ID | Description | Priority | Status |
|----|-------------|----------|--------|
| M2-TEST-1 | Atlassian service tests (Jira/Confluence MCP adapters) | Medium | Başlanmadı |
| M2-TEST-2 | Frontend test coverage for remaining untested pages (auth, settings, smart automations) | Low | Kısmi Tamamlandı (2026-02-16: UI M2 pack 50/50 PASS, Agents Hub E2E eklendi) |
| M2-TEST-3 | Integration tests for studio API routes | Low | Başlanmadı |

### Academic / Thesis

| ID | Description | Priority | Status |
|----|-------------|----------|--------|
| M2-THESIS-1 | Thesis outline: Introduction + Literature + Method chapters | High | Devam Ediyor |
| M2-THESIS-2 | Demo video recording (5-10 minutes, staging walkthrough) | High | Başlanmadı |
| M2-THESIS-3 | Expand literature reviews with empirical data from M1 pilot | Medium | Devam Ediyor |

### Infrastructure

| ID | Description | Priority | Status |
|----|-------------|----------|--------|
| M2-OPS-1 | MCP Gateway Docker image in CI/CD pipeline | Medium | Tamamlandı (PR #266) |
| M2-OPS-2 | Staging deploy after docs-final-sync PR merge | High | Tamamlandı (`ee5041f`, smoke + UI evidence 2026-02-16) |
| M2-OPS-3 | Performance profiling of agent execution on OCI Free Tier | Low | Devam Ediyor |

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
