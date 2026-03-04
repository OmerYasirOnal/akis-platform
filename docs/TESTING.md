# Test Rehberi (Canonical)

## Zorunlu Kalite Kapıları

Reponun kökünden çalıştırın:

```bash
pnpm -r typecheck
pnpm -r lint
pnpm -r build
pnpm -r test
```

## Paket Bazlı Komutlar

### Backend

```bash
pnpm -C backend test
```

### Frontend

```bash
pnpm -C frontend test
```

## Staging Doğrulama

- Release process: `docs/release/STAGING_RELEASE_CHECKLIST.md`
- Smoke checks: `docs/ops/STAGING_SMOKE_CHECKLIST.md`
- Rollback steps: `docs/deploy/STAGING_ROLLBACK_RUNBOOK.md`
