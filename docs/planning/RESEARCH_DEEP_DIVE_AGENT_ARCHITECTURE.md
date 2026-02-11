# Research Deep Dive — Agent Architecture, Testing & Production Patterns

> ## Özet (TR)
> Bu belge AKIS Platform'un agent mimarisini güçlendirmek için yapılan güncel araştırma bulgularını
> derler. Production-ready FSM lifecycle, orchestrator pattern, contract enforcement, resilience
> (retry/circuit breaker), deterministic test stratejileri, RAG context management, agent UX/UI
> ilkeleri, MCP best practices ve observability konularını kapsar. Her bölüm AKIS'in mevcut durumu,
> tespit edilen boşluklar ve aksiyon önerilerini içerir. Teknik detaylar İngilizce olarak sunulmaktadır.

> **Date:** 2026-02-10
> **Status:** Active
> **Related Tasks:** S0.5.1-AGT (Agent Reliability), S0.5.2-RAG (Context Packs), S0.5.3-QA (Golden Paths)
> **Plan Reference:** [`DELIVERY_PLAN_S0.5_FEB_TO_GRADUATION.md`](DELIVERY_PLAN_S0.5_FEB_TO_GRADUATION.md)

---

## Table of Contents

1. [AI Agent Architecture — Production Patterns](#1-ai-agent-architecture--production-patterns)
2. [Resilience Patterns](#2-resilience-patterns)
3. [Test/QA — Deterministic Agent Testing](#3-testqa--deterministic-agent-testing)
4. [RAG / Context Packs](#4-rag--context-packs)
5. [Agent UX/UI Principles](#5-agent-uxui-principles)
6. [Agent Observability](#6-agent-observability)
7. [MCP Production Best Practices](#7-mcp-production-best-practices)
8. [Skill-Based Architecture (Future Work)](#8-skill-based-architecture-future-work)
9. [AKIS Gap Analysis](#9-akis-gap-analysis)
10. [Full Reference List](#10-full-reference-list)

---

## 1. AI Agent Architecture — Production Patterns

### 1.1 FSM Lifecycle — Industry Standard

State-machine-based architecture is the gold standard for production-ready agents as of 2025-2026. Frameworks such as LangGraph (used in production by LinkedIn, Uber, Klarna), Dapr Agents, and HireSynth's synth_machine all adopt FSM as the foundational architectural primitive. [Ref 1, 9, 17]

AKIS uses a 5-state FSM:

```
pending ──▶ running ──▶ completed
                   └──▶ failed
                   └──▶ awaiting_approval (Scribe only)
```

This aligns with the LangGraph approach of treating "agents as state machines rather than conversational pipelines." [Ref 9]

**Concrete industry examples:**
- **Mia-Platform Flow Manager** manages multi-agent workflows with FSM models, defining inter-step flows and bounded retries within the same infrastructure. [Ref 23]
- **Arun Baby's multi-agent architecture guide** recommends modeling every task as `PENDING → RUNNING → (SUCCEEDED | FAILED)` with bounded retries. [Ref 24]
- **Composio's MCP-based framework** advocates all agents connecting through a single MCP Gateway for unified error handling. [Ref 25]

### 1.2 Six Non-Negotiable Production Features

The LangGraph Runtime Architecture (2025) identifies six features every production agent system must have:

| # | Feature | Description | AKIS Status |
|---|---------|-------------|-------------|
| 1 | **Robust State Management** | Clear mechanisms for defining, updating, persisting state across steps | ✅ `AgentOrchestrator` + DB jobs table |
| 2 | **Durability & Checkpointing** | Survive process restarts via checkpoints; resume without wasted tokens | ❌ Gap — job restarts from scratch on failure |
| 3 | **Structured Conditional Execution** | If/then/else branching, loops, parallel execution via graph-based architecture | ⚠️ Partial — Playbooks are sequential only |
| 4 | **Observability & Tracing** | Deep integration for debugging agent decision-making | ✅ `TraceRecorder` + `JobEventBus` SSE |
| 5 | **Latency Management** | Handle execution in seconds/minutes/hours, not milliseconds | ✅ `StaleJobWatchdog` for hung jobs |
| 6 | **Non-Deterministic Handling** | Checkpoints, approvals, comprehensive testing | ⚠️ Partial — `dryRun` + `awaitingApproval` (Scribe) |

**Action:** Feature #2 (Checkpointing) can be spiked in M2. Not critical for golden path completion but valuable for thesis discussion as a "durability gap."

### 1.2b Idempotency Requirement

All agent tasks must be idempotent — re-running a failed task should not create side effects (duplicate branches, duplicate PRs, duplicate commits). [Ref 24] This is critical for retry safety. AKIS's current implementation partially addresses this:
- Scribe: Branch naming includes timestamp (`docs/scribe-{timestamp}`) — avoids collision but does not deduplicate
- Trace/Proto: `branchStrategy: 'auto'` creates new branches — no deduplication
- **Gap:** No idempotency keys at the job submission level

### 1.3 Orchestrator Pattern

Three canonical orchestration patterns exist in the industry [Ref 12, 13]:

| Pattern | Description | AKIS Fit |
|---------|-------------|----------|
| **Sequential** | Deterministic, high control, higher latency | ✅ Current model — correct for golden paths |
| **Supervisor-Worker** | Tasks branch or require oversight | ✅ `AgentOrchestrator` acts as supervisor |
| **Hierarchical** | Multi-agent scenarios with delegation chains | Future — relevant for shelved Developer/Coder agents |

Key principle from A21.ai (2025): "Each role must be bounded and logged — for explainability, portability, audit speed, and repeatable value delivery." [Ref 12]

AKIS's architecture follows this principle:
- **Bounded:** Each agent (Scribe, Trace, Proto) has a typed contract + playbook
- **Logged:** TraceRecorder captures full execution history
- **DI-injected:** Agents never instantiate their own adapters or clients

### 1.4 Contract Enforcement

ArXiv 2407.18074 "Principal-Agent RL: Orchestrating AI Agents with Contracts" establishes that contract-based orchestration uses formal mechanisms to align agent behavior with intended outcomes. The principal-agent model from economics synergizes with RL to guide agents through explicit contracts that specify payments based on observable outcomes. [Ref 1]

AKIS's implementation maps directly:
- `AgentContract` defines typed input/output schemas per agent
- `AgentPlaybook` specifies execution steps and capabilities
- `PlanGenerator` creates structured plans for complex agents
- Zod validation enforces schema compliance at API boundary

**Thesis note:** ArXiv 2407.18074 can be directly cited — AKIS's "contract-first agent design" fits this academic framework.

### 1.5 Three Horizons of Maturity

A21.ai describes three adoption horizons [Ref 12]:

| Horizon | Focus | AKIS Phase |
|---------|-------|------------|
| H1 | Harden single patterns, prove value | **S0.5 (Current)** — golden paths, contracts, determinism |
| H2 | Reusable services with templates and contracts | **M2 (March)** — resilience, pg_trgm, UX improvements |
| H3 | Productized platform with composable agents | **M3+ (April-May)** — graduation, future work |

---

## 2. Resilience Patterns

### 2.1 Current State

AKIS agents depend on three external services: **AI Provider**, **MCP Gateway**, **GitHub API** (via MCP). Each can fail transiently or persistently.

### 2.2 Retry with Exponential Backoff + Jitter

Exponential backoff is foundational for transient failures (429, 5xx). The pattern spaces retries progressively (1s, 2s, 4s, 8s) to avoid overwhelming already-struggling services. Adding jitter (0-20% random variation) prevents thundering herd when multiple clients fail simultaneously. [Ref 19, 20]

**AKIS status:** `AIRateLimitedError` includes `retryAfter` field, but there is no systematic backoff implementation at the adapter level.

### 2.3 Circuit Breaker Pattern

Circuit breakers distinguish transient failures (worth retrying) from persistent ones (wasteful to retry). Three states: Closed (normal) → Open (fail fast) → Half-Open (test recovery). [Ref 19]

**AKIS status:** Missing. When MCP Gateway is down, every request is attempted and fails. This wastes resources and delays user feedback.

### 2.4 Per-Tool Timeout Management

Per-tool timeouts prevent agents from hanging on external APIs. Progressive timeout adjustment based on historical performance data improves both responsiveness and reliability. [Ref 19]

**AKIS status:** `StaleJobWatchdog` handles job-level timeouts. Tool-level (per-MCP-call) timeouts are not implemented.

### 2.5 Graceful Degradation

When external services fail, agents should provide fallback responses rather than hard failures. [Ref 19]

**AKIS status:**
- Proto ✅ — has `Default Scaffold (Fallback)` when AI generation fails
- Scribe ❌ — no fallback mechanism
- Trace ❌ — no fallback mechanism

### 2.6 Recommended Action (M2)

Create `backend/src/utils/resilience.ts` with:
- `RetryWithBackoff` — configurable max retries, initial delay, jitter
- `CircuitBreaker` — configurable failure threshold, recovery timeout
- Apply to all MCP adapter calls and AI provider calls

**Orchestrator-level health monitoring:** Dependencies (MCP Gateway, LLM providers, other services) must be health-checked at the orchestrator level. Similar to Kubernetes-style infrastructure, health check endpoints confirm service readiness. If a service is unhealthy, the orchestrator should take an alternative path or produce an alert. [Ref 24, 26]

**References:** "Agents That Don't Break: Production Patterns" (2025) [Ref 19], SparkCo Retry Best Practices [Ref 20], Dapr Resiliency Policies [Ref 21], Resilience Circuit Breakers for Agentic AI [Ref 26]

---

## 3. Test/QA — Deterministic Agent Testing

### 3.1 LLM Agent Test Pyramid

ArXiv 2601.18827 "Automated Structural Testing of LLM-Based Agents" adapts the software engineering test automation pyramid for LLM agents [Ref 2]:

1. **Trace-based testing** — Capture agent trajectories via OpenTelemetry traces
2. **Mock-based reproducibility** — Mock LLM responses to enforce deterministic behavior in CI
3. **Assertion-based verification** — Validate output structure and behavioral properties

**AKIS applicability:** `TraceRecorder` already produces traces. These can be converted to test assertions. Golden path tests can run in CI with LLM mocks (no live API calls needed).

### 3.1b Contract Languages and Golden Traces

**FACET contract language** defines the structure (types, required fields) of JSON outputs that agents must produce. If an output does not conform to the schema, the operation is rejected and the agent can retry. This enables immediate "contract violation" detection and logging. [Ref 27]

**Golden Traces** are complete records of a successful agent execution. In CI pipelines, "dry-run" mode captures a full agent run once; subsequent changes replay these recorded inputs and outputs for consistency checks. This "record once, replay in CI" pattern eliminates the need for live LLM calls during regression testing. [Ref 28]

**Promptfoo integration:** Package the agent runner as a script, run it against fixed datasets, and automatically validate JSON schema ("format"), correct tool calls ("policy"), and quality metrics ("quality"). Failed outputs are logged and surfaced for developer review. [Ref 28]

The "test first, fix second" principle applies: define failure examples, add them to the test suite, then fix. This ensures regressions in the main flow are caught in CI. [Ref 28]

### 3.2 CORE Framework — Full-Path Evaluation

ArXiv 2509.20998 introduces CORE (Correct Ordering and Reasoning Evaluation), which moves beyond final-state evaluation to assess the full execution path using Deterministic Finite Automata (DFAs) [Ref 3]. Five metrics:

| Metric | What It Measures | AKIS Relevance |
|--------|-----------------|----------------|
| **Path Correctness** | Were the right steps taken in the right order? | FSM transition validation |
| **Path Correctness-Kendall's τ** | Step ordering quality | Playbook step sequence |
| **Prefix Criticality** | Did critical early steps succeed? | Planning phase validation |
| **Harmful-Call Rate** | Ratio of harmful/unnecessary tool calls | MCP call audit |
| **Efficiency** | Ratio of useful steps to total steps | Token/cost optimization |

**Thesis note:** Evaluating AKIS's FSM with CORE metrics would be a strong academic contribution.

### 3.3 CI Pipeline Integration Tools

| Tool | Approach | AKIS Integration Point |
|------|----------|----------------------|
| **promptproof-action** [Ref 3b] | Recorded fixture replay, schema/regex/budget rules, PR comments | CI golden path regression without live API calls |
| **agent-contracts** [Ref 3c] | Structured contract definition + verification framework | Extends existing `AgentContract` types |
| **Promptfoo** [Ref 18] | JSON schema validation, similarity assertions, weighted scoring | Complements `QualityScoring` (0-100) |

### 3.4 Three-Layer Assertion Strategy for Golden Paths

Recommended approach for AKIS golden path validation:

```
Layer 1: STRUCTURAL
  └─ Zod schema validates output shape (already exists)
  └─ Required fields present, types correct

Layer 2: BEHAVIORAL
  └─ FSM transitions occur in correct order
  └─ Planning phase produces valid plan before execution
  └─ No invalid state transitions (CORE Path Correctness)

Layer 3: QUALITY
  └─ QualityScoring >= 60 threshold
  └─ Output meets minimum content requirements
  └─ No empty/placeholder sections in generated content
```

### 3.5 BEAVER — Deterministic LLM Verification

ArXiv 2512.05439 introduces BEAVER, the first practical framework for computing sound probability bounds on LLM constraint satisfaction [Ref 7]. It achieves 6-8x tighter probability bounds and identifies 3-4x more high-risk instances than baseline methods. While full implementation is out of scope for S0.5, the concept of "provable constraint satisfaction" reinforces AKIS's contract-first approach.

---

## 4. RAG / Context Packs

### 4.1 "Everything is Context" Paradigm

ArXiv 2512.05470 "Everything is Context: Agentic File System Abstraction for Context Engineering" establishes context engineering as the central architectural concern for agentic AI systems, superseding traditional prompt engineering [Ref 4]. The paper describes a unified file-system abstraction that treats all context artifacts uniformly through mounting, metadata, and access control.

AKIS's context packs mechanism aligns with this paradigm:
- **Selection** — MCP GitHub adapter fetches relevant files
- **Assembly** — Orchestrator bundles files as JSON context pack
- **Compression** — File/size limits enforce token budget
- **Delivery** — Context pack passed to agent as part of prompt

### 4.2 Token Budget Management

AKIS's current limits are sound:

| Agent | Max Files | Max Size | Rationale |
|-------|-----------|----------|-----------|
| Scribe | 50 | 200KB | Needs broad codebase view for documentation |
| Trace | 30 | 150KB | Focused on target module + existing tests |
| Proto | 20 | 100KB | Spec-driven, minimal code context needed |

**Future improvements (M2):**
- **Relevance scoring** — Rank files by importance; drop least relevant first during truncation
- **Metadata-driven selection** — Use file metadata (last modified, size, language) to prioritize
- **Context rot detection** — Flag stale files that may mislead agents

### 4.2b Token Overflow Strategies

When fetched content exceeds the LLM context window, several overflow management strategies apply [Ref 30]:

| Strategy | Description | Trade-off |
|----------|-------------|-----------|
| **Truncation** | Drop lowest-scored chunks | Simple, may lose relevant tail content |
| **Re-ranking** | Score and re-order chunks, select top-K | Better quality, additional computation |
| **Selective inclusion** | Include only chunks above a relevance threshold | Adaptive, may under-fill context |
| **Summarization** | Pre-summarize long content with a lighter model | Preserves information, adds latency |
| **Chunking optimization** | Keep chunk sizes small during indexing | Proactive, requires tuning |

For AKIS's static context packs, **truncation** (dropping lowest-priority files when pack exceeds size limit) is the correct strategy for S0.5. **Re-ranking** can be added in M2 alongside the pg_trgm spike.

### 4.3 March pg_trgm Spike — Comparison

If pilot feedback indicates static context packs miss important files, `pg_trgm` is the planned lightweight retrieval mechanism for M2.

| Criterion | pg_trgm | Full Text Search (tsvector) |
|-----------|---------|----------------------------|
| **Fuzzy matching** | Excellent (typo tolerance) | Weak |
| **Short strings** | Ideal | Overkill |
| **Language independence** | Yes | No (requires stemming dictionaries) |
| **Setup complexity** | Simple (`CREATE EXTENSION`) | Complex (dictionary, tsvector config) |
| **Performance (<10K chunks)** | <100ms | <100ms |
| **Semantic understanding** | None | Limited (word normalization) |

**Decision:** pg_trgm is the correct choice for AKIS. FTS only if multi-language stemming (TR+EN code comments) becomes necessary.

### 4.4 Agentic RAG Evolution

ArXiv 2501.09136 describes Agentic RAG — embedding autonomous agents into the retrieval pipeline for dynamic strategy management [Ref 5]. While this is beyond S0.5 scope, it represents a natural evolution path: agents that can dynamically decide what context they need rather than receiving pre-assembled packs.

---

## 5. Agent UX/UI Principles

### 5.1 Progressive Disclosure Pattern

The Progressive Disclosure pattern (Nielsen 2006, agentic-design.ai 2025) reveals information gradually to prevent cognitive overload [Ref 14, 22]:

```
Layer 1 (Summary):   "Scribe generated 3 files, PR opened"
Layer 2 (Detailed):  File list, commit messages, plan outline
Layer 3 (Technical): Token usage, AI metrics, full trace log
```

**Implementation principles:**
- Start with essential information only
- Use consistent expand/collapse controls
- Limit nesting to maximum 3-4 levels
- Remember user disclosure preferences
- Provide "expand all" / "collapse all" options

**AKIS application:** Agent console pages (`/agents/scribe`, `/agents/trace`, `/agents/proto`) can be restructured around these three layers. `JobEventBus` SSE stream provides real-time updates for Layer 1.

### 5.1b Validation Pane Pattern

The "Validation Pane" design (Imran Shaik, 2025) presents the agent's planned actions together with what will change in the system, why this path was chosen (with citations), and the risk level — all in a single panel. [Ref 29] This pattern directly maps to AKIS's dry-run preview:

```
┌─────────────────────────────────────────┐
│  VALIDATION PANE                        │
│                                         │
│  Plan:     Generate README.md           │
│  Changes:  1 file, +120 lines           │
│  Why:      Missing documentation        │
│  Risk:     Low (docs-only change)       │
│  Branch:   docs/scribe-1707350400       │
│                                         │
│  [Preview Diff]  [Execute]  [Cancel]    │
└─────────────────────────────────────────┘
```

Every proposed action and plan should be presented to the user with a summary, rationale, diff preview, and source links. Irreversible actions must be clearly marked. [Ref 29]

### 5.2 Error Resolution UX

The Error Handling and Recovery Pattern (agentic-design.ai) defines a three-step error explanation:

```
What happened?  →  "AI key not found"
Why?            →  "Scribe agent could not access AI provider"
How to fix?     →  [Settings > AI Keys] button (direct link)
```

**AKIS status:** Backend `errorCode` + `userMessage` (AGT-6, 39 unit tests) covers "what" and "why." Frontend needs "how to fix" action links — planned for M2.

### 5.3 Agent Status & Activity Visualization

Microsoft Design (2025) and Agentic Design framework [Ref 14, 22] recommend:
- **Real-time status indicators** — Animate FSM state transitions (`pending → running → completed`)
- **Step-by-step progress** — Show planning, execution, review as a timeline
- **Confidence visualization** — Display `qualityScore` (0-100) as a visual bar

### 5.4 Dry-Run to Execute Pattern

Progressive disclosure applies naturally to the dry-run workflow:

```
Step 1: User configures agent parameters
Step 2: Dry-run preview shows what will happen (files, branches, changes)
Step 3: User reviews preview and clicks "Execute"
Step 4: Real execution with live progress updates
```

AKIS already supports this via the `dryRun` boolean in all three agent payloads. The UX layer can be enhanced with richer preview formatting.

### 5.5 Additional Agent UX Patterns

The agentic-design.ai catalog includes 21 UI/UX patterns relevant to agent systems. Beyond progressive disclosure, the most relevant for AKIS are:

| Pattern | Description | AKIS Relevance |
|---------|-------------|----------------|
| Human-in-the-Loop (HITL) | User approval before critical actions | `awaitingApproval` state (Scribe) |
| Trust and Transparency (TTP) | Show reasoning traces for user trust | TraceRecorder output display |
| Error Handling and Recovery (ERP) | Structured error explanation and resolution | AGT-6 error envelope |
| Onboarding and Education (OEP) | Guide users through first agent interaction | Getting Started card (WL-3) |
| Agent Status & Activity (ASP) | Real-time execution status display | JobEventBus SSE stream |

---

## 6. Agent Observability

### 6.1 Five Pillar Model

The definitive guide to agent observability (getmaxim.ai, 2025) defines five pillars [Ref 16]:

| Pillar | Description | AKIS Status |
|--------|-------------|-------------|
| **Traces** | Record every step of agent execution | ✅ `TraceRecorder` |
| **Metrics** | Success rate, latency, token usage, cost | ✅ `aiMetrics` in job record |
| **Logs** | Structured JSON with correlation IDs | ✅ Pino + `requestId` |
| **Evaluations** | Offline + online quality scoring | ✅ `QualityScoring` (0-100) |
| **Human Feedback** | User feedback capture and analysis | ✅ `FeedbackWidget` + feedback table |

**AKIS covers all 5 pillars at a basic level.** This is a strong foundation relative to industry benchmarks.

### 6.2 Critical Metrics

Industry data (OrbitalAI, 2025) shows that 67% of production AI agent failures are discovered by users rather than monitoring systems. Teams with comprehensive observability debug issues 10x faster (12 min vs 2 hours). [Ref 1b]

Five critical metrics to track:

| Metric | Target | AKIS Tracking |
|--------|--------|---------------|
| Success rate | >99% | Job state distribution (completed vs failed) |
| Response latency | p95 <3s | `aiMetrics.summary.totalDurationMs` |
| Token usage | Budget-bounded | `aiMetrics.summary.totalTokens` |
| Error rates | <1% sustained | `errorCode` distribution |
| Business outcomes | Agent-specific | `qualityScore`, files generated, PRs created |

### 6.3 OpenTelemetry Standards

OpenTelemetry is developing AI agent observability standards (2025) [Ref 15]. AKIS's current `requestId`-based tracing can be migrated to OTel in M2+ for vendor-neutral, standardized observability.

### 6.4 Semantic Tracing

Traditional tracing captures timestamps and status codes. Agent observability requires "semantic tracing" — capturing thoughts, actions, and outcomes [Ref 16]. AKIS's `TraceRecorder` already captures execution steps semantically, placing it ahead of many production systems.

### 6.5 Per-Level Trace Granularity

Comprehensive tracing must cover four levels [Ref 24]:

```
Job Level    →  Overall job status, duration, final state
Task Level   →  Individual task within a job (e.g., "clone repo", "generate docs")
Agent Level  →  Agent decision points, plan generation, critique steps
Tool Level   →  Each MCP/AI tool call with input, output, latency, error code
```

At each level, track: tokens consumed, steps taken, tool calls made, latencies, and failure reasons. This data enables failure analysis and performance optimization. Explicitly defined alerts (e.g., error threshold breach) and visualizations (LLM usage graphs) give operators fast intervention capability. [Ref 24]

AKIS's `TraceRecorder` captures agent-level and tool-level traces. `aiMetrics` in the job record covers job-level metrics. The gap is in **cross-job aggregation** and **alerting** — planned for M2+.

---

## 7. MCP Production Best Practices

### 7.1 MCP Best Practice Guide (mcp-best-practice.github.io)

The vendor-neutral MCP Best Practice Guide (2025) provides comprehensive guidance for building, deploying, and operating MCP servers in production [Ref 10].

### 7.2 Design Principles — AKIS Compliance

| Principle | Description | AKIS Status |
|-----------|-------------|-------------|
| **Single responsibility** | One domain per server | ✅ `GitHubMCPService`, `JiraMCPService`, `ConfluenceMCPService` |
| **Contracts first** | Strict I/O schemas, explicit side effects | ✅ Zod validation on all endpoints |
| **Stateless by default** | No hidden server memory | ✅ Adapters are stateless |
| **Security by design** | Identity, authorization, audit built in | ✅ JWT auth + request logging |
| **Controlled autonomy** | Least-privilege tools with approval paths | ✅ `dryRun` mode + `awaitingApproval` |

### 7.3 Gateway Pattern

The MCP Gateway Pattern is recommended for enterprise scale [Ref 10]:
- Centralized authentication, authorization, routing, rate limiting
- Security boundary enforcement (TLS termination)
- Policy-as-code enforcement
- Multi-tenancy management

AKIS uses a gateway architecture with MCP Gateway as an always-on service in the staging Docker Compose stack. This aligns with the recommended pattern.

### 7.4 Identified Gaps

| Gap | Description | Priority |
|-----|-------------|----------|
| **Circuit breakers** | No adapter-level circuit breaking for MCP calls | M2 |
| **Idempotency keys** | No client-provided idempotency keys for create/update | M2 |
| **Rate limiting** | No per-tool rate limiting at adapter level | M2 |
| **Health probes** | MCP Gateway health monitored at `/ready` but not circuit-broken | M2 |

### 7.5 MCP Ecosystem Integration Patterns

Community patterns combine MCP with orchestration frameworks [Ref 32, 33]:
- **LangChain MCPToolkit** pulls tools from MCP servers and injects them into LangChain agents. Pattern: "LangChain for orchestration, MCP for tool connections."
- **CrewAI MCPServerAdapter** loads MCP servers at startup and provides all tools to agents automatically.
- **Combined stack:** MCP provides the tool layer, LangChain manages RAG/workflow, CrewAI handles multi-agent coordination.

**Security consideration:** Only connect to trusted MCP servers. When using SSE (Server-Sent Events) transport, guard against DNS rebinding attacks. [Ref 33]

AKIS's architecture already follows this pattern: MCP adapters at `backend/src/services/mcp/adapters/` serve as the tool layer, while `AgentOrchestrator` handles workflow management.

### 7.6 Anthropic MCP Registry

The official MCP Registry (modelcontextprotocol.io, 2025) standardizes server registration using `server.json` format with namespace management via DNS or GitHub authentication [Ref 11]. AKIS's adapter pattern at `backend/src/services/mcp/adapters/` is compatible with this standard.

### 7.6 Production Readiness Checklist (from MCP Best Practices)

- [x] Identity and authorization with least privilege
- [x] Input validation and output sanitization
- [x] Audit logging and metrics wired to observability
- [ ] Rate limits, backpressure, circuit breakers configured
- [x] Secrets in managed store (encrypted AI keys)
- [x] Versioned APIs with deprecation paths
- [ ] Documented SLOs, runbooks, rollback procedures

---

## 8. Skill-Based Architecture (Future Work)

### 8.1 HERAKLES — Hierarchical Skill Compilation

HERAKLES (ICLR 2025) enables two-level hierarchical LLM agents to continuously compile mastered goals into reusable skills [Ref 6]:
- **High-level controller** (LLM): Goal decomposition and subgoal planning
- **Low-level skills** (neural network): Compiled, efficient execution

AKIS mapping: The `AgentOrchestrator` serves as the high-level controller, while individual agents (Scribe, Trace, Proto) execute specific skills. Playbooks define the skill capabilities.

### 8.2 PSEC — Parametric Skill Expansion and Composition

PSEC (ICLR 2025) maintains a skill library using plug-and-play LoRA modules [Ref 6]:
- **Parameter-efficient finetuning** for new skills
- **Direct skill composition** by merging modules in parameter space
- **Context-aware activation** for collaborative task handling

While AKIS agents use LLM as a tool (not as the agent itself), the concept of composable skill modules maps to Playbook capabilities. Future evolution could decompose Scribe into skills: "code reading" + "doc generation" + "PR creation."

### 8.2b Anthropic Agent Skills Pattern

Anthropic's Agent Skills approach defines each skill as a filesystem directory containing content and scripts that agents load on demand. [Ref 31] For example, skills like "PDF processing" or "code analysis" are loaded automatically when needed. Complex workflows are built by composing skills.

This maps to a natural evolution of AKIS's Playbook system:
- **Current:** Playbooks define static capability lists per agent
- **Evolution:** Playbooks become skill manifests with dynamic loading
- **Future:** Shared skill library across agents (e.g., "GitHub PR creation" skill reused by Scribe + Proto)

### 8.3 Practical Multi-Agent Composition

In February 2026, Anthropic demonstrated 16 Claude instances collaboratively building a C compiler through shared Git repositories, minimal supervision, and autonomous conflict resolution [Ref 6b]. This validates the multi-agent approach that AKIS's shelved Developer/Coder agents could adopt in M3+.

### 8.4 Thesis Positioning

Skill-based architecture represents a natural evolution path for AKIS:
- **Current (S0.5):** Monolithic agents with typed contracts
- **Next (M2-M3):** Decomposed skills within agents
- **Future:** Composable skill library shared across agents

This progression can be framed as "from contract-first agents to skill-composable agents" in the thesis future work section.

---

## 9. AKIS Gap Analysis

### 9.1 Summary Table

| Area | Current State | Gap | Impact | Timeline |
|------|--------------|-----|--------|----------|
| **FSM Lifecycle** | 5-state FSM, DB persistence | No mid-execution checkpointing | Low (golden paths are short) | M2 spike |
| **Orchestrator** | DI + Factory + Registry pattern | No parallel execution | Low (sequential is correct for S0.5) | Post-M1 |
| **Contract Enforcement** | Zod + typed contracts + playbooks | No runtime output validation against contract | Medium | Golden path tests |
| **Resilience** | Basic `retryAfter` on AI errors | No circuit breaker, no systematic backoff, no per-tool timeout | Medium | M2 |
| **Testing** | 1,391 tests (842 backend + 549 frontend) + Scribe Golden Trace replay + 5-path QA acceptance matrix + TraceAutomationRunner (Playwright execution engine) + TrustScoringService (4-bar metrics) + webhook HMAC-SHA256 validation + Studio command/patch security tests | Cross-agent LLM-free golden trace replay still partial (Scribe done; Trace runner ready, Proto pending) | **Low** (P2) | M2 |
| **Context Packs** | 3 agent profiles, size-limited | No relevance scoring, no context quality evaluation | Low | M2 (pg_trgm spike) |
| **Agent UX** | Console pages, SSE stream | No progressive disclosure, no "how to fix" links | Medium | M2 |
| **Observability** | 5/5 pillars at basic level | No OTel standardization, no alerting on sustained failures | Low | M2+ |
| **MCP Adapters** | 3 adapters, stateless, gateway pattern | No idempotency keys, no adapter-level circuit breaker | Medium | M2 |
| **Skill Architecture** | Playbooks as implicit skill library | No formal skill decomposition or composition | Low | Thesis future work |

### 9.2 Priority Actions

**P0 — Now (Golden Path Completion):**
1. Validate golden path tests include all 3 assertion layers (structural, behavioral, quality)
2. Ensure `dryRun` mode tests cover happy path + all error codes
3. Verify MCP Gateway connectivity in staging with `GITHUB_TOKEN`

**P1 — M2 (March 2026):**
1. Implement `resilience.ts` (RetryWithBackoff + CircuitBreaker)
2. Apply circuit breaker to MCP adapter calls
3. Add progressive disclosure to agent console pages
4. Run pg_trgm spike for context retrieval
5. Add "how to fix" action links to error displays

**P2 — M3+ (April-May 2026):**
1. Evaluate OTel migration for standardized observability
2. Explore skill decomposition within agents
3. Consider checkpointing for long-running agent executions

---

## 10. Full Reference List

### Academic Papers

| # | Reference | Year | Topic |
|---|-----------|------|-------|
| Ref 1 | ArXiv 2407.18074 — "Principal-Agent RL: Orchestrating AI Agents with Contracts" | 2024 | Contract-based agent orchestration |
| Ref 2 | ArXiv 2601.18827 — "Automated Structural Testing of LLM-Based Agents" | 2026 | Agent test automation pyramid |
| Ref 3 | ArXiv 2509.20998 — "CORE: Full-Path Agent Evaluation with DFA" | 2025 | Full-path execution evaluation |
| Ref 4 | ArXiv 2512.05470 — "Everything is Context: Agentic File System Abstraction" | 2025 | Context engineering paradigm |
| Ref 5 | ArXiv 2501.09136 — "Agentic RAG: Evolution Beyond Static Workflows" | 2025 | Agentic retrieval-augmented generation |
| Ref 6 | ICLR 2025 — "PSEC: Parametric Skill Expansion and Composition" | 2025 | Skill-based agent composition |
| Ref 7 | ArXiv 2512.05439 — "BEAVER: Efficient Deterministic LLM Verifier" | 2025 | Deterministic output verification |
| Ref 8 | ArXiv 2507.21504 — "Evaluation and Benchmarking of LLM Agents: A Survey" | 2025 | Comprehensive agent evaluation taxonomy |

### Industry Sources

| # | Reference | Year | Topic |
|---|-----------|------|-------|
| Ref 9 | LangGraph Runtime Architecture — blog.langchain.com | 2025 | Production agent runtime design |
| Ref 10 | MCP Best Practice Guide — mcp-best-practice.github.io | 2025 | Vendor-neutral MCP production guidance |
| Ref 11 | Anthropic MCP Specification — modelcontextprotocol.io | 2025 | MCP registry and server standards |
| Ref 12 | A21.ai — "Agentic Orchestration Patterns That Scale" | 2025 | Orchestration pattern taxonomy |
| Ref 13 | Microsoft Azure — "AI Agent Design Patterns" | 2025 | Enterprise agent design patterns |
| Ref 14 | Agentic Design — agentic-design.ai (21 UI/UX patterns) | 2025 | Agent UX pattern catalog |
| Ref 15 | OpenTelemetry — "AI Agent Observability Standards" | 2025 | Emerging observability standards |
| Ref 16 | getmaxim.ai — "Agent Observability: The Definitive Guide" | 2025 | 5-pillar observability model |
| Ref 17 | Dapr Agents — docs.dapr.io | 2026 | Distributed agent framework |
| Ref 18 | Promptfoo — promptfoo.dev | 2025 | LLM assertion and evaluation |
| Ref 19 | "Agents That Don't Break: Production Patterns" | 2025 | Retry, circuit breaker, guardrails |
| Ref 20 | SparkCo — "Mastering Retry Logic Agents" | 2025 | Retry best practices |
| Ref 21 | SkyWork AI — "Observability for Manus 1.5 Agents" | 2025 | Error budgets and structured logging |
| Ref 22 | Microsoft Design — "UX Design for Agents" | 2025 | Agent interaction design principles |

### Additional Sources (from P0 Research Brief)

| # | Reference | Year | Topic |
|---|-----------|------|-------|
| Ref 23 | Mia-Platform — "AI Agent Lifecycle" (docs.mia-platform.eu) | 2025 | FSM-based multi-agent workflow management |
| Ref 24 | Arun Baby — "Scaling Multi-Agent Systems" (arunbaby.com) | 2025 | Multi-agent architecture, bounded retries |
| Ref 25 | Composio — "MCP Gateways: A Developer's Guide to AI Agent Architecture" (composio.dev) | 2026 | Unified MCP Gateway pattern |
| Ref 26 | Michael Hannecke — "Resilience Circuit Breakers for Agentic AI" (Medium) | 2025 | Circuit breaker patterns for agent systems |
| Ref 27 | FACET Language — "Contracts and Determinism in Production AI" (rokoss21.tech) | 2025 | Contract language for JSON output validation |
| Ref 28 | Meryem Sakin — "Testing AI Agents in CI: From Vibes to Determinism" (Medium) | 2025 | Golden Traces, Promptfoo CI integration |
| Ref 29 | Imran Shaik — "The Validation Pane: How Agents Should Show Their Work" (AI in Plain English) | 2025 | Agent UX validation panel design |
| Ref 30 | APXML — "Managing LLM Context Length Limitations in RAG" | 2025 | Token overflow strategies, truncation, re-ranking |
| Ref 31 | Anthropic — "Agent Skills" (platform.claude.com/docs) | 2025 | Filesystem-based skill modules for agents |
| Ref 32 | Digital Applied — "MCP vs LangChain vs CrewAI: Agent Framework Comparison" | 2026 | Framework comparison and integration patterns |
| Ref 33 | CrewAI — "MCP Servers as Tools" (docs.crewai.com) | 2025 | MCPServerAdapter integration |
| Ref 34 | A B Vijay Kumar — "MCP Deep Dive: Deployment Patterns" (Medium) | 2025 | MCP deployment and transport patterns |

---

*This document serves as the research foundation for AKIS agent architecture improvements. It should be referenced alongside the canonical delivery plan and agent contracts when making architectural decisions.*

*Related documents:*
- *[Agent Contracts](../agents/AGENT_CONTRACTS_S0.5.md)*
- *[Context Packs ADR](../agents/CONTEXT_PACKS.md)*
- *[Research Brief — S0.5](RESEARCH_BRIEF_S0.5_STAGING_RAG_AGENTS.md)*
- *[Delivery Plan](DELIVERY_PLAN_S0.5_FEB_TO_GRADUATION.md)*
