# Proto Agent — Golden Path Acceptance Criteria

> **Task ID:** S0.5.1-AGT-5  
> **Status:** Done  
> **Dependencies:** OPS-6 (staging deploy), AGT-1 (agent contracts)

---

## 1. What the User Does (UI Flow)

1. Navigate to **Agents → Proto** (`/agents/proto`)
2. Confirm agent status badge shows "Active" or "Inactive"
3. Enter **requirements/goal** in the textarea
4. Optionally configure **prototype scope** (UI component / API endpoint / full-stack)
5. Click **"Run Proto"**
6. Observe **Logs** tab streaming progress events in real-time
7. Wait for **Status** card to transition: Ready → Queued → Running → Complete
8. Switch to **Results** tab to see generated prototype code
9. After completion, **Run Proto** button re-enables for a new run

## 2. What the Backend Does

1. Receive `POST /api/agents/jobs` with `type: 'proto'` and `ProtoPayload`
2. Validate payload: `description` (required string), optional `scope`, `aiProvider`
3. Create job record (state: `pending`)
4. Return `{ jobId, state: 'pending' }`
5. Background worker picks up the job:
   - Analyze feature description
   - Generate prototype plan via AI (temp=0.2 if deterministic)
   - Generate prototype code (temp=0.3 if deterministic)
   - Self-review generated code (temp=0.1 if deterministic)
   - Optionally: create branch, commit prototype files, open PR
   - Update job state: `running` → `completed`
6. Trace events persisted for each step (available via `?include=trace`)
7. Results include generated files, architecture notes, implementation plan

## 3. What Artifacts Are Produced

| Artifact | Description |
|----------|-------------|
| Prototype Files | Array of `{ path, content, language }` generated code files |
| Architecture Notes | High-level design decisions and rationale |
| Implementation Plan | Step-by-step plan for the prototype |
| Trace Events | Step-by-step execution log (analyze → plan → generate → review) |
| Metadata | `{ fileCount, totalLines, descriptionLength }` |

## 4. PASS / FAIL Criteria

### PASS — All must be true:

- [ ] Page renders at `/agents/proto` with "Proto Console" heading
- [ ] Agent status badge visible (Active/Inactive)
- [ ] Textarea accepts feature description input
- [ ] "Run Proto" button enables when description is non-empty
- [ ] Job submission sends correct payload shape (`type: 'proto'`, `payload.description`)
- [ ] Logs tab streams progress events during job execution
- [ ] Status card transitions: Ready → Queued → Running → Complete
- [ ] Results tab shows generated prototype content after completion
- [ ] On job failure: Status shows "Failed", Logs show error
- [ ] After completion, Run Proto re-enables for retry
- [ ] Deep link `/agents/proto` returns SPA HTML (not 404)

### FAIL — Any of:

- Page does not render or shows blank screen
- "Run Proto" is permanently disabled
- Job submission sends malformed payload
- No progress events visible in Logs tab
- Status gets stuck (never reaches terminal state)
- Error messages are generic or missing

## 5. E2E Automated Coverage

| Test ID | Description | Spec File |
|---------|-------------|-----------|
| P1 | Page renders with heading + config bar | `proto-console.spec.ts` |
| P2 | Run Proto enables when description entered | `proto-console.spec.ts` |
| P3 | Logs and Results tabs visible | `proto-console.spec.ts` |
| P4 | Logs tab empty state | `proto-console.spec.ts` |
| P5 | Results tab empty state | `proto-console.spec.ts` |
| P6 | Golden path: submit → events → completed | `proto-console.spec.ts` |
| P7 | Submission error (500) → error in logs | `proto-console.spec.ts` |
| P8 | Job failure state → error message | `proto-console.spec.ts` |
| P9 | Scope selector changes payload | `proto-console.spec.ts` |
| P10 | After completion, Run Proto re-enabled | `proto-console.spec.ts` |
| P11 | Deep link returns SPA HTML | `proto-console.spec.ts` |
| P12 | Payload shape validation | `proto-console.spec.ts` |

## 6. Pilot Demo Script (10-minute checklist)

### Prerequisites
- Staging deployed with latest backend + frontend
- At least one AI provider key saved (OpenAI or OpenRouter)
- `AI_KEY_ENCRYPTION_KEY` configured (verify via `curl /ready`)

### Demo Steps

1. **Open Proto Console** → Show the description input layout
2. **Enter Feature Description** → Describe a simple UI component
3. **Configure Scope** → Select "UI Component" or "Full-Stack"
4. **Run Proto** → Observe:
   - Logs streaming progress events in real-time
   - Status transitions (Queued → Running → Complete)
5. **Review Results** → Switch to Results tab, show generated code
6. **Show Error Handling** → Submit empty description → show validation
7. **Re-run** → Modify description, re-run, observe fresh results
8. **Wrap Up** → Summarize: describe → run → review prototype

### Success Criteria for Demo
- No crashes or blank screens
- All transitions smooth and responsive
- Error messages are clear and actionable
- Total wall-clock time for one Proto run: < 60 seconds

---

*This document is the canonical golden path definition for S0.5.1-AGT-5.*
