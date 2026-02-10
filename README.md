# AKIS Platform

**AI Agent Orchestration System** — Automate repetitive software development tasks with autonomous AI agents.

AKIS Platform orchestrates specialized AI agents to handle documentation updates, test plan generation, and rapid prototyping — so developers can focus on what matters.

> **Live staging:** [staging.akisflow.com](https://staging.akisflow.com) | **Status:** All systems operational

---

## What It Does

AKIS runs three specialized AI agents through a structured orchestration pipeline:

| Agent | Purpose | How It Works |
|-------|---------|-------------|
| **Scribe** | Documentation generation | Analyzes source code via GitHub → generates Markdown docs → creates a PR |
| **Trace** | Test plan generation | Reads code structure → produces test cases with edge cases and coverage recommendations |
| **Proto** | Rapid prototyping | Takes a spec/idea → scaffolds working code → commits to a new branch |

Each agent follows a **Plan → Execute → Reflect** pipeline with deterministic prompts, quality scoring (0-100), and full trace logging.

---

## Architecture

```
                    ┌─────────────────────┐
                    │   React SPA (Vite)  │
                    │   Tailwind CSS      │
                    │   i18n (EN/TR)      │
                    └────────┬────────────┘
                             │ HTTPS
                    ┌────────▼────────────┐
                    │   Caddy (Edge Proxy) │
                    │   Auto-TLS, Static  │
                    └────────┬────────────┘
                             │
              ┌──────────────▼──────────────┐
              │     Fastify Backend (TS)     │
              │  ┌─────────────────────────┐ │
              │  │   AgentOrchestrator     │ │
              │  │   FSM: pending→running  │ │
              │  │   →completed|failed     │ │
              │  ├─────────────────────────┤ │
              │  │ Auth │ Jobs │ SSE │ API │ │
              │  └─────────────────────────┘ │
              └──────┬──────────────┬────────┘
                     │              │
              ┌──────▼──────┐ ┌────▼───────┐
              │ PostgreSQL  │ │MCP Gateway │
              │ Drizzle ORM │ │ GitHub API │
              └─────────────┘ └────────────┘
```

### Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Frontend** | React 19, Vite 7, Tailwind 4 | SPA with lazy loading, vendor chunking |
| **Backend** | Fastify 4, TypeScript (strict) | Modular monolith, pino logging |
| **Database** | PostgreSQL 16, Drizzle ORM | 12+ tables, migration system |
| **AI Integration** | OpenAI / OpenRouter | User-provided keys, AES-256-GCM encrypted |
| **External Services** | MCP Protocol adapters | No direct vendor SDKs — all via MCP |
| **Auth** | JWT in HTTP-only cookie | Email/password (multi-step) + OAuth (GitHub, Google) |
| **Deployment** | OCI Free Tier, Docker Compose, Caddy | Single ARM64 VM, auto-HTTPS |
| **CI/CD** | GitHub Actions | Typecheck + lint + build + test on every PR |

### Key Design Decisions

- **MCP-only integrations** — External services accessed only through Model Context Protocol adapters. No Octokit, no jira-client.
- **Orchestrator pattern** — `AgentOrchestrator` owns the full agent lifecycle. Agents never call each other.
- **FSM state machine** — Jobs follow `pending → running → completed | failed | awaiting_approval`
- **Contract-first agents** — Each agent has a `Contract` + `Playbook`. Prompts are deterministic (temp=0).
- **Context packs** — Static, deterministic file bundles per agent. Debuggable, token-efficient.

---

## Project Metrics

| Metric | Value |
|--------|-------|
| **Test count** | 1,344 (797 backend + 547 frontend) |
| **Test files** | 106 across unit, component, and E2E |
| **Source files** | 322 TypeScript/TSX files |
| **Lines of code** | ~58,000 TS/TSX |
| **API endpoints** | ~89 |
| **i18n keys** | ~500 (English + Turkish) |
| **Git commits** | 369+ |
| **CI quality gates** | typecheck, lint, build, test — all green |

---

## Staging Environment

**URL:** [staging.akisflow.com](https://staging.akisflow.com)

| Check | Status |
|-------|--------|
| `/health` | `{"status":"ok"}` |
| `/ready` | DB connected, encryption configured, SMTP active, OAuth (Google + GitHub) |
| `/version` | Commit SHA, build time, semver |
| Smoke tests | 12/12 passing |
| Frontend | Lazy-loaded SPA, 276 kB main chunk |
| TLS | Auto-provisioned via Caddy (Let's Encrypt) |

**Infrastructure:** Single OCI ARM64 VM (24GB RAM) → Caddy → Docker Compose (backend + postgres + MCP gateway)

---

## Features

### Platform
- Multi-step email/password authentication with 6-digit verification codes
- OAuth login (GitHub, Google) with welcome email
- Dashboard with 3-step onboarding (connect GitHub → add AI key → run first agent)
- Job history with pagination, filtering, and real-time SSE streaming
- Agents Hub — central discovery page for all agents
- Feedback capture widget (floating button, rating + message)
- i18n support (English + Turkish, ~500 keys)
- Standardized error handling with error envelope pattern

### Agent System
- AgentOrchestrator with FSM lifecycle management
- Factory + Registry pattern for agent instantiation
- Playbook system with phase definitions per agent
- Plan → Execute → Reflect/Critique pipeline
- Quality scoring (0-100) post-completion
- TraceRecorder for full observability
- JobEventBus → SSE for real-time updates
- StaleJobWatchdog for hung job detection
- Context packs with per-agent token/file limits

### Security
- JWT in HTTP-only, Secure, SameSite cookies (7-day expiry)
- AES-256-GCM encryption for user AI keys
- bcrypt password hashing
- Rate limiting (env-configurable)
- Helmet security headers
- API key masking in UI (last 4 chars only)
- Sensitive data redaction in SSE streams

### DevOps
- GitHub Actions CI/CD with quality gates on every PR
- Docker multi-arch builds (amd64 + arm64)
- Staging deploy with health check, version verification, auto-rollback
- MCP Gateway always-on in staging (no manual profile activation)
- Smoke test script with 12 automated checks
- Database migration with benign error handling

---

## Quick Start (Local Development)

```bash
# Clone
git clone https://github.com/OmerYasirOnal/akis-platform-devolopment.git
cd akis-platform-devolopment/devagents

# Install dependencies
pnpm install

# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your database URL and secrets
pnpm -C backend dev

# Frontend (separate terminal)
pnpm -C frontend dev
# → http://localhost:5173 (proxies /api to backend:3000)
```

For detailed setup: [`docs/local-dev/LOCAL_DEV_QUICKSTART.md`](docs/local-dev/LOCAL_DEV_QUICKSTART.md)

---

## Running Tests

```bash
# All quality gates (what CI runs)
pnpm -r typecheck && pnpm -r lint && pnpm -r build && pnpm -r test

# Backend only (797 tests, node:test runner)
pnpm -C backend test:unit

# Frontend only (547 tests, Vitest + Testing Library)
pnpm -C frontend test

# E2E (Playwright — auth flows, agent consoles, navigation)
pnpm -C frontend test:e2e
```

---

## Documentation

| Topic | Link |
|-------|------|
| Current sprint status | [`docs/NEXT.md`](docs/NEXT.md) |
| Roadmap & milestones | [`docs/ROADMAP.md`](docs/ROADMAP.md) |
| Local dev quickstart | [`docs/local-dev/LOCAL_DEV_QUICKSTART.md`](docs/local-dev/LOCAL_DEV_QUICKSTART.md) |
| Environment variables | [`docs/ENV_SETUP.md`](docs/ENV_SETUP.md) |
| API specification | [`backend/docs/API_SPEC.md`](backend/docs/API_SPEC.md) |
| Agent contracts | [`docs/agents/AGENT_CONTRACTS_S0.5.md`](docs/agents/AGENT_CONTRACTS_S0.5.md) |
| Agent workflows | [`backend/docs/AGENT_WORKFLOWS.md`](backend/docs/AGENT_WORKFLOWS.md) |
| Context packs design | [`docs/agents/CONTEXT_PACKS.md`](docs/agents/CONTEXT_PACKS.md) |
| Staging runbook | [`docs/deploy/OCI_STAGING_RUNBOOK.md`](docs/deploy/OCI_STAGING_RUNBOOK.md) |
| Smoke test checklist | [`docs/deploy/STAGING_SMOKE_TEST_CHECKLIST.md`](docs/deploy/STAGING_SMOKE_TEST_CHECKLIST.md) |
| Regression checklist | [`docs/qa/REGRESSION_CHECKLIST.md`](docs/qa/REGRESSION_CHECKLIST.md) |
| Graduation evidence | [`docs/qa/GRADUATION_EVIDENCE.md`](docs/qa/GRADUATION_EVIDENCE.md) |

---

## Project Status

| Phase | Status | Description |
|-------|--------|-------------|
| 0.1–0.3 | Completed | Foundation, architecture, core engine (Nov 2025) |
| 0.4 | Completed | Web shell, basic engine (Dec 2025) |
| 1.0 | Completed | Scribe/Trace/Proto early access (Dec 2025) |
| 1.5 | Completed | Logging + observability layer (Jan 2026) |
| 2.0 | Completed | Cursor-inspired UI + Scribe console (Jan 2026) |
| **S0.5** | **Active** | **Pilot demo — staging, UX, agent reliability, 1,344 tests** |

**Current milestone:** M1 Pilot Demo → 28 February 2026

| Milestone | Target | Focus |
|-----------|--------|-------|
| **M1: Pilot Demo** | Feb 2026 | Live staging, golden paths, 30/30 tasks complete |
| M2: Stabilization | Mar 2026 | Bug fixes, pilot feedback, pg_trgm, thesis draft |
| M3: Graduation | May 2026 | Final report, presentation, defense |

---

## Contributing

- Branch naming: `feat/S0.5.X-short-desc` or `fix/S0.5.X-short-desc`
- Conventional Commits: `feat|fix|chore|docs(scope): message`
- PRs: small (≤ 300 LoC), squash merge, linked to GitHub issue
- CI must pass: typecheck + lint + build + test

---

## License

MIT License — see [LICENSE](LICENSE)

---

**Built by [Ömer Yasir Önal](https://github.com/OmerYasirOnal)** as a senior thesis project at Istanbul Fatih Sultan Mehmet University.
