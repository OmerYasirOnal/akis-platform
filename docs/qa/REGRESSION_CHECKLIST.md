# Regression Checklist — S0.5 Pilot Demo

> **Task:** S0.5.3-QA-1
> **Date:** 2026-02-09
> **Purpose:** Verify all golden paths and critical flows before pilot demo (28 Feb 2026)

---

## Golden Path Acceptance Matrix (Demo-Critical)

| Path | Exact URL | Pass Criteria | Fail Criteria |
|---|---|---|---|
| GP-1 Auth signup/login | `https://staging.akisflow.com/auth/signup` and `https://staging.akisflow.com/auth/login` | Signup and login complete, session established, redirect to `/dashboard` | 4xx/5xx, stuck flow, no authenticated session |
| GP-2 Ready + MCP | `https://staging.akisflow.com/ready` | `ready=true`, `mcp` object present, `mcp.configured=true`, `mcp.gatewayReachable=true`, `mcp.missingEnv=[]` | `mcp` missing or any required MCP field invalid |
| GP-3 Scribe docpack | `https://staging.akisflow.com/agents/scribe` | Job reaches `completed`, preview and diff rendered | Job `failed/stuck`, missing output sections |
| GP-4 Trace test plan | `https://staging.akisflow.com/agents/trace` | Job reaches `completed`, test plan output visible | Job `failed/stuck`, missing output |
| GP-5 SSE + RunSummary | `https://staging.akisflow.com/api/agents/jobs/<jobId>/stream` and `https://staging.akisflow.com/dashboard/jobs/<jobId>` | SSE stream emits job/task/agent/tool-level events, RunSummary panel renders totals | Stream missing levels/events or RunSummary empty |

---

## 1. Infrastructure & Health

| # | Check | Expected | Pass |
|---|-------|----------|------|
| 1.1 | `GET /health` | `{"status":"ok"}` HTTP 200 | [ ] |
| 1.2 | `GET /ready` | `{"ready":true}`, DB connected | [ ] |
| 1.3 | `GET /version` | Commit SHA matches deployed | [ ] |
| 1.4 | `GET /` | HTML with `id="root"` | [ ] |
| 1.5 | `/ready` → `.mcp` | `configured: true` | [ ] |
| 1.6 | `/ready` → `.oauth` | `github: true` or `google: true` | [ ] |
| 1.7 | `/ready` → `.encryption` | `configured: true` | [ ] |
| 1.8 | TLS cert valid | Not expired, Let's Encrypt | [ ] |
| 1.9 | No `localhost` in responses | Grep staging HTML/API responses | [ ] |

---

## 2. Auth Flow — Email/Password

| # | Check | Expected | Pass |
|---|-------|----------|------|
| 2.1 | Navigate to `/auth/signup` | Signup form renders | [ ] |
| 2.2 | Submit email | Moves to password step | [ ] |
| 2.3 | Submit password | Creates account, sends verification email | [ ] |
| 2.4 | Enter verification code | Account verified, redirected to dashboard | [ ] |
| 2.5 | Logout | Session cleared, redirected to home | [ ] |
| 2.6 | Navigate to `/auth/login` | Login form renders | [ ] |
| 2.7 | Submit email + password | Authenticated, redirected to dashboard | [ ] |
| 2.8 | `GET /auth/me` (unauth) | HTTP 401 | [ ] |
| 2.9 | `GET /auth/me` (auth) | User object returned | [ ] |

---

## 3. Auth Flow — OAuth

| # | Check | Expected | Pass |
|---|-------|----------|------|
| 3.1 | "Continue with GitHub" | Redirects to GitHub OAuth | [ ] |
| 3.2 | Authorize on GitHub | Redirected back to staging | [ ] |
| 3.3 | OAuth callback processes | User created/logged in | [ ] |
| 3.4 | Welcome email sent | Email received (check SMTP logs) | [ ] |
| 3.5 | "Continue with Google" | Redirects to Google OAuth | [ ] |
| 3.6 | Google OAuth callback | User created/logged in | [ ] |

---

## 4. Dashboard & Onboarding

| # | Check | Expected | Pass |
|---|-------|----------|------|
| 4.1 | Navigate to `/dashboard` | Dashboard loads | [ ] |
| 4.2 | Getting Started card visible | 3-step checklist shown | [ ] |
| 4.3 | AI keys unconfigured | Step 1 shows "Set up AI Keys" link | [ ] |
| 4.4 | Configure AI key | Step 1 shows checkmark | [ ] |
| 4.5 | After running a job | Steps 2-3 show checkmarks | [ ] |
| 4.6 | Dismiss card | Card hidden, persists across reloads | [ ] |
| 4.7 | Progress bar updates | Reflects completed steps (0/3 → 3/3) | [ ] |

---

## 5. Scribe Agent — Golden Path

| # | Check | Expected | Pass |
|---|-------|----------|------|
| 5.1 | Navigate to `/agents/scribe` | Console page renders | [ ] |
| 5.2 | GitHub connected user | Repos/branches populate | [ ] |
| 5.3 | Select repo + branch | Dropdowns functional | [ ] |
| 5.4 | Configure doc pack + depth | Selectors work | [ ] |
| 5.5 | Click "Run Scribe" | Job submitted (201), status: pending | [ ] |
| 5.6 | Logs tab | Progress events stream | [ ] |
| 5.7 | Status transitions | Ready → Queued → Running → Complete | [ ] |
| 5.8 | Preview tab | Generated docs visible | [ ] |
| 5.9 | Diff tab | File changes visible | [ ] |
| 5.10 | Reset Console | State cleared | [ ] |
| 5.11 | GitHub disconnected | Error notice, controls disabled | [ ] |
| 5.12 | No AI key | AI_KEY_MISSING error shown | [ ] |

---

## 6. Trace Agent — Golden Path

| # | Check | Expected | Pass |
|---|-------|----------|------|
| 6.1 | Navigate to `/agents/trace` | Console page renders | [ ] |
| 6.2 | Agent status badge | Shows Active/Inactive | [ ] |
| 6.3 | Enter spec in textarea | Text accepted | [ ] |
| 6.4 | "Run Trace" enabled | When spec non-empty | [ ] |
| 6.5 | Click "Run Trace" | Job submitted (201) | [ ] |
| 6.6 | Logs tab | Trace events stream | [ ] |
| 6.7 | Status transitions | Ready → Queued → Running → Complete | [ ] |
| 6.8 | Results tab | Test plan JSON/Markdown visible | [ ] |
| 6.9 | Button re-enables | After completion or failure | [ ] |
| 6.10 | Empty spec submit | Validation error shown | [ ] |
| 6.11 | No AI key | AI_KEY_MISSING error shown | [ ] |

---

## 7. Proto Agent — Golden Path

| # | Check | Expected | Pass |
|---|-------|----------|------|
| 7.1 | Navigate to `/agents/proto` | Console page renders | [ ] |
| 7.2 | Agent status badge | Shows Active/Inactive | [ ] |
| 7.3 | Enter description | Text accepted | [ ] |
| 7.4 | "Run Proto" enabled | When description non-empty | [ ] |
| 7.5 | Click "Run Proto" | Job submitted (201) | [ ] |
| 7.6 | Logs tab | Progress events stream | [ ] |
| 7.7 | Status transitions | Ready → Queued → Running → Complete | [ ] |
| 7.8 | Results tab | Prototype files visible | [ ] |
| 7.9 | Button re-enables | After completion or failure | [ ] |
| 7.10 | Empty description submit | Validation error shown | [ ] |
| 7.11 | No AI key | AI_KEY_MISSING error shown | [ ] |

---

## 8. API Health Endpoints

| # | Check | Expected | Pass |
|---|-------|----------|------|
| 8.1 | `GET /api/agents/jobs` (unauth) | Returns jobs or 401 | [ ] |
| 8.2 | `GET /api/agents/jobs/running` (unauth) | HTTP 401 | [ ] |
| 8.3 | `POST /api/agents/jobs` (unauth) | HTTP 401 | [ ] |
| 8.4 | `GET /api/settings/ai-keys/status` (auth) | Provider status JSON | [ ] |
| 8.5 | `GET /api/usage/current-month` (auth) | Usage stats JSON | [ ] |
| 8.6 | `GET /brand/logo.png` | HTTP 200, image content | [ ] |

---

## 9. Staging-Specific Checks

| # | Check | Expected | Pass |
|---|-------|----------|------|
| 9.1 | No localhost leaks | No `localhost` or `127.0.0.1` in HTML/API | [ ] |
| 9.2 | trust-proxy active | Cookies set with `Secure` flag | [ ] |
| 9.3 | CORS headers | `Access-Control-Allow-Origin` present | [ ] |
| 9.4 | Security headers | `X-Content-Type-Options`, `X-Frame-Options`, HSTS | [ ] |
| 9.5 | SPA deep links | `/agents/scribe`, `/agents/trace`, `/agents/proto` return HTML | [ ] |
| 9.6 | Route redirects | `/dashboard/scribe` → `/agents/scribe` | [ ] |
| 9.7 | Rate limiting | Rapid requests get 429 | [ ] |

---

## 10. Error Handling (All Agents)

| # | Check | Expected | Pass |
|---|-------|----------|------|
| 10.1 | AI_KEY_MISSING | Clear error: "No AI key configured" | [ ] |
| 10.2 | ENCRYPTION_NOT_CONFIGURED | Clear error: "Server config error" | [ ] |
| 10.3 | VALIDATION_ERROR | Clear error with field details | [ ] |
| 10.4 | AI_RATE_LIMITED | "AI service is busy, will retry" | [ ] |
| 10.5 | GITHUB_NOT_CONNECTED | "Connect GitHub" message | [ ] |
| 10.6 | Job failure | Status shows "Failed" + error message | [ ] |
| 10.7 | Network error | Graceful fallback, no white screen | [ ] |

---

## Execution Notes

- Run automated smoke tests first: `./scripts/staging_smoke.sh`
- Manual checks follow (sections 2-10)
- All agents require: AI key + GitHub OAuth + MCP Gateway
- Record results with date and tester name
- Any failing check blocks pilot demo

---

*Related: [Staging Smoke Test](../deploy/STAGING_SMOKE_TEST_CHECKLIST.md) | [Agent Contracts](../agents/AGENT_CONTRACTS_S0.5.md)*
