## Task ID

<!-- REQUIRED: Link to the task from NEXT.md / WBS -->
<!-- Format: S0.5.X-XXX-N (e.g., S0.5.0-OPS-1) -->
**Task:** S0.5.X-XXX-N

## Why

<!-- Explain the motivation and context for this change. -->

## What Changed

### Code Changes
- 
- 

### Documentation Changes
- 
- 

## Test / Verification Evidence

<!-- Provide evidence that changes work as intended. -->

### Static Checks
- [ ] `pnpm -r typecheck`
- [ ] `pnpm -r lint`
- [ ] `pnpm -r test`
- [ ] `pnpm -r build`

### Manual Verification
- [ ] Verified locally (describe steps)
- [ ] No `localhost` references in production/staging build (if FE change)

## Deployment Notes

<!-- If this PR affects staging/prod deployment, describe what needs to happen. -->
<!-- Write "N/A" if no deployment impact. -->

## Docs Updates

<!-- Did you update NEXT.md task status? ROADMAP.md milestone status? -->
- [ ] `docs/NEXT.md` task status updated (if milestone/status changed)
- [ ] `docs/ROADMAP.md` updated (if milestone changed)

---

## Checklist

- [ ] Branch name follows convention (`feat/`, `fix/`, `chore/`, `docs/` + task ID)
- [ ] Commits follow Conventional Commits (`feat|fix|chore|docs(scope): message`)
- [ ] No secrets committed (`.env` files, API keys, tokens)
- [ ] PR is focused and reviewable (target: ≤300 LoC)
- [ ] Squash & Merge when ready

## Linked Issues

Closes #ISSUE_ID
