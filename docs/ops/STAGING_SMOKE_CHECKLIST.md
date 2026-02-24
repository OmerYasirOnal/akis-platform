# Staging Smoke Checklist

Use this right after each staging deploy.

## A) Health
- [ ] `GET /health` returns `200` and `{"status":"ok"}`
- [ ] `GET /ready` returns `200` and `{"ready":true}`
- [ ] `GET /version` returns `200` and expected commit/version

## B) Auth
- [ ] Login page loads without console/runtime errors
- [ ] Valid login works and redirects to authenticated area
- [ ] Invalid login shows expected error state (no crash)
- [ ] Authenticated session survives one page refresh

## C) Agents Lifecycle
- [ ] Agents list page opens and primary cards are visible
- [ ] Start one simple run (Scribe/Trace/Proto) successfully
- [ ] Run transitions through expected states and completes/fails with visible status
- [ ] Job detail page opens for the created run

## D) SSE
- [ ] Job/event stream connects without repeated reconnect loops
- [ ] Live updates appear during run progress
- [ ] Stream closes/reconnects gracefully after completion

## E) Out-of-Scope Removal Verification
- [ ] Out-of-scope navigation entries are absent in UI
- [ ] `/agents/smart-automations` does not render feature content (404 or redirect acceptable)
- [ ] No active API routes expose removed out-of-scope features

## F) Negative Tests
- [ ] Unauthenticated call to protected endpoint returns 401/403 (not 500)
- [ ] Unknown route returns 404 with standard error envelope
- [ ] Invalid payload to one job endpoint returns validation error (not crash)

## G) Logs
- [ ] Backend logs contain no new error burst after deploy
- [ ] No recurring unhandled exceptions during smoke run
- [ ] Request and job logs include expected identifiers (`requestId`, `jobId`)

