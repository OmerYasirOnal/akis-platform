# Staging Smoke Test Checklist

**Version**: 1.0.0
**Last Updated**: 2026-02-07
**Automation**: `scripts/staging_smoke.sh`

> This checklist mirrors the automated smoke script. Use it for manual verification or when the script is not available.

---

## Prerequisites

- Target: `https://staging.akisflow.com`
- Expected commit SHA (from `git rev-parse --short HEAD` or CI output)
- curl + jq installed

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

## Extended Tests (Manual)

| # | Test | How to Verify | Expected |
|---|------|---------------|----------|
| 6 | TLS certificate | Browser padlock icon or `curl -vI https://staging.akisflow.com 2>&1 \| grep 'SSL certificate'` | Valid Let's Encrypt cert, not expired |
| 7 | OAuth redirect | `curl -sI https://staging.akisflow.com/auth/oauth/github \| head -3` | HTTP 302 to `github.com/login/oauth/authorize` (or 503 if not configured) |
| 8 | Jobs API guard | `curl -sf -o /dev/null -w '%{http_code}' https://staging.akisflow.com/api/agents/jobs` | HTTP 401 |
| 9 | CORS headers | `curl -sI -H 'Origin: https://staging.akisflow.com' https://staging.akisflow.com/health \| grep -i 'access-control'` | Correct CORS headers present |
| 10 | Security headers | `curl -sI https://staging.akisflow.com/ \| grep -iE '(x-content-type|x-frame|strict-transport)'` | X-Content-Type-Options, X-Frame-Options headers present |

---

## Pass/Fail Criteria

- **ALL PASS**: Tests 1-5 must return expected results.
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

---

## Related Documents

- [OCI_STAGING_RUNBOOK.md](OCI_STAGING_RUNBOOK.md) — Full staging operations runbook
- [STAGING_ROLLBACK_RUNBOOK.md](STAGING_ROLLBACK_RUNBOOK.md) — Rollback procedures
- [../release/STAGING_RELEASE_CHECKLIST.md](../release/STAGING_RELEASE_CHECKLIST.md) — Release checklist
