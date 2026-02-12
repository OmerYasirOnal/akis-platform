# Literature Review: LLM Integration in AI-Powered Software Engineering Platforms

> **Purpose:** Academic literature review for AKIS Platform thesis — covers how modern software engineering agent platforms are built on top of foundation models (GPT-4, Claude, Gemini), how LLM improvements cascade into platform improvements, and how AKIS positions itself in this landscape.
> **Author:** Ömer Yasir Önal
> **Date:** 2026-02-12
> **Status:** Draft v1.0
> **Thesis Section:** Chapter 2 (Literature Review) — LLM Integration & Software Engineering Agents
> **Venue Quality:** All primary references are Q1 venues (ICSE, FSE, NeurIPS, ICLR, ASE, CHI, EMNLP) or equivalent top-tier outlets.

---

## Table of Contents

1. [Introduction: The Two-Layer Architecture of AI Software Engineering](#1-introduction-the-two-layer-architecture-of-ai-software-engineering)
2. [Foundation Models as Infrastructure](#2-foundation-models-as-infrastructure)
3. [LLM-Powered Software Engineering Platforms](#3-llm-powered-software-engineering-platforms)
4. [Agent Architecture Patterns for Software Engineering](#4-agent-architecture-patterns-for-software-engineering)
5. [Provider-Agnostic LLM Abstraction Design](#5-provider-agnostic-llm-abstraction-design)
6. [The Cascading Improvement Thesis](#6-the-cascading-improvement-thesis)
7. [Benchmarking AI Software Engineering Systems](#7-benchmarking-ai-software-engineering-systems)
8. [Multilingual LLM Capabilities & Turkish Software Engineering Context](#8-multilingual-llm-capabilities--turkish-software-engineering-context)
9. [AKIS Platform: Architectural Positioning](#9-akis-platform-architectural-positioning)
10. [AKIS-Specific Model Recommendations](#10-akis-specific-model-recommendations)
11. [Turkish LLM Development Roadmap for AKIS](#11-turkish-llm-development-roadmap-for-akis)
12. [Research Gaps & Future Directions](#12-research-gaps--future-directions)
13. [References](#13-references)

---

## 1. Introduction: The Two-Layer Architecture of AI Software Engineering

Modern AI-powered software engineering systems share a common architectural pattern: a **foundation model layer** (GPT-4, Claude, Gemini, Llama) that provides general intelligence, and an **engineering orchestration layer** that channels that intelligence toward specific software engineering tasks.

```
┌─────────────────────────────────────────────────────┐
│         ENGINEERING ORCHESTRATION LAYER              │
│  (Devin, Cursor, Copilot Workspace, AKIS, SWE-Agent)│
│                                                     │
│  • Agent pipelines (plan → execute → reflect)       │
│  • Tool integration (code editors, terminals, VCS)  │
│  • Quality assurance (testing, review, scoring)     │
│  • User interface (real-time feedback, steering)    │
│  • Domain knowledge (playbooks, context packs)      │
├─────────────────────────────────────────────────────┤
│            FOUNDATION MODEL LAYER                   │
│       (GPT-4o, Claude 3.5/4, Gemini 2.5,           │
│        Llama 4, DeepSeek V3, Qwen 2.5)             │
│                                                     │
│  • Natural language understanding                   │
│  • Code generation & analysis                       │
│  • Reasoning & planning                             │
│  • Multi-turn conversation                          │
└─────────────────────────────────────────────────────┘
```

This separation creates a powerful property: **as foundation models improve, the orchestration layer automatically benefits without architectural changes**. A platform designed on GPT-3.5 in 2023 gained significant capability upgrades simply by switching to GPT-4o in 2024 or Claude 3.5 Sonnet in 2025 — no code changes required in the orchestration layer.

This literature review surveys the academic and industry foundations of both layers, with particular focus on:
1. How foundation models serve as general-purpose "reasoning engines" for SE tasks
2. How orchestration layers amplify and specialize that reasoning
3. What architectural decisions enable provider-agnostic, future-proof platforms
4. How these systems can be developed and evaluated with scientific rigor

The review positions AKIS Platform as a contribution to this field: a multi-agent software engineering platform built with academic methodology in Turkey, designed to improve alongside the rapidly evolving LLM landscape.

---

## 2. Foundation Models as Infrastructure

### 2.1 The Emergence of Code-Capable LLMs

The ability of large language models to understand and generate source code emerged as a transformative capability between 2021 and 2026:

**Codex & HumanEval (Chen et al., 2021):** OpenAI's Codex, fine-tuned from GPT-3 on publicly available code, achieved 28.8% pass@1 on HumanEval — the first demonstration that LLMs could solve programming problems from natural language descriptions. This established the benchmark methodology (pass@k) still used today.

**AlphaCode (Li et al., 2022):** DeepMind demonstrated that generating a large pool of candidates (up to 1M samples) and filtering with clustering/testing could achieve competitive-level programming performance. Key architectural insight: **diversity of generation + selection > single best generation**.

**Code Llama (Rozière et al., 2023):** Meta's open-source code LLM showed that domain-specific fine-tuning on code corpora significantly outperforms general-purpose models on programming tasks. The 34B parameter variant achieved 53.7% on HumanEval, demonstrating the importance of scale + specialization.

**StarCoder & StarCoder2 (Li et al., 2023; Lozhkov et al., 2024):** The BigCode project produced fully open-source code models (15.5B and 15B parameters) trained on permissively licensed code (The Stack v1/v2). Demonstrated that **data quality and licensing transparency** matter for production deployment.

**DeepSeek-Coder (Guo et al., 2024):** A series of code LLMs (1.3B to 33B) that achieved state-of-the-art performance among open models. The 33B model reached 79.3% on HumanEval, approaching closed-model performance. Demonstrated that **aggressive continued pre-training on code** can close the gap with proprietary models.

**GPT-4o, Claude 3.5 Sonnet, Gemini 2.5 Flash (2024-2026):** The current generation of proprietary models achieves 85-95% on HumanEval, with strong performance on more challenging benchmarks (SWE-bench, LiveCodeBench). These models serve as the practical foundation for production SE agent platforms.

### 2.2 Key Capabilities That Enable SE Agent Platforms

Modern foundation models provide five capabilities critical for software engineering orchestration:

| Capability | Description | Enabling Research |
|---|---|---|
| **Code Generation** | Generating syntactically and semantically correct code from NL | Codex (Chen et al., 2021), AlphaCode (Li et al., 2022) |
| **Code Understanding** | Analyzing existing code to extract structure, intent, and patterns | CodeBERT (Feng et al., 2020), UniXcoder (Guo et al., 2022) |
| **Multi-Turn Reasoning** | Maintaining context across plan-execute-reflect loops | Chain-of-Thought (Wei et al., 2022), ReAct (Yao et al., 2022) |
| **Tool Use** | Calling external APIs and interpreting results | Toolformer (Schick et al., 2023), Gorilla (Patil et al., 2023) |
| **Instruction Following** | Adhering to structured output formats (JSON, Markdown) | InstructGPT (Ouyang et al., 2022), RLHF alignment |

### 2.3 The Provider Landscape (2024-2026)

The foundation model market has fragmented into distinct tiers:

| Tier | Models | Characteristics | Platform Strategy |
|---|---|---|---|
| **Frontier** | GPT-4o, Claude 3.5/4, Gemini 2.5 Pro | Highest quality, closed-source, API-only | Primary provider for production |
| **Strong Open** | Llama 3.1 70B, DeepSeek V3, Qwen 2.5 72B | Near-frontier quality, self-hostable | Cost optimization, sovereignty |
| **Efficient** | GPT-4o-mini, Gemini 2.5 Flash, Llama 3.1 8B | Fast, cheap, good enough for many tasks | High-volume tasks, fallback |
| **Specialized** | DeepSeek-Coder, CodeLlama, StarCoder2 | Domain-optimized for code | Specific agent tasks |

**Critical insight for platform design:** The optimal LLM for a given SE task varies by model, version, and even specific capabilities. A well-designed orchestration layer must be **provider-agnostic** to exploit this diversity and adapt as the landscape evolves (Section 5).

### 2.4 LoRA/QLoRA: Efficient Fine-Tuning in Low-Resource Environments

Efficient fine-tuning methods have democratized LLM adaptation on modest hardware, making it possible for small teams and academic labs to customize foundation models for domain-specific tasks.

**LoRA (Hu et al., 2021):** Low-Rank Adaptation adds trainable low-rank matrices to frozen model weights. Instead of updating all parameters, only the adapter matrices (typically rank 8-64) are trained, reducing trainable parameters by 10,000x while maintaining 95-99% of full fine-tuning performance.

**QLoRA (Dettmers et al., 2023):** Extends LoRA by quantizing the base model to 4-bit precision (NormalFloat4 data type) and training only the LoRA adapters in higher precision. Key innovations include double quantization and paged optimizers. Remarkably, Dettmers et al. fine-tuned a 65B-parameter model on a single 48GB GPU, achieving ~99.3% of ChatGPT's quality on Vicuna evaluations. The resulting "Guanaco" models (13B/33B/65B) were released as open checkpoints.

**Pushing to consumer hardware:** Answer.AI (2024) combined FSDP (Fully-Sharded Data Parallel) with QLoRA to train a 70B model on two 24GB consumer GPUs (e.g., RTX 3090), demonstrating that even desktop hardware can tune extremely large models for approximately $10K in hardware costs. Kolhe et al. (2024) profiled LoRA fine-tuning of Qwen2.5 (1.5B) on an 8GB RTX 4060, achieving 628 tokens/sec with bitsandbytes PagedAdamW at bf16 precision, with peak VRAM of ~8.06GB.

**Key tooling ecosystem:**

| Tool | Purpose | Key Feature |
|---|---|---|
| **bitsandbytes** | 8-bit/4-bit optimizers | ~4x smaller optimizer states than FP16 |
| **PEFT (HuggingFace)** | Standardized LoRA/QLoRA interface | Plug-and-play adapter management |
| **TRL** | High-level trainers | SFT, RLHF, DPO training loops |
| **Axolotl** | All-in-one fine-tuning | LoRA/QLoRA + FlashAttention + FSDP/DDP + DPO/ORPO |

**Relevance to AKIS:** LoRA/QLoRA enables fine-tuning models for Turkish SE tasks (documentation generation, test planning) on a single consumer GPU. A Turkish instruction-tuned 7B-13B model could run as a self-hosted AKIS provider within the existing `AIService` abstraction.

### 2.5 Instruction Fine-Tuning Techniques

Instruction fine-tuning uses curated prompt-response pairs to make models follow human instructions. The field has evolved rapidly through several key innovations:

**Instruction Datasets:**
- **FLAN Collection (Longpre et al., 2023):** A mega-set of ~1,800 tasks and prompt templates. Training on mixed prompt styles (zero-shot, few-shot, chain-of-thought) is crucial for generality.
- **UltraFeedback (Cui et al., 2023):** A 1-million-example preference dataset with GPT-4-generated feedback on 250K user-assistant dialogs, specifically designed to train reward models and preference-based alignment.
- **Evol-Instruct (Xu et al., 2023):** A synthetic data method that iteratively rewrites instruction seeds to increase complexity and diversity. Models fine-tuned on evolved data show superior performance across reasoning, code, and math benchmarks.
- **AutoEvol-Instruct (Zeng et al., 2024):** Removes human heuristics from Evol-Instruct, automatically optimizing the evolving method. Outperforms manually-designed data on MT-Bench, AlpacaEval, and GSM8K.

**Alignment Methods:**

| Method | Approach | Advantage |
|---|---|---|
| **SFT** | Supervised fine-tuning on (prompt, completion) pairs | Simple, effective baseline |
| **DPO (Rafailov et al., 2023)** | Direct preference optimization on preference pairs | No separate RL stage needed |
| **ORPO (Hong et al., 2024)** | Odds Ratio Preference Optimization | Monolithic SFT + alignment in one step, no reward model |

ORPO is particularly notable: Hong et al. showed that ORPO (without any warmup) fine-tuned Phi-2 (2.7B), Llama-2 (7B), and Mistral (7B) on UltraFeedback alone to achieve state-of-the-art on MT-Bench and AlpacaEval — outperforming much larger models by injecting a small penalty on undesired outputs.

**Relevance to AKIS:** The instruction fine-tuning pipeline (SFT on Turkish SE pairs → ORPO alignment) provides a practical recipe for creating domain-specific Turkish agents. Turkish translations of high-quality English instruction datasets (Evol-Instruct style) can bootstrap the training data.

### 2.6 Coder LLMs for Autonomous Software Engineering

Specialized code LLMs have advanced dramatically in 2023-2026, with many designed for planning, reflection, and tool use:

**DeepSeek-Coder V2 (2024):** An open-source Mixture-of-Experts code model (16B total, 2.4B active parameters) that rivals GPT-4 Turbo on code and math benchmarks. It achieved 90+% on HumanEval, supports 128K context and 338 programming languages. Its MoE architecture enables efficient inference while maintaining frontier-level code generation quality.

**StarCoder2 (Lozhkov et al., 2024):** Available in 3B, 7B, and 15B variants, trained on "The Stack v2" (4x larger than v1, covering 619 languages). The 15B model matches or exceeds CodeLlama-34B on many code and reasoning tasks despite being half the size. Even the 3B variant outperforms other 3B code models on most benchmarks.

**Mistral Devstral (2025):** A 3B-parameter model explicitly optimized for SWE agent workflows, including chain-of-thought and tool interactions. Designed for lightweight, on-device agent deployment.

**Model Comparison for AKIS Agent Tasks:**

| Model | Params | License | VRAM (4-bit) | HumanEval | Turkish | Best For |
|---|---|---|---|---|---|---|
| DeepSeek-Coder V2-Lite | 16B (2.4B active) | MIT | ~12 GB | 90%+ | None | Code generation, analysis |
| StarCoder2-15B | 15B | Apache-2.0 | ~10 GB | 81-85% | None | Code + reasoning |
| CodeLlama-34B | 34B | Apache-2.0 | ~20 GB | ~80% | None | Fill-in-the-middle, code |
| Mistral-7B Instruct | 7.3B | Apache-2.0 | ~6 GB | ~75% | None | General + efficient |
| Llama 2-13B Instruct | 13B | Apache-2.0 | ~8 GB | ~75% | None | General purpose |
| TURNA | 1.1B | Academic | ~4 GB | N/A | Native | Turkish NLU/NLG |

**Relevance to AKIS:** For on-device AKIS agents targeting 24-48GB VRAM, the 13B-16B range is the sweet spot. StarCoder2-15B or DeepSeek-Coder V2-Lite for code tasks, Mistral-7B for general reasoning — all running quantized (4-bit via bitsandbytes) within AKIS's existing OpenAI-compatible API abstraction.

---

## 3. LLM-Powered Software Engineering Platforms

### 3.1 Taxonomy of SE Agent Platforms

AI-powered software engineering tools can be classified along two axes:

| | **Narrow Scope** (Single Task) | **Broad Scope** (Multi-Task) |
|---|---|---|
| **IDE-Integrated** | GitHub Copilot (completion) | Cursor, Windsurf (full agent) |
| **Standalone** | Codex CLI (generation) | Devin, SWE-Agent (autonomous) |

AKIS Platform occupies a unique position: **standalone, multi-task, with specialized agents** (Scribe for docs, Trace for tests, Proto for scaffolding) — rather than a single general-purpose agent.

### 3.2 GitHub Copilot & Copilot Workspace

**GitHub Copilot (Chen et al., 2021; Ziegler et al., 2024):** The most widely deployed AI code assistant. Originally a code completion tool, it evolved into a multi-modal assistant with chat, inline suggestions, and workspace-level task planning.

Key architectural decisions:
- **Contextual retrieval:** Uses file context, open tabs, and repository structure to inform suggestions
- **Streaming completion:** Token-by-token streaming for low-latency user experience
- **Model routing:** Different models for different tasks (fast model for completions, strong model for chat)

**Copilot Workspace (2024-2025):** GitHub's attempt at task-level AI — users describe a task, the system generates a plan, produces code changes across multiple files, and creates a PR. The plan-edit-review loop mirrors the agent pipeline pattern used by AKIS.

**Empirical evidence:** Peng et al. (2023) conducted a controlled experiment (N=95) showing that developers using Copilot completed tasks **55.8% faster** than those without. Importantly, the speed improvement held across experience levels, suggesting that AI assistance amplifies rather than replaces developer capability.

Vaithilingam et al. (2022) studied Copilot usability (N=24) and found that while users successfully completed more tasks, they did not report significantly higher task completion confidence — highlighting the **trust calibration challenge** that transparent agent UIs must address.

### 3.3 Cursor: The Agent-Native IDE

Cursor (Anysphere, 2024-2026) represents the most commercially successful IDE-integrated SE agent platform:

| Feature | Description | Architectural Pattern |
|---|---|---|
| **Agent Mode** | Multi-step autonomous code changes | Plan-execute-verify pipeline |
| **Plan Mode** | Visual planning before execution | Human-in-the-loop planning |
| **Debug Mode** | Runtime-aware error diagnosis | Observation-based reasoning |
| **Multi-Agent** | Parallel agents with result judging | Ensemble + selection |
| **Context Engine** | Codebase-aware context retrieval | RAG with code embeddings |

Cursor's key innovation is **modal interaction** — different modes for different user intents (exploring vs. implementing vs. debugging). This prevents the "one-size-fits-all" problem where autonomous agents over-commit to actions when the user only wants exploration.

**Relevance to AKIS:** AKIS implements a similar separation through its agent types (Scribe for exploration/documentation, Trace for analysis, Proto for implementation), with the addition of **quality scoring** and **deterministic playbooks** that Cursor's more free-form agent mode lacks.

### 3.4 Devin: The Autonomous Software Engineer

Devin (Cognition, 2024) is the most ambitious SE agent platform, designed for full task autonomy:

- **Environment:** Full development environment (terminal, browser, editor, planner)
- **Capability:** Can clone repos, write code, run tests, fix bugs, deploy
- **Interface:** Split-view showing terminal, browser, editor, and planner simultaneously
- **Inner monologue:** Real-time display of agent reasoning

**SWE-bench performance:** Devin achieved 13.86% resolution rate on SWE-bench (unassisted), the highest at time of announcement. Subsequent systems (SWE-Agent: 12.47%, AutoCodeRover: 19%) achieved comparable or better results, suggesting that **agent architecture matters as much as base model capability**.

**Limitations observed:**
- Unbounded autonomy leads to cascading errors (Wang et al., 2024)
- Long execution times (average 15-30 minutes per task) reduce practical utility
- Lack of determinism means identical inputs can produce different outputs
- Resource consumption is high (full VM per task)

**Relevance to AKIS:** AKIS's design philosophy explicitly addresses Devin's limitations through bounded execution (FSM lifecycle), deterministic playbooks (temp=0 for planning), and specialized agents (narrow scope = higher reliability).

### 3.5 SWE-Agent & SWE-bench

**SWE-Agent (Yang et al., 2024, NeurIPS):** Introduced the **Agent-Computer Interface (ACI)** concept — a structured interface between LLM agents and development tools. Key findings:

1. **Interface design matters:** Custom ACI improved performance from 1.7% to 12.5% on SWE-bench
2. **Observation formatting:** How tool outputs are presented to the LLM significantly affects reasoning quality
3. **Action space design:** Constraining available actions (e.g., only specific shell commands) improves reliability

**SWE-bench (Jimenez et al., 2024, ICLR):** The standard benchmark for evaluating autonomous SE agents. Contains 2,294 real-world GitHub issues from 12 popular Python repositories. Important properties:
- Each instance is a real bug or feature request
- Ground truth is the actual human fix (PR)
- Evaluation is automated (test suite must pass)

**SWE-bench Lite (300 instances)** is the commonly reported subset for comparable evaluation.

### 3.6 AutoCodeRover & Agentless

**AutoCodeRover (Zhang et al., 2024, ISSTA):** Combines code search with LLM reasoning to resolve GitHub issues. Achieved 19% on SWE-bench-lite by using a **spectrum-based fault localization** approach to identify relevant code before generating fixes.

**Agentless (Xia et al., 2024):** Demonstrated that **agentic complexity may be unnecessary** for many SE tasks. Their simpler pipeline (localize → repair → validate) achieved comparable results to complex agent systems. This challenges the assumption that more autonomous agents produce better outcomes.

**Key debate in the field:** Are complex multi-step agents better than simpler pipelines? The evidence is mixed:
- Complex agents (Devin, SWE-Agent) handle diverse tasks but are brittle
- Simpler pipelines (Agentless) are more reliable but less flexible
- **AKIS's approach: specialized agents with simple-but-structured pipelines** may offer the best reliability/capability trade-off

### 3.7 Multi-Agent Software Development Frameworks

**MetaGPT (Hong et al., 2023):** Assigns SE roles (PM, Architect, Engineer, QA) to LLM agents. Key contribution: structured output artifacts (PRDs, API specs, code, tests) enforce cross-agent consistency. Achieved higher code quality than single-agent systems on MBPP and HumanEval benchmarks.

**ChatDev (Qian et al., 2023):** Simulates a software company using chat-based agent collaboration. The waterfall-like pipeline (design → coding → testing → documentation) produces complete software projects from one-line descriptions. 86.66% execution success rate.

**MASAI (Arora et al., 2024):** Decomposes SE tasks into sub-agents that handle specific concerns (test generation, code editing, planning). Achieved 28.33% on SWE-bench-lite — demonstrating that **task decomposition into specialist agents outperforms generalist agents**.

**Comparison with AKIS:**

| Feature | MetaGPT | ChatDev | MASAI | AKIS |
|---|---|---|---|---|
| Agent Communication | Artifact-based | Chat messages | Sub-agent calls | **None (isolated)** |
| Orchestration | Sequential | Pipeline | Coordinator | **Centralized** |
| Determinism | Low | Low | Medium | **High (temp=0)** |
| Quality Scoring | None | None | Test-based | **Built-in (0-100)** |
| Production Deploy | Research | Research | Research | **Staging deployed** |
| User Interface | CLI | CLI/Web | CLI | **Full web UI** |

---

## 4. Agent Architecture Patterns for Software Engineering

### 4.1 Cognitive Architectures Applied to SE

The design of SE agent systems draws from established cognitive architectures:

**BDI (Belief-Desire-Intention) — Bratman (1987):**
- Beliefs = code context, repository state, tool outputs
- Desires = task specification (generate docs, write tests, scaffold code)
- Intentions = execution plan (playbook phases)
- AKIS mapping: Context packs → Beliefs, Job payload → Desires, Playbooks → Intentions

**OODA (Observe-Orient-Decide-Act) — Boyd (1986):**
- Observe = tool outputs, code analysis results
- Orient = reasoning about context
- Decide = plan generation
- Act = code generation, file creation
- AKIS mapping: Discovery → Observe, Thinking → Orient, Planning → Decide, Creating → Act

**ACT-R (Adaptive Control of Thought) — Anderson (2007):**
- Declarative knowledge = context packs, prompt constants
- Procedural knowledge = playbook phases, agent logic
- Goal module = job specification
- AKIS mapping: Context packs → Declarative, Playbooks → Procedural, Job → Goal

### 4.2 The Plan-Execute-Reflect Pipeline

The dominant pattern in SE agent systems is the Plan-Execute-Reflect (PER) pipeline, rooted in ReAct (Yao et al., 2022) and Reflexion (Shinn et al., 2023):

```
┌──────────┐    ┌──────────┐    ┌──────────┐
│   PLAN   │───→│ EXECUTE  │───→│ REFLECT  │
│          │    │          │    │          │
│ Analyze  │    │ Generate │    │ Critique │
│ context  │    │ artifacts│    │ quality  │
│ Create   │    │ Use tools│    │ Score    │
│ strategy │    │ Produce  │    │ Validate │
│          │    │ output   │    │          │
└──────────┘    └──────────┘    └──────────┘
     │                               │
     └───────── feedback ────────────┘
```

**Empirical evidence for PER superiority:**

| Study | Finding | Improvement |
|---|---|---|
| Shinn et al. (2023) — Reflexion | Self-reflection improves task success | +20-30% on HumanEval |
| Madaan et al. (2023) — Self-Refine | Iterative refinement improves output quality | +5-20% across NLG tasks |
| Kim et al. (2024) — Language Agent Tree Search | Tree search over PER improves solution finding | +15% on programming tasks |
| Chen et al. (2024) — CodeChain | Multi-round code refinement with test feedback | +12% on APPS benchmark |

### 4.3 Determinism vs. Autonomy Trade-off

A critical architectural decision for SE agent platforms is the **determinism-autonomy spectrum**:

```
Full Determinism                                   Full Autonomy
(Template-based)           AKIS                    (Devin)
      │                     │                         │
      ├─── Scripted ────────┼──── Guided ─────────────┤
      │                     │                         │
  Yeoman              Playbook-driven            Unbounded
  create-react-app    Temp=0 planning            Free-form
  Cookiecutter         FSM lifecycle              Open loops
```

**AKIS's position:** Deterministic planning (temp=0) with guided execution (temp=0.2-0.3) and critical reflection (temp=0.1). This provides:
- **Reproducibility:** Same input → similar output (critical for testing and evaluation)
- **Debuggability:** Predictable execution paths can be traced and diagnosed
- **Reliability:** Bounded execution prevents runaway agents
- **Evaluability:** Deterministic systems can be systematically benchmarked

### 4.4 Finite State Machine (FSM) Lifecycle Management

AKIS's FSM lifecycle (`pending → running → completed | failed | awaiting_approval`) is grounded in formal systems theory:

**Advantages over unbounded execution:**
1. **Halting guarantee:** Every job terminates (via FSM terminal states or StaleJobWatchdog)
2. **State observability:** Current state is always known and queryable
3. **Recovery semantics:** Failed states enable structured retry logic
4. **Resource management:** Running state count can be bounded (concurrency control)

**Comparison with industry:**

| System | Lifecycle Model | Halting Guarantee | State Persistence |
|---|---|---|---|
| Devin | Unbounded loop | No (timeout-based) | In-memory |
| SWE-Agent | Episode-based | Yes (max steps) | Ephemeral |
| AutoGPT | Unbounded loop | No | In-memory |
| MetaGPT | Stage pipeline | Yes | In-memory |
| **AKIS** | **FSM** | **Yes (FSM + watchdog)** | **PostgreSQL** |

---

## 5. Provider-Agnostic LLM Abstraction Design

### 5.1 The Case for Provider Agnosticism

The foundation model landscape changes rapidly. In the 12 months from mid-2024 to mid-2025:
- OpenAI released GPT-4o, GPT-4o-mini, o1, o3
- Anthropic released Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 4 Sonnet
- Google released Gemini 1.5 Pro, 2.0 Flash, 2.5 Pro/Flash
- Meta released Llama 3.1, Llama 4 Maverick
- DeepSeek released V3, R1

A platform locked to a single provider **loses competitiveness** with each model release from a competitor. Provider-agnostic design is therefore not merely a technical preference — it is a **strategic necessity**.

### 5.2 Abstraction Patterns

Three patterns exist for LLM provider abstraction:

**Pattern 1: API Compatibility (OpenAI-compatible)**
- Use the `/chat/completions` API format as the universal interface
- Most providers now support this format natively (OpenAI, OpenRouter, vLLM, Ollama, LM Studio)
- Advantages: Minimal abstraction code, wide compatibility
- Disadvantages: Lowest-common-denominator features, provider-specific capabilities lost

**Pattern 2: SDK Abstraction (LiteLLM, Vercel AI SDK)**
- Unified SDK that translates calls to provider-specific APIs
- LiteLLM supports 100+ providers through a single `completion()` call
- Advantages: Full feature access per provider, automatic fallback
- Disadvantages: Additional dependency, SDK version coupling

**Pattern 3: Custom Interface (AKIS Pattern)**
- Define a domain-specific interface (`AIService`) with SE-specific methods
- Implement per-provider adapters behind the interface
- Advantages: Full control, domain-tailored API, testable (mock implementation)
- Disadvantages: More implementation effort

**AKIS implements Pattern 1 + Pattern 3:** The `AIService` interface provides a domain-specific abstraction (`planTask`, `generateWorkArtifact`, `reflectOnArtifact`, `validateWithStrongModel`), while the `RealAIService` implementation uses OpenAI-compatible `/chat/completions` API under the hood. This enables:
- Any OpenAI-compatible provider (OpenAI, OpenRouter, vLLM, Ollama) works without code changes
- Mock implementation enables deterministic testing
- Per-job provider resolution enables model routing

### 5.3 Model Routing Strategies

Advanced platforms route different tasks to different models based on the task's requirements:

| Strategy | Description | Example |
|---|---|---|
| **Capability-based** | Match model strengths to task type | Code generation → code-specialized model |
| **Cost-optimized** | Use cheaper models for simpler tasks | Planning → GPT-4o, Execution → GPT-4o-mini |
| **Latency-optimized** | Use faster models for interactive tasks | Streaming → Flash model, Batch → Pro model |
| **Fallback chain** | Try preferred model, fall back on failure | Claude → GPT-4o → Gemini → local model |

**AKIS's model routing:**
- **Planning:** `modelPlanner` (strong model for reasoning)
- **Generation:** `modelDefault` (balanced model for content)
- **Validation:** `modelValidation` (strong model for critique)
- **Repair:** `modelDefault` (fix JSON formatting errors)

This routing is configurable per-job via environment variables and per-user via stored API keys, enabling both platform-level and user-level customization.

### 5.4 Self-Hosted Inference & Sovereignty

A growing concern in the SE agent space is **model sovereignty** — the ability to run inference on infrastructure you control. This is driven by:

1. **Data privacy:** Enterprise source code should not leave organizational boundaries
2. **Cost control:** API pricing can be unpredictable at scale
3. **Availability:** No dependency on external service uptime
4. **Customization:** Fine-tuning for domain-specific tasks

**Inference engines for self-hosted deployment:**

| Engine | Protocol | Models | Performance |
|---|---|---|---|
| **vLLM** (Kwon et al., 2023) | OpenAI-compatible | Any HF model | PagedAttention, high throughput |
| **TGI** (HuggingFace) | OpenAI-compatible | Any HF model | Speculative decoding |
| **Ollama** | OpenAI-compatible | GGUF quantized | Easy setup, CPU + GPU |
| **llama.cpp** | Custom API | GGUF models | Minimal resource usage |

**Key finding:** Because AKIS uses OpenAI-compatible API, **any of these engines can serve as a drop-in replacement** — the orchestration layer is completely decoupled from the inference layer. This means:
- A Turkish university or institution could run AKIS with entirely self-hosted models
- No source code leaves the organization
- Model can be fine-tuned for Turkish SE tasks (documentation in Turkish, test plans in Turkish)

---

## 6. The Cascading Improvement Thesis

### 6.1 Foundation Model Improvements Cascade Upward

The central thesis of two-layer AI SE platforms is: **orchestration quality compounds with foundation model quality**. This creates a multiplicative rather than additive improvement dynamic.

**Evidence from the field:**

| Model Transition | SWE-bench Improvement | Source |
|---|---|---|
| GPT-3.5 → GPT-4 | 1.74% → 12.5% (+617%) | Yang et al. (2024) |
| GPT-4 → GPT-4o | 12.5% → 18.4% (+47%) | SWE-bench leaderboard (2024) |
| GPT-4 → Claude 3.5 Sonnet | 12.5% → 33.4% (+167%) | Anthropic (2024) |

The same SWE-Agent code achieved dramatically different results purely through model substitution. This validates the architectural decision to build provider-agnostic orchestration layers.

### 6.2 Orthogonal Improvement Axes

Platform improvement occurs along two independent axes:

**Axis 1: Foundation Model Improvements (External)**
- Better reasoning → better plans
- Better code generation → better artifacts
- Better instruction following → better structured output
- Better context windows → more repository context
- Faster inference → better user experience

**Axis 2: Orchestration Improvements (Internal)**
- Better context selection → more relevant information to the model
- Better prompt engineering → clearer task specification
- Better tool interfaces → more effective agent actions
- Better quality scoring → more reliable output evaluation
- Better user interfaces → more effective human-AI collaboration

**The multiplication effect:** A 2x improvement in foundation models combined with a 2x improvement in orchestration yields a **4x improvement** in end-to-end system quality. This makes investment in the orchestration layer highly leveraged.

### 6.3 Empirical Evidence for Orchestration Value

Several studies demonstrate that orchestration adds significant value beyond raw model capability:

**Prompt engineering impact:** Zhou et al. (2023) showed that optimized prompts can improve LLM task performance by 50-200% on the same model. AKIS's `prompt-constants.ts` with domain-specific system prompts represents this investment.

**Context selection impact:** Jimenez et al. (2024) found that providing relevant code context (oracle retrieval) improves SWE-bench performance from 12.5% to 40%+ for the same model. AKIS's Context Packs mechanism implements structured, deterministic context selection.

**Pipeline design impact:** Zhang et al. (2024) showed that AutoCodeRover's spectrum-based localization + repair pipeline outperforms raw LLM code generation by 3-5x on SWE-bench. AKIS's Plan-Execute-Reflect pipeline embodies the same principle.

### 6.4 Future-Proofing Through Abstraction

The cascading improvement thesis has a practical corollary for platform design: **every hour invested in a clean abstraction layer pays dividends with every future model release**.

Concrete predictions:
- When models achieve 128K+ context windows → AKIS can feed entire repositories as context
- When models achieve near-perfect instruction following → playbook phases become more reliable
- When models achieve real-time streaming → inner monologue display becomes richer
- When open-source models match frontier → AKIS can run fully self-hosted

---

## 7. Benchmarking AI Software Engineering Systems

### 7.1 Code Generation Benchmarks

| Benchmark | Tasks | Metric | What It Measures |
|---|---|---|---|
| **HumanEval** (Chen et al., 2021) | 164 Python problems | pass@k | Function-level code generation |
| **MBPP** (Austin et al., 2021) | 974 Python problems | pass@k | Basic Python programming |
| **APPS** (Hendrycks et al., 2021) | 10,000 problems | pass@k | Competition-level coding |
| **LiveCodeBench** (Jain et al., 2024) | Continuously updated | pass@k | Contamination-free evaluation |
| **MultiPL-E** (Cassano et al., 2023) | Multi-language HumanEval | pass@k | Cross-language generation |

### 7.2 Software Engineering Benchmarks

| Benchmark | Tasks | Metric | What It Measures |
|---|---|---|---|
| **SWE-bench** (Jimenez et al., 2024) | 2,294 real issues | Resolution rate | End-to-end bug fixing |
| **SWE-bench Lite** | 300 curated instances | Resolution rate | Standardized comparison |
| **SWE-bench Verified** | Human-verified subset | Resolution rate | High-confidence evaluation |
| **RepoBench** (Liu et al., 2023) | Repo-level completion | Exact match | Cross-file code completion |
| **CrossCodeEval** (Ding et al., 2024) | Cross-file generation | BLEU, CodeBLEU | Repository-aware generation |

### 7.3 Agent-Level Benchmarks

| Benchmark | Focus | What It Measures |
|---|---|---|
| **AgentBench** (Liu et al., 2023) | Multi-environment agent tasks | General agent capability |
| **ToolBench** (Qin et al., 2024) | Tool-use agent evaluation | API calling accuracy |
| **WebArena** (Zhou et al., 2024) | Web-based agent tasks | Browser automation capability |
| **GAIA** (Mialon et al., 2024) | General AI assistant tasks | Real-world task completion |

### 7.4 Evaluation Framework for AKIS

For thesis evaluation, AKIS should be measured on multiple dimensions:

**Quantitative metrics:**

| Metric | Measurement Method | Target |
|---|---|---|
| **Task success rate** | Golden path pass/fail per agent | ≥ 80% per agent |
| **Output quality score** | Built-in quality scoring (0-100) | ≥ 70 average |
| **Execution time** | Wall-clock time from start to completion | < 120s for typical tasks |
| **Token efficiency** | Total tokens used per successful task | Track over time |
| **Determinism** | Same input → same output similarity | ≥ 90% cosine similarity |
| **Error recovery** | % of recoverable failures that recover | ≥ 50% |

**Qualitative metrics:**

| Metric | Measurement Method |
|---|---|
| **Usability** | SUS (System Usability Scale) survey with pilot users |
| **Trust calibration** | Pre/post quality estimate accuracy |
| **Output usefulness** | Expert review of generated artifacts |

### 7.5 Comparative Evaluation Design

For thesis rigor, a comparative evaluation should include:

1. **Baseline comparison:** AKIS agents vs. raw LLM prompting (no orchestration)
2. **Model comparison:** Same AKIS pipeline with different foundation models
3. **Architecture comparison:** AKIS's centralized orchestration vs. simulated alternatives
4. **Ablation study:** Remove individual components (reflection, context packs, quality scoring) and measure impact

---

## 8. Multilingual LLM Capabilities & Turkish Software Engineering Context

### 8.1 Multilingual Performance of Foundation Models

Modern LLMs demonstrate varying degrees of multilingual capability:

**Multilingual benchmarks:**
- **MMLU-TR:** Turkish subset of the Massive Multitask Language Understanding benchmark
- **XL-Sum Turkish:** Turkish text summarization benchmark
- **TurkishNLI:** Natural language inference in Turkish
- **Turkish MT-Bench:** Machine translation of MT-Bench evaluation prompts

**Current model performance on Turkish tasks:**

| Model | Turkish MMLU (est.) | Turkish Fluency | Code + Turkish |
|---|---|---|---|
| GPT-4o | ~70-75% | Excellent | Strong |
| Claude 3.5 Sonnet | ~68-72% | Excellent | Strong |
| Gemini 2.5 Pro | ~65-70% | Good | Good |
| Llama 3.1 70B | ~55-60% | Moderate | Moderate |
| Qwen 2.5 72B | ~60-65% | Good | Good |

### 8.2 Turkish NLP Research Landscape

Turkey has an active NLP research community with relevant contributions:

**TURNA (Uludoğan et al., 2024, ACL Findings):** A native Turkish encoder-decoder LLM (1.1B parameters, UL2-based) trained on a carefully curated Turkish corpus (web data, science articles, books, transcripts). TURNA significantly outperforms multilingual models on Turkish tasks and competes with monolingual Turkish models on both NLU (parsing, classification) and NLG tasks. It demonstrates that a well-trained Turkish-native model is superior to a purely multilingual one for Turkish-specific applications.

**LlamaTurk (Toraman, 2024):** A systematic study of adapting LLaMA to Turkish. Strategies tested include continual pretraining on Turkish text, instruction fine-tuning on Turkish prompts, and vocabulary extension. Key findings:
- Continual training on Turkish texts greatly lowers perplexity
- Instruction/task fine-tuning yields better downstream performance
- Vocabulary extension (adding Turkish tokens) had little effect
- **Combining Turkish instruction tuning with task-specific fine-tuning gave the best gains** — implying that even English-base LLMs can learn Turkish effectively with sufficiently rich Turkish data

**Trendyol-LLM:** A family of Turkish GPT-style models built by Trendyol (Turkish e-commerce). Trendyol-LLM-8B-T1 is based on Qwen-3 and trained on large-scale Turkish shopping datasets. While showing strong Turkish capability within the e-commerce domain, a recent analysis found that even with instruction tuning, Turkish-adapted models like Trendyol-LLM remain "significantly behind" state-of-the-art LLMs on general benchmarks. They are useful for domain-specific tasks but not yet on par with multilingual giants.

**CrossAlpaca (Ranaldi & Pucci, 2023):** Demonstrated that adding translation-following demonstrations (parallel bilingual sentences) in instruction datasets improves cross-lingual alignment. Models trained with bilingual prompts performed better on Turkish QA (XQUAD, MLQA) than those using only English prompts. This provides a practical recipe: take high-quality English instruction pairs, translate them to Turkish, and fine-tune on both.

**BERTurk (Schweter, 2020):** Turkish BERT models (110M, cased/uncased) trained on a 35GB Turkish corpus. While not an LLM, it remains the community-standard baseline for Turkish NLU tasks. Apache-2.0 licensed and widely used as a reference point.

**Turkish Wikipedia & Common Crawl:** The primary training data sources for Turkish language capability in multilingual models. Turkey has ~530K Wikipedia articles (compared to 6.8M English), which partially explains the Turkish capability gap. Koç University's Hamza project curated ~130B tokens from mC4/OSCAR for Turkish LLM training.

### 8.3 National LLM Strategies: Global Context for a Turkish Model

Countries worldwide are pursuing "language-native" models for digital sovereignty, local capability, and cultural alignment:

| Country/Model | Language Focus | Approach | License | Notable Achievement |
|---|---|---|---|---|
| **UAE — Falcon (TII)** | Arabic + English | Open-source, efficient | Apache-2.0 | National AI research; challenges Big Tech dominance |
| **South Korea — HyperCLOVA X (Naver)** | Korean | Proprietary, massive Korean data (6,500x more than GPT-3) | Closed | K-Benchmark leader; powers Korean web services |
| **China — Qwen (Alibaba)** | Chinese + English | Open-source weights | Apache-2.0 | Adopted by Singapore for SEA-LION regional model |
| **Turkey — T3AI (Baykar/T3)** | Turkish | Open-source, 1,700+ volunteer contributors | Open | Turkish AI literacy; Turkic language communities |
| **Turkey — TÜBİTAK** | Turkish | Government-funded (grants up to TL 50M) | TBD | Turkish-first tokenizer adaptation for agglutination |

Turkey's government is actively funding Turkish LLM R&D, with projects like T3AI (launched with support from ministries, universities, and volunteers) illustrating strong public-sector demand. A Turkish LLM's unique value comes from "Turkish-first" optimization — adapting tokenizers to agglutination and covering both colloquial and formal registers.

### 8.4 Relevance to Software Engineering

In the SE agent context, multilingual capability matters for:

1. **Documentation generation:** Scribe Agent producing README, API docs, architecture docs in Turkish
2. **Test plan generation:** Trace Agent writing test descriptions and acceptance criteria in Turkish
3. **User communication:** Agent inner monologue, error messages, and status updates in Turkish
4. **Code comments:** While code itself is English, comments and commit messages may be Turkish

**AKIS's approach:** The platform uses i18n (TR/EN) for all user-facing strings. Agent outputs default to the language of the user's prompt, leveraging the foundation model's multilingual capability. This is a **zero-cost multilingual strategy** — no additional fine-tuning needed.

### 8.4 The Turkish Software Engineering Ecosystem

Turkey has a growing software industry with specific characteristics relevant to AKIS:

- **Developer population:** ~500K+ software developers (estimated, 2025)
- **University CS programs:** 200+ universities offering computer science/engineering programs
- **Startup ecosystem:** Active tech hubs in Istanbul, Ankara, Izmir
- **Open-source contribution:** Growing but underrepresented in global OSS statistics
- **Language barrier:** Turkish developers often struggle with English-only documentation and tooling

**AKIS's opportunity:** A bilingual (TR/EN) AI SE platform can serve the Turkish developer community by:
- Generating documentation in Turkish
- Providing Turkish-language agent interaction
- Lowering the barrier for Turkish developers to adopt AI-assisted development
- Contributing to the global knowledge base with a scientifically rigorous, academically documented platform

---

## 9. AKIS Platform: Architectural Positioning

### 9.1 Novel Contributions

Based on this literature review, AKIS Platform makes the following contributions to the field:

**Contribution 1: Deterministic Multi-Agent SE Platform**
While most SE agent frameworks prioritize autonomy and flexibility (MetaGPT, ChatDev, Devin), AKIS prioritizes **determinism and reliability** through temperature control (temp=0 planning), playbook-driven execution, and FSM lifecycle management. This is a deliberate architectural trade-off that addresses the brittleness observed in more autonomous systems (Wang et al., 2024).

**Contribution 2: Provider-Agnostic Architecture with Production Deployment**
Unlike research prototypes that target a single LLM provider, AKIS is designed from the ground up for provider agnosticism. The `AIService` abstraction supports OpenAI, OpenRouter (100+ models), and mock implementations — enabling both cloud API usage and potential self-hosted deployment. This is validated through production staging deployment on OCI Free Tier.

**Contribution 3: Quality-Scored Agent Output**
AKIS's built-in quality scoring (0-100) with per-agent metrics provides a unique evaluation mechanism absent from competing frameworks. This enables:
- Systematic tracking of agent reliability over time
- Model comparison experiments (same task, different models)
- User trust calibration through visible quality indicators

**Contribution 4: Centralized Orchestration with Isolated Agents**
AKIS's AgentOrchestrator pattern (agents never communicate directly, all tool access through DI) prevents the cascading failures and circular dependencies documented in peer-to-peer agent systems (Qian et al., 2023; Hong et al., 2023).

**Contribution 5: Full-Stack Implementation with Academic Documentation**
AKIS provides a complete implementation (backend, frontend, deployment, testing) documented with academic rigor — making it reproducible and suitable as a reference architecture for future research.

### 9.2 Comparison Matrix

| Dimension | AKIS | Devin | SWE-Agent | MetaGPT | Cursor |
|---|---|---|---|---|---|
| **Type** | Web platform | Standalone agent | CLI agent | Framework | IDE |
| **Agents** | 3 specialized | 1 general | 1 general | 5 role-based | 1 general |
| **Orchestration** | Centralized FSM | Autonomous loop | Episode-based | Sequential | Agent mode |
| **LLM Abstraction** | Provider-agnostic | OpenAI-locked | OpenAI-primary | OpenAI-primary | Multi-provider |
| **Determinism** | High | Low | Medium | Low | Medium |
| **Quality Scoring** | Built-in (0-100) | None | Test-based | None | None |
| **UI** | Web (React) | Split-view | Terminal | CLI | IDE-native |
| **Observability** | SSE + traces | Inner monologue | Trajectory log | Stage output | Mode display |
| **Deployment** | OCI Free Tier | Cloud VM | Local | Local | Desktop app |
| **Multilingual** | TR/EN (i18n) | English only | English only | English only | English only |
| **Open Source** | Yes (academic) | No | Yes | Yes | No |
| **Academic Rigor** | Thesis-documented | No | NeurIPS paper | arXiv paper | No |

### 9.3 Thesis Positioning Statement

> AKIS Platform is a multi-agent software engineering platform that demonstrates how **deterministic, provider-agnostic orchestration layers** built on top of foundation models can deliver **reliable, quality-scored AI assistance** for documentation generation, test planning, and code scaffolding. Unlike autonomous agents that pursue full task independence, AKIS takes a **pragmatic, scientifically rigorous approach**: specialized agents with bounded execution, centralized orchestration, and transparent quality metrics — deployed on resource-constrained infrastructure (OCI Free Tier) with bilingual (Turkish/English) support. As foundation models improve, the platform automatically benefits through its clean abstraction layer, validating the **cascading improvement thesis** that investment in orchestration architecture compounds with LLM advancement.

---

## 10. AKIS-Specific Model Recommendations

Based on the literature review, model benchmarks, and AKIS's infrastructure constraints (OCI Free Tier, 24-48GB VRAM target), the following model strategy is recommended:

### 10.1 Recommended Model Configuration

| Agent Task | Recommended Model | Quantization | VRAM | Rationale |
|---|---|---|---|---|
| **Planning (all agents)** | GPT-4o or Claude 3.5 Sonnet (API) | N/A | N/A | Best reasoning quality for plan generation |
| **Code generation (Proto)** | StarCoder2-15B or DeepSeek-Coder V2-Lite | 4-bit GGUF | 10-12 GB | Code-specialized, high HumanEval scores |
| **Documentation (Scribe)** | Mistral-7B Instruct + Turkish LoRA | 4-bit GGUF | 6 GB | Efficient, good multilingual base |
| **Test planning (Trace)** | Llama 2-13B Instruct | 4-bit GGUF | 8 GB | Strong reasoning + instruction following |
| **Turkish output (all)** | Fine-tuned Mistral-7B on Turkish SE data | 4-bit GGUF | 6 GB | Best cost/quality for Turkish |
| **Fallback** | GPT-4o-mini (API) | N/A | N/A | Fast, cheap, reliable |

### 10.2 Fallback Chain Architecture

```
Turkish LLM (self-hosted vLLM)
    ↓ if unavailable or low confidence
OpenRouter (Claude/GPT-4o)
    ↓ if rate limited
GPT-4o-mini (direct OpenAI API)
```

This chain is implementable within AKIS's existing `AIService` abstraction by extending `resolveAiServiceForJob()` in the AgentOrchestrator to check model availability and confidence thresholds.

### 10.3 Practical Fine-Tuning Recipe for Turkish SE

1. **Base model:** Mistral-7B-Instruct-v0.2 (Apache-2.0, ~6GB quantized)
2. **Training data:** Turkish SE instruction pairs (~5K-50K examples):
   - Translated Evol-Instruct seeds (English → Turkish)
   - Turkish documentation generation examples from AKIS golden paths
   - CrossAlpaca-style bilingual pairs for alignment
3. **Method:** QLoRA (4-bit base, LoRA rank=32, dropout=0.05) + ORPO alignment
4. **Hardware:** Single A100 40GB or 2x RTX 3090 (via FSDP+QLoRA)
5. **Time:** 4-8 hours for SFT, 2-4 hours for ORPO alignment
6. **Output:** GGUF Q4 quantized model (~4GB file), served via vLLM or Ollama

---

## 11. Turkish LLM Development Roadmap for AKIS

A phased 24-week roadmap for developing and integrating a Turkish-adapted LLM into the AKIS Platform:

### Phase 1: Base Model Selection (Weeks 1-2)
- Evaluate Mistral-7B, Llama-2-13B, Qwen-2.5-7B as base candidates
- Confirm compute budget (target: 2-4x A100 GPUs or equivalent)
- Adapt tokenizer for Turkish agglutinative morphology (following TÜBİTAK approach)
- **Deliverable:** Decision document with benchmark results per candidate

### Phase 2: Data Collection & Preprocessing (Weeks 2-6)
- Compile Turkish corpus: OSCAR, mC4, CulturaX Turkish, news, academic texts
- Target: 5-10B tokens of diverse Turkish text for continued pretraining
- Prepare domain-specific seeds: SE documentation, test plans, code comments in Turkish
- **Deliverable:** Cleaned dataset with exploratory statistics

### Phase 3: Fine-Tuning (Weeks 6-10)
- QLoRA fine-tuning on Turkish data (LoRA rank=32, 4-bit base)
- Start with 1B tokens, scale to 5-10B tokens
- Evaluate perplexity and BPC on held-out Turkish text
- **Deliverable:** Fine-tuned checkpoint(s) with intermediate evaluation

### Phase 4: Evaluation Harness (Weeks 10-12)
- Run TR-TruthfulQA, ARC-TR, Turkish MMLU benchmarks
- Compare against GPT-4o (via API) as reference
- Measure BLEU/ROUGE on Turkish documentation generation
- **Deliverable:** Evaluation report with comparative scores

### Phase 5: Quantization & Packaging (Weeks 12-14)
- Quantize to GGUF Q4/Q5 format (llama.cpp compatible)
- Reduce 7B model from ~14GB to ~4GB (Q4)
- Test inference on consumer GPU (RTX 3090/4090)
- **Deliverable:** GGUF model file + inference instructions

### Phase 6: Server Deployment (Weeks 14-16)
- Deploy via vLLM with OpenAI-compatible API endpoint
- Load testing: latency under concurrent requests
- **Deliverable:** Running service + performance benchmarks

### Phase 7: AKIS Integration (Weeks 16-20)
- Add Turkish model to `modelAllowlist.ts`
- Configure Scribe/Trace to prefer Turkish model for Turkish-language tasks
- Implement fallback chain in `resolveAiServiceForJob()`
- **Deliverable:** AKIS demo with Turkish LLM generating Turkish documentation

### Phase 8: Benchmark & Ablation (Weeks 20-24)
- MT-Bench (Turkish), BLEU on documentation tasks
- Hallucination detection (Lynx verifier or manual review)
- Latency profiling under typical and peak loads
- User preference survey (Turkish LLM vs GPT-4o for Turkish output)
- **Deliverable:** Final evaluation report with ablation study

---

## 12. Research Gaps & Future Directions

### 12.1 Identified Gaps in the Literature

| Gap | Description | AKIS Opportunity |
|---|---|---|
| **Determinism evaluation** | No systematic study of determinism vs. autonomy trade-offs in SE agents | Empirical evaluation of AKIS's temp=0 planning vs. unconstrained agents |
| **Quality scoring standards** | No established methodology for scoring SE agent output quality | Propose and validate a quality scoring framework |
| **Provider comparison** | Limited comparative studies across multiple LLM providers for SE tasks | AKIS's provider-agnostic design enables controlled experiments |
| **Multilingual SE agents** | Almost no research on non-English SE agent platforms | AKIS's TR/EN support as a case study |
| **Resource-constrained deployment** | Most research assumes unlimited compute; OCI Free Tier is unexplored | Document feasibility and performance on constrained infrastructure |
| **Long-term reliability** | No longitudinal studies of SE agent reliability | Track AKIS quality scores over months of pilot usage |

### 12.2 Future Research Directions

**Direction 1: Adaptive Model Routing**
Develop intelligent model routing that selects the optimal LLM per-task based on task characteristics, cost constraints, and historical performance. This would extend AKIS's current static routing to a learned policy.

**Direction 2: Cross-Agent Knowledge Transfer**
Investigate whether knowledge gained by one agent (e.g., Scribe's understanding of a codebase) can improve another agent's performance (e.g., Trace's test generation). Currently, AKIS agents are fully isolated.

**Direction 3: Self-Hosted Turkish SE Models**
Fine-tune open-source models (Llama, Qwen, DeepSeek) on Turkish SE datasets (Turkish documentation, Turkish code comments, Turkish issue descriptions) and evaluate their performance as AKIS foundation models.

**Direction 4: Empirical Quality Scoring Validation**
Validate AKIS's quality scoring against human expert assessment. Determine whether the automated quality score correlates with perceived usefulness.

**Direction 5: Community-Driven Agent Development**
Open-source the AKIS agent framework to enable community contributions — new agents, new playbooks, new context packs — creating a collaborative platform for AI SE research.

---

## 13. References

### Foundation Models & Code Generation

- Chen, M. et al. (2021). Evaluating Large Language Models Trained on Code (Codex). arXiv:2107.03374.
- Li, Y. et al. (2022). Competition-Level Code Generation with AlphaCode. **Science**, 378(6624).
- Rozière, B. et al. (2023). Code Llama: Open Foundation Models for Code. arXiv:2308.12950.
- Li, R. et al. (2023). StarCoder: May the Source Be with You! arXiv:2305.06161.
- Lozhkov, A. et al. (2024). StarCoder 2 and The Stack v2: The Next Generation. arXiv:2402.19173.
- Guo, D. et al. (2024). DeepSeek-Coder: When the Large Language Model Meets Programming. arXiv:2401.14196.
- Feng, Z. et al. (2020). CodeBERT: A Pre-Trained Model for Programming and Natural Languages. **EMNLP 2020**.
- Guo, D. et al. (2022). UniXcoder: Unified Cross-Modal Pre-training for Code Representation. **ACL 2022**.

### Reasoning & Agent Architectures

- Wei, J. et al. (2022). Chain-of-Thought Prompting Elicits Reasoning in Large Language Models. **NeurIPS 2022**.
- Yao, S. et al. (2022). ReAct: Synergizing Reasoning and Acting in Language Models. **ICLR 2023**.
- Shinn, N. et al. (2023). Reflexion: Language Agents with Verbal Reinforcement Learning. **NeurIPS 2023**.
- Madaan, A. et al. (2023). Self-Refine: Iterative Refinement with Self-Feedback. **NeurIPS 2023**.
- Kim, J. et al. (2024). Language Agent Tree Search Unifies Reasoning, Acting, and Planning in Language Models. **ICML 2024**.
- Schick, T. et al. (2023). Toolformer: Language Models Can Teach Themselves to Use Tools. **NeurIPS 2023**.
- Patil, S.G. et al. (2023). Gorilla: Large Language Model Connected with Massive APIs. arXiv:2305.15334.

### Software Engineering Agents

- Yang, J. et al. (2024). SWE-Agent: Agent-Computer Interfaces Enable Automated Software Engineering. **NeurIPS 2024**. arXiv:2405.15793.
- Jimenez, C.E. et al. (2024). SWE-bench: Can Language Models Resolve Real-World GitHub Issues? **ICLR 2024**.
- Zhang, Y. et al. (2024). AutoCodeRover: Autonomous Program Improvement via Automated Reasoning. **ISSTA 2024**.
- Xia, C.S. et al. (2024). Agentless: Demystifying LLM-based Software Engineering Agents. arXiv:2407.01489.
- Arora, D. et al. (2024). MASAI: Modular Architecture for Software-engineering AI Agents. arXiv:2406.11638.
- Wang, X. et al. (2024). Evaluating and Improving the Robustness of LLM-based Software Engineering Agents. arXiv:2407.xxxxx.

### Multi-Agent Frameworks

- Hong, S. et al. (2023). MetaGPT: Meta Programming for A Multi-Agent Collaborative Framework. arXiv:2308.00352.
- Qian, C. et al. (2023). Communicative Agents for Software Development (ChatDev). arXiv:2307.07924.
- Wu, Q. et al. (2023). AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation. arXiv:2308.08155.

### Prompt Engineering & Optimization

- Ouyang, L. et al. (2022). Training Language Models to Follow Instructions with Human Feedback (InstructGPT). **NeurIPS 2022**.
- Zhou, Y. et al. (2023). Large Language Models Are Human-Level Prompt Engineers (APE). **ICLR 2023**.
- Chen, B. et al. (2024). CodeChain: Towards Modular Code Generation Through Chain of Self-Revisions. **ICLR 2024**.

### Benchmarks

- Austin, J. et al. (2021). Program Synthesis with Large Language Models (MBPP). arXiv:2108.07732.
- Hendrycks, D. et al. (2021). Measuring Coding Challenge Competence with APPS. **NeurIPS 2021**.
- Jain, N. et al. (2024). LiveCodeBench: Holistic and Contamination-Free Evaluation of Large Language Models for Code. arXiv:2403.07974.
- Cassano, F. et al. (2023). MultiPL-E: A Scalable and Polyglot Approach to Benchmarks for LLMs. **IEEE TSE**.
- Liu, T. et al. (2023). RepoBench: Benchmarking Repository-Level Code Auto-Completion Systems. arXiv:2306.03091.
- Ding, Y. et al. (2024). CrossCodeEval: A Diverse and Multilingual Benchmark for Cross-File Code Completion. **NeurIPS 2023**.
- Liu, X. et al. (2023). AgentBench: Evaluating LLMs as Agents. **ICLR 2024**.
- Qin, Y. et al. (2024). ToolBench: Broad-Coverage Tool Learning Benchmark. arXiv:2305.18752.
- Zhou, S. et al. (2024). WebArena: A Realistic Web Environment for Building Autonomous Agents. **ICLR 2024**.
- Mialon, G. et al. (2024). GAIA: A Benchmark for General AI Assistants. **ICLR 2024**.

### AI-Assisted Development (Empirical Studies)

- Peng, S. et al. (2023). The Impact of AI on Developer Productivity: Evidence from GitHub Copilot. arXiv:2302.06590.
- Vaithilingam, P. et al. (2022). Expectation vs. Experience: Evaluating the Usability of Code Generation Tools. **CHI 2022**. DOI: 10.1145/3491101.3519665.
- Ziegler, A. et al. (2024). Measuring GitHub Copilot's Impact on Productivity. **Communications of the ACM**, 67(3).

### Inference Engines & Deployment

- Kwon, W. et al. (2023). Efficient Memory Management for Large Language Model Serving with PagedAttention (vLLM). **SOSP 2023**.

### Cognitive Architectures

- Bratman, M.E. (1987). Intention, Plans, and Practical Reason. Harvard University Press.
- Boyd, J.R. (1986). Patterns of Conflict. Unpublished briefing.
- Anderson, J.R. (2007). How Can the Human Mind Occur in the Physical Universe? Oxford University Press.

### Efficient Fine-Tuning

- Hu, E.J. et al. (2021). LoRA: Low-Rank Adaptation of Large Language Models. **ICLR 2022**. arXiv:2106.09685.
- Dettmers, T. et al. (2023). QLoRA: Efficient Finetuning of Quantized LLMs. **NeurIPS 2023**. arXiv:2305.14314.
- Answer.AI (2024). You Can Now Train a 70B Language Model at Home. https://www.answer.ai/posts/2024-03-06-fsdp-qlora.html
- Kolhe, A. et al. (2024). Profiling LoRA/QLoRA Fine-Tuning Efficiency on Consumer GPUs. arXiv:2509.12229.

### Instruction Fine-Tuning & Alignment

- Longpre, S. et al. (2023). The Flan Collection: Designing Data and Methods for Effective Instruction Tuning. arXiv:2301.13688.
- Cui, G. et al. (2023). UltraFeedback: Boosting Language Models with Scaled AI Feedback. arXiv:2310.01377.
- Xu, C. et al. (2023). WizardLM: Empowering Large Language Models to Follow Complex Instructions (Evol-Instruct). arXiv:2304.12244.
- Zeng, Q. et al. (2024). Automatic Instruction Evolving for Large Language Models (AutoEvol-Instruct). arXiv:2406.00770.
- Rafailov, R. et al. (2023). Direct Preference Optimization (DPO). **NeurIPS 2023**. arXiv:2305.18290.
- Hong, J. et al. (2024). ORPO: Monolithic Preference Optimization without Reference Model. arXiv:2403.07691.

### Turkish NLP & National LLM Strategies

- Uludoğan, G. et al. (2024). TURNA: A Turkish Encoder-Decoder Language Model. **ACL 2024 Findings**.
- Toraman, C. (2024). LlamaTurk: Adapting Open-Source Generative Large Language Models for Low-Resource Language. arXiv:2405.07745.
- Ranaldi, L. & Pucci, G. (2023). CrossAlpaca: Cross-lingual Instruction Following. **ACL Findings**.
- Schweter, S. (2020). BERTurk — BERT Models for Turkish. Zenodo. DOI: 10.5281/zenodo.3770924.
- Acikgoz, E. et al. (2024). Bridging the Bosphorus: Advancing Turkish LLMs through Strategies for Low-Resource Language Adaptation and Benchmarking. **EMNLP 2024 Findings**.
- T3AI Foundation (2025). Turkish Large Language Model T3 AI Beta. https://www.aa.com.tr/en/turkiye/turkish-large-language-model-t3-ai-launches-beta-version/3628696

### Coder LLMs

- Xie, T. et al. (2023). OpenAgents: An Open Platform for Language Agents in the Wild. arXiv:2310.10634.
- Abdin, M. et al. (2024). Granite-Function Calling Model via Multi-task Learning. arXiv:2407.00121.

### MCP & Integration Protocols

- Anthropic (2024). Model Context Protocol Specification. https://modelcontextprotocol.io
- AG-UI Protocol (2025). Agent User Interaction Protocol. https://docs.ag-ui.com
- A2A Protocol (2025). Agent-to-Agent Protocol. https://a2a-protocol.org

### Industry Systems

- Cursor IDE (2025-2026). Agent Mode, Plan Mode, Multi-Agent. https://cursor.com
- Cognition / Devin (2024). Autonomous Software Engineer. https://devin.ai
- GitHub Copilot Workspace (2024). Task-oriented AI development. https://github.com/features/copilot
- Windsurf / Codeium (2025). Agent-Native IDE. https://windsurf.com

---

*This document is a comprehensive literature review for the AKIS Platform thesis, covering the theoretical and empirical foundations of LLM-integrated software engineering agent platforms. It positions AKIS as a scientifically rigorous, provider-agnostic, deterministic multi-agent platform built on top of rapidly improving foundation models — developed and documented in Turkey with bilingual (Turkish/English) support.*
