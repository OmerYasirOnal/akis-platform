# AKIS Platform — Public Portfolio README

> **This file is the template for the public portfolio repository.**
> Run `./scripts/public-repo/export.sh` to generate a sanitized public repo snapshot.
> See `docs/public/PUBLIC_REPO_SCOPE.md` for what's included/excluded.
> See `docs/public/PUBLIC_REPO_CHECKLIST.md` for step-by-step creation guide.
> It contains no secrets, internal paths, or private infrastructure details.

---

# AKIS Platform

**AI Agent Orchestration System for Software Development**

AKIS automates repetitive software engineering tasks — documentation, test planning, and prototyping — through autonomous AI agents orchestrated via a web interface. Outputs are committed as GitHub pull requests.

**Live Demo:** [staging.akisflow.com](https://staging.akisflow.com)

---

## The Problem

Software teams spend significant time on repetitive tasks: keeping documentation in sync, writing test plans, and scaffolding boilerplate code. These tasks are well-defined, pattern-driven, and ripe for automation — yet most AI coding tools focus on inline code completion rather than end-to-end task automation.

## The Solution

AKIS provides a **structured agent orchestration framework** where each agent:
1. **Plans** — Analyzes the codebase and creates an execution plan
2. **Executes** — Performs the task with deterministic prompts
3. **Reflects** — Reviews output quality with a critique step
4. **Delivers** — Commits results as a GitHub pull request

This produces predictable, reviewable outputs rather than ad-hoc suggestions.

---

## Agents

| Agent | What It Does | Input | Output |
|-------|-------------|-------|--------|
| **Scribe** | Generates technical documentation | GitHub repo + branch | Markdown docs → PR |
| **Trace** | Creates test plans with edge cases | Code module/directory | Test plan document → PR |
| **Proto** | Scaffolds working prototypes | Spec/idea description | Code scaffold → PR |

---

## Architecture Highlights

```
React SPA → Caddy (auto-TLS) → Fastify API → PostgreSQL
                                     ↓
                              AgentOrchestrator
                              (FSM lifecycle)
                                     ↓
                              MCP Gateway → GitHub API
```

### Key Technical Decisions

- **Modular monolith** — Single deployable backend, optimized for constrained infrastructure (OCI Free Tier ARM64 VM)
- **MCP Protocol** — All external service access through Model Context Protocol adapters. No direct vendor SDKs (Octokit, etc.)
- **Orchestrator pattern** — Central `AgentOrchestrator` owns full agent lifecycle. Agents are isolated and never call each other.
- **FSM state machine** — Every job follows `pending → running → completed | failed` with full trace logging
- **Contract-first agents** — Each agent has a typed Contract + Playbook. Prompts are deterministic (temperature=0).
- **Context packs** — Static file bundles assembled per agent with token/file limits. Debuggable and reproducible.

### Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React 19 + Vite + Tailwind CSS |
| Backend | Fastify + TypeScript (strict mode) |
| Database | PostgreSQL 16 + Drizzle ORM |
| AI | OpenAI / OpenRouter (user-provided keys, AES-256-GCM encrypted) |
| Auth | JWT (HTTP-only cookie) + Email/Password + OAuth (GitHub, Google) |
| CI/CD | GitHub Actions (typecheck + lint + build + test on every PR) |
| Deploy | Docker Compose + Caddy (auto-HTTPS) on OCI ARM64 |

---

## Numbers

| Metric | Value |
|--------|-------|
| Automated tests | **1,344** (797 backend + 547 frontend) |
| Test files | 106 (unit, component, E2E) |
| Source files | 322 TypeScript/TSX |
| Lines of code | ~58,000 |
| API endpoints | ~89 |
| i18n translation keys | ~500 (English + Turkish) |
| Quality gate checks | 4 (typecheck, lint, build, test) — all green |
| Staging smoke tests | 12/12 passing |

---

## What I Built (Engineering Highlights)

### Agent Orchestration Engine
- Full FSM lifecycle management with state persistence
- Factory + Registry pattern for dynamic agent instantiation
- Plan → Execute → Reflect pipeline with quality scoring (0-100)
- Real-time job streaming via Server-Sent Events (SSE)
- Stale job detection with configurable watchdog

### Authentication System
- Multi-step email/password flow with 6-digit verification codes (15min expiry, bcrypt)
- OAuth integration (GitHub + Google) with automatic welcome emails
- JWT sessions in HTTP-only, Secure, SameSite cookies

### Developer Experience
- Cursor-inspired UI with lazy-loaded pages (50% bundle size reduction)
- 3-step onboarding flow: connect GitHub → add AI key → run first agent
- Bilingual interface (English/Turkish) with ~500 i18n keys
- Standardized error handling with error envelope pattern

### Infrastructure & DevOps
- Docker multi-arch builds (amd64 + arm64)
- CI/CD pipeline: GitHub Actions with quality gates on every PR
- Staging deploy with health verification, version check, and auto-rollback
- 12-check automated smoke test suite
- MCP Gateway always-on in staging (zero manual post-deploy steps)

### Security
- AES-256-GCM encryption for user AI keys at rest
- Sensitive data redaction in SSE streams (GitHub PATs, OAuth tokens, API keys)
- Rate limiting, Helmet headers, CORS enforcement
- API key masking in UI (last 4 characters only)

---

## Staging Environment

The platform runs on a single OCI Free Tier ARM64 VM:

| Endpoint | Response |
|----------|----------|
| `/health` | `{"status":"ok"}` |
| `/ready` | Database connected, encryption configured, email active, OAuth ready |
| `/version` | Commit SHA + build time + semver |

All 12 automated smoke tests pass. TLS is auto-provisioned via Caddy + Let's Encrypt.

---

## Development Timeline

| Phase | Period | What Was Built |
|-------|--------|---------------|
| Foundation | Nov 2025 | Core architecture, modular monolith setup |
| Web Shell | Dec 2025 | Basic UI, Fastify backend, auth system |
| Agent EA | Dec 2025 | Scribe, Trace, Proto early access |
| Observability | Jan 2026 | Logging, trace recording, SSE streaming |
| UI Overhaul | Jan 2026 | Cursor-inspired dashboard, agent consoles |
| Pilot Demo | Feb 2026 | Staging deployment, 1,344 tests, onboarding, feedback capture |

---

## Running Locally

```bash
git clone https://github.com/OmerYasirOnal/akis-platform.git
cd akis-platform

# Install
pnpm install

# Backend
cp backend/.env.example backend/.env
pnpm -C backend dev

# Frontend
pnpm -C frontend dev
# → http://localhost:5173
```

---

## Testing

```bash
# Full quality gate (what CI runs on every PR)
pnpm -r typecheck && pnpm -r lint && pnpm -r build && pnpm -r test

# 797 backend tests
pnpm -C backend test:unit

# 547 frontend tests
pnpm -C frontend test
```

---

## About

Built by **Ömer Yasir Önal** as a senior thesis project at Istanbul Fatih Sultan Mehmet University (2025-2026).

**Thesis:** *Can a structured AI agent orchestration framework improve developer productivity in documentation, testing, and prototyping tasks while maintaining output quality through automated review and critique pipelines?*

### Approach
- **Design Science Research (DSR)** methodology
- Iterative development with 7 phases over 4 months
- Pilot evaluation with real users on staging environment
- Quantitative metrics: task completion time, output quality scores, test coverage

---

## Repository Structure

This public repository contains selected source code and documentation showcasing the platform's architecture:

```
├── README.md                            # This file
├── LICENSE                              # MIT
├── SECURITY.md                          # Vulnerability reporting
├── backend/
│   ├── docs/                            # API spec, auth flow, agent workflows
│   └── src/
│       ├── core/                        # Orchestrator, FSM, events, tracing
│       ├── agents/{scribe,trace,proto}/ # Agent implementations
│       └── services/
│           ├── mcp/adapters/            # MCP protocol adapters
│           └── quality/                 # Quality scoring engine
├── frontend/src/
│   ├── pages/dashboard/                 # Dashboard + agent console pages
│   └── components/
│       ├── agents/                      # Agent UI components
│       ├── jobs/                        # Job management UI
│       └── dashboard/                   # Dashboard widgets
└── docs/
    ├── agents/                          # Agent contracts, context packs
    ├── UI_DESIGN_SYSTEM.md              # Design system documentation
    └── public/assets/                   # Screenshots and demo GIFs
```

> **Note:** This is a curated showcase — not the full private repository. The complete codebase includes 322+ source files, 106 test files, CI/CD pipelines, deployment infrastructure, and internal planning documents.

---

## License

MIT
