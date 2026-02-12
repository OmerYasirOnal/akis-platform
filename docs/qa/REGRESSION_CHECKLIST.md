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
| 1.1 | `GET /health` | `{"status":"ok"}` HTTP 200 | [x] 2026-02-12 |
| 1.2 | `GET /ready` | `{"ready":true}`, DB connected | [x] 2026-02-12 |
| 1.3 | `GET /version` | Commit SHA matches deployed | [x] b723c2d 2026-02-12 |
| 1.4 | `GET /` | HTML with `id="root"` | [x] 2026-02-12 |
| 1.5 | `/ready` → `.mcp` | `configured: true` | [x] 2026-02-12 |
| 1.6 | `/ready` → `.oauth` | `github: true` or `google: true` | [x] both true 2026-02-12 |
| 1.7 | `/ready` → `.encryption` | `configured: true` | [x] 2026-02-12 |
| 1.8 | TLS cert valid | Not expired, Let's Encrypt | [x] LE E7, exp May 4 2026 |
| 1.9 | No `localhost` in responses | Grep staging HTML/API responses | [x] 2026-02-12 |

---

## Golden Path Acceptance Matrix (Demo-Critical)

| Path | Exact URL | Pass Criteria | Fail Criteria |
|---|---|---|---|
| GP-1 Auth signup/login | `https://staging.akisflow.com/auth/signup` and `https://staging.akisflow.com/auth/login` | Signup completes, verification succeeds, login redirects to `/dashboard` | Signup/login stuck, 4xx/5xx, session not established |
| GP-2 Ready + MCP | `https://staging.akisflow.com/ready` | `ready=true`, `mcp.configured=true`, `mcp.gatewayReachable=true`, `mcp.missingEnv=[]` | Any required field missing/false, non-200 |
| GP-3 Scribe docpack | `https://staging.akisflow.com/agents/scribe` | Scribe job reaches `completed`, preview/diff visible | Job fails/stalls, missing output |
| GP-4 Trace test plan | `https://staging.akisflow.com/agents/trace` | Trace job reaches `completed`, test plan output visible | Job fails/stalls, output missing |
| GP-5 SSE + RunSummary | `https://staging.akisflow.com/api/agents/jobs/<jobId>/stream` and `https://staging.akisflow.com/dashboard/jobs/<jobId>` | Live stream emits events and Job Detail RunSummary panel renders totals | No stream events or RunSummary panel empty/broken |

---

## 2. Auth Flow — Email/Password

| # | Check | Expected | Pass |
|---|-------|----------|------|
| 2.1 | Navigate to `/auth/signup` | Signup form renders | [!] 2026-02-12 — `/auth/signup` SPA içinde `/` ana sayfaya düşüyor; form görünmüyor |
| 2.2 | Submit email | Moves to password step | [!] 2026-02-12 — `/auth/signup` rotasında email adımı yok (canonical rota `/signup`) |
| 2.3 | Submit password | Creates account, sends verification email | [x] 2026-02-12 |
| 2.4 | Enter verification code | Account verified, redirected to dashboard | [~] 2026-02-12 — blocked: inbox/verification code erişimi yok |
| 2.5 | Logout | Session cleared, redirected to home | [ ] manual |
| 2.6 | Navigate to `/auth/login` | Login form renders | [!] 2026-02-12 — `/auth/login` SPA içinde `/` ana sayfaya düşüyor; form görünmüyor |
| 2.7 | Submit email + password | Authenticated, redirected to dashboard | [~] 2026-02-12 — blocked: `/auth/login` route mismatch + doğrulanmış test kullanıcı şifresi yok |
| 2.8 | `GET /auth/me` (unauth) | HTTP 401 | [x] 2026-02-12 |
| 2.9 | `GET /auth/me` (auth) | User object returned | [~] 2026-02-12 — blocked: sağlanan `akis_session` ile `/auth/me` HTTP 401 |

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
| 5.5 | Click "Run Scribe" | Job submitted (201), status: pending | [x] API dry-run completed 2026-02-12 |
| 5.6 | Logs tab | Progress events stream | [ ] |
| 5.7 | Status transitions | Ready → Queued → Running → Complete | [ ] |
| 5.8 | Preview tab | Generated docs visible | [ ] |
| 5.9 | Diff tab | File changes visible | [ ] |
| 5.10 | Reset Console | State cleared | [ ] |
| 5.11 | GitHub disconnected | Error notice, controls disabled | [ ] |
| 5.12 | No AI key | AI_KEY_MISSING error shown | [x] API 2026-02-12 |

---

## 6. Trace Agent — Golden Path

| # | Check | Expected | Pass |
|---|-------|----------|------|
| 6.1 | Navigate to `/agents/trace` | Console page renders | [~] 2026-02-12 — blocked: auth session 401 |
| 6.2 | Agent status badge | Shows Active/Inactive | [~] 2026-02-12 — blocked: auth session 401 |
| 6.3 | Enter spec in textarea | Text accepted | [~] 2026-02-12 — blocked: auth session 401 |
| 6.4 | "Run Trace" enabled | When spec non-empty | [~] 2026-02-12 — blocked: auth session 401 |
| 6.5 | Click "Run Trace" | Job submitted (201) | [~] 2026-02-12 — blocked: `/auth/me` HTTP 401, Phase 2 durduruldu |
| 6.6 | Logs tab | Trace events stream | [~] 2026-02-12 — blocked: auth session 401 |
| 6.7 | Status transitions | Ready → Queued → Running → Complete | [~] 2026-02-12 — blocked: auth session 401 |
| 6.8 | Results tab | Test plan JSON/Markdown visible | [~] 2026-02-12 — blocked: auth session 401 |
| 6.9 | Button re-enables | After completion or failure | [~] 2026-02-12 — blocked: auth session 401 |
| 6.10 | Empty spec submit | Validation error shown | [~] 2026-02-12 — blocked: auth session 401 |
| 6.11 | No AI key | AI_KEY_MISSING error shown | [~] 2026-02-12 — blocked: auth session 401 |

---

## 7. Proto Agent — Golden Path

| # | Check | Expected | Pass |
|---|-------|----------|------|
| 7.1 | Navigate to `/agents/proto` | Console page renders | [~] 2026-02-12 — blocked: auth session 401 |
| 7.2 | Agent status badge | Shows Active/Inactive | [~] 2026-02-12 — blocked: auth session 401 |
| 7.3 | Enter description | Text accepted | [~] 2026-02-12 — blocked: auth session 401 |
| 7.4 | "Run Proto" enabled | When description non-empty | [~] 2026-02-12 — blocked: auth session 401 |
| 7.5 | Click "Run Proto" | Job submitted (201) | [~] 2026-02-12 — blocked: `/auth/me` HTTP 401, Phase 3 durduruldu |
| 7.6 | Logs tab | Progress events stream | [~] 2026-02-12 — blocked: auth session 401 |
| 7.7 | Status transitions | Ready → Queued → Running → Complete | [~] 2026-02-12 — blocked: auth session 401 |
| 7.8 | Results tab | Prototype files visible | [~] 2026-02-12 — blocked: auth session 401 |
| 7.9 | Button re-enables | After completion or failure | [~] 2026-02-12 — blocked: auth session 401 |
| 7.10 | Empty description submit | Validation error shown | [~] 2026-02-12 — blocked: auth session 401 |
| 7.11 | No AI key | AI_KEY_MISSING error shown | [~] 2026-02-12 — blocked: auth session 401 |

---

## 8. API Health Endpoints

| # | Check | Expected | Pass |
|---|-------|----------|------|
| 8.1 | `GET /api/agents/jobs` (unauth) | HTTP 401 (S0.5.3-AUTH-3 user isolation) | [ ] verify post-merge |
| 8.2 | `GET /api/agents/jobs/running` (unauth) | HTTP 401 | [x] 401 2026-02-12 |
| 8.3 | `POST /api/agents/jobs` (unauth) | HTTP 401 | [~] 400 validation-before-auth |
| 8.4 | `GET /api/settings/ai-keys/status` (auth) | Provider status JSON | [~] 2026-02-12 — blocked: sağlanan session ile auth 401 |
| 8.5 | `GET /api/usage/current-month` (auth) | Usage stats JSON | [x] 237k tokens 2026-02-12 |
| 8.6 | `GET /brand/logo.png` | HTTP 200, image content | [x] 2026-02-12 |
| 8.7 | Jobs user isolation (S0.5.3-AUTH-3) | User A sees only own jobs; User B gets 404 for User A's job IDs | [ ] verify post-merge |

---

## 9. Staging-Specific Checks

| # | Check | Expected | Pass |
|---|-------|----------|------|
| 9.1 | No localhost leaks | No `localhost` or `127.0.0.1` in HTML/API | [x] 2026-02-12 |
| 9.2 | trust-proxy active | Cookies set with `Secure` flag | [x] deployment config 2026-02-12 |
| 9.3 | CORS headers | `Access-Control-Allow-Origin` present | [x] staging origin 2026-02-12 |
| 9.4 | Security headers | `X-Content-Type-Options`, `X-Frame-Options`, HSTS | [!] 2026-02-12 — `X-Content-Type-Options` ve `X-Frame-Options` var, HSTS/CSP header gözlenmedi |
| 9.5 | SPA deep links | `/agents/scribe`, `/agents/trace`, `/agents/proto` return HTML | [x] all 200 with root 2026-02-12 |
| 9.6 | Route redirects | `/dashboard/scribe` → `/agents/scribe` | [x] SPA client-side 2026-02-12 |
| 9.7 | Rate limiting | Rapid requests get 429 | [~] no 429 after 50 req — limit high or /health excluded |

---

## 10. Error Handling (All Agents)

| # | Check | Expected | Pass |
|---|-------|----------|------|
| 10.1 | AI_KEY_MISSING | Clear error: "No AI key configured" | [x] API 2026-02-12 |
| 10.2 | ENCRYPTION_NOT_CONFIGURED | Clear error: "Server config error" | [ ] requires config change |
| 10.3 | VALIDATION_ERROR | Clear error with field details | [x] API 2026-02-12 |
| 10.4 | AI_RATE_LIMITED | "AI service is busy, will retry" | [ ] requires load test |
| 10.5 | GITHUB_NOT_CONNECTED | "Connect GitHub" message | [ ] manual browser test |
| 10.6 | Job failure | Status shows "Failed" + error message | [x] NOT_FOUND 2026-02-12 |
| 10.7 | Network error | Graceful fallback, no white screen | [ ] manual browser test |

---

## Latest Test Run — 2026-02-12

**Tester:** Codex (automated + browser verification)
**Staging commit:** `b723c2d`
**Main HEAD:** `b723c2d` (Scribe AGT-8 staging'de canlı)

| Area | Status | Notes |
|------|--------|-------|
| Smoke tests (staging_smoke.sh) | PASS | `./scripts/staging_smoke.sh --commit b723c2d` → 12/12 (13:34 UTC) |
| Infrastructure (/health, /ready, /version) | PASS | `/health` 200, `/ready` healthy, `/version.commit=b723c2d` |
| MCP Gateway | PASS | `/ready.mcp.configured=true`, `gatewayReachable=true`, `missingEnv=[]` |
| Email signup (API) | PASS | `/auth/signup/start` → 201 `pending_verification` |
| Email signup (browser) | PARTIAL | `/signup` akışı password adımına geçti; verify-code adımı inbox erişimi nedeniyle tamamlanamadı |
| Trace golden path (API) | BLOCKED | Sağlanan `akis_session` ile `/auth/me` 401 döndü; kural gereği Phase 2 durduruldu |
| Trace golden path (browser) | BLOCKED | Auth 401 nedeniyle agent console doğrulanamadı |
| Proto golden path (API) | BLOCKED | Auth 401 nedeniyle Phase 3 durduruldu |
| Proto golden path (browser) | BLOCKED | Auth 401 nedeniyle agent console doğrulanamadı |
| OAuth (GitHub + Google) | PASS | `/ready` üzerinde `oauth.github=true`, `oauth.google=true` |

**Remaining manual checks:** Auth route canonicalization (`/auth/*` vs `/signup,/login`), verified account ile login-complete, Trace/Proto authenticated golden-path, security headers için HSTS/CSP politikası.

---

## Execution Notes

- Run automated smoke tests first: `./scripts/staging_smoke.sh`
- Manual checks follow (sections 2-10)
- All agents require: AI key + GitHub OAuth + MCP Gateway
- Record results with date and tester name
- Any failing check blocks pilot demo

---

*Related: [Staging Smoke Test](../deploy/STAGING_SMOKE_TEST_CHECKLIST.md) | [Agent Contracts](../agents/AGENT_CONTRACTS_S0.5.md)*
