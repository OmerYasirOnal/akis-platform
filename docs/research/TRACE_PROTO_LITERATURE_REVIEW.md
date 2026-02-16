# Literature Review: LLM-Based Test Generation & Agentic Code Scaffolding

> **Purpose:** Academic literature review for AKIS Platform thesis — covers Trace Agent (automated test generation) and Proto Agent (agentic code scaffolding) theoretical foundations.
> **Author:** Ömer Yasir Önal
> **Date:** 2026-02-12
> **Status:** Draft v1.0
> **Thesis Section:** Chapter 2 (Literature Review) + Chapter 3 (Methodology)

---

## 0. M2+ Primary Validation Addendum (2026-02-16)

Bu doküman M2+ reliability kapanışında `primary-first` karar modeliyle güncellendi.
Karar-kod-metrik zinciri için kanonik kayıt:

- `docs/research/TRACE_AGENT_EVIDENCE_MATRIX.md`
- `docs/qa/TRACE_EVAL_PROTOCOL.md`

Bu addendum ile Trace tarafındaki şu kararlar kilitlendi:

1. Determinism doğrulaması exact-equality değil drift-threshold bazlı.
2. Edge-case coverage eksenlerinde ASVS `V2/V3/V4` zorunlu.
3. CI Playwright başlangıç profile: `workers=1`, `trace='on-first-retry'`.
4. Flaky yönetimi binary değil, `PFS-lite + selective quarantine`.
5. Rollout politikası observe -> warn -> enforce ve tek env-toggle rollback.

---

## Table of Contents

1. [LLM-Based Test Generation (Trace Agent)](#1-llm-based-test-generation-trace-agent)
2. [Agentic Code Scaffolding (Proto Agent)](#2-agentic-code-scaffolding-proto-agent)
3. [Plan-Execute-Reflect Pipeline](#3-plan-execute-reflect-pipeline)
4. [MCP Protocol & Tool-Use Patterns](#4-mcp-protocol--tool-use-patterns)
5. [Multi-Agent Orchestration](#5-multi-agent-orchestration)
6. [Comparison with AKIS Architecture](#6-comparison-with-akis-architecture)
7. [References](#7-references)

---

## 1. LLM-Based Test Generation (Trace Agent)

### 1.1 Background: Traditional Automated Test Generation

Automated test generation has been studied extensively in software engineering research. Traditional approaches include:

- **Search-Based Software Testing (SBST):** Tools like EvoSuite (Fraser & Arcuri, 2011) use genetic algorithms to evolve test suites that maximize code coverage. EvoSuite generates JUnit test suites targeting branch coverage, mutation testing, and exception-triggering inputs. While effective for structural coverage, SBST produces tests that lack semantic meaning — they exercise code paths but don't validate business requirements.

- **Random Testing:** Randoop (Pacheco & Ernst, 2007) generates random method sequences and uses contracts to classify them as passing or failing. Effective for regression oracle creation but limited in testing complex business logic.

- **Symbolic Execution:** KLEE (Cadar et al., 2008) and similar tools explore program paths symbolically, generating concrete inputs that reach specific code branches. Powerful but suffers from path explosion in real-world programs.

- **Property-Based Testing:** QuickCheck (Claessen & Hughes, 2000) and Hypothesis generate random inputs satisfying property specifications. Effective when properties can be expressed formally, but requires developer-written property definitions.

### 1.2 LLM-Based Approaches (2023-2026)

The emergence of large language models has introduced a paradigm shift in test generation:

- **ChatUniTest (Chen et al., 2023):** Uses ChatGPT to generate unit tests from focal methods. Key insight: LLMs can produce semantically meaningful test names and assertions that reflect actual requirements, unlike coverage-driven approaches. Achieved 58.5% compilation rate and found 11 real bugs in open-source projects.

- **CodiumAI / Qodo (2024):** Commercial tool that analyzes code context (function signature, docstrings, usage patterns) to generate behavior-aware tests. Uses a multi-stage pipeline: (1) analyze function behavior, (2) generate test scenarios, (3) produce test code, (4) validate compilation. This pipeline approach directly influenced AKIS Trace Agent's design.

- **TestPilot (Schäfer et al., 2023):** LLM-based test generation for JavaScript. Demonstrated that GPT-4 can generate tests with 73% passing rate on first attempt when given function source code and existing tests as context. Key finding: providing existing test patterns dramatically improves generated test quality.

- **LIBRO (Kang et al., 2023):** Uses LLMs to generate bug-reproducing tests from bug reports. Demonstrates that natural language specifications (similar to Trace Agent's spec input) can be effectively translated into executable tests.

- **ChatTester (Yuan et al., 2023):** Iterative test generation with ChatGPT, using a generate-validate-repair loop. Achieved 34% improvement over single-pass generation by incorporating compilation feedback. This iterative pattern maps to AKIS's Plan-Execute-Reflect pipeline.

### 1.3 Specification-Driven Test Generation

AKIS Trace Agent's unique contribution is **specification-driven** test generation, where the input is a natural language specification rather than source code:

- **Gherkin/BDD Parsing:** The Trace Agent accepts multiple specification formats (Gherkin, arrow notation, sentence format) and parses them into structured test scenarios. This aligns with research on automated BDD test generation (Carvalho et al., 2021).

- **Coverage Matrix Generation:** Unlike code-level test generators, Trace produces a feature-to-test mapping matrix that visualizes test coverage at the requirements level. This concept draws from requirements-based testing (Whalen et al., 2006).

- **Multi-Format Output:** Trace generates both human-readable test plans (Markdown) and executable test code (TypeScript/Playwright), bridging the gap between documentation and automation.

### 1.4 Relevance to AKIS Trace Agent

| Research Concept | AKIS Implementation |
|---|---|
| ChatUniTest's focal method analysis | Context pack file analysis |
| CodiumAI's multi-stage pipeline | Playbook phases: thinking → discovery → creating → publishing |
| TestPilot's existing test context | Context packs include existing test files |
| ChatTester's iterative repair | Plan-Execute-Reflect pipeline with quality scoring |
| Gherkin parsing | Multi-strategy spec parser (Gherkin/arrow/colon/sentence) |
| LIBRO's NL-to-test | Specification textarea → test plan + executable tests |

---

## 2. Agentic Code Scaffolding (Proto Agent)

### 2.1 Background: Code Generation with LLMs

Code generation has evolved from template-based scaffolding to AI-driven approaches:

- **Copilot & Codex (Chen et al., 2021):** OpenAI Codex demonstrated that large language models trained on code can generate functionally correct code from natural language descriptions. The HumanEval benchmark showed 28.8% pass@1 for code-davinci-002. This established the foundation for all LLM-based code generation.

- **AlphaCode (Li et al., 2022):** DeepMind's competitive programming system generates millions of solutions and filters them. Key insight: generating many candidates and selecting the best one outperforms single-pass generation. Proto Agent's reflection phase implements a lightweight version of this principle.

- **CodeT (Chen et al., 2022):** Combines code generation with automatic test generation for dual validation. Generated tests serve as a selection mechanism for candidate solutions. This dual-generation pattern (code + tests) is partially realized in the AKIS ecosystem where Proto generates code and Trace generates tests.

### 2.2 Agentic Code Generation Frameworks (2023-2026)

The transition from single-pass generation to agentic, multi-step code generation:

- **MetaGPT (Hong et al., 2023):** Multi-agent framework that assigns software engineering roles (Product Manager, Architect, Engineer, QA) to different LLM agents. Each agent produces structured artifacts (PRDs, architecture docs, code, tests). AKIS's separation of Scribe (docs), Trace (tests), and Proto (code) follows a similar role-based decomposition, but with independent orchestration rather than sequential handoff.

- **ChatDev (Qian et al., 2023):** Simulates a software company with communicating agents using a chat-based pipeline (design → coding → testing → documentation). Demonstrated that role-playing improves code quality. Key difference from AKIS: ChatDev agents communicate directly, while AKIS agents are isolated and orchestrated centrally.

- **AutoGPT / GPT-Engineer (2023-2024):** General-purpose autonomous agents that break down tasks, write code, and execute it. GPT-Engineer specifically focuses on project scaffolding from natural language descriptions, similar to Proto Agent. Key limitation: unbounded autonomy leads to unreliable outputs. AKIS addresses this with deterministic playbooks and bounded execution.

- **SWE-Agent (Yang et al., 2024):** Agent that resolves GitHub issues by navigating repositories, editing files, and running tests. Achieved 12.5% resolution rate on SWE-bench. Key design: agent-computer interface (ACI) for structured tool use. AKIS's MCP adapter pattern serves a similar purpose — structured, typed interfaces to external tools.

- **Devin / Cognition (2024):** Autonomous software engineer agent with access to terminal, browser, and editor. Demonstrated end-to-end task completion on real engineering tasks. AKIS Proto Agent is scoped more narrowly (scaffolding only), which improves reliability for the targeted use case.

### 2.3 Scaffolding-Specific Research

- **Yeoman & Create-React-App:** Template-based scaffolding tools that generate project structures from predefined templates. Limitation: rigid templates don't adapt to unique requirements. Proto Agent's AI-driven approach generates custom scaffolds based on natural language requirements.

- **AI-Assisted Project Initialization (Zhang et al., 2024):** Research on using LLMs to generate project structures, configuration files, and boilerplate code. Found that providing tech stack constraints (like Proto's optional `stack` parameter) significantly improves output relevance.

- **Reflection-Guided Generation:** Proto Agent's self-review phase (temp=0.1, critique step) implements reflection-guided generation, where the model evaluates its own output before finalizing. Research by Shinn et al. (2023) on Reflexion demonstrated that self-reflection improves task success rates by 20-30%.

### 2.4 Relevance to AKIS Proto Agent

| Research Concept | AKIS Implementation |
|---|---|
| Codex's NL-to-code | Requirements textarea → scaffold files |
| AlphaCode's candidate selection | Reflection phase evaluates generated code |
| MetaGPT's role decomposition | Scribe (docs) + Trace (tests) + Proto (code) |
| SWE-Agent's ACI | MCP adapters for GitHub interaction |
| Reflexion's self-critique | `reflect()` method with temp=0.1 |
| GPT-Engineer's scaffolding | `parseScaffoldOutput()` file extraction |
| ChatDev's pipeline | Playbook phases: thinking → discovery → creating → reviewing → publishing |

---

## 3. Plan-Execute-Reflect Pipeline

### 3.1 Cognitive Architecture Foundations

AKIS's agent pipeline draws from cognitive science and AI agent research:

- **BDI Architecture (Bratman, 1987):** Belief-Desire-Intention model where agents form plans (intentions) based on beliefs about the world and desires (goals). AKIS agents embody this: context packs represent beliefs, job payload represents desires, and playbook phases represent intentions.

- **OODA Loop (Boyd, 1986):** Observe-Orient-Decide-Act cycle used in military decision-making. AKIS's Plan-Execute-Reflect maps to Orient-Decide-Act-Observe, with the reflect phase providing the observation feedback loop.

- **ReAct (Yao et al., 2022):** Synergizing Reasoning and Acting in LLMs. ReAct interleaves reasoning traces with action execution, allowing the model to update its plan based on observations. AKIS's trace events during execution serve a similar purpose — observable reasoning steps.

- **Reflexion (Shinn et al., 2023):** Extends ReAct with a self-reflection mechanism. After task failure, the agent generates a verbal reflection that is stored in memory and used to improve subsequent attempts. Proto Agent's `reflect()` phase and quality scoring implement this pattern.

### 3.2 Pipeline Comparison

| Framework | Pipeline | Feedback Loop | Determinism |
|---|---|---|---|
| ReAct | Reason → Act → Observe → Repeat | Per-action | Low (temp-dependent) |
| Reflexion | Act → Evaluate → Reflect → Retry | Per-episode | Low |
| AutoGPT | Plan → Execute → Review → Iterate | Per-iteration | Very Low |
| MetaGPT | Design → Code → Review → Fix | Per-stage | Medium |
| AKIS | Plan → Execute → Reflect → Validate | Per-job | High (temp=0, fixed prompts) |

### 3.3 AKIS's Contribution: Deterministic Agentic Pipelines

AKIS differentiates from existing frameworks through:

1. **Temperature Control:** All planning prompts use temp=0 for determinism. Execution prompts use temp=0.2-0.3 for creativity. Reflection uses temp=0.1 for critical evaluation.

2. **Playbook-Driven Execution:** Each agent has a typed playbook defining phases, capabilities, and required fields. This constrains the agent's behavior space, improving reliability.

3. **FSM Lifecycle:** Strict state machine (pending → running → completed | failed) prevents runaway execution. Unlike AutoGPT's unbounded loops, AKIS agents have finite, predictable lifecycles.

4. **Central Orchestration:** AgentOrchestrator owns the full lifecycle. Agents never call each other or instantiate tools directly. This prevents the cascading failures common in multi-agent systems.

5. **Quality Scoring:** Post-execution quality assessment (0-100) provides quantitative feedback for each job, enabling systematic improvement tracking.

---

## 4. MCP Protocol & Tool-Use Patterns

### 4.1 Model Context Protocol (MCP)

The Model Context Protocol, introduced by Anthropic (2024), provides a standardized interface for LLM applications to interact with external tools and data sources:

- **Architecture:** Client-server model where MCP servers expose resources and tools, and MCP clients (like AKIS backend) consume them through a typed protocol.

- **Key Principles:** Vendor-agnostic (works with any LLM), structured tool definitions (JSON Schema), resource management (files, databases), and prompt templates.

- **AKIS Implementation:** MCP adapters at `backend/src/services/mcp/adapters/` wrap GitHub, Jira, and Confluence APIs. Agents access external systems exclusively through these adapters, ensuring a clean separation between agent logic and integration details.

### 4.2 Tool-Use in LLM Agents

- **Toolformer (Schick et al., 2023):** LLMs can learn to use external tools through self-supervised training. While AKIS doesn't fine-tune models, it provides tool descriptions through MCP's typed schema definitions.

- **Function Calling (OpenAI, 2023):** Structured function calling allows LLMs to invoke external functions with typed parameters. AKIS leverages this through AI service integration, where agents can specify tool schemas for the LLM to call.

- **Gorilla (Patil et al., 2023):** LLM fine-tuned for API calling. Demonstrated that constraining the API surface improves reliability. AKIS's limited, well-defined MCP adapter set (3 adapters) embodies this principle.

### 4.3 Academic Context for MCP in Thesis

For thesis purposes, MCP can be positioned as:
- An implementation of the **Mediator Pattern** (Gang of Four) for AI-tool integration
- A practical realization of **tool-augmented LLMs** (Mialon et al., 2023)
- A **vendor-agnostic abstraction layer** that decouples agent logic from integration specifics
- An alternative to direct SDK usage that improves **testability** and **maintainability**

---

## 5. Multi-Agent Orchestration

### 5.1 Orchestration Patterns

- **Centralized Orchestration (AKIS):** A single orchestrator manages all agents. Benefits: predictable execution, no circular dependencies, clear ownership. Drawbacks: single point of control, limited inter-agent collaboration.

- **Peer-to-Peer Communication (ChatDev, MetaGPT):** Agents communicate directly through message passing. Benefits: emergent collaboration, flexible workflows. Drawbacks: hard to debug, potential for infinite loops.

- **Hierarchical Orchestration (AutoGen):** Manager agents delegate to worker agents. Benefits: complex task decomposition. Drawbacks: added complexity, potential for cascading failures.

### 5.2 AKIS Orchestration Architecture

AKIS implements centralized orchestration with these key properties:

1. **Single Entry Point:** `AgentOrchestrator.ts` owns the full lifecycle
2. **Factory + Registry:** `AgentFactory.register()` is the only instantiation point
3. **Dependency Injection:** Orchestrator injects tools (MCP, AI service) — agents never create clients
4. **Event-Driven Observability:** `JobEventBus` + SSE for real-time progress
5. **Watchdog:** `StaleJobWatchdog` detects and handles hung jobs

### 5.3 Comparison Table

| Feature | AKIS | MetaGPT | ChatDev | AutoGen | CrewAI |
|---|---|---|---|---|---|
| Orchestration | Centralized | Sequential | Chat-based | Hierarchical | Role-based |
| Agent Communication | None (isolated) | Artifacts | Direct messages | Function calls | Delegation |
| State Management | FSM + PostgreSQL | In-memory | Chat history | Conversation | Task queue |
| Tool Integration | MCP adapters | Custom | Custom | Tool registry | Tool registry |
| Determinism | High (temp control) | Low | Low | Medium | Medium |
| Quality Scoring | Built-in (0-100) | None | None | None | None |
| Observability | Full trace + SSE | Logs | Chat logs | Logs | Logs |

---

## 6. Comparison with AKIS Architecture

### 6.1 AKIS Novel Contributions (for Thesis)

1. **Deterministic Agentic Pipelines:** Unlike general-purpose agent frameworks, AKIS enforces determinism through temperature control, fixed prompts, and playbook-driven execution. This improves reliability for production use cases.

2. **Specification-Driven Test Generation:** Trace Agent's ability to parse multiple specification formats (Gherkin, arrow, sentence) and generate both documentation and executable tests is a unique combination.

3. **MCP-Only Integration Policy:** Strict enforcement of MCP adapters (no direct SDKs) provides a clean, testable integration layer that is vendor-agnostic by design.

4. **Quality-Scored Agent Output:** Post-execution quality scoring (0-100) with specific metrics per agent type enables objective measurement of agent reliability.

5. **Context Pack Mechanism:** Static, deterministic file bundles that provide exactly the context an agent needs — no search indexing, no retrieval latency, fully debuggable.

### 6.2 Thesis Positioning

AKIS can be positioned in the thesis as:

> "An AI agent orchestration platform that prioritizes **reliability and determinism** over **autonomy and flexibility**. While frameworks like MetaGPT and ChatDev pursue full software development automation with multi-agent collaboration, AKIS takes a pragmatic approach: specialized, isolated agents with centralized orchestration, deterministic playbooks, and quality-scored outputs. This design trades generality for production-readiness, making it suitable for real-world deployment on resource-constrained infrastructure (OCI Free Tier)."

---

## 7. References

### Test Generation
- Fraser, G. & Arcuri, A. (2011). EvoSuite: Automatic Test Suite Generation for Object-Oriented Software. FSE.
- Pacheco, C. & Ernst, M.D. (2007). Randoop: Feedback-Directed Random Testing for Java. OOPSLA.
- Cadar, C. et al. (2008). KLEE: Unassisted and Automatic Generation of High-Coverage Tests. OSDI.
- Claessen, K. & Hughes, J. (2000). QuickCheck: A Lightweight Tool for Random Testing. ICFP.
- Chen, Y. et al. (2023). ChatUniTest: A Framework for LLM-Based Unit Test Generation. arXiv:2305.04764.
- Schäfer, M. et al. (2023). An Empirical Evaluation of Using Large Language Models for Automated Unit Test Generation. IEEE TSE.
- Kang, S. et al. (2023). LIBRO: Large Language Model Based Bug Reproduction. arXiv:2309.01552.
- Yuan, Z. et al. (2023). No More Manual Tests? Evaluating and Improving ChatGPT for Unit Test Generation. arXiv:2305.04207.
- Carvalho, G. et al. (2021). Towards Automated BDD Test Generation from Natural Language. ICST.
- Whalen, M. et al. (2006). Coverage Metrics for Requirements-Based Testing. ISSTA.

### Code Generation & Agentic Systems
- Chen, M. et al. (2021). Evaluating Large Language Models Trained on Code (Codex). arXiv:2107.03374.
- Li, Y. et al. (2022). Competition-Level Code Generation with AlphaCode. Science.
- Chen, B. et al. (2022). CodeT: Code Generation with Generated Tests. ICLR.
- Hong, S. et al. (2023). MetaGPT: Meta Programming for A Multi-Agent Collaborative Framework. arXiv:2308.00352.
- Qian, C. et al. (2023). Communicative Agents for Software Development (ChatDev). arXiv:2307.07924.
- Yang, J. et al. (2024). SWE-Agent: Agent-Computer Interfaces Enable Automated Software Engineering. arXiv:2405.15793.
- Shinn, N. et al. (2023). Reflexion: Language Agents with Verbal Reinforcement Learning. NeurIPS.
- Zhang, Y. et al. (2024). AI-Assisted Project Initialization: LLM-Based Scaffolding for Modern Web Applications. ICSE-SEIP.

### Agent Architectures & Tool Use
- Yao, S. et al. (2022). ReAct: Synergizing Reasoning and Acting in Language Models. ICLR.
- Bratman, M.E. (1987). Intention, Plans, and Practical Reason. Harvard University Press.
- Schick, T. et al. (2023). Toolformer: Language Models Can Teach Themselves to Use Tools. NeurIPS.
- Patil, S.G. et al. (2023). Gorilla: Large Language Model Connected with Massive APIs. arXiv:2305.15334.
- Mialon, G. et al. (2023). Augmented Language Models: A Survey. TMLR.

### MCP & Integration
- Anthropic (2024). Model Context Protocol Specification. https://modelcontextprotocol.io
- Gamma, E. et al. (1994). Design Patterns: Elements of Reusable Object-Oriented Software (Mediator Pattern). Addison-Wesley.

---

*This document serves as a living literature review for the AKIS Platform thesis. It will be expanded during M2 (March 2026) with additional empirical findings and quantitative comparisons.*
