# M2 Reliability PR Slices (Reviewable Delivery)

> Updated: 2026-02-15  
> Branch: `codex/feat-m2-reliability-wave1`

Bu doküman, M2 reliability değişikliklerini küçük ve reviewable PR’lara bölmek için teslim stratejisidir.

## PR-1 — Contracts + Determinism + Verification Rollout (P0)

**Goal**
- Contract enforcement runtime’a zorunlu bağlansın.
- Deterministic planning force aktif olsun.
- Gate rollout policy (`observe|warn|enforce_scribe|enforce_all`) orkestratöre işlensin.

**Files**
- `backend/src/core/contracts/AgentContract.ts`
- `backend/src/core/orchestrator/AgentOrchestrator.ts`
- `backend/src/core/errors.ts`
- `backend/src/services/ai/AIService.ts`
- `backend/src/services/knowledge/verification/VerificationGateEngine.ts`
- `backend/src/api/agents.ts`
- `backend/src/config/env.ts`
- `backend/.env.example`
- `backend/test/unit/agent-contracts-runtime.test.ts`
- `backend/test/unit/verification-gates-rollout.test.ts`
- `backend/test/unit/prompt-determinism.test.ts`
- `docs/ENV_SETUP.md`

**Checks**
- Backend typecheck
- Contract + rollout + determinism unit tests

## PR-2 — Freshness + MCP Boundary (P0/P1)

**Goal**
- FreshnessScheduler prod bootstrap + admin gözlem endpointleri.
- Integrations vendor call’ları MCP gateway boundary’ye taşınsın.

**Files**
- `backend/src/services/knowledge/FreshnessScheduler.ts`
- `backend/src/server.app.ts`
- `backend/src/api/knowledge.ts`
- `backend/src/services/mcp/McpGateway.ts`
- `backend/src/api/integrations.ts`
- `backend/test/unit/freshness-scheduler.test.ts`
- `backend/test/integration/integrations-mcp-boundary.test.ts`
- `backend/.env.example`
- `docs/ENV_SETUP.md`

**Checks**
- Backend typecheck
- Freshness + MCP boundary tests

## PR-3 — Trust UI + Docs/Runbooks + Evidence (P1)

**Goal**
- Job detail / Agents hub trust signals backend gate semantiğiyle eşleşsin.
- i18n parity kapansın.
- NEXT/ROADMAP/runbook/evidence docs güncel olsun.

**Files**
- `frontend/src/pages/JobDetailPage.tsx`
- `frontend/src/pages/dashboard/agents/AgentsHubPage.tsx`
- `frontend/src/services/api/types.ts`
- `frontend/src/services/api/agents.ts`
- `frontend/src/pages/__tests__/JobDetailPage.test.tsx`
- `frontend/src/i18n/locales/en.json`
- `frontend/src/i18n/locales/tr.json`
- `docs/research/PLAYBOOK_EVIDENCE_MATRIX.md`
- `docs/planning/PLAYBOOK_IMPLEMENTATION_MAP.md`
- `docs/NEXT.md`
- `docs/ROADMAP.md`
- `docs/release/STAGING_RELEASE_CHECKLIST.md`
- `docs/deploy/STAGING_ROLLBACK_RUNBOOK.md`
- `docs/qa/REGRESSION_CHECKLIST.md`

**Checks**
- Frontend typecheck
- Frontend trust panel test
- Docs link/consistency spot-check

## Merge Order
1. PR-1
2. PR-2
3. PR-3

## Rollback Rule
- Her PR bağımsız rollback edilebilir olmalı.
- Runtime rollback için ilk aksiyon: feature flags (`observe` mode) + backend restart.
