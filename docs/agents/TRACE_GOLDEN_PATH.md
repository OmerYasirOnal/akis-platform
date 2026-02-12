# Trace Agent — Golden Path Acceptance Criteria

> **Task ID:** S0.5.1-AGT-4  
> **Status:** Done  
> **Dependencies:** OPS-6 (staging deploy), AGT-1 (agent contracts)

---

## 1. What the User Does (UI Flow)

1. Navigate to **Agents → Trace** (`/agents/trace`)
2. Confirm agent status badge shows "Active" or "Inactive"
3. Enter a **test specification** in the textarea (acceptance criteria, user story, Gherkin, etc.)
4. Click **"Run Trace"**
5. Observe **Logs** tab streaming trace events in real-time
6. Wait for **Status** card to transition: Ready → Queued → Running → Complete
7. Switch to **Results** tab to see generated test plan (JSON format)
8. After completion, **Run Trace** button re-enables for a new run

## 2. What the Backend Does

1. Receive `POST /api/agents/jobs` with `type: 'trace'` and `TracePayload`
2. Validate payload: `spec` (required string), optional `aiProvider`
3. Create job record (state: `pending`)
4. Return `{ jobId, state: 'pending' }`
5. Background worker picks up the job:
   - Parse spec into test scenarios (Gherkin / arrow / colon / sentence strategies)
   - Generate test plan via AI (temp=0.2 if deterministic)
   - Generate test cases for each scenario (temp=0.3 if deterministic)
   - Build coverage matrix (feature → test mapping)
   - Optionally: create branch, commit test files, open PR
   - Update job state: `running` → `completed`
6. Trace events persisted for each step (available via `?include=trace`)
7. Results include `files`, `testPlan`, `coverageMatrix`, `metadata`

## 3. What Artifacts Are Produced

| Artifact | Description |
|----------|-------------|
| Test Plan | Markdown test plan covering all parsed scenarios |
| Test Cases | Array of `{ path, cases: [{ name, steps }] }` objects |
| Coverage Matrix | `Record<string, string[]>` — feature → test mapping |
| Trace Events | Step-by-step execution log (parse → plan → generate → review) |
| Metadata | `{ scenarioCount, totalTestCases, specLength }` |

## 4. PASS / FAIL Criteria

### PASS — All must be true:

- [ ] Page renders at `/agents/trace` with "Trace Console" heading
- [ ] Agent status badge visible (Active/Inactive)
- [ ] Textarea accepts specification input
- [ ] "Run Trace" button enables when spec is non-empty
- [ ] Job submission sends correct payload shape (`type: 'trace'`, `payload.spec`)
- [ ] Logs tab streams trace events during job execution
- [ ] Status card transitions: Ready → Queued → Running → Complete
- [ ] Results tab shows JSON-formatted output after completion
- [ ] On job failure: Status shows "Failed", Logs show error
- [ ] After completion, Run Trace re-enables for retry
- [ ] Deep link `/agents/trace` returns SPA HTML (not 404)

### FAIL — Any of:

- Page does not render or shows blank screen
- "Run Trace" is permanently disabled
- Job submission sends malformed payload
- No trace events visible in Logs tab
- Status gets stuck (never reaches terminal state)
- Error messages are generic or missing

## 5. E2E Automated Coverage

| Test ID | Description | Spec File |
|---------|-------------|-----------|
| T1 | Page renders with heading + config bar | `trace-console.spec.ts` |
| T2 | Run Trace enables when spec entered | `trace-console.spec.ts` |
| T3 | Logs and Results tabs visible | `trace-console.spec.ts` |
| T4 | Logs tab empty state | `trace-console.spec.ts` |
| T5 | Results tab empty state | `trace-console.spec.ts` |
| T6 | Golden path: submit → trace events → completed | `trace-console.spec.ts` |
| T7 | Submission error (500) → error in logs | `trace-console.spec.ts` |
| T8 | Job failure state → error message | `trace-console.spec.ts` |
| T9 | After completion, Run Trace re-enabled | `trace-console.spec.ts` |
| T10 | Deep link returns SPA HTML | `trace-console.spec.ts` |

## 6. Pilot Demo Script (10-minute checklist)

### Prerequisites
- Staging deployed with latest backend + frontend
- At least one AI provider key saved (OpenAI or OpenRouter)
- `AI_KEY_ENCRYPTION_KEY` configured (verify via `curl /ready`)

### Demo Steps

1. **Open Trace Console** → Show the specification input layout
2. **Enter Specification** → Paste a user story or acceptance criteria
3. **Run Trace** → Observe:
   - Logs streaming trace events in real-time
   - Status transitions (Queued → Running → Complete)
4. **Review Results** → Switch to Results tab, show JSON output
5. **Show Error Handling** → Submit empty spec → show validation
6. **Re-run** → Modify spec, re-run, observe fresh results
7. **Wrap Up** → Summarize: spec → run → review test plan

### Success Criteria for Demo
- No crashes or blank screens
- All transitions smooth and responsive
- Error messages are clear and actionable
- Total wall-clock time for one Trace run: < 60 seconds

---

*This document is the canonical golden path definition for S0.5.1-AGT-4.*
