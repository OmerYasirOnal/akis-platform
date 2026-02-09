# Scribe Agent — SKILL Reference

> **Agent ID:** `scribe-v2`
> **Source:** `backend/src/agents/scribe/ScribeAgent.ts`
> **Playbook:** `backend/src/core/agents/playbooks/scribe-playbook.ts`
> **Contract:** `backend/src/agents/scribe/DocContract.ts`
> **Version:** S0.5

---

## 1. What Is Scribe?

Scribe is an **autonomous documentation specialist**. It reads a GitHub repository's source code, generates or updates documentation files (README, API docs, guides), and opens a draft Pull Request — all without human intervention.

Scribe is the most mature agent in the AKIS platform. It uses a **contract-first** approach: every document type has a `DocTypeContract` that specifies required sections, quality rules, and grounding requirements.

---

## 2. Execution Flow (Phases)

```
thinking → discovery → reading → creating → reviewing → publishing → done
```

| Phase | Duration | What Happens |
|---|---|---|
| **Thinking** | ~3s | Analyzes repository and doc requirements. Creates execution plan via PlanGenerator. |
| **Discovery** | ~5s | Scans repo structure via MCP (`get_file_contents`). Lists directories, identifies key files (package.json, tsconfig, etc.). |
| **Reading** | ~10s | Reads source files for documentation evidence. Builds `RepoContext` with tech stack, license, package manager, key file previews. |
| **Creating** | ~30s | Generates documentation using AI with contract-compliant prompts. Supports 1 or 2 passes. |
| **Reviewing** | ~15s | AI reviews generated docs for quality. Runs `reflector.critique()` on each file. Checks contract compliance, accuracy, actionability. |
| **Publishing** | ~8s | Creates branch, commits files, opens draft PR via MCP GitHub adapter. |
| **Done** | — | Documentation generation complete. |

---

## 3. AI Prompts

### 3.1 Planning Prompt

**System:** `PLAN_SYSTEM_PROMPT` — Generic planning assistant. Responds with JSON `{ steps, rationale }`.

**User:** `"Create an execution plan for the scribe agent. Goal: <task_description>"`

**Temperature:** 0.2 (deterministic mode)

### 3.2 Generation Prompt (Main)

**System (built by `buildContractPrompt()`):**

```
You are a technical documentation specialist creating production-grade
{docType} documentation.

CRITICAL RULES (MUST FOLLOW):
1. ONLY use information from the repository evidence provided below
2. DO NOT hallucinate features, commands, or configurations
3. If information is missing, note it as "TODO: Add [topic]"
4. Every command, endpoint, or technical detail MUST come from the repository files
5. Output ONLY valid Markdown

Required sections (MUST include all):
- {section.name} (REQUIRED): {section.description}

Quality Review Rubric:
- Completeness: All required sections present with meaningful content
- Accuracy: Every technical claim backed by repository evidence
- Actionability: Commands and instructions are copy-paste ready
- Consistency: Formatting and terminology uniform throughout
- Grounding: No hallucinated content

Repository Evidence:
[{file.path}]: ```{file.preview}```

Output the complete updated Markdown document:
```

**Temperature:** 0.3

### 3.3 Reflection Prompt

**System:** `REFLECT_SYSTEM_PROMPT` — Reviews artifact and returns JSON `{ issues, recommendations, severity }`.

**Temperature:** 0.1

---

## 4. MCP Tools (GitHub Access)

Scribe uses `GitHubMCPService` (HTTP JSON-RPC → MCP Gateway → `@modelcontextprotocol/server-github`):

| Operation | MCP Tool | When Used |
|---|---|---|
| List directory | `get_file_contents` (dir path) | Discovery phase |
| Read file | `get_file_contents` (file path) | Reading phase |
| Create branch | `create_branch` | Publishing phase |
| Commit file | `create_or_update_file` | Publishing phase |
| Open draft PR | `create_pull_request` | Publishing phase |

---

## 5. Inputs (ScribePayload)

| Field | Type | Required | Description |
|---|---|---|---|
| `owner` | `string` | Yes | GitHub repo owner |
| `repo` | `string` | Yes | Repository name |
| `baseBranch` | `string` | Yes | Base branch (e.g., `main`) |
| `featureBranch` | `string` | No | Custom branch name (auto-generated if omitted) |
| `targetPath` | `string` | No | Target path (e.g., `README.md` or `docs/`) |
| `taskDescription` | `string` | No | What to document |
| `dryRun` | `boolean` | No | Simulate without writing |
| `docPack` | `'readme' \| 'standard' \| 'full'` | No | Documentation package scope |
| `docDepth` | `'lite' \| 'standard' \| 'deep'` | No | Detail level |
| `passes` | `1 \| 2` | No | Number of AI generation passes |
| `requiresApproval` | `boolean` | No | Human approval before commit |

---

## 6. Outputs (ScribeResult)

| Field | Type | Description |
|---|---|---|
| `ok` | `boolean` | Success flag |
| `agent` | `'scribe-v2'` | Agent identifier |
| `filesUpdated` | `number` | Count of files created/updated |
| `plan` | `Plan` | AI-generated execution plan |
| `branch` | `string` | Working branch name |
| `branchCreated` | `boolean` | Whether a new branch was created |
| `commits` | `CommitResult[]` | Array of commit results |
| `pullRequest` | `{ url, number }` | Draft PR reference |
| `critiques` | `Critique[]` | AI quality review results |
| `preview` | `FilePreview[]` | Dry-run preview (if `dryRun=true`) |
| `diagnostics` | `object` | Execution timing and metadata |

**Files Produced:** Markdown documentation files (README.md, docs/*.md), stored plan artifact in DB.

---

## 7. Doc Type Contracts

Scribe uses `DocTypeContract` objects to enforce document structure:

| Contract | File Type | Required Sections | Quality Rules |
|---|---|---|---|
| `readmeContract` | README.md | Overview, Features, Tech Stack, Getting Started, Architecture, API, Contributing, License | minLength: 500, requireCodeExamples, requireLinks |
| `apiDocContract` | api-docs.md | Endpoints, Auth, Errors, Rate Limiting, Examples | minLength: 300, requireCodeExamples |
| `setupGuideContract` | setup-guide.md | Prerequisites, Installation, Configuration, Running, Troubleshooting | minLength: 400, requireCodeExamples |
| `changelogContract` | CHANGELOG.md | Changes per version, Migration notes | minLength: 200, tone: concise |
| `releaseNotesContract` | release-notes.md | Highlights, Breaking Changes, Migration, Usage | minLength: 300, tone: friendly |

---

## 8. Quality Scoring

Every generated document is scored on 5 dimensions:

- **Completeness** — All required sections present with meaningful content
- **Accuracy** — Every technical claim backed by repository evidence
- **Actionability** — Commands and instructions are copy-paste ready
- **Consistency** — Formatting and terminology uniform throughout
- **Grounding** — No hallucinated content; everything traceable to source files

---

## 9. Error Handling

| Error Code | Cause | Recovery |
|---|---|---|
| `MCP_UNREACHABLE` | MCP Gateway down | Check mcp-gateway container |
| `REPO_ACCESS_DENIED` | No GitHub token or wrong permissions | Verify GITHUB_TOKEN scopes |
| `BRANCH_CONFLICT` | Branch already exists | Use a unique branch name |
| `AI_KEY_MISSING` | No API key for selected provider | Add key in Settings > API Keys |
| `CONTRACT_VIOLATION` | Generated doc doesn't meet contract | Agent retries with corrections |
