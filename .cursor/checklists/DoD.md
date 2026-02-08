---
description: "Definition of Done — AKIS"
---

## Code
- [ ] TS **strict** clean; `pnpm -r typecheck` passes.
- [ ] Lint clean; `pnpm -r lint` passes (warnings OK, errors NO).
- [ ] Build clean; `pnpm -r build` succeeds, no artifacts committed.

## Test
- [ ] Frontend vitest: test(s) for new/affected components.
- [ ] Backend: at least 1 **fastify.inject** test per new route.
- [ ] CI `pnpm -r test` green; if no backend tests, log shows "no tests – skipping".

## Security
- [ ] `helmet`, `cors`, `rate-limit` registered.
- [ ] Secrets in `.env` only; **.env.example** updated.
- [ ] No tokens/passwords in logs; requestId attached.

## Documentation
- [ ] `docs/NEXT.md` task status updated (if milestone/status changed).
- [ ] `.env.example` and `docs/ENV_SETUP.md` current.

## PR Hygiene
- [ ] Single topic; small PR (≤ 300 LoC); **Conventional Commit** title.
- [ ] Screenshot/log evidence included.
- [ ] Branch is not `main` (feature/fix/chore branch only).
- [ ] **GitHub issue linked** via `Closes #123` or `Fixes #123` in PR description.
- [ ] Issue status set to `status:In Progress` when PR opened.
- [ ] **Issue closed** (auto via closing keyword or manually) when PR merged.
- [ ] Issue label `status:Done` applied before/at close time.

## Staging Pilot (S0.5 — when deploying to staging)
> Canonical DoD: `docs/NEXT.md` § M1 Definition of Done.
> Smoke test checklist: `docs/deploy/STAGING_SMOKE_TEST_CHECKLIST.md`.

- [ ] No `localhost` references in staging build (`grep -r localhost dist/` returns 0 runtime hits).
- [ ] `/health`, `/ready`, `/version` return 200.
- [ ] Email/password auth works on staging domain.
- [ ] OAuth redirects use staging domain (not localhost).
