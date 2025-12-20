# AKIS Observability: Trace Specification

**Version**: 1.1  
**Status**: Living Specification  
**Owner**: Platform Team  
**Last Updated**: 2025-12-20

---

## Purpose

This document defines the **trace taxonomy**, **required fields**, and **required events** for agent job execution in AKIS. It serves as the canonical reference for:

- Backend developers implementing new agents
- Frontend developers building observability UIs
- QA engineers writing verification tests
- Operations teams debugging production issues

---

## Trace Taxonomy

### Event Types

| Event Type | Category | Description | Required Fields |
|------------|----------|-------------|-----------------|
| `step_start` | Execution | Agent step started | `stepId`, `title` |
| `step_complete` | Execution | Agent step completed successfully | `stepId`, `title`, `durationMs` |
| `step_failed` | Execution | Agent step failed | `stepId`, `title`, `errorCode`, `durationMs` |
| `doc_read` | Artifact | Document/file read from source | `path` (in detail) |
| `file_created` | Artifact | File created/produced | `path` (in detail) |
| `file_modified` | Artifact | File modified | `path` (in detail) |
| `mcp_connect` | Integration | MCP gateway connection attempt | `gatewayUrl`, `correlationId` |
| `mcp_call` | Integration | MCP tool call | `correlationId`, `durationMs` |
| `ai_call` | Integration | AI/LLM call | `durationMs` |
| `ai_parse_error` | Integration | AI response parse error (fallback used) | `detail.fallbackUsed` |
| `error` | Error | General error event | `errorCode` |
| `info` | Info | Informational event | - |
| **`tool_call`** | **Explainability** | **External tool invocation** | **`toolName`, `askedWhat`, `didWhat`, `whyReason`** |
| **`tool_result`** | **Explainability** | **Tool response** | **`toolName`, `outputSummary`** |
| **`decision`** | **Explainability** | **Agent decision point** | **`didWhat`, `reasoningSummary`** |
| **`plan_step`** | **Explainability** | **Plan step execution** | **`stepId`, `didWhat`, `reasoningSummary`** |
| **`reasoning`** | **Explainability** | **Reasoning summary** | **`reasoningSummary`** |

### Status Values

| Status | Meaning | Color | Use Case |
|--------|---------|-------|----------|
| `success` | Operation completed successfully | Green | Step completion, successful tool calls |
| `failed` | Operation failed | Red | Step failures, connection errors |
| `warning` | Non-critical issue | Amber | AI parse fallback, validation warnings |
| `info` | Informational | Blue | General info, reasoning summaries |

---

## Required Fields

### All Events (Base)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `jobId` | UUID | ✅ | Job identifier |
| `eventType` | Enum | ✅ | Event type from taxonomy |
| `title` | String(500) | ✅ | Event title/summary |
| `timestamp` | DateTime | ✅ | Event timestamp (auto-set) |
| `status` | Enum | ✅ | Event status (default: `info`) |

### Optional Fields (Contextual)

| Field | Type | When Required | Description |
|-------|------|---------------|-------------|
| `stepId` | String(100) | If part of a plan | Plan step identifier |
| `durationMs` | Integer | If timed | Duration in milliseconds |
| `correlationId` | String(100) | For external calls | Correlation ID for tracing |
| `gatewayUrl` | String(500) | For MCP events | MCP Gateway URL |
| `errorCode` | String(50) | If failed | Structured error code |
| `detail` | JSON | Optional | Raw details (server-side only, redacted) |

### Explainability Fields (S1.1)

| Field | Type | When Required | Description |
|-------|------|---------------|-------------|
| `toolName` | String(100) | For `tool_call`, `tool_result` | Tool/service name |
| `inputSummary` | Text | For `tool_call` | Redacted input summary |
| `outputSummary` | Text | For `tool_result` | Redacted output summary |
| `reasoningSummary` | String(1000) | For decision events | User-facing reasoning (2-4 sentences) |
| `askedWhat` | Text | For `tool_call` | What did we ask the tool? |
| `didWhat` | Text | For `tool_call`, `decision`, `plan_step` | What action was taken? |
| `whyReason` | Text | For `tool_call`, `decision` | Why was this action taken? |

---

## Required Events Per Job Phase

### Phase 1: Initialization

| Event Type | Required | When | Fields |
|------------|----------|------|--------|
| `reasoning` | ✅ | Job start | `reasoningSummary` describing mode (PLAN_ONLY vs EXECUTE) |

### Phase 2: Planning (if `requiresPlanning`)

| Event Type | Required | When | Fields |
|------------|----------|------|--------|
| `plan_step` | ✅ (per step) | For each plan step | `stepId`, `didWhat`, `reasoningSummary`, `status: 'pending'` |

### Phase 3: Execution

| Event Type | Required | When | Fields |
|------------|----------|------|--------|
| `tool_call` | ✅ | Before external tool/API call | `toolName`, `askedWhat`, `didWhat`, `whyReason`, `inputSummary` |
| `tool_result` | ⚠️ Recommended | After tool call completes | `toolName`, `outputSummary`, `status` |
| `decision` | ⚠️ Recommended | At key decision points | `didWhat`, `reasoningSummary` |
| `doc_read` | ✅ | When reading source files | `path` (in detail) |
| `file_created` | ✅ | When creating files | `path` (in detail) |
| `file_modified` | ✅ | When modifying files | `path` (in detail), diff info |
| `mcp_connect` | ✅ | First MCP gateway connection | `gatewayUrl`, `correlationId` |
| `mcp_call` | ✅ | Each MCP tool call | `correlationId`, `durationMs` |
| `ai_call` | ✅ | Each AI/LLM call | `durationMs` |

### Phase 4: Reflection (if `requiresReflection`)

| Event Type | Required | When | Fields |
|------------|----------|------|--------|
| `reasoning` | ✅ | Reflection complete | `reasoningSummary` describing critique |

### Phase 5: Completion

| Event Type | Required | When | Fields |
|------------|----------|------|--------|
| `reasoning` | ✅ | Job completion | `reasoningSummary` describing outcome |

---

## Artifacts

### Required Artifacts

| Artifact Type | When Required | Fields |
|---------------|---------------|--------|
| `doc_read` | When reading source files | `path`, `sizeBytes`, `preview` |
| `file_created` | When creating files | `path`, `sizeBytes`, `preview` |
| `file_modified` | When modifying files | `path`, `sizeBytes`, `preview`, `diffPreview`, `linesAdded`, `linesRemoved` |

---

## Approval Policy (S1.2)

### PLAN_ONLY Mode

**Purpose**: Generate execution plan and preview without making changes.

**Requirements**:
- ✅ Must generate full trace timeline
- ✅ Must generate diff previews for all proposed file changes
- ✅ Must set `requiresApproval: true` on job
- ✅ Must transition to `awaiting_approval` state on completion
- ❌ Must NOT execute actual changes (no commits, no PRs, no external writes)

**Trace Requirements**:
- All `tool_call` events must have `didWhat` in past tense (e.g., "Would have created branch...")
- All `file_modified` artifacts must include `diffPreview`
- Final `reasoning` event must summarize proposed changes

**Job States**:
```
pending → running → completed → awaiting_approval
```

### EXECUTE Mode

**Purpose**: Execute approved plan with real changes.

**Requirements**:
- ✅ Must have `approvedBy` and `approvedAt` fields set
- ✅ Must validate approval before execution
- ✅ Must generate full trace timeline
- ✅ Must record actual outcomes (commit SHAs, PR URLs)
- ❌ Cannot execute without approval (unless `allowAutoExecute: true` in config)

**Trace Requirements**:
- All `tool_call` events must have `didWhat` in past tense (e.g., "Created branch...")
- All `file_modified` artifacts must include actual commit info
- Final `reasoning` event must summarize actual outcomes

**Job States**:
```
pending → running → completed
```

### Approval Flow

```
┌─────────────┐
│  PLAN_ONLY  │
│     Job     │
└──────┬──────┘
       │
       ├─ Execute plan (no writes)
       ├─ Generate trace + diffs
       │
       ▼
┌─────────────────────┐
│ awaiting_approval   │
└──────┬──────────────┘
       │
       ├─ User reviews trace/diffs
       │
       ▼
┌─────────────┐      ┌─────────────┐
│   APPROVE   │  or  │   REJECT    │
└──────┬──────┘      └──────┬──────┘
       │                    │
       ▼                    ▼
┌─────────────┐      ┌─────────────┐
│   EXECUTE   │      │  cancelled  │
│     Job     │      └─────────────┘
└──────┬──────┘
       │
       ├─ Execute approved plan
       ├─ Make real changes
       │
       ▼
┌─────────────┐
│  completed  │
└─────────────┘
```

### Approval Metadata

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `requiresApproval` | Boolean | ✅ | Set to `true` for PLAN_ONLY jobs |
| `approvedBy` | UUID | ⚠️ (if approved) | User ID who approved |
| `approvedAt` | DateTime | ⚠️ (if approved) | Approval timestamp |
| `rejectedBy` | UUID | ⚠️ (if rejected) | User ID who rejected |
| `rejectedAt` | DateTime | ⚠️ (if rejected) | Rejection timestamp |
| `approvalComment` | Text | ❌ Optional | User comment on approval/rejection |

---

## Secret Redaction Rules

### Token Patterns (Automatically Redacted)

| Pattern | Example | Redacted As |
|---------|---------|-------------|
| GitHub PAT | `ghp_abc123...` | `ghp_[REDACTED]` |
| GitHub OAuth | `gho_abc123...` | `gho_[REDACTED]` |
| GitHub App | `ghs_abc123...` | `ghs_[REDACTED]` |
| GitHub Refresh | `ghr_abc123...` | `ghr_[REDACTED]` |
| OpenAI | `sk-abc123...` | `sk-[REDACTED]` |
| Bearer Token | `Bearer abc123...` | `Bearer [REDACTED]` |

### Field Patterns (Always Redacted)

| Field Name (Regex) | Action |
|--------------------|--------|
| `/token/i` | Replace value with `[REDACTED]` |
| `/secret/i` | Replace value with `[REDACTED]` |
| `/password/i` | Replace value with `[REDACTED]` |
| `/apikey/i` | Replace value with `[REDACTED]` |
| `/api_key/i` | Replace value with `[REDACTED]` |
| `/authorization/i` | Replace value with `[REDACTED]` |
| `/bearer/i` | Replace value with `[REDACTED]` |

### Redaction Enforcement

- **Server-Side**: All trace recorder methods apply redaction before storage
- **Client-Side**: Additional redaction applied in UI before rendering
- **Logs**: Correlation IDs only (never tokens)
- **Error Messages**: Sanitized (no secret values in error text)

---

## Validation Rules

### Trace Completeness

A job trace is considered **complete** if:

1. ✅ Has at least one `reasoning` event at initialization
2. ✅ Has at least one `reasoning` event at completion
3. ✅ Has `tool_call` events for all external operations
4. ✅ Has `doc_read` artifacts for all source files read
5. ✅ Has `file_created`/`file_modified` artifacts for all files changed
6. ✅ No unhandled errors (all errors have `error` events)

### Trace Integrity

A job trace has **integrity** if:

1. ✅ All `stepId` references match plan steps (if plan exists)
2. ✅ All timestamps are monotonically increasing
3. ✅ All `durationMs` values are positive
4. ✅ All `correlationId` values are unique per job
5. ✅ All secrets are redacted (no token patterns in text)

---

## Anti-Patterns (Do Not)

### ❌ Don't: Expose Raw Chain-of-Thought

```json
{
  "eventType": "reasoning",
  "reasoningSummary": "Let me think... First I need to analyze the file structure, then I'll check for imports, and then I'll consider the best approach..."
}
```

**Why**: Raw chain-of-thought is verbose, confusing, and not user-facing.

**Instead**: Provide a concise summary of the decision:

```json
{
  "eventType": "reasoning",
  "reasoningSummary": "Analyzing file structure to determine import dependencies before generating documentation."
}
```

### ❌ Don't: Include Secrets in Detail Fields

```json
{
  "eventType": "tool_call",
  "toolName": "github.createBranch",
  "detail": {
    "token": "ghp_abc123def456..."
  }
}
```

**Why**: Secrets can leak into logs, UI, or error messages.

**Instead**: Redact before storing:

```json
{
  "eventType": "tool_call",
  "toolName": "github.createBranch",
  "detail": {
    "token": "[REDACTED]"
  }
}
```

### ❌ Don't: Skip Required Events

```typescript
// Bad: No tool_call event before GitHub API call
await githubMCP.createBranch(owner, repo, branch, base);
```

**Why**: Missing events make debugging impossible.

**Instead**: Always record tool calls:

```typescript
// Good: Record tool call with explainability
traceRecorder.recordToolCall({
  toolName: 'github.createBranch',
  asked: `Create branch "${branch}" from "${base}"`,
  did: 'Calling GitHub API to create a new branch',
  why: 'Creating a separate branch ensures the base branch remains unchanged until changes are reviewed.',
  inputSummary: `owner: ${owner}, repo: ${repo}, branch: ${branch}, base: ${base}`,
  success: true,
  durationMs: Date.now() - startTime,
});
await githubMCP.createBranch(owner, repo, branch, base);
```

### ❌ Don't: Use Generic Titles

```json
{
  "eventType": "step_complete",
  "title": "Step completed"
}
```

**Why**: Generic titles don't help debugging.

**Instead**: Be specific:

```json
{
  "eventType": "step_complete",
  "title": "Branch Management: Created docs/scribe-20251220-140530"
}
```

---

## Examples

### Example 1: PLAN_ONLY Job (Full Trace)

```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "type": "scribe",
  "state": "awaiting_approval",
  "requiresApproval": true,
  "trace": [
    {
      "eventType": "reasoning",
      "title": "Reasoning: initialization",
      "reasoningSummary": "Starting Scribe workflow for acme/docs. Target: README.md. Mode: dry-run (no changes will be written).",
      "status": "info",
      "timestamp": "2025-12-20T14:00:00Z"
    },
    {
      "eventType": "plan_step",
      "stepId": "branch-management",
      "title": "Branch Management",
      "didWhat": "Determine working branch for documentation updates",
      "reasoningSummary": "In dry-run mode, we simulate branch operations without making changes.",
      "status": "running",
      "timestamp": "2025-12-20T14:00:01Z"
    },
    {
      "eventType": "tool_call",
      "toolName": "github.createBranch",
      "title": "Tool: github.createBranch",
      "askedWhat": "Create branch \"docs/scribe-20251220-140000\" from \"main\"",
      "didWhat": "Would have called GitHub API to create a new branch",
      "whyReason": "Creating a separate branch ensures the base branch remains unchanged until changes are reviewed.",
      "inputSummary": "owner: acme, repo: docs, branch: docs/scribe-20251220-140000, base: main",
      "status": "success",
      "durationMs": 150,
      "timestamp": "2025-12-20T14:00:02Z"
    },
    {
      "eventType": "plan_step",
      "stepId": "branch-management",
      "title": "Branch Management",
      "didWhat": "Working branch: docs/scribe-20251220-140000",
      "reasoningSummary": "Dry-run: no branch changes made",
      "status": "completed",
      "timestamp": "2025-12-20T14:00:02Z"
    },
    {
      "eventType": "reasoning",
      "title": "Reasoning: completion",
      "reasoningSummary": "Dry-run completed successfully. Would have updated README.md on branch docs/scribe-20251220-140000. Content preview: 1523 bytes.",
      "status": "info",
      "timestamp": "2025-12-20T14:00:10Z"
    }
  ],
  "artifacts": [
    {
      "artifactType": "doc_read",
      "path": "README.md",
      "operation": "read",
      "sizeBytes": 1024,
      "preview": "# Acme Documentation\n\n...",
      "timestamp": "2025-12-20T14:00:03Z"
    },
    {
      "artifactType": "file_modified",
      "path": "README.md",
      "operation": "modify",
      "sizeBytes": 1523,
      "diffPreview": "@@ -1,3 +1,8 @@\n # Acme Documentation\n \n+## Update 2025-12-20T14:00:00Z\n+Documentation updated by ScribeAgent.\n+\n...",
      "linesAdded": 5,
      "linesRemoved": 0,
      "timestamp": "2025-12-20T14:00:10Z"
    }
  ]
}
```

### Example 2: EXECUTE Job (After Approval)

```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440001",
  "type": "scribe",
  "state": "completed",
  "requiresApproval": false,
  "approvedBy": "user-123",
  "approvedAt": "2025-12-20T14:05:00Z",
  "trace": [
    {
      "eventType": "reasoning",
      "title": "Reasoning: initialization",
      "reasoningSummary": "Starting Scribe workflow for acme/docs. Target: README.md. Mode: execute (changes will be written).",
      "status": "info",
      "timestamp": "2025-12-20T14:05:10Z"
    },
    {
      "eventType": "tool_call",
      "toolName": "github.createBranch",
      "title": "Tool: github.createBranch",
      "askedWhat": "Create branch \"docs/scribe-20251220-140500\" from \"main\"",
      "didWhat": "Called GitHub API to create a new branch",
      "whyReason": "Creating a separate branch ensures the base branch remains unchanged until changes are reviewed.",
      "inputSummary": "owner: acme, repo: docs, branch: docs/scribe-20251220-140500, base: main",
      "outputSummary": "Branch created: sha=abc123",
      "status": "success",
      "durationMs": 320,
      "correlationId": "550e8400-e29b-41d4-a716-446655440001",
      "timestamp": "2025-12-20T14:05:12Z"
    },
    {
      "eventType": "tool_call",
      "toolName": "github.commitFile",
      "title": "Tool: github.commitFile",
      "askedWhat": "Commit the updated content to \"README.md\" on branch \"docs/scribe-20251220-140500\"",
      "didWhat": "Called GitHub API to create a new commit with the updated file",
      "whyReason": "Committing the changes makes them permanent and trackable in version control.",
      "inputSummary": "path: README.md, branch: docs/scribe-20251220-140500, message: \"docs: update README.md via ScribeAgent\"",
      "outputSummary": "Commit created: sha=def456",
      "status": "success",
      "durationMs": 450,
      "correlationId": "550e8400-e29b-41d4-a716-446655440001",
      "timestamp": "2025-12-20T14:05:15Z"
    },
    {
      "eventType": "tool_call",
      "toolName": "github.createPRDraft",
      "title": "Tool: github.createPRDraft",
      "askedWhat": "Create a draft pull request for the documentation changes",
      "didWhat": "Called GitHub API to create a draft pull request",
      "whyReason": "A draft PR allows team members to review the documentation changes before they are merged.",
      "inputSummary": "title: \"docs: update README.md\", head: docs/scribe-20251220-140500, base: main",
      "outputSummary": "PR created: #123",
      "status": "success",
      "durationMs": 280,
      "correlationId": "550e8400-e29b-41d4-a716-446655440001",
      "timestamp": "2025-12-20T14:05:18Z"
    },
    {
      "eventType": "reasoning",
      "title": "Reasoning: completion",
      "reasoningSummary": "Scribe workflow completed successfully. Updated README.md on branch docs/scribe-20251220-140500. Pull request created for review.",
      "status": "info",
      "timestamp": "2025-12-20T14:05:20Z"
    }
  ]
}
```

---

## References

- **Implementation**: `backend/src/core/tracing/TraceRecorder.ts`
- **Frontend UI**: `frontend/src/components/agents/ExplainableTimeline.tsx`
- **QA Guide**: `docs/QA_SCRIBE_AUTOMATION.md`
- **Dev Setup**: `docs/DEV_SETUP.md`

---

## Changelog

### v1.1 (2025-12-20)
- Added approval policy (PLAN_ONLY vs EXECUTE)
- Added approval metadata fields
- Added approval flow diagram
- Added validation rules
- Added anti-patterns section
- Added complete examples

### v1.0 (2025-12-20)
- Initial trace taxonomy
- Required fields per event type
- Required events per job phase
- Secret redaction rules
- Explainability fields (S1.1)

---

**Next**: See `docs/QA_SCRIBE_AUTOMATION.md` for test automation guide.

