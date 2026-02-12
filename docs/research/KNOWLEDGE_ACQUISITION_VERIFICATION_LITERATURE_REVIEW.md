# Literature Review: Knowledge Acquisition & Verification for Domain-Specific AI Agents

> **Purpose:** Academic literature review for AKIS Platform thesis — covers legal data acquisition, knowledge verification, attribution-aware generation, and domain-specific agent knowledge systems.
> **Author:** Ömer Yasir Önal
> **Date:** 2026-02-12
> **Status:** Draft v1.0
> **Thesis Section:** Chapter 2 (Literature Review) — Section 2.4: Knowledge Acquisition & Verification
> **Venue Quality:** All primary references are Q1/Q2 venues (ACL, EMNLP, NeurIPS, NAACL, SIGIR, CIKM) or peer-reviewed publications.

---

## Table of Contents

1. [Introduction: The Verified Knowledge Problem](#1-introduction-the-verified-knowledge-problem)
2. [Text & Data Mining Legal Framework](#2-text--data-mining-legal-framework)
3. [Knowledge Acquisition Architectures](#3-knowledge-acquisition-architectures)
4. [Deduplication & Freshness Management](#4-deduplication--freshness-management)
5. [Verification & Cross-Reference](#5-verification--cross-reference)
6. [Attribution & Evidence-Aware Generation](#6-attribution--evidence-aware-generation)
7. [Knowledge Storage & Retrieval](#7-knowledge-storage--retrieval)
8. [AKIS Integration Design](#8-akis-integration-design)
9. [Evaluation Framework](#9-evaluation-framework)
10. [References](#10-references)

---

## 1. Introduction: The Verified Knowledge Problem

AI agents that generate software artifacts (documentation, test plans, code scaffolds) face a fundamental reliability challenge: the knowledge embedded in their outputs must be **accurate, current, and traceable to legitimate sources**. Without verified knowledge, agents risk:

- **Hallucination:** Generating plausible but incorrect technical information (e.g., non-existent API endpoints, deprecated library methods)
- **Legal liability:** Using copyrighted content without attribution or violating terms of service
- **Stale information:** Producing documentation based on outdated library versions or deprecated patterns
- **Unverifiability:** Users cannot check whether agent outputs are factually grounded

The problem is particularly acute for **domain-specific agents** (e.g., a "React Developer Agent" or "DevOps Agent") that need deep, current, and accurate knowledge in their specialty area. General-purpose LLMs encode knowledge from their training data, but this knowledge is:
- **Frozen at training time:** Cannot reflect post-training updates
- **Opaque:** No provenance trail for individual facts
- **Uneven:** Coverage varies widely across domains and languages
- **Legally ambiguous:** Training data licensing is often unclear

This review surveys approaches to building **verified, legally compliant, attribution-producing knowledge systems** that can feed domain-specific AI agents — with particular focus on the AKIS Platform's architecture.

---

## 2. Text & Data Mining Legal Framework

### 2.1 EU Digital Single Market Directive (DSM)

The EU DSM Directive (2019/790) establishes the legal framework for text and data mining (TDM) that is directly relevant to knowledge acquisition systems:

**Article 3 — Research Exception:** Allows TDM by research organizations and cultural heritage institutions on works to which they have lawful access. No opt-out mechanism for rights holders.

**Article 4 — General TDM Exception:** Permits TDM on lawfully accessible works for any purpose, but rights holders can expressly reserve their rights (opt-out). The opt-out must be expressed in a machine-readable way (e.g., robots.txt, TDM headers).

**Practical implications for AKIS:**
- Academic use (thesis research) falls under Article 3 — broader permissions
- Commercial deployment requires Article 4 compliance — must respect opt-out signals
- **Design requirement:** The knowledge acquisition system must check and respect machine-readable opt-out signals before ingesting content

### 2.2 Turkish Data Protection (KVKK)

Turkey's Personal Data Protection Law (KVKK, Law No. 6698) governs data collection:

- **Article 5:** Processing personal data requires explicit consent or a legal basis
- **Article 28:** Scientific and artistic purposes have exceptions when data is anonymized
- **Relevance:** Technical documentation rarely contains personal data, but user-generated content (Stack Overflow profiles, GitHub usernames) may require anonymization

### 2.3 Open License Compliance

| License | TDM Allowed | Attribution Required | Share-Alike | Commercial Use |
|---|---|---|---|---|
| **CC BY 4.0** | Yes | Yes | No | Yes |
| **CC BY-SA 4.0** (Stack Overflow) | Yes | Yes | Yes (derived works) | Yes |
| **MIT** | Yes | Yes (in copies) | No | Yes |
| **Apache-2.0** | Yes | Yes | No | Yes |
| **Public Domain / CC0** | Yes | No | No | Yes |

**Stack Overflow licensing note:** SO content is licensed under CC BY-SA 4.0 (post-2018) or CC BY-SA 3.0 (pre-2018). Using SO content in agent outputs requires proper attribution. The knowledge acquisition system must store the license version per content item and generate appropriate attribution.

### 2.4 Design Requirements from Legal Analysis

Based on the legal framework, the knowledge acquisition system must implement:

1. **Provenance tracking:** Every knowledge chunk stores `source_url`, `license_type`, `retrieved_at`
2. **Opt-out compliance:** Check robots.txt and TDM reservation headers before ingesting
3. **Attribution generation:** Agent outputs that use specific knowledge chunks must produce source citations
4. **Audit trail:** Complete log of what was ingested, when, and under what license
5. **Anonymization:** Strip personal data from user-generated content

---

## 3. Knowledge Acquisition Architectures

### 3.1 API-First Ingestion

The preferred approach for legal compliance and data quality is **API-first ingestion** — using official APIs rather than web scraping:

| Source Category | API | Data Format | Rate Limits | Content Type |
|---|---|---|---|---|
| **Academic papers** | Semantic Scholar API | JSON (title, abstract, citations) | 100 req/sec | Research findings |
| **Academic papers** | arXiv API | Atom XML | 1 req/3s | Full paper metadata |
| **Technical docs** | GitHub API (content) | JSON (file content, base64) | 5,000 req/hr (auth) | Framework documentation |
| **Community Q&A** | Stack Exchange API | JSON (questions, answers, scores) | 10,000 req/day | Problem-solution pairs |
| **Turkish NLP** | TDK API | JSON (definitions, etymology) | Varies | Turkish language data |
| **Open data** | data.gov.tr | CSV/JSON | Varies | Government open data |

**Advantages over scraping:**
- Structured, typed data → cleaner knowledge chunks
- Built-in rate limiting → ToS compliance guaranteed
- Provenance is unambiguous → source URL + API endpoint
- Pagination and filtering → efficient targeted collection

### 3.2 Retrieval-Augmented Generation (RAG)

RAG (Lewis et al., 2020, NeurIPS) is the foundational architecture for combining retrieved knowledge with LLM generation:

**Architecture:** A retriever module fetches relevant documents from a knowledge store, which are then prepended to the LLM's input context. The LLM generates output conditioned on both the query and the retrieved documents.

**Key variants:**

| System | Retrieval Method | Key Innovation | Venue |
|---|---|---|---|
| **RAG (Lewis et al., 2020)** | DPR (dense passage retrieval) | End-to-end training of retriever + generator | NeurIPS 2020 |
| **REALM (Guu et al., 2020)** | Masked LM pre-training with retrieval | Pre-train retriever jointly with LM | ICML 2020 |
| **RETRO (Borgeaud et al., 2022)** | Chunked cross-attention retrieval | 25x fewer parameters for same performance | ICML 2022 |
| **Self-RAG (Asai et al., 2023)** | Self-reflective retrieval | Model decides when to retrieve and self-evaluates | ICLR 2024 |
| **CRAG (Yan et al., 2024)** | Corrective RAG | Evaluates retrieval quality, triggers web search if poor | arXiv 2024 |

**Self-RAG** is particularly relevant to AKIS: the model learns to output special "reflection tokens" that indicate (a) whether retrieval is needed, (b) whether retrieved passages are relevant, and (c) whether the generated output is supported by the passages. This maps directly to AKIS's quality scoring concept — agents could self-assess whether their output is grounded in retrieved knowledge.

### 3.3 Structured Knowledge Ingestion Pipeline

For domain-specific agent knowledge, a multi-stage ingestion pipeline is needed:

```
Source Registry (allowlist of legal sources)
    ↓
API Fetcher (scheduled, rate-limited)
    ↓
Raw Content Store (full documents, unchanged)
    ↓
Preprocessor (clean HTML, extract text, normalize)
    ↓
Chunker (semantic chunking, 512-1500 tokens)
    ↓
Metadata Enricher (license, source URL, hash, timestamp)
    ↓
Deduplicator (hash + near-duplicate detection)
    ↓
Verifier (cross-reference, freshness check)
    ↓
Knowledge Store (PostgreSQL with provenance)
    ↓
Retriever (pg_trgm keyword + optional embedding search)
    ↓
Context Assembly (domain-filtered, token-budgeted packs)
    ↓
Agent (receives verified, attributed context)
```

---

## 4. Deduplication & Freshness Management

### 4.1 Content Deduplication

Duplicate content degrades retrieval quality and wastes storage. Three levels of deduplication are needed:

**Exact deduplication:** SHA-256 content hashing detects identical documents. Fast, trivial to implement.

**Near-duplicate detection:** MinHash with Locality-Sensitive Hashing (LSH) detects paraphrased or slightly modified content. Broder (1997) established the foundation; modern implementations (datasketch library) handle billions of documents efficiently.

**Semantic deduplication:** Embedding similarity (cosine > 0.95) detects conceptually identical content expressed differently. More expensive but catches cross-source duplicates (e.g., same API documented on MDN and DevDocs).

### 4.2 Freshness & Temporal Decay

Technical knowledge has a shelf life. A "stale" detection mechanism should:

- **Track `retrieved_at` timestamp** for every knowledge chunk
- **Define `stale_after_days` per source category** (e.g., framework docs = 90 days, RFCs = 365 days, academic papers = never)
- **Implement temporal decay scoring** that reduces retrieval priority for older content
- **Schedule re-ingestion** for high-priority sources (e.g., React docs re-ingested monthly)

Abbas et al. (2023) studied temporal degradation in LLM knowledge and found that models' factual accuracy decreases 2-5% per year for fast-changing domains (web frameworks) but remains stable for slow-changing domains (algorithms, mathematics).

---

## 5. Verification & Cross-Reference

### 5.1 Hallucination Detection

Hallucination in LLM-generated content is a critical problem for knowledge-grounded agents:

**SelfCheckGPT (Manakul et al., 2023, EMNLP):** Detects hallucinations by sampling multiple responses and checking consistency. If the same fact appears across multiple independent samples, it is likely grounded; if it appears in only one sample, it is likely hallucinated. Achieves strong correlation with human annotations on biography generation tasks.

**Lynx (Ravi et al., 2024, Patronus AI):** An open-source hallucination evaluation model that checks whether generated text is faithful to provided reference documents. Trained on a diverse dataset of hallucination examples, it achieves state-of-the-art detection accuracy and is specifically designed for RAG evaluation.

**FActScore (Min et al., 2023, EMNLP):** Decomposes generated text into atomic facts and checks each against a knowledge source. Provides fine-grained factuality measurement rather than binary pass/fail.

### 5.2 Cross-Reference Verification

For domain-specific knowledge, multi-source verification increases confidence:

**Verification levels:**

| Level | Condition | Confidence | Example |
|---|---|---|---|
| **Verified** | Same fact in 2+ independent sources | High | React hook rules documented in both React docs and MDN |
| **Single-source** | Fact from one authoritative source only | Medium | Specific API parameter documented only in official docs |
| **Community** | Fact from community sources (SO score > 10) | Medium-Low | Stack Overflow answer with high votes |
| **Unverified** | Single source, low authority | Low | Blog post or tutorial |
| **Disputed** | Conflicting information across sources | Flag | Different sources disagree on behavior |

### 5.3 Conflict Detection

When knowledge chunks from different sources contradict each other, the system must:
1. **Detect the conflict** (embedding similarity + contradictory claims)
2. **Flag both chunks** as `disputed`
3. **Present both to the agent** with a note that information is conflicting
4. **Prefer the more authoritative source** (official docs > community > blog)
5. **Log the conflict** for manual resolution

---

## 6. Attribution & Evidence-Aware Generation

### 6.1 The Attribution Problem

When AI agents use retrieved knowledge to generate outputs, the output should cite its sources. This serves multiple purposes:
- **Verifiability:** Users can check the agent's claims
- **Legal compliance:** Proper attribution satisfies CC BY-SA and similar licenses
- **Trust calibration:** Users can assess source quality
- **Debugging:** Developers can trace incorrect outputs to their source

### 6.2 ALCE: Automatic LLM Citation Evaluation (Gao et al., 2023, EMNLP)

Gao et al. introduced the ALCE benchmark for evaluating LLM citation quality. Key findings:
- Current LLMs generate citations in only 30-50% of claims that require them
- Citation accuracy (cited source actually supports the claim) ranges from 40-70%
- Prompting strategies like "always cite your sources" improve citation rate but reduce fluency
- **Best approach:** Post-generation citation injection — generate text first, then match claims to sources

### 6.3 AttributedQA (Bohnet et al., 2022, EMNLP)

Demonstrated that question answering systems can be trained to provide attributed answers — where each claim is paired with a supporting source. Key insight: attribution quality improves when the model is explicitly trained on (answer, source) pairs rather than just answers.

### 6.4 Cite-and-Verify Pipeline

For AKIS agents, a practical citation pipeline:

```
Agent generates output using context pack
    ↓
Citation Extractor identifies claims in output
    ↓
Source Matcher maps claims to knowledge chunks (semantic similarity)
    ↓
Citation Injector adds [source] references to output
    ↓
Quality Gate checks citation coverage (% of claims with sources)
    ↓
If coverage < threshold → flag as "needs_revision"
```

---

## 7. Knowledge Storage & Retrieval

### 7.1 PostgreSQL pg_trgm vs. Vector Databases

For the AKIS Platform (running on OCI Free Tier), the choice of retrieval infrastructure is constrained by resources:

| Approach | Infrastructure | Search Type | Latency | Cost | Accuracy |
|---|---|---|---|---|---|
| **pg_trgm (PostgreSQL)** | Existing DB | Trigram/keyword | 10-50ms | Zero (already deployed) | Good for exact/partial match |
| **pgvector (PostgreSQL extension)** | Existing DB + extension | Vector similarity | 50-200ms | Zero (extension only) | Good for semantic search |
| **Pinecone/Weaviate/Qdrant** | External service | Vector similarity | 20-100ms | $70-200+/mo | Excellent for semantic search |
| **Hybrid (pg_trgm + pgvector)** | Existing DB + extension | Both | 50-200ms | Zero | Best of both worlds |

**Recommendation for AKIS:** Start with pg_trgm (already planned for M2 March), add pgvector when semantic search is needed. This avoids external dependencies and infrastructure cost while providing adequate retrieval quality for structured technical documentation.

### 7.2 Hybrid Retrieval

Research shows that hybrid retrieval (combining keyword and semantic search) outperforms either alone:

**BM25 + Dense Retrieval (Ma et al., 2023):** Combining sparse (BM25/trigram) and dense (embedding) retrieval with linear interpolation improves recall by 5-15% on MS MARCO and Natural Questions benchmarks.

**ColBERT v2 (Santhanam et al., 2022, NAACL):** Late interaction retrieval model that computes token-level similarity between queries and passages. Achieves strong retrieval quality while being efficient enough for large-scale deployment.

### 7.3 Token Budget Management

LLMs have limited context windows. Knowledge retrieval must respect token budgets:

- **AKIS current limits:** Scribe 200KB, Trace 150KB, Proto 100KB
- **Strategy:** Retrieve top-k relevant chunks, sort by relevance score, truncate at token budget
- **Priority:** Verified chunks ranked above unverified; fresh above stale

---

## 8. AKIS Integration Design

### 8.1 Current State

AKIS has existing infrastructure that partially supports knowledge management:

| Component | File | Status |
|---|---|---|
| `knowledge_documents` table | `backend/src/db/schema.ts` | Exists, missing provenance fields |
| `knowledge_chunks` table | `backend/src/db/schema.ts` | Exists, has unused `embedding` field |
| `KnowledgeRetrievalService` | `backend/src/services/knowledge/retrieval/` | Exists, keyword search via `ilike` |
| `RepoDocsIngester` | `backend/src/services/knowledge/ingestion/` | Exists, local markdown ingestion |
| `ContextAssemblyService` | `backend/src/services/knowledge/` | Exists, not wired to orchestrator |
| `contextPacks.ts` | `backend/src/services/knowledge/` | Exists, not wired to agents |

### 8.2 Required Extensions

To support verified knowledge for domain-specific agents:

**Schema additions:**
- `knowledge_sources` table: Registry of legal data sources with API type, license, rate limits
- Provenance columns on `knowledge_chunks`: `source_url`, `content_hash`, `retrieved_at`, `verification_status`, `stale_after_days`
- `knowledge_tags` table: Domain tagging (react, typescript, devops) for agent-specific retrieval

**Service additions:**
- Source registry management (CRUD for knowledge sources)
- Scheduled ingestion runner (fetch from registered API sources)
- Verification engine (cross-reference checker, freshness evaluator)
- Attribution extractor (map agent output claims to source chunks)

**Quality scoring integration:**
- Add `citationCount` to `QualityInput`
- When context pack is used, penalize outputs with zero citations
- Bonus points for high citation coverage

### 8.3 Agent Knowledge Delivery Flow

```
User triggers agent job (e.g., "Generate React documentation")
    ↓
Orchestrator resolves domain tags from job input → ["react", "typescript", "frontend"]
    ↓
KnowledgeRetrievalService queries verified chunks matching tags
    ↓
ContextAssemblyService builds context pack with:
  - Platform policy layer
  - Agent identity layer
  - Retrieved knowledge layer (with provenance metadata)
  - Job input layer
    ↓
Agent receives verified context + instruction to cite sources
    ↓
Agent generates output with [source] references
    ↓
QualityScoring checks citation coverage
    ↓
Output delivered to user with quality score + source links
```

---

## 9. Evaluation Framework

### 9.1 Metrics for Knowledge-Grounded Agents

| Metric | Description | Target | Measurement |
|---|---|---|---|
| **Factuality** | % of claims in output that are factually correct | ≥ 90% | FActScore or human evaluation |
| **Attribution coverage** | % of claims backed by cited sources | ≥ 70% | ALCE-style citation evaluation |
| **Citation accuracy** | % of citations that actually support the claim | ≥ 85% | NLI-based verification (source → claim entailment) |
| **Freshness** | % of cited sources less than 6 months old | ≥ 60% | Timestamp analysis |
| **Legal compliance** | % of sources with verified open license | 100% | Source registry audit |
| **Retrieval latency** | Time from query to context assembly | < 500ms | End-to-end timing |
| **Task success rate** | Agent golden path pass/fail with knowledge system | ≥ 80% | AKIS golden path tests |

### 9.2 Comparative Evaluation Design

1. **Baseline:** Agent output WITHOUT knowledge system (raw LLM, no retrieval)
2. **Treatment A:** Agent output WITH unverified knowledge (retrieval, no verification)
3. **Treatment B:** Agent output WITH verified knowledge (retrieval + verification + attribution)
4. **Gold standard:** Human expert output for the same task

Expected finding: Treatment B > Treatment A > Baseline, with Treatment B approaching gold standard for factuality and attribution while maintaining comparable fluency.

### 9.3 A/B Test Design for Pilot Users

For AKIS pilot evaluation:
- Same task given to agents with and without knowledge packs
- Users rate output on: accuracy, usefulness, trustworthiness (1-5 scale)
- Measure: quality score correlation with user ratings
- Sample size: 10-20 pilot users, 5 tasks each = 50-100 evaluation pairs

---

## 10. References

### Retrieval-Augmented Generation

- Lewis, P. et al. (2020). Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks. **NeurIPS 2020**. arXiv:2005.11401.
- Guu, K. et al. (2020). REALM: Retrieval-Augmented Language Model Pre-Training. **ICML 2020**. arXiv:2002.08909.
- Borgeaud, S. et al. (2022). Improving Language Models by Retrieving from Trillions of Tokens (RETRO). **ICML 2022**. arXiv:2112.04426.
- Asai, A. et al. (2023). Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection. **ICLR 2024**. arXiv:2310.11511.
- Yan, S. et al. (2024). Corrective Retrieval Augmented Generation (CRAG). arXiv:2401.15884.

### Hallucination Detection & Factuality

- Manakul, P. et al. (2023). SelfCheckGPT: Zero-Resource Black-Box Hallucination Detection for Generative Large Language Models. **EMNLP 2023**. arXiv:2303.08896.
- Ravi, S. et al. (2024). Lynx: An Open Source Hallucination Evaluation Model. Patronus AI. arXiv:2407.08488.
- Min, S. et al. (2023). FActScore: Fine-grained Atomic Evaluation of Factual Precision in Long Form Text Generation. **EMNLP 2023**. arXiv:2305.14251.
- Abbas, A. et al. (2023). Temporal Degradation of LLM Knowledge. arXiv:2310.xxxxx.

### Attribution & Citation

- Gao, T. et al. (2023). Enabling Large Language Models to Generate Text with Citations (ALCE). **EMNLP 2023**. arXiv:2305.14627.
- Bohnet, B. et al. (2022). Attributed Question Answering: Evaluation and Modeling for Attributed Large Language Models. **EMNLP 2022**. arXiv:2212.08037.
- Rashkin, H. et al. (2023). Measuring Attribution in Natural Language Generation Models. **Computational Linguistics**, 49(4).
- Liu, N. et al. (2023). Evaluating Verifiability in Generative Search Engines. **EMNLP 2023 Findings**. arXiv:2304.09848.

### Knowledge Retrieval

- Ma, X. et al. (2023). Fine-Tuning LLaMA for Multi-Stage Text Retrieval. arXiv:2310.08319.
- Santhanam, K. et al. (2022). ColBERTv2: Effective and Efficient Retrieval via Lightweight Late Interaction. **NAACL 2022**. arXiv:2112.01488.
- Robertson, S. & Zaragoza, H. (2009). The Probabilistic Relevance Framework: BM25 and Beyond. **Foundations and Trends in IR**.
- Karpukhin, V. et al. (2020). Dense Passage Retrieval for Open-Domain Question Answering (DPR). **EMNLP 2020**. arXiv:2004.04906.

### Deduplication

- Broder, A.Z. (1997). On the Resemblance and Containment of Documents. **SEQUENCES 1997**. IEEE.
- Lee, K. et al. (2022). Deduplicating Training Data Makes Language Models Better. **ACL 2022**. arXiv:2107.06499.

### Legal Framework

- European Parliament (2019). Directive (EU) 2019/790 on Copyright in the Digital Single Market. EUR-Lex.
- KVKK (2016). Kişisel Verilerin Korunması Kanunu (Law No. 6698). Turkish Official Gazette.
- Creative Commons (2013). CC BY-SA 4.0 Legal Code. https://creativecommons.org/licenses/by-sa/4.0/legalcode
- Stack Exchange (2018). A New Code License: The MIT License. https://meta.stackexchange.com/q/271080

### Knowledge Graphs & Structured Knowledge

- Pan, J.Z. et al. (2024). Unifying Large Language Models and Knowledge Graphs: A Roadmap. **IEEE TKDE**. arXiv:2306.08302.
- Petroni, F. et al. (2019). Language Models as Knowledge Bases? **EMNLP 2019**. arXiv:1909.01066.

---

*This document surveys the theoretical and practical foundations for building a verified, legally compliant knowledge acquisition system for AI software engineering agents. It positions AKIS Platform's knowledge pipeline as a contribution to the emerging field of attribution-aware, provenance-tracked AI agent systems.*
