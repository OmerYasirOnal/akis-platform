# Evidence: S0.4.6 Baseline Snapshot

**Date**: 2025-12-18  
**Branch**: `fix/scribe-github-only-and-job-run-s0.4.6`

---

## Git Status

```
On branch fix/scribe-github-only-and-job-run-s0.4.6

Changes not staged for commit:
  - .cursor/plans/scribe_github_only_fix_plan.md
  - backend/migrations/meta/_journal.json
  - backend/src/utils/auth.ts
  - docs/IMPLEMENTATION_REPORT_SCRIBE_FIX.md
  - docs/MINIMUM_FIX_PLAN_SCRIBE_VALIDATION.md
  - docs/PR_DESCRIPTION_SCRIBE_FIX.md
  - docs/QA_SCRIBE_S0.4.6_MANUAL.md
  - docs/TRACE_MAP_SCRIBE_JOB_VALIDATION_BUG.md

Untracked files:
  - backend/migrations/0008_fearless_harpoon.sql
  - backend/migrations/0009_aspiring_prowler.sql
  - backend/migrations/meta/0008_snapshot.json
  - backend/migrations/meta/0009_snapshot.json
  - backend/src/api/agent-configs.ts
  - backend/src/api/integrations.ts
```

## Git Log (Last 15 Commits)

```
83d06c4 (HEAD) docs: add implementation summary and final PR description
4379ea3 docs(scribe): add implementation artifacts and QA evidence
5d99537 feat(scribe): enable GitHub-only mode with config-aware job creation
898fcfa fix(backend): resolve NODE_ENV parsing and schema mismatch
339c681 (origin/main) docs: canonicalize planning docs + resolve auth conflicts (S0.4.6)
0860cdc S0.4.2: Finalize OAuth onboarding + i18n stability (#93)
e997a6f Merge pull request #92 from OmerYasirOnal/feat/auth-oauth-config-S0.4.2
225a22e fix(auth): correct GitHub OAuth email verification logic
5546df3 fix(auth): close OAuth state token and unverified email race conditions
0966e2b fix(auth): enforce OAuth state TTL during callback validation
cc28458 fix(auth): add OAuth concurrency safety and email verification policy alignment
d7c63da chore(auth): remove unused sanitizeUser placeholder
fdbd47d fix(auth): add fallback for missing name in Google OAuth profile
63bb125 fix(auth): validate pending_verification status in OAuth flow
0b98112 fix(auth): URL-encode OAuth error parameter in redirect
```

## Diff Stats (vs origin/main)

```
18 files changed, 5705 insertions(+), 50 deletions(-)

Key files:
- backend/src/api/agents.ts                          |  132 +/-
- backend/src/db/schema.ts                           |   64 +/-
- backend/src/utils/auth.ts                          |   52 +
- backend/test/integration/scribe-config-aware.test.ts |  218 +
- frontend/src/components/common/SearchableSelect.tsx |  248 +
- frontend/src/pages/dashboard/agents/DashboardAgentScribePage.tsx | 1123 +/-
- frontend/src/services/api/agent-configs.ts         |  163 +
- frontend/src/services/api/github-discovery.ts      |   92 +
```

## Notes

- Branch is 4 commits ahead of origin/main
- Some files modified but not staged (documentation updates)
- New migration files present but not committed
- New API files (agent-configs.ts, integrations.ts) present but not committed

