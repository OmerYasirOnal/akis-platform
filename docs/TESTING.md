# Testing Guide (Canonical)

## Required Quality Gates

Run these from repository root:

```bash
pnpm -r typecheck
pnpm -r lint
pnpm -r build
pnpm -r test
```

## Package-Level Commands

### Backend

```bash
pnpm -C backend test
```

### Frontend

```bash
pnpm -C frontend test
```

## Staging Verification

- Release process: `docs/release/STAGING_RELEASE_CHECKLIST.md`
- Smoke checks: `docs/ops/STAGING_SMOKE_CHECKLIST.md`
- Rollback steps: `docs/deploy/STAGING_ROLLBACK_RUNBOOK.md`
