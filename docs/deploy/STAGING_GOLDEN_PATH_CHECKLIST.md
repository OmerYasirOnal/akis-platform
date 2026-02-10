# Staging Golden Path Checklist

> M1 closeout verification: Scribe/Trace/Proto golden paths on staging with MCP Gateway always-on.
> Run after every staging deploy that touches agents, MCP, or orchestrator.

---

## Prerequisites

- [ ] Staging deploy completed successfully (check GitHub Actions: OCI Staging Deploy)
- [ ] `GITHUB_TOKEN` configured in staging `.env` (verify via `/ready` → `mcp.configured: true`)
- [ ] MCP Gateway container running (no manual profile — always-on in default stack)
- [ ] At least one user account with an active AI key on staging

---

## Step 0: Infrastructure Verification

```bash
# 1. Health check
curl -s https://staging.akisflow.com/health | jq .
# Expected: { "status": "ok" }

# 2. Readiness check (MCP fields — always present)
curl -s https://staging.akisflow.com/ready | jq '.mcp'
# Expected (healthy):
# {
#   "configured": true,
#   "gatewayReachable": true,
#   "baseUrl": "http://mcp-gateway:4010/mcp",
#   "missingEnv": [],
#   "error": null
# }
# If configured=false → check missingEnv array for which env vars are missing
# If gatewayReachable=false → gateway container is down or unreachable

# 3. Version check
curl -s https://staging.akisflow.com/version | jq .
# Record version for evidence
```

---

## Step 1: Scribe Golden Path

| # | Action | Expected Result |
|---|--------|----------------|
| 1 | Navigate to `/agents/scribe` (logged in) | Scribe console loads, GitHub owner field populated |
| 2 | Select a repository from dropdown | Repos fetched from MCP Gateway → GitHub API |
| 3 | Set: base branch = `main`, doc pack = "Standard", depth = "Lite" | Form validates |
| 4 | Enable **Dry Run** (avoids creating real PRs) | Checkbox checked |
| 5 | Click **"Run Scribe"** | Job created, status → Queued → Running |
| 6 | Observe Logs tab | SSE events streaming: plan → generate → reflect steps |
| 7 | Wait for status = **Complete** | Job finishes without `MISSING_DEPENDENCY` or MCP errors |
| 8 | Check Preview tab | Generated documentation visible |

**Pass criteria:** Job reaches `completed` state. No `MISSING_DEPENDENCY`, `MCP_UNAVAILABLE`, or `GATEWAY_ERROR` in logs.

---

## Step 2: Trace Golden Path

| # | Action | Expected Result |
|---|--------|----------------|
| 1 | Navigate to `/agents/trace` | Trace console loads |
| 2 | Enter test spec: `"User can login with email and password, sees dashboard after redirect"` | Textarea accepts input |
| 3 | Click **"Run Trace"** | Job created, status transitions start |
| 4 | Observe Logs tab | SSE events: analysis → plan → generate test cases |
| 5 | Wait for status = **Complete** | Job finishes |
| 6 | Check Results tab | Test plan JSON with test cases visible |

**Pass criteria:** Job reaches `completed` state. Generated test plan contains at least 1 test case.

---

## Step 3: Proto Golden Path

| # | Action | Expected Result |
|---|--------|----------------|
| 1 | Navigate to `/agents/proto` | Proto console loads |
| 2 | Enter description: `"A simple REST API endpoint that returns user profile data"` | Textarea accepts input |
| 3 | Set scope to "API endpoint" (if available) | Option selected |
| 4 | Click **"Run Proto"** | Job created, status transitions start |
| 5 | Observe Logs tab | SSE events: plan → scaffold → review |
| 6 | Wait for status = **Complete** | Job finishes |
| 7 | Check Results tab | Generated prototype code visible |

**Pass criteria:** Job reaches `completed` state. Output contains code artifacts.

---

## Evidence Collection

After all 3 golden paths pass:

1. **Record job IDs** from each run (visible in URL: `/dashboard/jobs/:id`)
2. **Take screenshots** (use `?shot=1` for PII masking):
   - `/agents/scribe?shot=1` — completed Scribe job
   - `/agents/trace?shot=1` — completed Trace job
   - `/agents/proto?shot=1` — completed Proto job
3. **Save `/ready` output** showing `mcp.configured: true, mcp.github: true`
4. **Update docs:**
   - `docs/NEXT.md` — check off the M1 golden path item
   - `docs/qa/GRADUATION_EVIDENCE.md` — add run IDs/dates if needed

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `mcp.configured: false` | Check `mcp.missingEnv` array | Add listed env vars to staging `.env` (e.g. `GITHUB_MCP_BASE_URL`, `GITHUB_TOKEN`) |
| `mcp.gatewayReachable: false` | Gateway down or unreachable | Check `docker compose logs mcp-gateway`; verify container is running |
| `MISSING_DEPENDENCY` in job logs | AI key not configured for user | Add API key in Settings → AI Keys |
| Job stuck in `running` | Stale job watchdog timeout | Wait 5min; check `StaleJobWatchdog` logs |
| `GATEWAY_ERROR` | MCP Gateway network issue | Restart: `docker compose restart mcp-gateway` |
