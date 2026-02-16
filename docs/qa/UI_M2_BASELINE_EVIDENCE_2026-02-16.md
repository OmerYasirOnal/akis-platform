# UI M2 Baseline Evidence (2026-02-16)

## Test Baseline (Pre-closure)

### 1) Frontend Typecheck
Command:
```bash
npm -C frontend run typecheck
```
Result:
- PASS (`tsc --noEmit`)

### 2) Target E2E Pack
Command:
```bash
npm -C frontend run test:e2e -- \
  tests/e2e/auth-login-flow.spec.ts \
  tests/e2e/navigation-guards.spec.ts \
  tests/e2e/scribe-console.spec.ts \
  tests/e2e/trace-console.spec.ts \
  tests/e2e/proto-console.spec.ts
```
Result:
- PASS (`47/47`)
- Runtime: ~12.7s

## Staging Smoke Baseline

### OAuth Redirect Smoke
- URL: `https://staging.akisflow.com/login`
- Action: `Continue with GitHub`
- Expected: GitHub OAuth login sayfasına yönlendirme
- Observed: PASS (redirect URL includes `/login/oauth/authorize`)

## Timestamp
- Captured at: `2026-02-16 09:57:06 UTC`

## Notes
- Bu dosya UI closure öncesi "known-good" baseline olarak kullanılır.
- Sonraki PR dilimlerinde regressions bu baseline ile karşılaştırılacaktır.

---

## Closure Validation (Post-closure)

### Frontend typecheck
```bash
npm -C frontend run typecheck
```
Result:
- PASS

### Frontend full unit/integration
```bash
npm -C frontend run test
```
Result:
- PASS (`602/602`)

### UI target E2E pack (with Agents Hub suite)
```bash
npm -C frontend run test:e2e -- \
  tests/e2e/auth-login-flow.spec.ts \
  tests/e2e/navigation-guards.spec.ts \
  tests/e2e/scribe-console.spec.ts \
  tests/e2e/trace-console.spec.ts \
  tests/e2e/proto-console.spec.ts \
  tests/e2e/agents-hub-ui.spec.ts
```
Result:
- PASS (`50/50`)

### Backend safety checks
```bash
npm -C backend run typecheck
npm -C backend run test
```
Result:
- PASS (`1302/1302`)

### Docs reference integrity
```bash
node scripts/check_docs_references.mjs
```
Result:
- PASS (`broken reference = 0`)
