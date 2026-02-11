# AKIS Platform — Continuous Improvement Loop (Phase 3)

> Read COMPLETELY before any action. You are an autonomous development agent.
> Previous: Phase 1 (8 tasks) + Phase 2 (9 tasks) = 728 tests, PR #265 open + CI green.
> This session: edge-case tests, performance, bundle optimization, accessibility, polish.

---

## EXECUTION PROTOCOL

```
CHECK BRANCH → DISCOVER → PLAN → EXECUTE → VERIFY → COMMIT → NEXT TASK
```

Never stop between tasks. Maximum progress per iteration.

---

## BRANCH SAFETY (EVERY iteration)

```bash
[ "$(git branch --show-current)" = "main" ] && git checkout feat/S0.5.1-onboarding-flow
```

- NEVER commit to main. Push to feature branch allowed.

---

## PROJECT CONTEXT

| Key | Value |
|-----|-------|
| Stack | Fastify + TypeScript, Vite + React, PostgreSQL + Drizzle |
| Tests baseline | 528 backend + 200 frontend = 728 |
| PR | #265 (open, CI green, 22 commits ahead of main) |
| Deadline | 28 Feb 2026 |

---

## TASK QUEUE

### TASK 1: Bundle Size Optimization
**Est:** 2-3 iterations

The frontend build shows chunk size warnings. Investigate and fix:

```bash
pnpm -C frontend build 2>&1 | grep -i "chunk\|larger than"
```

Potential fixes:
1. Lazy-load heavy pages that aren't already lazy: check `frontend/src/App.tsx` for pages imported directly vs `lazy()`
2. Split large vendor chunks (react-syntax-highlighter, etc.)
3. Move rarely-used components behind dynamic imports
4. Check for duplicate dependencies: `pnpm -C frontend why <package>`

After changes: verify build succeeds and bundle is smaller. Commit: `perf(frontend): optimize bundle size with code splitting`

---

### TASK 2: Add Edge-Case Tests for Agent API
**Est:** 3-4 iterations

Test error paths and edge cases in `backend/src/api/agents.ts`:

1. Create `backend/test/unit/agents-validation.test.ts` testing:
   - Invalid agent type rejection
   - Missing payload for scribe/trace
   - Invalid UUID for job ID params
   - Duplicate job detection logic (extract and test the SQL condition builder)
   - Provider-model compatibility detection (extract `detectModelProvider` and test)

2. Create `backend/test/unit/agents-provider-resolution.test.ts` testing:
   - `detectModelProvider` function — all model prefixes
   - `getProviderSafeModel` — compatible/incompatible model scenarios
   - Provider inference from model ID

Pattern: Node test runner, pure function tests without DB.

---

### TASK 3: Add Frontend Hook Tests
**Est:** 2-3 iterations

Test custom hooks in `frontend/src/hooks/`:

```bash
find frontend/src/hooks -name "*.ts" -o -name "*.tsx" | head -10
```

Priority:
1. useJobPolling — test polling interval, cleanup, state updates
2. useAgentStatus — test status transitions
3. Any other custom hooks without tests

Use `@testing-library/react` renderHook. After each: `pnpm -C frontend test`.

---

### TASK 4: API Client Robustness Tests
**Est:** 2-3 iterations

Test frontend API clients for error handling:

1. `frontend/src/services/api/agents.ts` — test error responses, network failures
2. `frontend/src/services/api/ai-keys.ts` — test 401, 500 responses
3. `frontend/src/services/api/client.ts` — test retry logic, timeout handling

Create tests at `frontend/src/services/api/__tests__/`. Mock fetch/httpClient.

---

### TASK 5: Accessibility Quick Wins
**Est:** 2-3 iterations

Check and fix accessibility issues:

1. Add `aria-label` to icon-only buttons (sidebar collapse, close buttons)
2. Add `role="alert"` to error/success notifications
3. Add `aria-live="polite"` to dynamic content regions (job status updates)
4. Ensure all form inputs have associated labels
5. Check color contrast in dark theme components

Focus on dashboard and agent pages. After fixes: run all gates. Commit: `fix(a11y): add accessibility attributes to interactive elements`

---

### TASK 6: Backend Error Handler Coverage
**Est:** 2-3 iterations

`backend/src/utils/errorHandler.ts` is critical for user-facing error messages. Add thorough tests:

1. Test `formatErrorResponse` with every error type:
   - AIProviderError (all codes)
   - McpError / McpConnectionError
   - MissingAIKeyError
   - DatabaseError
   - Generic Error
   - Non-Error thrown values

2. Test `getStatusCodeForError` mapping for all error codes

3. Test edge cases: very long error messages, null values, circular references

---

### TASK 7: Config Validation Tests
**Est:** 1-2 iterations

Test `backend/src/config/env.ts` validation logic:

1. Extract validation functions if possible (without triggering DB import)
2. Test env var parsing: boolean coercion, number parsing, URL validation
3. Test missing required vars produce clear error messages

---

### TASK 8: Frontend i18n Completeness Check
**Est:** 1-2 iterations

Verify all i18n keys are present in both locales:

```bash
# Compare key counts
cat frontend/src/i18n/locales/en.json | python3 -c "import json,sys; print(len(json.load(sys.stdin)))"
cat frontend/src/i18n/locales/tr.json | python3 -c "import json,sys; print(len(json.load(sys.stdin)))"
```

If counts differ: find missing keys and add them. Verify MESSAGE_KEYS type matches.

---

### TASK 9: Push All Work + Update PR
**Est:** 1 iteration

```bash
git push origin feat/S0.5.1-onboarding-flow
gh pr comment 265 --body "Phase 3: edge-case tests, bundle optimization, accessibility, i18n completeness"
```

---

## QUALITY GATES (after EVERY code change)

```bash
pnpm -r typecheck && pnpm -r lint && pnpm -r build && pnpm -r test
```

NEVER commit with failing gates. Fix → re-run ALL 4 → repeat.

---

## ITERATION STATUS (print EVERY iteration)

```
=== RALPH [N] ===
Branch: <name>
Task: <number> — <title>
Tests: <backend> + <frontend> = <total>
Action: <what you're doing>
=================
```

---

## GIT RULES

- Conventional commits: `feat|fix|chore|docs|refactor|test|perf(scope): message`
- Max 300 LoC per commit. Push allowed (feature branch only).
- NEVER push to main. NEVER force push.

---

## COMPLETION CRITERIA

- [ ] Test count > 728 (improved from baseline)
- [ ] Bundle size warning reduced or eliminated
- [ ] 0 lint warnings
- [ ] All quality gates pass
- [ ] All changes pushed

Output: <promise>DONE</promise>

---

## STUCK PROTOCOL

3 failed attempts → document blocker → move to next task.
Never waste more than 3 iterations on the same problem.
