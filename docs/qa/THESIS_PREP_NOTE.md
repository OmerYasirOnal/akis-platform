# Thesis Preparation Note — AKIS Platform

> **Task:** S0.5.3-QA-4
> **Date:** 2026-02-09
> **Student:** Ömer Yasir Onal
> **Advisor:** [Advisor Name]
> **Status:** Draft — to be refined during M2

---

## 1. Working Title

**"Design and Implementation of an AI Agent Orchestration Platform for Automated Software Development Tasks"**

Alternative titles:
- "AKIS: A Multi-Agent Orchestration Framework for Documentation, Testing, and Prototyping Automation"
- "Structured AI Agent Pipelines for Developer Productivity: Design, Implementation, and Evaluation"

---

## 2. Abstract (Draft)

Modern software development teams face increasing pressure to maintain documentation, write tests, and produce prototypes rapidly. While large language models (LLMs) have demonstrated remarkable code understanding capabilities, their integration into automated development workflows remains challenging due to issues of reliability, determinism, and output quality control.

This thesis presents AKIS Platform, an AI agent orchestration system that structures LLM interactions into multi-phase pipelines (Plan → Execute → Reflect) to automate three software development tasks: documentation generation (Scribe), test plan creation (Trace), and rapid prototyping (Proto). The system employs a finite state machine lifecycle, tool injection via the Model Context Protocol (MCP), and static context packs for deterministic input assembly.

We describe the architecture, implementation, and deployment of AKIS on a cloud staging environment, present initial pilot feedback, and discuss the trade-offs between agent autonomy and output quality in production-grade AI-assisted development tools.

---

## 3. Methodology

### 3.1 System Design

- **Design Science Research (DSR)** framework: Problem → Objectives → Design → Demonstration → Evaluation
- Iterative development with sprint-based delivery (8 phases, Nov 2025 – Feb 2026)
- Architecture decisions documented as ADRs (Architecture Decision Records)

### 3.2 Implementation

- Full-stack TypeScript implementation (React frontend, Fastify backend, PostgreSQL)
- Agent orchestration with FSM lifecycle and dependency injection
- MCP protocol for external service integration
- Context packs for deterministic agent input

### 3.3 Evaluation Plan

| Dimension | Method | Metrics |
|-----------|--------|---------|
| **Functional Correctness** | Golden path E2E tests | Pass rate (target: 100%) |
| **Output Quality** | Pilot user survey | Likert scale (1-5) on documentation quality |
| **Developer Productivity** | Time comparison | Manual vs. AKIS-generated documentation time |
| **System Reliability** | Regression testing | 70+ regression checklist items |
| **Code Quality** | Static analysis | TypeScript strict mode, 476+ automated tests |

### 3.4 Data Collection

- Pilot user feedback via in-platform FeedbackWidget (rating + text + page context)
- Automated test results from CI pipeline
- Job execution metrics (tokens, duration, success rate) from PostgreSQL

---

## 4. Technical Contribution

### 4.1 Agent Orchestration Framework

- **FSM-based lifecycle management** for AI agent execution
- **Tool injection pattern:** Orchestrator provides MCP adapters and AI services — agents are decoupled from infrastructure
- **Factory + Registry pattern** for agent creation and discovery

### 4.2 Multi-Phase AI Pipeline

- **Plan → Execute → Reflect** pattern with optional critique/validation phases
- Scribe uses strong-model validation (gpt-5.2) for quality assurance
- Structured trace events for observability and debugging

### 4.3 Context Pack Mechanism

- Static, deterministic file bundles replacing traditional RAG
- Per-agent limits (Scribe: 50 files/200KB, Trace: 30/150KB, Proto: 20/100KB)
- Token-efficient, debuggable, zero-infrastructure approach

### 4.4 MCP Protocol Integration

- External service access exclusively through Model Context Protocol adapters
- Vendor-agnostic design — GitHub today, extensible to other services
- Structured error propagation with correlation IDs

---

## 5. Related Work

### 5.1 AI-Assisted Development Tools

| Tool/Paper | Relevance | Differentiation |
|------------|-----------|-----------------|
| GitHub Copilot | Inline code completion | AKIS: task-level automation (docs, tests, prototypes) |
| Cursor IDE | AI-powered code editor | AKIS: orchestrated multi-phase pipelines, not inline |
| Devin (Cognition AI) | Autonomous software engineer | AKIS: structured agents with human oversight, not fully autonomous |
| AutoGPT / BabyAGI | General-purpose AI agents | AKIS: domain-specific agents with deterministic pipelines |
| Sweep AI | Automated bug fixes | AKIS: broader scope (docs, tests, prototypes) |

### 5.2 Agent Frameworks

| Framework | Relevance |
|-----------|-----------|
| LangChain / LangGraph | General-purpose LLM orchestration |
| CrewAI | Multi-agent collaboration |
| AutoGen (Microsoft) | Conversational agent framework |
| Model Context Protocol (MCP) | Standardized tool access for AI agents |

### 5.3 Software Engineering Automation

- Automated documentation generation (Sphinx, JSDoc, Doxygen)
- Test generation (Diffblue, EvoSuite, Ponicode)
- Code scaffolding (Yeoman, Create React App)
- AKIS differentiator: LLM-powered with structured quality pipelines

---

## 6. Thesis Chapter Mapping

| Chapter | Content | AKIS Feature |
|---------|---------|--------------|
| 1. Introduction | Problem, motivation, objectives | — |
| 2. Literature Review | AI agents, dev tools, MCP | Related work analysis |
| 3. System Design | Architecture, agent contracts, FSM | Architecture docs, ADRs |
| 4. Implementation | Stack, code organization, key patterns | Source code, tests |
| 5. Agent Implementation | Scribe, Trace, Proto details | Agent code + playbooks |
| 6. Deployment & Operations | OCI, Docker, Caddy, CI/CD | Staging runbook |
| 7. Evaluation | Pilot results, test coverage, metrics | Feedback data, test results |
| 8. Discussion | Trade-offs, limitations, future work | Known limitations |
| 9. Conclusion | Summary, contributions | — |

---

## 7. Timeline

| Period | Activity | Deliverable |
|--------|----------|-------------|
| Feb 2026 | M1 Pilot Demo | Working staging, demo script, evidence doc |
| Mar 2026 | M2 Stabilization + Writing | Chapters 1-4 draft, pilot feedback analysis |
| Apr 2026 | Final Writing + Defense Prep | Complete thesis draft, presentation slides |
| May 2026 | Defense + Submission | Final report, demo video, delivery package |

---

## 8. Tools & Resources

| Tool | Purpose |
|------|---------|
| LaTeX / Overleaf | Thesis document |
| draw.io / Excalidraw | Architecture diagrams |
| OBS Studio | Demo video recording |
| Google Slides / Keynote | Presentation |
| GitHub | Version control + CI/CD |
| AKIS Platform (self) | Live demo artifact |

---

## 9. Open Questions

- [ ] Finalize thesis title with advisor
- [ ] Determine evaluation methodology precision (quantitative vs. qualitative pilot feedback)
- [ ] Decide on video recording format and length for defense
- [ ] Confirm if pg_trgm evaluation (March) should be included in thesis scope
- [ ] Identify 3-5 pilot users for feedback collection

---

*This note is a working draft. It will be refined iteratively during M2 (March 2026) as the thesis writing progresses.*
