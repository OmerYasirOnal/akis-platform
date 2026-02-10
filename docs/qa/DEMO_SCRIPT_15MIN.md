# Demo Script — AKIS Platform Pilot Demo (15 Dakika)

> **Task:** S0.5.3-QA-2
> **Date:** 2026-02-09
> **Duration:** 15 minutes (12 min content + 3 min Q&A buffer)
> **Presenter:** Ömer Yasir Onal
> **Staging URL:** https://staging.akisflow.com

---

## Pre-Demo Checklist

- [ ] Staging running: `curl -s https://staging.akisflow.com/health | jq .status`
- [ ] Smoke tests passing: `./scripts/staging_smoke.sh`
- [ ] Test user account created and logged in (use email/password or Google OAuth)
- [ ] AI key configured (OpenRouter or OpenAI)
- [ ] GitHub OAuth connected (for Scribe demo)
- [ ] MCP Gateway running (check `/ready` → `mcp.configured: true`)
- [ ] Browser: Chrome, clean profile, bookmarks bar hidden
- [ ] Screen resolution: 1920x1080, zoom 100%
- [ ] Demo repo available: a simple Node.js project on GitHub

---

## Pilot Golden Paths (Mandatory)

| Path | Exact URL | Acceptance Criteria |
|---|---|---|
| GP-1 Auth signup/login | `https://staging.akisflow.com/auth/signup` + `https://staging.akisflow.com/auth/login` | Signup/login works, redirect to `/dashboard` |
| GP-2 /ready + MCP | `https://staging.akisflow.com/ready` | `ready=true`, `mcp.configured=true`, `mcp.gatewayReachable=true` |
| GP-3 Scribe docpack | `https://staging.akisflow.com/agents/scribe` | Job completes, doc output visible |
| GP-4 Trace test plan | `https://staging.akisflow.com/agents/trace` | Job completes, test plan output visible |
| GP-5 SSE + RunSummary | `https://staging.akisflow.com/api/agents/jobs/<jobId>/stream` + `https://staging.akisflow.com/dashboard/jobs/<jobId>` | Live events stream and RunSummary panel renders |

---

## Timeline

| Time | Section | Duration |
|------|---------|----------|
| 0:00 | Introduction & Context | 1 min |
| 1:00 | GP-1 Auth + GP-2 /ready | 5 min |
| 6:00 | GP-3 Scribe docpack | 4 min |
| 10:00 | GP-4 Trace + GP-5 SSE/RunSummary | 3 min |
| 13:00 | Architecture + Q&A buffer | 2 min |

---

## Section 1: Introduction & Context (0:00 – 2:00)

### Talking Points

1. **Problem statement:**
   - "Software teams generate code faster than documentation keeps up."
   - "AI agents can automate tedious development tasks — documentation, testing, prototyping."

2. **What is AKIS?**
   - "AKIS Platform is an AI agent orchestration system."
   - "Three specialized agents: Scribe (documentation), Trace (test plans), Proto (prototyping)."
   - "Each agent follows a structured pipeline: Plan → Execute → Review."

3. **Tech stack (brief):**
   - "React + TypeScript frontend, Fastify + PostgreSQL backend, MCP protocol for GitHub integration."

### Screen

- Show landing page: `https://staging.akisflow.com`
- Point out tagline and agent cards

---

## Section 2: Platform Walkthrough (2:00 – 5:00)

### Step-by-step

1. **Login flow:**
   - Navigate to `https://staging.akisflow.com/login`
   - Enter test account email → password
   - Show successful login redirect to `/dashboard`

2. **Dashboard overview:**
   - Point out Getting Started card (3-step onboarding checklist)
   - Show sidebar navigation: Dashboard, Agents Hub, Jobs, Settings

3. **AI Key configuration:**
   - Navigate to `/dashboard/settings/ai-keys`
   - Show that a key is already configured (green indicator)
   - Explain: "Users bring their own API key — we encrypt it with AES-256-GCM at rest."

4. **Agents Hub:**
   - Navigate to `/agents`
   - Show three agent cards: Scribe, Trace, Proto
   - Point out status badges (Active/Inactive)
   - Explain: "Each agent has its own console page with real-time logs."

### Fallback

If login fails:
- Check `/health` and `/ready` endpoints in a new tab
- Use browser developer tools to check for CORS or cookie issues
- If unresolvable: switch to screenshots or local dev server

---

## Section 3: Scribe Agent Demo (5:00 – 10:00)

### Step-by-step

1. **Open Scribe console:**
   - Click Scribe card or navigate to `/agents/scribe`
   - Point out: repo selector, branch selector, doc pack dropdown, depth slider

2. **Configure the job:**
   - Select demo repo from dropdown (e.g., `omeryasironal/demo-project`)
   - Select branch: `main`
   - Doc pack: "Standard" (README + API docs)
   - Depth: "Standard"
   - Click **"Run Scribe"**

3. **Watch execution:**
   - Switch to **Logs tab** — show real-time trace events streaming
   - Point out phases: Thinking → Discovery → Reading → Creating → Reviewing → Publishing
   - Explain: "The agent reads repo files via MCP, generates docs with AI, reviews its own output."

4. **Review results:**
   - Switch to **Preview tab** — show generated documentation
   - Switch to **Diff tab** — show file changes
   - Explain: "The agent created a PR with these docs. It follows a structured pipeline."

5. **Error handling (quick):**
   - Explain: "If the AI key is missing, users see a clear error: 'No AI key configured.'"
   - Reference error taxonomy from AGENT_CONTRACTS_S0.5.md

### Fallback

If job execution fails:
- Show the Logs tab to demonstrate the trace system works
- Show a pre-recorded screenshot/video of a successful Scribe run
- Explain: "In a production setup with all environment variables configured, this completes in ~60 seconds."

### GP-4 Trace Demo (Quick)

1. Navigate to `https://staging.akisflow.com/agents/trace`
2. Enter a short spec and click **"Run Trace"**
3. Verify status reaches `completed`
4. Confirm Results tab shows generated test plan

### GP-5 SSE + RunSummary Demo (Quick)

1. Open `https://staging.akisflow.com/dashboard/jobs/<jobId>` for the running/completed job
2. Verify Logs/Timeline receives live events
3. Verify RunSummary panel shows AI totals and execution summary

---

## Section 4: Architecture Overview (10:00 – 13:00)

### Talking Points

1. **System architecture diagram:**
   - "Frontend SPA → Fastify Backend → PostgreSQL"
   - "Agents run in the backend, orchestrated by AgentOrchestrator"
   - "GitHub access through MCP protocol adapters — no direct vendor SDKs"

2. **Agent orchestration:**
   - "FSM: pending → running → completed | failed"
   - "Orchestrator injects tools — agents never call each other"
   - "Context packs provide repo files to agents deterministically"

3. **Quality & testing:**
   - "382+ backend unit tests, 94 frontend tests"
   - "E2E golden path tests for each agent (Playwright)"
   - "Regression checklist with 70+ checks"

4. **Deployment:**
   - "OCI Free Tier VM + Caddy reverse proxy + Docker Compose"
   - "CI/CD: GitHub Actions for build + typecheck + lint + test"

### Screen

- Show `/ready` endpoint response (JSON with service status)
- Show architecture reference from docs if available

---

## Section 5: Q&A (13:00 – 15:00)

### Anticipated Questions

| Question | Answer |
|----------|--------|
| "How is the AI key stored?" | "AES-256-GCM encryption at rest, decrypted only at runtime for agent execution." |
| "What AI models do you support?" | "OpenRouter (gpt-5-mini, gpt-4o-mini, gpt-5.2) and direct OpenAI. Users choose per agent." |
| "Can agents call each other?" | "No. The orchestrator controls the lifecycle. Agents are isolated by design." |
| "What happens if the AI API is down?" | "Structured error: AI_RATE_LIMITED or AI_PROVIDER_ERROR, with retry logic." |
| "Is this deployed somewhere?" | "Yes, staging.akisflow.com on OCI Free Tier. Single VM, Docker Compose." |
| "What's the testing coverage?" | "382 backend + 94 frontend tests. E2E golden path tests per agent." |

---

## Demo Artifacts

| Resource | Location |
|----------|----------|
| Staging URL | https://staging.akisflow.com |
| Health check | `GET /health` → `{"status":"ok"}` |
| Ready check | `GET /ready` → service status JSON |
| Agent contracts | `docs/agents/AGENT_CONTRACTS_S0.5.md` |
| Regression checklist | `docs/qa/REGRESSION_CHECKLIST.md` |
| Context packs ADR | `docs/agents/CONTEXT_PACKS.md` |
| Golden path docs | `docs/agents/SCRIBE_GOLDEN_PATH.md`, `TRACE_GOLDEN_PATH.md`, `PROTO_GOLDEN_PATH.md` |

---

## Post-Demo

- Collect feedback via FeedbackWidget (floating button on platform)
- Note any issues encountered during demo
- Update regression checklist with results

---

*Related: [Regression Checklist](REGRESSION_CHECKLIST.md) | [Agent Contracts](../agents/AGENT_CONTRACTS_S0.5.md)*
