# SCRIBE PR Factory v1 — Design Document

**Version**: 1.0  
**Status**: Implementation Ready  
**Owner**: Platform Team  
**Created**: 2025-12-21  
**Last Updated**: 2025-12-21

---

## Executive Summary

This document defines the architecture for transforming SCRIBE into a reliable, cost-controlled, security-conscious **PR-producing pipeline** based on the "Playbook for Reliable PR-Generating AI Agents". The design implements:

- **Contract-first** plan artifacts (saved, reviewable)
- **Dry-run by default** with human approval gates for risky/costly actions
- **Evidence-first** PR descriptions (tests/lint/typecheck/build/security scan links/artifacts)
- **Reflect/critique phase** before asking for review
- **Strong observability**: trace timeline + preserved artifacts (plans, diffs, logs, previews)

---

## Current State Analysis

### Existing Infrastructure (What We Have)

| Component | Status | Location |
|-----------|--------|----------|
| **Job State Machine** | ✅ Exists | `backend/src/core/state/AgentStateMachine.ts` |
| **Job States** | ✅ `pending`, `running`, `completed`, `failed`, `awaiting_approval` | `backend/src/db/schema.ts` |
| **Approval Fields** | ✅ `requiresApproval`, `approvedBy`, `approvedAt`, `rejectedBy`, `rejectedAt`, `approvalComment` | `backend/src/db/schema.ts` |
| **TraceRecorder** | ✅ Explainability fields (asked/did/why) | `backend/src/core/tracing/TraceRecorder.ts` |
| **Scribe Agent** | ✅ Contract-first docs, playbook workflow | `backend/src/agents/scribe/ScribeAgent.ts` |
| **Timeline UI** | ✅ StepTimeline, filters, grouping | `frontend/src/components/agents/StepTimeline.tsx` |
| **Artifact Preview** | ✅ Inline preview, diff view | `frontend/src/components/jobs/ArtifactPreview.tsx` |
| **PR Metadata Card** | ✅ Repo, branch, commit, PR link | `frontend/src/components/jobs/PRMetadataCard.tsx` |
| **Secret Redaction** | ✅ Token patterns, field patterns | `TraceRecorder.ts` |

### Gaps to Fill (What We Need)

| Component | Status | Priority |
|-----------|--------|----------|
| **Contract/Plan Artifact** | ❌ Missing | P0 |
| **Plan Approval Gate** | ⚠️ Partial (state exists, flow missing) | P0 |
| **Evidence-First PR Template** | ❌ Missing | P1 |
| **Reflect/Critique Phase** | ❌ Missing | P1 |
| **Cost-Aware Execution** | ❌ Missing | P2 |
| **Plan Tab in UI** | ⚠️ Tab exists, content missing | P1 |
| **Reflection Report Artifact** | ❌ Missing | P1 |
| **Screenshot Artifacts** | ❌ Missing | P2 |

---

## Target Architecture

### Pipeline Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SCRIBE PR FACTORY v1 PIPELINE                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌─────────┐ │
│  │  INTAKE  │───▶│   PLAN   │───▶│  AWAIT   │───▶│ EXECUTE  │───▶│VALIDATE │ │
│  │  & CONTEXT│   │(Contract)│   │ APPROVAL │    │(Dry-Run) │    │(Tests)  │ │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘    └─────────┘ │
│       │               │               │               │               │       │
│       ▼               ▼               ▼               ▼               ▼       │
│   [Context]       [Plan.md]      [Approval]      [Changes]       [Evidence]   │
│   Artifact        Artifact        Event          Artifacts        Artifacts   │
│                                                                               │
│                                                                               │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────────────────────┐ │
│  │ REFLECT  │───▶│ REFINE   │───▶│  HUMAN   │───▶│  APPROVE & MERGE (Human) │ │
│  │(Critique)│    │   PR     │    │  REVIEW  │    │                          │ │
│  └──────────┘    └──────────┘    └──────────┘    └──────────────────────────┘ │
│       │               │               │                      │                │
│       ▼               ▼               ▼                      ▼                │
│   [Reflection]   [PR with       [Comments]              [Merged]              │
│    Artifact      Evidence]                                                    │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### State Transitions

```
                    ┌───────────────────────┐
                    │       pending         │
                    │   (Job submitted)     │
                    └───────────┬───────────┘
                                │ start()
                                ▼
                    ┌───────────────────────┐
                    │       running         │◀───────────┐
                    │   (Plan generation)   │            │
                    └───────────┬───────────┘            │
                                │ plan generated         │ approve()
                                ▼                        │
                    ┌───────────────────────┐            │
                    │   awaiting_approval   │────────────┤
                    │   (Human reviews)     │            │
                    └───────────┬───────────┘            │
                                │                        │
               ┌────────────────┼────────────────┐       │
               │ reject()       │                │       │
               ▼                ▼                │       │
    ┌──────────────────┐   (re-run with edits)  │       │
    │     failed       │                        │       │
    │   (Rejected)     │                        │       │
    └──────────────────┘                        │       │
                                                │       │
                                                ▼       │
                    ┌───────────────────────────────────┘
                    │       running           │
                    │   (Execution phase)     │
                    └───────────┬─────────────┘
                                │
               ┌────────────────┼────────────────┐
               │ error          │ success        │
               ▼                ▼                │
    ┌──────────────────┐    ┌──────────────────┐│
    │     failed       │    │    completed     ││
    │   (Error)        │    │   (PR ready)     ││
    └──────────────────┘    └──────────────────┘│
```

---

## Step Model (From Playbook)

### Step 1: Task Intake & Context Gathering

**Acceptance Criteria:**
- [ ] Agent confirms exact requirements
- [ ] Fetches all relevant context (code files, config, related PRs)
- [ ] Summarizes the issue in its own words
- [ ] Lists key files to change or investigate

**Artifacts Produced:**
- `context_summary.json` — Files discovered, dependencies identified
- Trace event: `reasoning` with context gathering summary

**Implementation:**
```typescript
// backend/src/agents/scribe/ScribeAgent.ts
async gatherContext(task: ScribeTaskContext): Promise<ContextArtifact> {
  this.traceRecorder?.recordReasoning({
    phase: 'intake',
    summary: `Analyzing task: ${task.taskDescription}. Target: ${task.targetPath || 'repository root'}. Mode: ${task.dryRun ? 'dry-run' : 'execute'}.`,
  });
  
  // Discover files, dependencies, existing docs
  const context = await this.discoverContext(task);
  
  await this.traceRecorder?.recordArtifact({
    artifactType: 'context_summary',
    path: 'context_summary.json',
    operation: 'create',
    preview: JSON.stringify(context, null, 2).substring(0, 1000),
  });
  
  return context;
}
```

---

### Step 2: Planning Phase (Draft the Contract)

**Acceptance Criteria:**
- [ ] Plan fills in all playbook sections (see below)
- [ ] Plan is saved to `job_plans` table for audit
- [ ] Job transitions to `awaiting_approval` state
- [ ] Human can review plan before execution

**Plan Document Structure:**

```markdown
# Agent Job Plan

## Objective & Context
<!-- What issue/task is being addressed? Link to issue tracker if applicable -->

## Scope & Constraints
<!-- In-scope modules/files, out-of-scope items, constraints (coding standards, performance budgets, security rules) -->

## Proposed Solution Plan
<!-- Step-by-step approach: what will be changed, why this approach -->

## Validation Strategy
<!-- How will the agent validate the change? Tests, linters, type checks -->

## Rollback / Mitigation Plan
<!-- If the change fails, how to revert? Feature flag? -->

## Documentation & Comments
<!-- What docs/comments will be updated? -->

## AI Usage Disclosure
<!-- "This PR was produced by SCRIBE Agent v2" -->

## Evidence Checklist
- [ ] Tests passed: (link to CI run)
- [ ] Lint/Typecheck passed: (link)
- [ ] Security scan: (link or "N/A")
- [ ] Coverage: X% → Y%
```

**Database Schema Extension:**

```sql
-- New table for plan artifacts
CREATE TABLE job_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  plan_markdown TEXT NOT NULL,
  plan_json JSONB, -- Structured plan data for programmatic access
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_job_plans_job_id ON job_plans(job_id);
```

---

### Step 3: Dry-Run Execution

**Acceptance Criteria:**
- [ ] No real changes written until approval
- [ ] Produces draft PR on new branch (e.g., `agent/feature-123`)
- [ ] Labels PR as `[WIP][AI]`
- [ ] Captures diff preview and commit list in artifacts

**Artifacts Produced:**
- `file_preview` artifacts for each changed file
- `diff_preview` in artifact metadata
- Trace events for all tool calls with explainability

**Implementation:**

```typescript
async executeDryRun(plan: Plan, context: ContextArtifact): Promise<DryRunResult> {
  this.traceRecorder?.recordDecision({
    title: 'Execution Mode',
    decision: 'Dry-run mode: simulating changes without writing to repository',
    reasoning: 'User requested dry-run or plan requires approval before execution.',
  });
  
  for (const file of plan.filesToChange) {
    const content = await this.generateContent(file, context);
    
    this.traceRecorder?.recordFilePreview({
      path: file.path,
      sizeBytes: content.length,
      preview: content.substring(0, 500),
      diffPreview: this.generateDiff(file.originalContent, content),
      linesAdded: this.countAddedLines(file.originalContent, content),
    });
  }
  
  return { success: true, filesPreviewCount: plan.filesToChange.length };
}
```

---

### Step 4: Validation Phase (Self-Check and Test)

**Acceptance Criteria:**
- [ ] All static checks pass (linter, type-check, build)
- [ ] All targeted tests pass
- [ ] Agent gathers results as evidence
- [ ] If issues found, agent revises and re-runs validation

**Artifacts Produced:**
- `validation_report.json` — Test results, lint output, build status

**Implementation:**

```typescript
async validate(changes: ChangeSet): Promise<ValidationResult> {
  this.traceRecorder?.startStep('validation', 'Running validation checks');
  
  const results = await Promise.all([
    this.runLint(changes),
    this.runTypeCheck(changes),
    this.runTests(changes),
    this.runBuild(changes),
  ]);
  
  const report = {
    lint: results[0],
    typecheck: results[1],
    tests: results[2],
    build: results[3],
    allPassed: results.every(r => r.passed),
  };
  
  await this.traceRecorder?.recordArtifact({
    artifactType: 'validation_report',
    path: 'validation_report.json',
    operation: 'create',
    preview: JSON.stringify(report, null, 2),
  });
  
  this.traceRecorder?.completeStep('validation', 'Validation complete', { report });
  
  return report;
}
```

---

### Step 5: Reflect / Critique Phase

**Acceptance Criteria:**
- [ ] Agent runs internal critique over diff + plan compliance
- [ ] If issues found, agent iterates (bounded retries)
- [ ] Reflection output saved as artifact

**Reflection Report Structure:**

```json
{
  "planAdherence": {
    "passed": true,
    "notes": "All required sections addressed"
  },
  "riskyChanges": {
    "found": false,
    "details": []
  },
  "testGaps": {
    "found": false,
    "details": []
  },
  "securityConcerns": {
    "found": false,
    "details": []
  },
  "rollbackSanity": {
    "passed": true,
    "notes": "Changes can be reverted via git revert"
  },
  "recommendation": "APPROVE" | "NEEDS_WORK" | "REJECT"
}
```

**Implementation:**

```typescript
async reflect(plan: Plan, changes: ChangeSet, validation: ValidationResult): Promise<ReflectionReport> {
  this.traceRecorder?.startStep('reflect', 'Running self-critique');
  
  const prompt = `
    You are a senior code reviewer. Analyze the following:
    
    PLAN:
    ${plan.markdown}
    
    CHANGES:
    ${changes.diffSummary}
    
    VALIDATION:
    ${JSON.stringify(validation)}
    
    Evaluate:
    1. Does the implementation match the plan?
    2. Are there risky changes (security, performance, breaking)?
    3. Are there test gaps?
    4. Can changes be safely rolled back?
    
    Output JSON following the ReflectionReport schema.
  `;
  
  const reflection = await this.aiService?.generateReflection(prompt);
  
  await this.traceRecorder?.recordArtifact({
    artifactType: 'reflection_report',
    path: 'reflection_report.json',
    operation: 'create',
    preview: JSON.stringify(reflection, null, 2),
  });
  
  this.traceRecorder?.recordReasoning({
    phase: 'reflection',
    summary: `Self-critique complete. Recommendation: ${reflection.recommendation}. ${reflection.planAdherence.notes}`,
  });
  
  return reflection;
}
```

**Retry Policy:**

```typescript
const MAX_RETRIES = 3;
let attempt = 0;

while (attempt < MAX_RETRIES) {
  const reflection = await this.reflect(plan, changes, validation);
  
  if (reflection.recommendation === 'APPROVE') {
    break;
  }
  
  if (reflection.recommendation === 'REJECT') {
    throw new Error('Agent self-critique rejected changes');
  }
  
  // NEEDS_WORK: revise and retry
  changes = await this.revise(changes, reflection);
  validation = await this.validate(changes);
  attempt++;
}

if (attempt >= MAX_RETRIES) {
  // Escalate to human
  await this.escalateToHuman('Max retries exceeded during self-critique');
}
```

---

### Step 6: PR Refinement & Documentation

**Acceptance Criteria:**
- [ ] PR description filled with all required sections
- [ ] Evidence links attached (CI run, coverage report)
- [ ] Documentation updated if needed
- [ ] PR title and description are clear and appropriately formatted

**PR Template:**

```markdown
## Summary
<!-- Brief description of what this PR does -->

## Changes
<!-- List of files changed and why -->

## Evidence
- [ ] Tests: [CI Run #123](link)
- [ ] Lint/Typecheck: ✅ Passed
- [ ] Coverage: 85% → 87%
- [ ] Security Scan: N/A

## Rollback Plan
<!-- How to revert if needed -->

## AI Disclosure
This PR was generated by SCRIBE Agent v2 on AKIS Platform.
Job ID: `{jobId}`
Correlation ID: `{correlationId}`
```

---

### Step 7: Human Review & Iteration

**Acceptance Criteria:**
- [ ] Human reviewer inspects the PR
- [ ] Feedback applied by human or agent
- [ ] All reviewer comments addressed
- [ ] Agent cannot merge its own PR

**Implementation:**

```typescript
// backend/src/api/agents.ts - Existing approval endpoint
fastify.post('/jobs/:id/approve', async (request, reply) => {
  const { id } = request.params as { id: string };
  const user = request.user;
  
  // Validate job is in awaiting_approval state
  const job = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  
  if (job.state !== 'awaiting_approval') {
    return reply.status(400).send({ error: 'Job not awaiting approval' });
  }
  
  // Update approval fields
  await db.update(jobs).set({
    approvedBy: user.id,
    approvedAt: new Date(),
    state: 'running', // Resume execution
    updatedAt: new Date(),
  }).where(eq(jobs.id, id));
  
  // Trigger execution phase
  await orchestrator.resumeJob(id);
  
  return { success: true };
});
```

---

### Step 8: Approval & Merge

**Acceptance Criteria:**
- [ ] All required checks are green
- [ ] Human maintainer approves the PR
- [ ] Merge is manual or automated upon approval
- [ ] Branch protections prevent agent from bypassing

---

## Quality Gates Checklist

| Gate | Enforcement | Evidence Required |
|------|-------------|-------------------|
| **Tests Pass** | CI blocks merge if tests fail | Link to test run |
| **Lint Pass** | CI blocks merge if lint fails | Link to lint output |
| **Typecheck Pass** | CI blocks merge if types fail | Link to tsc output |
| **Build Pass** | CI blocks merge if build fails | Link to build output |
| **Security Scan** | Optional but recommended | Link or "N/A" |
| **Coverage** | Optional threshold | Before/after % |
| **PR Template** | CI validates required sections | Template filled |
| **Plan Approved** | Job must have `approvedBy` | Approval timestamp |

---

## Cost-Aware Execution Policy

### Thresholds

| Action | Risk Level | Approval Required |
|--------|------------|-------------------|
| Read file | Low | No |
| Create branch | Low | No (dry-run) |
| Modify 1-3 files | Low | No (dry-run) |
| Modify 4-10 files | Medium | Recommended |
| Modify 10+ files | High | Yes |
| Run migrations | High | Yes |
| Update dependencies | High | Yes |
| Wide refactors | High | Yes |

### Token Budget Reporting

```typescript
interface JobCostReport {
  tokensUsed: {
    input: number;
    output: number;
    total: number;
  };
  stepsExecuted: number;
  toolCallsMade: number;
  estimatedCostUSD?: number;
}
```

### Circuit Breakers

```typescript
const CIRCUIT_BREAKERS = {
  maxTokensPerJob: 100_000,
  maxStepsPerJob: 50,
  maxToolCallsPerJob: 100,
  maxFilesModified: 20,
};

function checkCircuitBreaker(job: Job): void {
  if (job.tokensUsed > CIRCUIT_BREAKERS.maxTokensPerJob) {
    throw new CircuitBreakerError('Token budget exceeded');
  }
  // ... other checks
}
```

---

## Observability Requirements

### Trace Events (Per Step)

| Step | Required Events |
|------|-----------------|
| Intake | `reasoning` (context summary) |
| Plan | `plan_step` (each planned action), `artifact` (plan.md) |
| Dry-Run | `tool_call` (each tool), `file_preview` (each file) |
| Validate | `tool_call` (lint/test/build), `artifact` (validation_report) |
| Reflect | `reasoning` (critique summary), `artifact` (reflection_report) |
| PR | `tool_call` (create PR), `artifact` (PR metadata) |
| Complete | `reasoning` (final summary) |

### Artifacts Preserved

| Artifact Type | When Created | Retention |
|---------------|--------------|-----------|
| `context_summary` | Intake | Permanent |
| `plan` | Planning | Permanent |
| `file_preview` | Dry-run | Permanent |
| `validation_report` | Validation | Permanent |
| `reflection_report` | Reflection | Permanent |
| `screenshot` | UI flows (optional) | 30 days |

---

## Security Constraints

### Never Stored

- Raw chain-of-thought
- Tokens/secrets (redacted)
- Full file contents over 10KB (truncated)

### Always Redacted

- GitHub tokens (`ghp_*`, `gho_*`, `ghs_*`)
- API keys (`sk-*`)
- Bearer tokens
- Field names matching `/token|secret|password|apikey/i`

### Branch Protections

- Agent cannot push directly to protected branches
- Agent cannot merge its own PR
- Approval required from human maintainer

---

## Implementation Roadmap

### PR-1: Contract-First Plan Artifact + Approval Gate

**Files to Create/Modify:**

```
backend/src/db/schema.ts                    # Add job_plans table
backend/src/db/migrations/0014_*.sql        # Migration for job_plans
backend/src/core/planning/PlanGenerator.ts  # New: Plan generation logic
backend/src/agents/scribe/ScribeAgent.ts    # Integrate plan generation
frontend/src/pages/JobDetailPage.tsx        # Plan tab content
frontend/src/components/jobs/PlanView.tsx   # New: Plan viewer component
```

**Tests:**
- State transition tests (pending → running → awaiting_approval)
- API contract tests (POST /jobs/:id/approve, POST /jobs/:id/reject)
- Plan artifact persistence tests

### PR-2: Evidence-First PR Template Enforcement

**Files to Create/Modify:**

```
.github/pull_request_template.md            # New: PR template with required sections
.github/workflows/pr-gate.yml               # Add template validation step
scripts/ci/validate-pr-template.ts          # New: Template validator
```

**Tests:**
- Validator unit tests (pass/fail cases)
- CI integration tests

### PR-3: Reflect/Critique Phase + Retry Policy

**Files to Create/Modify:**

```
backend/src/core/reflection/Reflector.ts    # New: Reflection logic
backend/src/core/tracing/TraceRecorder.ts   # Add reflection_report artifact type
backend/src/agents/scribe/ScribeAgent.ts    # Integrate reflection phase
frontend/src/components/jobs/ReflectionView.tsx # New: Reflection viewer
```

**Tests:**
- Reflection generation tests
- Retry policy tests
- Escalation tests

### PR-4: Cost-Aware Execution Policy + Circuit Breakers

**Files to Create/Modify:**

```
backend/src/core/cost/CostTracker.ts        # New: Token/step tracking
backend/src/core/cost/CircuitBreaker.ts     # New: Circuit breaker logic
backend/src/core/orchestrator/AgentOrchestrator.ts # Integrate cost tracking
frontend/src/components/jobs/CostView.tsx   # New: Cost display component
```

**Tests:**
- Circuit breaker trigger tests
- Cost aggregation tests

### PR-5: Observability Hardening

**Files to Create/Modify:**

```
backend/src/core/tracing/TraceRecorder.ts   # Add screenshot artifact type
backend/src/agents/scribe/ScribeAgent.ts    # Ensure all required events emitted
frontend/src/pages/JobDetailPage.tsx        # Enhance timeline/artifacts display
```

**Tests:**
- Trace completeness tests
- Artifact persistence tests

### PR-6 (Optional): RAG-Backed Context Retrieval

**Files to Create/Modify:**

```
backend/src/services/knowledge/KnowledgeService.ts  # New: RAG service
backend/src/services/knowledge/Indexer.ts           # New: Document indexer
docs/agents/scribe/RAG_SETUP.md                     # New: RAG setup guide
```

**Tests:**
- Retrieval determinism tests
- Kill-switch tests

---

## Acceptance Criteria (Final State)

After all PRs are merged:

1. ✅ SCRIBE runs: Plan → Await approval → Execute (dry-run) → Validate → Reflect → PR body filled with evidence → human review
2. ✅ CI blocks merges unless:
   - tests/lint/typecheck/build gates pass
   - PR template sections exist and evidence links/artifacts are present
3. ✅ Job Details shows:
   - Plan contract
   - Timeline trace events
   - Preview artifacts (for dry-run)
   - Evidence artifacts (logs/reports)
4. ✅ No secrets are recorded anywhere
5. ✅ main stays green

---

## References

- [Playbook for Reliable PR-Generating AI Agents](../../Playbook%20for%20Reliable%20PR-Generating%20AI%20Agents.pdf)
- [GitHub Copilot Coding Agent 101](https://github.blog/ai-and-ml/github-copilot/github-copilot-coding-agent-101-getting-started-with-agentic-workflows-on-github/)
- [CodeMender: AI Agent for Code Security](https://deepmind.google/blog/introducing-codemender-an-ai-agent-for-code-security/)
- [Agent Factory: Observability Best Practices](https://azure.microsoft.com/en-us/blog/agent-factory-top-5-agent-observability-best-practices-for-reliable-ai/)
- [Building Effective LLM Agents](https://www.anthropic.com/engineering/building-effective-agents)
- [AKIS Observability Trace Spec](../../OBSERVABILITY_TRACE_SPEC.md)
- [Scribe v2 Contract-First Doc](../../SCRIBE_V2_CONTRACT_FIRST.md)

---

## Changelog

### v1.0 (2025-12-21)
- Initial design document
- Defined 8-step pipeline model
- Mapped to existing AKIS infrastructure
- Created implementation roadmap

