# Scribe Agent — Golden Path Acceptance Criteria

> **Task ID:** S0.5.1-AGT-3  
> **Status:** Done  
> **Dependencies:** OPS-6 (staging deploy), AGT-1 (agent contracts)

---

## 1. What the User Does (UI Flow)

1. Navigate to **Dashboard → Scribe** (`/dashboard/scribe`)
2. Confirm GitHub is connected (owner field shows `@<username>`)
3. Select a **repository** from the dropdown (populated from GitHub API)
4. Select a **base branch** (default: `main`)
5. Configure **Documentation Pack** (quick readme / standard / full)
6. Configure **Depth** (lite / standard / deep)
7. Optionally: expand **Advanced Options** → set target path, dry run, analyze N commits
8. Click **"Run Scribe"**
9. Observe **Logs** tab streaming progress events
10. Wait for **Status** card to show "Complete"
11. Switch to **Preview** tab to see generated documentation
12. Switch to **Diff** tab to see file-level changes
13. Optionally click **"Reset Console"** to start a new run

## 2. What the Backend Does

1. Receive `POST /api/agents/jobs` with `type: 'scribe'` and `ScribePayload`
2. Validate payload via `ScribePayloadSchema` (Zod)
3. Create a job record in DB (state: `pending`)
4. Return `{ jobId, state: 'pending' }`
5. Background worker picks up the job:
   - Resolve AI provider (user's active or auto-selected)
   - Clone repository via MCP Gateway (GitHub operations)
   - Analyze code structure (file tree, README detection)
   - Generate documentation plan (planning phase, temp=0.2 if deterministic)
   - Generate documentation artifacts (generation phase, temp=0.3 if deterministic)
   - Self-review generated content (reflection phase, temp=0.1 if deterministic)
   - Create branch, commit files, open PR via MCP Gateway
   - Update job state: `running` → `completed`
6. Trace events are persisted for each step (available via `?include=trace`)
7. Artifacts are persisted (available via `?include=artifacts`)

## 3. What Artifacts Are Produced

| Artifact | Description |
|----------|-------------|
| Branch | `scribe/docs-YYYYMMDD-HHMMSS` (auto-generated) |
| Commits | One commit per generated/updated doc file |
| Pull Request | PR linking branch to base branch with summary |
| Documentation Files | README.md, ARCHITECTURE.md, API.md, DEVELOPMENT.md (varies by pack) |
| Trace Events | Step-by-step execution log (clone → analyze → plan → generate → review → commit → PR) |

## 4. PASS / FAIL Criteria

### PASS — All must be true:

- [ ] Page renders at `/dashboard/scribe` with "Scribe Console" heading
- [ ] GitHub-connected user sees their repos and branches
- [ ] "Run Scribe" button is enabled when owner + repo + branch are selected
- [ ] Job submission sends correct payload shape (`type: 'scribe'`, `payload.owner/repo/baseBranch`)
- [ ] Logs tab streams progress events during job execution
- [ ] Status card transitions: Ready → Queued → Running → Complete
- [ ] Preview tab shows generated documentation content (after completion)
- [ ] Diff tab shows file changes (after completion)
- [ ] On job failure: Status shows "Failed", Logs show error message
- [ ] "Reset Console" clears state and returns to idle
- [ ] GitHub disconnected: Error notice shown, controls disabled

### FAIL — Any of:

- Page does not render or shows blank screen
- GitHub repos/branches fail to populate
- "Run Scribe" is permanently disabled
- Job submission sends malformed payload
- No progress events visible in Logs tab
- Status gets stuck (never reaches terminal state)
- Error messages are generic or missing (no structured error code)
- Frontend crashes on 503 ENCRYPTION_NOT_CONFIGURED

## 5. E2E Automated Coverage

| Test ID | Description | Spec File |
|---------|-------------|-----------|
| SC1 | Page renders with heading + config bar | `scribe-console.spec.ts` |
| SC2 | GitHub connected → owner, repo, branch visible | `scribe-console.spec.ts` |
| SC3 | Run Scribe enabled when config complete | `scribe-console.spec.ts` |
| SC4 | Golden path: submit → poll → completed + logs | `scribe-console.spec.ts` |
| SC5 | Submission fails (500) → error in logs | `scribe-console.spec.ts` |
| SC6 | Job fails during execution → error state | `scribe-console.spec.ts` |
| SC7 | Doc pack selector changes output targets | `scribe-console.spec.ts` |
| SC8 | GitHub not connected → error notice | `scribe-console.spec.ts` |
| SC9 | Logs tab idle state | `scribe-console.spec.ts` |
| SC10 | Reset Console clears state | `scribe-console.spec.ts` |
| SC11 | Correct route renders page | `scribe-console.spec.ts` |
| SC12 | Payload shape validation | `scribe-console.spec.ts` |

## 6. Pilot Demo Script (15-minute checklist)

### Prerequisites
- Staging deployed with latest backend + frontend
- GitHub OAuth connected for demo account
- `AI_KEY_ENCRYPTION_KEY` configured (verify via `curl /ready`)
- At least one AI provider key saved (OpenAI or OpenRouter)
- Target repository accessible via connected GitHub account

### Demo Steps

1. **Open Scribe Console** → Show the configuration bar layout
2. **Verify GitHub Integration** → Owner auto-populated, repos loading
3. **Select Repository** → Pick a demo repo with existing code
4. **Configure Doc Pack** → Switch between Quick README / Standard / Deep
5. **Show Advanced Options** → Target path, dry run toggle, commit analysis
6. **Run Scribe (Standard, Dry Run)** → Observe:
   - Logs streaming in real-time
   - Status transitions (Queued → Running → Complete)
   - Preview tab shows generated documentation
7. **Run Scribe (Standard, Real)** → Observe:
   - PR link in result
   - Diff tab shows committed changes
8. **Show Error Handling** → Disconnect AI key → try Run → show clear error message
9. **Reset Console** → Show clean slate for next run
10. **Wrap Up** → Summarize: config → run → review → ship

### Success Criteria for Demo
- No crashes or blank screens
- All transitions smooth and responsive
- Error messages are clear and actionable
- Total wall-clock time for one Scribe run: < 90 seconds

---

*This document is the canonical golden path definition for S0.5.1-AGT-3.*
