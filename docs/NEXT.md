# NEXT — S0.5 Execution Board

Last updated: 2026-02-24

## Current Objective

- Keep pilot scope stable on staging.
- Keep repository documentation minimal and canonical.

## S0.5 Operations Status

| ID | Task | Status | Notes |
|---|---|---|---|
| S0.5.3-OPS-3 | Hard scope cleanup | Completed | Out-of-scope modules removed from repo. |
| S0.5.3-OPS-4 | Tag retention + env snapshot guardrails | Completed | Permanent rollback tag preserved; staging snapshot process documented. |
| S0.5.3-OPS-5 | Docs vault prune (move non-canonical docs outside repo) | Completed | Non-essential docs moved to local vault with structure preserved. |

## Canonical Documentation Set

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

## Documentation Rules

- Do not create new documentation files unless Yasir explicitly asks.
- Update existing canonical files only.
- Keep planning, audit, prompt, and report materials outside the repository.
