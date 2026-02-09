# Trace Agent — SKILL Reference

> **Agent ID:** `trace`
> **Source:** `backend/src/agents/trace/TraceAgent.ts`
> **Playbook:** `backend/src/core/agents/playbooks/trace-playbook.ts`
> **Version:** S0.5

---

## 1. What Is Trace?

Trace is a **test plan generation specialist**. It takes a specification (Gherkin, plain text, or structured requirements) and produces:
- A comprehensive **test plan** document
- A **coverage matrix** mapping features to test cases
- Scaffolded **test files** ready for implementation

When an AI service is available, Trace uses the LLM to generate an enhanced, context-aware test plan. Without AI, it falls back to deterministic scenario parsing.

---

## 2. Execution Flow (Phases)

```
thinking → discovery → creating → publishing → done
```

| Phase | Duration | What Happens |
|---|---|---|
| **Thinking** | ~3s | Analyzes the test specification. Creates execution plan via PlanGenerator. |
| **Discovery** | ~5s | Parses scenarios from the specification. Identifies test boundaries, Given/When/Then steps, and feature groups. |
| **Creating** | ~20s | If AI available: Generates enhanced test plan with LLM (`generateWorkArtifact`). If no AI: Uses deterministic parser to build test plan, coverage matrix, and test files. |
| **Publishing** | ~8s | If GitHub config provided: Creates branch, commits test artifacts, opens draft PR via MCP. |
| **Done** | — | Test plan generation complete. |

---

## 3. AI Prompts

### 3.1 Planning Prompt

**System:** `PLAN_SYSTEM_PROMPT` — Generic planning assistant.

**User:** `"Generate a comprehensive test plan and coverage matrix from the following specification:\n\n{spec}"`

**Temperature:** 0.2 (deterministic)

### 3.2 Generation Prompt (with AI)

**System:** `GENERATE_SYSTEM_PROMPT` — Code and content generation assistant.

**User:**
```
Generate a comprehensive test plan with test cases and coverage matrix
from this specification. Return structured markdown with sections:
## Test Plan, ## Test Cases (with scenario names and steps),
## Coverage Matrix (feature vs test mapping).

Specification:
{spec}
```

**Context:** `{ plan: [step titles from planning phase] }`

**Temperature:** 0.3

### 3.3 Reflection

Trace does **not** have a reflection step (`requiresReflection: false`). It relies on structured parsing and AI generation quality.

---

## 4. MCP Tools (GitHub Access)

GitHub integration is **optional** for Trace. When `owner`, `repo`, and MCP tools are provided:

| Operation | MCP Tool | When Used |
|---|---|---|
| Create branch | `create_branch` | Publishing phase |
| Commit file | `create_or_update_file` | Publishing phase (per artifact) |
| Open draft PR | `create_pull_request` | Publishing phase |

---

## 5. Inputs (TracePayload)

| Field | Type | Required | Description |
|---|---|---|---|
| `spec` | `string` | **Yes** | Test specification text (Gherkin, plain text, or structured) |
| `owner` | `string` | No | GitHub repo owner (for PR creation) |
| `repo` | `string` | No | Repository name |
| `baseBranch` | `string` | No | Base branch (default: `main`) |
| `branchStrategy` | `'auto' \| 'manual'` | No | `auto` = create new branch, `manual` = commit to baseBranch |
| `dryRun` | `boolean` | No | Simulate without writing to GitHub |

---

## 6. Outputs (TraceResult)

| Field | Type | Description |
|---|---|---|
| `ok` | `boolean` | Success flag |
| `agent` | `'trace'` | Agent identifier |
| `files` | `TestFile[]` | Array of test file structures with cases |
| `testPlan` | `string` | Complete test plan markdown |
| `coverageMatrix` | `Record<string, string[]>` | Feature → test case mapping |
| `artifacts` | `Artifact[]` | Array of generated file paths + content |
| `branch` | `string` | Branch name (if committed to GitHub) |
| `prUrl` | `string` | Pull request URL (if created) |
| `metadata` | `{ scenarioCount, totalTestCases, specLength }` | Execution statistics |

**Files Produced:**
- `docs/test-plan.md` — Complete test plan document
- `tests/generated/trace-tests.test.ts` — Scaffolded test file
- `docs/coverage-matrix.md` — Feature-to-test coverage matrix

---

## 7. Scenario Parsing (Deterministic Engine)

When AI is not available (or as a supplementary step), Trace uses a built-in parser:

### Parsing Rules

1. **Gherkin Format:**
   ```gherkin
   Feature: User Login
     Scenario: Successful login
       Given a registered user
       When they enter valid credentials
       Then they should see the dashboard
   ```
   Parsed into structured `{ feature, scenario, steps[] }` objects.

2. **Plain Text:** Lines starting with numbers (`1.`, `2.`) or dashes (`-`) are treated as individual test cases.

3. **Fallback:** If no structure is detected, the entire spec is wrapped as a single scenario.

### Coverage Matrix Generation

The parser maps each scenario to its parent feature/group, producing:

```
| Feature       | Test Cases                    |
|---------------|-------------------------------|
| User Login    | Successful login, Failed login|
| Registration  | Email signup, OAuth signup    |
```

---

## 8. AI vs. Deterministic Mode

| Aspect | With AI | Without AI (Mock/Fallback) |
|---|---|---|
| Test plan quality | Enhanced, context-aware | Basic, template-based |
| Coverage matrix | AI-enriched with edge cases | Direct scenario mapping |
| Test file content | AI-generated test code | Skeleton with step comments |
| Processing time | ~20s (API call) | ~1s (instant) |
| Cost | Per-token LLM cost | Free |

---

## 9. Error Handling

| Error Code | Cause | Recovery |
|---|---|---|
| `MISSING_SPEC` | `spec` field empty or missing | Provide test specification text |
| `MCP_UNREACHABLE` | MCP Gateway down (GitHub ops) | Check mcp-gateway container |
| `AI_KEY_MISSING` | No API key for AI provider | Add key in Settings > API Keys |
| `BRANCH_CONFLICT` | Branch already exists | Use unique branch or `branchStrategy: 'manual'` |
