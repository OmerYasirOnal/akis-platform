# AKIS Platform — Scope Guardrails (Canonical)

Last updated: 2026-02-24

## Active Scope (S0.5)

- Active agents: Scribe, Trace, Proto.
- Runtime architecture: Fastify + Drizzle + React/Vite (single deployable backend).
- Staging source of truth: `docs/deploy/OCI_STAGING_RUNBOOK.md`.

## Documentation Policy

1. Do not create new documentation files unless Yasir explicitly asks.
2. When docs must change, update only canonical SSOT files:
   - `README.md`
   - `docs/NEXT.md`
   - `docs/ROADMAP.md`
   - `docs/ENV_SETUP.md`
   - `docs/TESTING.md`
   - `docs/API_SPEC.md`
   - `docs/UI_DESIGN_SYSTEM.md`
   - `docs/WEB_INFORMATION_ARCHITECTURE.md`
   - `docs/deploy/OCI_STAGING_RUNBOOK.md`
   - `docs/deploy/STAGING_ROLLBACK_RUNBOOK.md`
   - `docs/release/STAGING_RELEASE_CHECKLIST.md`
   - `docs/ops/STAGING_SMOKE_CHECKLIST.md`
   - `docs/ops/STAGING_ENV_SNAPSHOT.md`
   - `docs/agents/AGENT_CONTRACTS_S0.5.md`
   - `backend/docs/AGENT_WORKFLOWS.md`
   - `backend/docs/API_SPEC.md`
   - `backend/docs/Auth.md`
3. Do not create planning, audit, report, prompt, or personal docs inside this repository.
4. Keep non-canonical materials in local or external vault storage outside the repository.
