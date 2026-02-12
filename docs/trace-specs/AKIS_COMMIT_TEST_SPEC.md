# Trace Agent Spec: AKIS Platform — Commit-Based Test Generation

> **Purpose:** When this spec is fed to the Trace agent targeting the AKIS Platform repository,
> it should generate a comprehensive test plan covering all recent changes,
> with quality scoring and coverage analysis.
>
> **How to use:** Run Trace agent with `spec` = contents of this file.

---

## Specification

### Project Context

AKIS Platform is an AI agent orchestration system with three active agents (Scribe, Trace, Proto).
The codebase uses Fastify + PostgreSQL + Drizzle ORM (backend) and React + Vite (frontend).
All tests use Node.js built-in `node:test` runner with TypeScript via `tsx`.
Route tests use `fastify.inject()` pattern — no HTTP server required.
Auth uses JWT in HTTP-only cookies (`akis_session`).

### Recent Changes to Test (S0.5.3-AUTH-3: Jobs User Isolation)

#### Change 1: GET /api/agents/jobs — User Isolation Filter
- **File:** `backend/src/api/agents.ts` (line ~1160)
- **What changed:** Added `requireAuth()` call. Added SQL condition: `(payload->>'userId')::text = user.id` to the WHERE clause.
- **Before:** Endpoint returned ALL jobs in the system (data leak).
- **After:** Endpoint returns ONLY jobs belonging to the authenticated user.
- **Test scenarios:**
  - Scenario: Unauthenticated request → 401 UNAUTHORIZED
    Given no cookie header
    When GET /api/agents/jobs
    Then response status is 401
    And body.error.code equals "UNAUTHORIZED"
  - Scenario: Authenticated user sees only own jobs
    Given User A is authenticated
    And database has jobs for User A and User B
    When GET /api/agents/jobs with User A cookie
    Then all returned jobs have payload.userId === User A's id
    And no jobs belong to User B
  - Scenario: User with no jobs sees empty list
    Given User C is authenticated with zero jobs
    When GET /api/agents/jobs with User C cookie
    Then response.items is empty array
  - Scenario: Type filter works alongside user isolation
    Given User A has 2 scribe + 1 trace job
    When GET /api/agents/jobs?type=scribe
    Then returns 2 scribe jobs, all belonging to User A
  - Scenario: State filter works alongside user isolation
    Given User A has jobs in completed/running/failed states
    When GET /api/agents/jobs?state=completed
    Then returns only User A's completed jobs
  - Scenario: Pagination cursor works with user isolation
    Given User A has 25 jobs
    When GET /api/agents/jobs?limit=10
    Then returns 10 jobs + nextCursor
    When GET /api/agents/jobs?limit=10&cursor=nextCursor
    Then returns next 10 jobs, all belonging to User A

#### Change 2: GET /api/agents/jobs/:id — Ownership Check
- **File:** `backend/src/api/agents.ts` (line ~810)
- **What changed:** Added `requireAuth()`. After fetching job, compares `payload.userId` with authenticated user. Returns 404 if mismatch.
- **Before:** Any user could view any job by ID (information leak).
- **After:** Only the job owner can view it; others get 404.
- **Test scenarios:**
  - Scenario: Owner views their own job → 200 with full details
    Given User A owns job-123
    When GET /api/agents/jobs/job-123 with User A cookie
    Then response status is 200
    And body contains job details, plan, audit if requested
  - Scenario: Non-owner tries to view → 404 NOT_FOUND
    Given User B owns job-456
    When GET /api/agents/jobs/job-456 with User A cookie
    Then response status is 404
    And body.error.code equals "NOT_FOUND"
  - Scenario: Nonexistent job → 404 NOT_FOUND
    When GET /api/agents/jobs/nonexistent-uuid with User A cookie
    Then response status is 404
  - Scenario: No auth → 401 UNAUTHORIZED
    When GET /api/agents/jobs/job-123 without cookie
    Then response status is 401
  - Scenario: Include plan/audit/trace for own job works
    Given User A owns job-789
    When GET /api/agents/jobs/job-789?include=plan,audit,trace
    Then response includes plan, audits, traces objects
  - Scenario: Include plan/audit for OTHER user's job → 404 (not partial)
    Given User B owns job-999
    When GET /api/agents/jobs/job-999?include=plan with User A cookie
    Then response is 404 (not 200 with empty plan)

#### Change 3: POST /api/agents/jobs/:id/cancel — Ownership Check
- **File:** `backend/src/api/agents.ts` (line ~1897)
- **What changed:** After `requireAuth()`, checks `payload.userId` against user. Returns 404 if mismatch. Then checks state (only pending/running).
- **Before:** Any authenticated user could cancel any job.
- **After:** Only the owner can cancel their own job.
- **Test scenarios:**
  - Scenario: Owner cancels pending job → 200
    Given User A owns job-100 in "pending" state
    When POST /api/agents/jobs/job-100/cancel with User A cookie
    Then response status is 200
    And job state changes to "failed" with errorCode "JOB_CANCELLED"
  - Scenario: Owner cancels running job → 200
    Given User A owns job-101 in "running" state
    When POST /api/agents/jobs/job-101/cancel with User A cookie
    Then response status is 200
  - Scenario: Non-owner tries to cancel → 404
    Given User B owns job-200 in "pending" state
    When POST /api/agents/jobs/job-200/cancel with User A cookie
    Then response status is 404
    And job state remains "pending" (unchanged)
  - Scenario: Cancel completed job → 409 INVALID_STATE_TRANSITION
    Given User A owns job-300 in "completed" state
    When POST /api/agents/jobs/job-300/cancel with User A cookie
    Then response status is 409
    And error code is "INVALID_STATE_TRANSITION"
  - Scenario: Cancel without auth → 401
    When POST /api/agents/jobs/job-100/cancel without cookie
    Then response status is 401

#### Change 4: GET /api/agents/jobs/:id/stream — SSE Auth + Ownership
- **File:** `backend/src/api/job-events.ts` (line ~47)
- **What changed:** Added `requireAuth()` and ownership check before starting SSE stream.
- **Before:** Anyone could subscribe to any job's SSE stream (live data leak).
- **After:** Only authenticated owner can subscribe to their job's stream.
- **Test scenarios:**
  - Scenario: Owner subscribes to SSE → 200 text/event-stream
    Given User A owns job-500
    When GET /api/agents/jobs/job-500/stream with User A cookie
    Then response Content-Type is "text/event-stream"
  - Scenario: Non-owner → 404
    Given User B owns job-600
    When GET /api/agents/jobs/job-600/stream with User A cookie
    Then response status is 404
  - Scenario: No auth → 401
    When GET /api/agents/jobs/job-500/stream without cookie
    Then response status is 401
  - Scenario: Terminal job → immediate stream end
    Given User A owns job-700 in "completed" state
    When GET /api/agents/jobs/job-700/stream with User A cookie
    Then receives final stage event and stream closes

### Edge Cases

- Scenario: Job payload has no userId (legacy) → allow access to any authenticated user
  Given a legacy job with payload = { spec: "test" } (no userId field)
  When any authenticated user accesses it
  Then access is granted (backward compatibility)

- Scenario: Multiple rapid requests from same user → rate limiting unaffected
  Given User A is authenticated
  When 10 rapid GET /api/agents/jobs requests
  Then all return 200 (rate limit is per-IP, not per-user for this endpoint)

- Scenario: Job with null payload → allow access (edge case)
  Given a job with payload = null
  When User A tries to access it
  Then access is granted (null payload has no userId to deny on)

### Security Properties

1. **Information Hiding:** Unauthorized access returns 404 (same as nonexistent), not 403
2. **No Enumeration:** User cannot discover job IDs belonging to other users
3. **Consistent Auth:** All 4 endpoints use same requireAuth + ownership check pattern
4. **Backward Compatible:** Legacy jobs without userId remain accessible
5. **Type-Safe:** SQL injection prevented via parameterized Drizzle queries

### Quality Scoring Criteria

| Criterion | Weight | Description |
|-----------|--------|-------------|
| Auth coverage | 25% | All 4 endpoints tested for 401 |
| Ownership isolation | 25% | Cross-user access denied (404) for all endpoints |
| Positive paths | 20% | Owner can access their own resources |
| Edge cases | 15% | null payload, missing userId, pagination with isolation |
| Regression | 15% | Existing functionality not broken (type/state filters, cursor pagination) |

### Test File Structure

```
backend/test/
├── unit/
│   └── jobs-user-isolation-auth.test.ts     # 35+ unit tests (no DB)
├── integration/
│   └── jobs-user-isolation.test.ts          # 4+ integration tests (with DB)
└── e2e/ (future)
    └── jobs-isolation-browser.test.ts       # Browser-based verification
```

### Expected Test Count

| Category | Tests | Coverage Focus |
|----------|-------|----------------|
| Auth guard | 9 | Cookie parsing, token validation, multi-cookie |
| Ownership check | 7 | userId match/mismatch, null/undefined/empty |
| List filtering | 8 | Per-user filter, type/state combos, pagination, scale |
| Error shapes | 6 | UNAUTHORIZED, NOT_FOUND response formats |
| Cancel logic | 3 | State guards, cancel result format |
| SSE stream | 4 | Auth + ownership for stream endpoint |
| Security invariants | 4 | Information hiding, enumeration prevention |
| Regression guards | 4 | Pre-existing behavior preserved |
| **Total** | **45+** | **Full isolation coverage** |

### Impact Assessment

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Jobs visible to User A | ALL users' jobs | Only User A's jobs | -100% leak |
| Endpoints with auth | 3/8 | 7/8 | +50% coverage |
| Cross-user access | Allowed | Blocked (404) | Critical fix |
| SSE stream isolation | None | Full | Critical fix |
| Test coverage (jobs) | 4 tests | 45+ tests | +1000% |
| Quality score target | - | 85+ / 100 | High confidence |
