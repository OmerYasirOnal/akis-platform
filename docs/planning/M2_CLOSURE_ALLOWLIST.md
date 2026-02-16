# M2 Closure Allowlist (Scope Freeze)

Bu dosya, `M2 Core + Closure` turunda değişmesine izin verilen dosya setini sabitler.

## PR-1 — M2-SEC-1 OAuth Token Encryption

- `backend/src/services/auth/OAuthTokenCrypto.ts`
- `backend/src/api/integrations.ts`
- `backend/src/api/auth.oauth.ts`
- `backend/src/core/orchestrator/AgentOrchestrator.ts`
- `backend/test/unit/oauth-token-crypto.test.ts`
- `backend/test/unit/integrations-api.test.ts`

## PR-2 — M2-ORCH-1 Approval Continuation

- `backend/src/api/agents.ts`
- `backend/src/core/orchestrator/AgentOrchestrator.ts`
- `backend/test/integration/agents-approval-flow.test.ts`
- `backend/test/unit/agents-validation.test.ts`

## PR-3 — M2-PLAY-1 Playbook Retry

- `backend/src/core/contracts/AgentPlaybook.ts`
- `backend/test/unit/agent-playbook-retry.test.ts`

## PR-4 — Docs / Governance Sync

- `docs/planning/M2_BACKLOG.md`
- `docs/planning/M2_CLOSURE_ALLOWLIST.md`
- `docs/ENV_SETUP.md`
- `backend/.env.example`
- `scripts/check_docs_references.mjs`

## Scope Dışı Kuralı

- Bu listedeki dosyalar dışında değişiklik taşınmaz.
- Scope dışı iyileştirmeler ayrı PR’a ayrılır.
