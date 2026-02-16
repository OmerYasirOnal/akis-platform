# Staging Smoke Test Checklist

**Version**: 2.1.0
**Last Updated**: 2026-02-16
**Automation**: `scripts/staging_smoke.sh`

> This checklist mirrors the automated smoke script. Use it for manual verification or when the script is not available.

---

## Prerequisites

- Target: `https://staging.akisflow.com`
- Expected commit SHA (from `git rev-parse --short HEAD` or CI output)
- curl + jq installed

---

## Latest Verified Baseline (2026-02-16)

| Item | Value |
|------|-------|
| Deployed Commit | `ee5041f` |
| Scripted smoke | 13/13 PASS |
| Manual route smoke | 13/13 PASS |
| Browser E2E (staging) | 61/61 PASS |
| Browser E2E (local UI M2 pack) | 50/50 PASS |
| QA evidence pack | [`../qa/QA_EVIDENCE_STAGING_SMOKE_PACK.md`](../qa/QA_EVIDENCE_STAGING_SMOKE_PACK.md) |

---

## Test Matrix

| # | Test | Command | Expected | Pass/Fail | Exit Code |
|---|------|---------|----------|-----------|-----------|
| 1 | Health endpoint | `curl -sf https://staging.akisflow.com/health \| jq .` | `{"status":"ok"}` (HTTP 200) | | 2 |
| 2 | Ready endpoint | `curl -sf https://staging.akisflow.com/ready \| jq .` | `{"ready":true}` + DB connected (HTTP 200) | | 2 |
| 3 | Version match | `curl -sf https://staging.akisflow.com/version \| jq -r '.commit'` | Matches expected commit SHA | | 1 (CRITICAL) |
| 4 | Frontend loads | `curl -sf https://staging.akisflow.com/ \| grep 'id="root"'` | HTML contains `<div id="root">` (HTTP 200) | | 3 |
| 5 | Auth guard (unauth) | `curl -sf -o /dev/null -w '%{http_code}' https://staging.akisflow.com/auth/me` | HTTP 401 | | 4 |

---

## Automated Tests (New — added in v2.0.0)

| # | Test | Command | Expected | Pass/Fail | Exit Code |
|---|------|---------|----------|-----------|-----------|
| 6 | SPA deep link | `curl -sf https://staging.akisflow.com/auth/privacy-consent \| head -c 50` | HTML (SPA served, HTTP 200) | | 4 |
| 7 | MCP Gateway readiness | `curl -sf https://staging.akisflow.com/ready \| jq .mcp` | `configured: true, gatewayReachable: true, baseUrl: "http://mcp-gateway:4010/mcp", missingEnv: []` | | 2 (REQUIRED) |
| 8 | Canonical logo | `curl -sI https://staging.akisflow.com/brand/logo.png \| head -5` | HTTP 200 | | — |
| 9 | Agents hub route | `curl -sf https://staging.akisflow.com/agents \| head -c 50` | HTML (SPA served, HTTP 200) | | — |
| 10 | OAuth providers | `curl -sf https://staging.akisflow.com/ready \| jq .oauth` | `github: true` and/or `google: true` | | — |

## Extended Tests (Manual)

| # | Test | How to Verify | Expected |
|---|------|---------------|----------|
| 11 | TLS certificate | Browser padlock icon or `curl -vI https://staging.akisflow.com 2>&1 \| grep 'SSL certificate'` | Valid Let's Encrypt cert, not expired |
| 12 | OAuth redirect | `curl -sI https://staging.akisflow.com/auth/oauth/github \| head -3` | HTTP 302 to `github.com/login/oauth/authorize` (or 503 if not configured) |
| 13 | Jobs API guard | `curl -sf -o /dev/null -w '%{http_code}' https://staging.akisflow.com/api/agents/jobs` | HTTP 401 |
| 14 | CORS headers | `curl -sI -H 'Origin: https://staging.akisflow.com' https://staging.akisflow.com/health \| grep -i 'access-control'` | Correct CORS headers present |
| 15 | Security headers | `curl -sI https://staging.akisflow.com/ \| grep -iE '(x-content-type\|x-frame\|strict-transport)'` | X-Content-Type-Options, X-Frame-Options headers present |
| 16 | Route redirect (browser) | Navigate to `/dashboard/scribe` in browser | Redirects to `/agents/scribe` |
| 17 | OAuth welcome email | Sign in with new Google/GitHub account | Welcome email arrives (check inbox + backend logs for `SmtpEmailService`) |
| 18 | Agent job MCP | Run Scribe dry-run job from `/agents/scribe` | No `MISSING_DEPENDENCY` error; job completes or produces expected output |
| 19 | LiveAgentCanvas (S0.5.3-UX-15) | Navigate to `/agents/scribe`, run job, switch to Logs tab | PhaseProgressBanner, InnerMonologue, PhaseActivityCards render in real-time |
| 20 | Agent console routes | Navigate to `/agents/scribe`, `/agents/trace`, `/agents/proto` | Each renders dedicated console with LiveAgentCanvas |
| 21 | Jobs user isolation (S0.5.3-AUTH-3) | With User A session, `GET /api/agents/jobs`; then try User A's job ID with User B's session | User B gets 404, no cross-user data leak |
| 22 | Manual UI artifact pack | Check `output/manual-ui-*/report.json` and screenshots | Route matrix ve interaction kanıtı mevcut |

---

## Pass/Fail Criteria

- **ALL PASS**: Tests 1-10 must return expected results (automated).
- **CRITICAL FAIL (Exit 1)**: Version mismatch (Test 3) — indicates wrong image deployed. **Rollback immediately**.
- **SERVICE FAIL (Exit 2)**: Health/Ready failing — backend not running. Check container status and logs.
- **FRONTEND FAIL (Exit 3)**: Frontend not loading — check Caddy config and static file serving.
- **API FAIL (Exit 4)**: API endpoints not responding correctly — check backend routes.

---

## Automated Execution

```bash
# Basic smoke (no version check)
./scripts/staging_smoke.sh

# With version verification (recommended after deploy)
./scripts/staging_smoke.sh --commit $(git rev-parse --short HEAD)

# Custom host
./scripts/staging_smoke.sh --host staging.akisflow.com --commit abc1234

# Extended timeout (for slow boot)
./scripts/staging_smoke.sh --timeout 300
```

### Retry Behavior

The automated script:
- Attempts up to **30 times** with **5-second** intervals (150s total)
- Waits for the backend to become healthy before running tests
- Exits with specific codes for each failure type

---

## Post-Smoke Actions

| Result | Action |
|--------|--------|
| All pass | Deploy confirmed, update deploy log |
| Version mismatch | **Rollback** — see [STAGING_ROLLBACK_RUNBOOK.md](STAGING_ROLLBACK_RUNBOOK.md) |
| Health fail | Check `docker compose logs backend --tail=100` |
| Frontend fail | Check Caddy logs and `/srv/frontend/` contents |
| Evidence missing | Update [`../qa/QA_EVIDENCE_STAGING_SMOKE_PACK.md`](../qa/QA_EVIDENCE_STAGING_SMOKE_PACK.md) before release sign-off |

---

## Related Documents

- [OCI_STAGING_RUNBOOK.md](OCI_STAGING_RUNBOOK.md) — Full staging operations runbook
- [STAGING_ROLLBACK_RUNBOOK.md](STAGING_ROLLBACK_RUNBOOK.md) — Rollback procedures
- [../release/STAGING_RELEASE_CHECKLIST.md](../release/STAGING_RELEASE_CHECKLIST.md) — Release checklist
