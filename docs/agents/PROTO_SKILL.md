# Proto Agent — SKILL Reference

> **Agent ID:** `proto`
> **Source:** `backend/src/agents/proto/ProtoAgent.ts`
> **Playbook:** `backend/src/core/agents/playbooks/proto-playbook.ts`
> **Version:** S0.5

---

## 1. What Is Proto?

Proto is an **MVP scaffolding specialist**. Given a set of requirements and an optional tech stack preference, it generates a complete project scaffold — directory structure, configuration files, boilerplate code, and a README — then commits everything to GitHub via a draft PR.

Proto is unique among AKIS agents because it has an **orchestrator-level reflection step**: after generating the scaffold, the orchestrator's AI reflector reviews the output for completeness and quality before committing.

---

## 2. Execution Flow (Phases)

```
thinking → discovery → creating → reviewing → publishing → done
```

| Phase | Duration | What Happens |
|---|---|---|
| **Thinking** | ~5s | Understands requirements. Creates execution plan via PlanGenerator with stack awareness. |
| **Discovery** | ~8s | Designs project structure and file layout based on requirements and preferred stack. |
| **Creating** | ~30s | If AI available: Generates scaffold files with LLM (`generateWorkArtifact`). If no AI: Produces minimal fallback scaffold (README.md, package.json, index.js). |
| **Reviewing** | ~15s | **Orchestrator-level reflection.** AI reviews the scaffold for completeness, missing files, and quality issues. |
| **Publishing** | ~8s | If GitHub config provided: Creates branch, commits all scaffold files, opens draft PR. |
| **Done** | — | MVP scaffold generation complete. |

---

## 3. AI Prompts

### 3.1 Planning Prompt

**System:** `PLAN_SYSTEM_PROMPT` — Generic planning assistant.

**User:** `"Generate an MVP scaffold from these requirements:\n\n{requirements}"`

**Context:** `{ stack: "React + Node.js + PostgreSQL" }` (if provided)

**Temperature:** 0.2

### 3.2 Generation Prompt

**System:** `GENERATE_SYSTEM_PROMPT` — Code and content generation assistant.

**User:**
```
Generate a working MVP project scaffold based on these requirements.
For each file, output the file path and content.

Requirements:
{requirements}

Preferred stack: {stack}
```

**Context:** `{ plan: [step titles from planning phase] }`

**Temperature:** 0.3

### 3.3 Reflection Prompt (Orchestrator-Level)

**System:** `REFLECT_SYSTEM_PROMPT` — Quality assessment assistant.

**Input:** The complete scaffold artifact (all generated files).

**Output:** JSON `{ issues: string[], recommendations: string[], severity: "low" | "medium" | "high" }`

**Temperature:** 0.1

Proto is the **only** agent with `requiresReflection: true` — the orchestrator calls `reflect()` after `executeWithTools()` completes.

---

## 4. MCP Tools (GitHub Access)

GitHub integration is **optional** for Proto. When `owner`, `repo`, and MCP tools are provided:

| Operation | MCP Tool | When Used |
|---|---|---|
| Create branch | `create_branch` | Publishing phase |
| Commit file | `create_or_update_file` | Publishing phase (per scaffold file) |
| Open draft PR | `create_pull_request` | Publishing phase |

---

## 5. Inputs (ProtoPayload)

| Field | Type | Required | Description |
|---|---|---|---|
| `requirements` | `string` | **Yes** | Project requirements / feature description |
| `stack` | `string` | No | Preferred tech stack hint (e.g., `"React + Node.js + PostgreSQL"`) |
| `owner` | `string` | No | GitHub repo owner (for PR creation) |
| `repo` | `string` | No | Repository name |
| `baseBranch` | `string` | No | Base branch (default: `main`) |
| `branchStrategy` | `'auto' \| 'manual'` | No | `auto` = create new branch, `manual` = commit to baseBranch |
| `dryRun` | `boolean` | No | Simulate without writing to GitHub |

---

## 6. Outputs (ProtoResult)

| Field | Type | Description |
|---|---|---|
| `ok` | `boolean` | Success flag |
| `agent` | `'proto'` | Agent identifier |
| `artifacts` | `Artifact[]` | Array of scaffold files (path + content) |
| `branch` | `string` | Branch name (if committed to GitHub) |
| `prUrl` | `string` | Pull request URL (if created) |
| `message` | `string` | Status message (e.g., fallback mode indicator) |
| `metadata` | `{ fileCount, totalSize }` | Scaffold statistics |

**Files Produced (AI mode):** Depends on requirements — typically includes:
- `README.md` — Project overview and setup
- `package.json` — Dependencies and scripts
- Source files — Entry points, components, routes
- Configuration — tsconfig, .env.example, docker files

**Files Produced (Fallback mode):** Minimal scaffold:
- `README.md` — Generated from requirements summary
- `package.json` — Basic project manifest
- `index.js` — Entry point placeholder

---

## 7. Scaffold Parsing

When AI generates the scaffold, Proto parses the LLM output to extract file paths and contents:

### Parsing Rules (`parseScaffoldOutput()`)

1. **Code Block Format (primary):**
   ````
   ```filepath:src/index.ts
   // file content here
   ```
   ````

2. **Header Format:**
   ```
   ### src/index.ts
   ```typescript
   // file content
   ```
   ```

3. **Fallback:** If no structured format is detected, the entire output is saved as `README.md`.

---

## 8. AI vs. Fallback Mode

| Aspect | With AI | Without AI (Fallback) |
|---|---|---|
| Scaffold quality | Full project structure | Minimal 3-file skeleton |
| Stack awareness | Generates stack-specific files | Generic Node.js placeholder |
| File count | 5-15+ files | 3 files |
| Configuration | Includes tsconfig, .env, docker, etc. | Only package.json |
| Processing time | ~30s (API call) | ~1s (instant) |
| Cost | Per-token LLM cost | Free |

---

## 9. Reflection Step (Unique to Proto)

Proto is the only agent where the orchestrator runs a **post-execution reflection**:

```
execute() → reflection → commit (if quality passes)
```

The reflector checks:
- **Completeness** — Are critical files present? (README, entry point, config)
- **Consistency** — Do imports/dependencies align across files?
- **Best Practices** — Are there .gitignore, .env.example, proper scripts?
- **Stack Alignment** — Do generated files match the requested tech stack?

If severity is `"high"`, the orchestrator may flag the result for human review.

---

## 10. Error Handling

| Error Code | Cause | Recovery |
|---|---|---|
| `MISSING_REQUIREMENTS` | `requirements` field empty or missing | Provide project requirements text |
| `MCP_UNREACHABLE` | MCP Gateway down (GitHub ops) | Check mcp-gateway container |
| `AI_KEY_MISSING` | No API key for AI provider | Add key in Settings > API Keys |
| `BRANCH_CONFLICT` | Branch already exists | Use unique branch or `branchStrategy: 'manual'` |
| `SCAFFOLD_PARSE_FAIL` | AI output couldn't be parsed into files | Agent falls back to single-file output |
