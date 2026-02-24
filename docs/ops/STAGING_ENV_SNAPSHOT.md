# Staging Env Snapshot Guardrails

## Source of Truth

- Staging runtime env file lives on the VM at `/opt/akis/.env`.
- This file may contain production-like secrets and must never be committed.

## Safe Refresh Procedure

1. Fetch the file over SSH to local gitignored storage only:
   - `.secrets/staging.env.snapshot`
2. Enforce restrictive permissions:
   - directory: `chmod 700 .secrets`
   - snapshot file: `chmod 600 .secrets/staging.env.snapshot`
3. Validate with redacted output only (variable names and masked metadata, never raw values).

## Usage Guidance

- Snapshot is reference material for ops troubleshooting and env parity checks.
- Local development should keep separate local secrets by default.
- Copying staging secrets into tracked templates or committed files is forbidden.

## Tag Cleanup Note

Date: 2026-02-24

Removed temporary tags during cleanup:

- `snapshot-local-codex-docs-m2-closure-sync-2026-02-16-20260224-193858`
- `snapshot-local-feat-S0.5-platform-polish-20260224-193858`
- `snapshot-remote-codex-docs-m2-closure-sync-2026-02-16-20260224-193848`
- `snapshot/20251110-234031-main`
- `snapshot/20251111-004911-phase10-baseline`
- `snapshot/20251111-004929-phase10-baseline`
- `archive/pre-scope-cleanup-20260224-1821`
- `phase-8.1-obs+spa`
- `phase-9.1`
- `safe-merge-poc-7ad6f6a`
- `safe-pre-prune-d85b841`
