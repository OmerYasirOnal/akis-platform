# AKIS M2 Playbook Evidence Matrix

> Last updated: 2026-02-15  
> Scope: M2 reliability wave (`contract enforcement`, `determinism`, `verification gates`, `freshness`, `MCP boundary`, `trust UI`, `rollout`, `traceability`)

Bu dosya, PDF’deki claim/evidence kararlarını doğrudan kod ve ölçüm noktalarına bağlar.

| Claim | Evidence | AKIS Kararı | Kod Etki Noktası | Metrik | Risk |
|---|---|---|---|---|---|
| Agent input/output contract runtime’da zorunlu doğrulanmalı | Runtime schema validation + structured contract violation patterns (engineering best practice) | Orchestrator pre/post execution contract kontrolü, rollout flag ile `observe/enforce`; output ihlalinde opsiyonel `retry_once` normalize-retry | `backend/src/core/contracts/AgentContract.ts`, `backend/src/core/orchestrator/AgentOrchestrator.ts`, `backend/src/core/errors.ts` | `contract_compliance_rate`, `contract_violation_count` | False-positive bloklama |
| Planlama deterministic olmalı (default) | Low-temperature + seed kullanımının replay stabilitesini artırması | `AI_FORCE_DETERMINISTIC_PLAN=true` default, plan adımı deterministic profile | `backend/src/services/ai/AIService.ts`, `backend/src/config/env.ts` | `reproducibility_rate`, `golden_path_drift_rate` | Yaratıcılık kaybı (override ile dengelenir) |
| Verification gates kademeli enforce edilmeli | Observe-first rollout stratejisi operasyonel riski azaltır | `observe -> warn -> enforce_scribe -> enforce_all` policy | `backend/src/services/knowledge/verification/VerificationGateEngine.ts`, `backend/src/core/orchestrator/AgentOrchestrator.ts` | `gate_pass_rate`, `false_block_rate` | Erken enforce sırasında yanlış blok |
| Agent risk seviyesine göre gate strictness değişmeli | Risk-based policy models | Scribe strict, Trace standard, Proto relaxed profile | `backend/src/config/agentRiskProfiles.ts`, `backend/src/services/knowledge/verification/AgentVerificationService.ts` | `violation_frequency_by_agent` | Düşük risk profili altında kalite düşüşü |
| Freshness sinyali DB-temelli scheduler ile işletilmeli | Scheduled staleness detection reduces stale knowledge use | Due-source scan + `staleAt/nextFetchAt/verificationStatus` update + admin status endpoint | `backend/src/services/knowledge/FreshnessScheduler.ts`, `backend/src/server.app.ts`, `backend/src/api/knowledge.ts` | `stale_source_ratio`, `freshness_score_distribution` | External source/mcp failures |
| Vendor çağrıları tek boundary katmanında toplanmalı | Adapter/gateway isolation, anti-leak logging | `integrations.ts` içindeki vendor fetch’ler `McpGateway` üzerinden çağrılır | `backend/src/services/mcp/McpGateway.ts`, `backend/src/api/integrations.ts` | `mcp_call_success_rate`, `unauthorized_attempts`, `retry_count` | Gateway timeout/retry tuning |
| UI trust sinyalleri backend gate semantiğiyle birebir hizalanmalı | Trust calibration literature: explainability + confidence cues | Job detail + Agents hub’da citation/confidence/freshness + blocked state görünürlüğü | `frontend/src/pages/JobDetailPage.tsx`, `frontend/src/pages/dashboard/agents/AgentsHubPage.tsx`, `frontend/src/services/api/types.ts` | `trust_calibration_score`, `user_override_rate` | Trustwashing (metin/sinyal uyumsuzluğu) |
| Rollback canary threshold’ları açık runbook ile yönetilmeli | Progressive rollout + error budget gating | `%10 -> %50 -> %100` deterministic cohort rollout (`RELIABILITY_CANARY_*`) + env rollback switch | `backend/src/core/orchestrator/ReliabilityRollout.ts`, `docs/deploy/STAGING_ROLLBACK_RUNBOOK.md`, `docs/release/STAGING_RELEASE_CHECKLIST.md`, `docs/qa/REGRESSION_CHECKLIST.md` | `rollback_frequency`, `error_budget_breach_count` | Doküman drift / operasyonel gecikme |

## Traceability Mapping

- Literature/PDF claims -> this matrix row  
- Matrix row -> code files above  
- Code -> tests:
  - `backend/test/unit/agent-contracts-runtime.test.ts`
  - `backend/test/unit/verification-gates-rollout.test.ts`
  - `backend/test/unit/reliability-rollout.test.ts`
  - `backend/test/unit/freshness-scheduler.test.ts`
  - `backend/test/integration/integrations-mcp-boundary.test.ts`
  - `frontend/src/pages/__tests__/JobDetailPage.test.tsx`
