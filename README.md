<p align="center">
  <img src="frontend/src/assets/branding/akis-mark-512.png" alt="AKIS Logo" width="80" />
</p>

<h1 align="center">AKIS Platform</h1>

<p align="center">
  <strong>Adaptive Knowledge Integrity System</strong><br/>
  An AI-powered agent orchestration engine that transforms ideas into verified software.
</p>

<p align="center">
  <a href="https://akisflow.com"><img src="https://img.shields.io/badge/live-akisflow.com-07D1AF?style=flat-square" alt="Live Demo" /></a>&nbsp;
  <img src="https://img.shields.io/badge/version-0.2.0-blue?style=flat-square" alt="Version" />&nbsp;
  <img src="https://img.shields.io/github/actions/workflow/status/OmerYasirOnal/akis-platform/ci.yml?style=flat-square&label=CI" alt="CI Status" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Fastify-4-000?style=flat-square&logo=fastify" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Claude-Sonnet_4-D97757?style=flat-square&logo=anthropic" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" />
</p>

---

## Overview

AKIS automates the software development pipeline through three specialized AI agents working in sequence. Describe your idea in natural language, and AKIS produces a structured specification, scaffolds a working codebase, and generates verification tests — all with human oversight at the approval gate.

```
  Idea  ──>  SCRIBE  ──>  Human Approval  ──>  PROTO  ──>  TRACE  ──>  Working Project
              spec          review & approve      code        tests
```

Each agent's output is verified by the next stage. This **verification chain** is central to the platform's design — Scribe specs are approved by humans, Proto code is tested by Trace, and Trace tests run automatically.

---

## Screenshots

<table>
  <tr>
    <td width="50%">
      <img src="docs/screenshots/01-landing.png" alt="Landing Page" /><br/>
      <sub><b>Landing Page</b> — Hero with frosted-glass theme</sub>
    </td>
    <td width="50%">
      <img src="docs/screenshots/02-chat.png" alt="Chat Interface" /><br/>
      <sub><b>Chat Interface</b> — Sidebar, agent pipeline, message input</sub>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="docs/screenshots/03-settings.png" alt="Settings" /><br/>
      <sub><b>Settings</b> — AI provider management and profile</sub>
    </td>
    <td width="50%">
      <img src="docs/screenshots/04-docs.png" alt="Documentation" /><br/>
      <sub><b>Documentation</b> — Getting started, AI setup, GitHub integration</sub>
    </td>
  </tr>
</table>

---

## Features

- **Sequential Agent Pipeline** — Scribe (spec) -> Human Gate -> Proto (code) -> Trace (tests)
- **Real-time Streaming** — SSE-powered live agent activity during pipeline execution
- **GitHub via MCP** — Model Context Protocol adapter for repo creation, branch management, commits, and PRs
- **Multi-provider AI** — Anthropic Claude, OpenAI, and OpenRouter with user-configurable API keys
- **OAuth Authentication** — GitHub and Google login alongside email/password
- **Pipeline Statistics** — Success rates, agent durations, execution history
- **Onboarding** — Animated welcome wizard and profile setup flow
- **Localization** — Full Turkish and English support (i18n)

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  FRONTEND — React 19 + Vite 7 + Tailwind 4             │
│  Chat UI · Pipeline Viz · Settings · Onboarding         │
├─────────────────────────────────────────────────────────┤
│  BACKEND — Fastify 4 + TypeScript                       │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │          Pipeline Orchestrator (FSM)             │    │
│  │                                                  │    │
│  │  ┌────────┐    ┌────────┐    ┌───────┐          │    │
│  │  │ SCRIBE │ ──>│ PROTO  │ ──>│ TRACE │          │    │
│  │  │ idea→  │    │ spec→  │    │ code→ │          │    │
│  │  │ spec   │    │ code   │    │ tests │          │    │
│  │  └────────┘    └────────┘    └───────┘          │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  Auth · GitHub MCP Adapter · AI Service · Pipeline Stats │
├─────────────────────────────────────────────────────────┤
│  INFRA — PostgreSQL 16 · Drizzle ORM · Docker · Caddy   │
└─────────────────────────────────────────────────────────┘
```

### Agents

| Agent | Role | Input | Output |
|-------|------|-------|--------|
| **Scribe** | Business analyst — structures the idea | Free-text idea | Structured specification (markdown) |
| **Proto** | Builder — generates working code | Approved spec | MVP scaffold pushed to GitHub |
| **Trace** | Verifier — writes tests for the code | GitHub branch + code | Playwright test suite |

### Verification Chain

| Stage | Producer | Verifier | Method |
|-------|----------|----------|--------|
| Spec | Scribe | **Human** | Review & approve/reject in UI |
| Code | Proto | **Trace** | Reads real code from GitHub, writes tests |
| Tests | Trace | **Automated** | Tests execute automatically |

### MCP Integration

AKIS uses the **Model Context Protocol (MCP)** to interface with GitHub. The pipeline's `GitHubMCPAdapter` wraps a `callToolRaw` bridge, allowing agents (Proto and Trace) to perform GitHub operations — creating repos, pushing branches, opening PRs — through a standardized tool-calling interface rather than direct API calls. A parallel `GitHubRESTAdapter` provides a fallback path when MCP is unavailable.

This architecture decouples agent logic from the GitHub transport layer and aligns with emerging standards for AI-tool interoperability.

### Pipeline State Machine

```
scribe_clarifying → scribe_generating → awaiting_approval
                                              │
                                    ┌─────────┤
                                    │ approve  │ reject
                                    v          ↺
                             proto_building
                                    │
                                    v
                             trace_testing
                                    │
                              ┌─────┴──────┐
                              v            v
                          completed   completed_partial

Every stage → failed (3 retries, exponential backoff) | cancelled
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 7, Tailwind CSS 4, React Router 7 |
| **Backend** | Fastify 4, TypeScript 5.9 |
| **Database** | PostgreSQL 16, Drizzle ORM |
| **AI** | Anthropic Claude (claude-sonnet-4-6), OpenAI, OpenRouter |
| **Integration** | GitHub REST API + MCP (Model Context Protocol) adapter |
| **Auth** | JWT sessions, bcrypt, AES-256-GCM encryption, OAuth 2.0 |
| **Testing** | Vitest (unit), Playwright (E2E via Trace agent) |
| **Deploy** | Docker Compose, Caddy (auto-SSL), OCI ARM64 |

---

## Project Structure

```
devagents/
├── backend/                    Fastify 4 + TypeScript
│   └── src/
│       ├── pipeline/           Pipeline engine
│       │   ├── agents/         scribe/, proto/, trace/
│       │   ├── core/           PipelineOrchestrator, FSM, contracts
│       │   ├── adapters/       GitHubRESTAdapter, GitHubMCPAdapter
│       │   └── api/            pipeline.routes.ts
│       ├── api/                REST API routes (auth, github, settings)
│       ├── db/                 Drizzle ORM schema + migrations
│       └── services/           AI, auth, email services
├── frontend/                   React 19 + Vite 7 SPA
│   └── src/
│       ├── pages/              chat/, settings/, auth/, docs
│       ├── components/         chat/, onboarding/, ui/, pipeline/
│       ├── hooks/              usePipelineStream, useProfileCompleteness
│       └── services/api/       HTTP client, workflows, auth
├── deploy/                     Docker Compose, Caddy, deploy scripts
└── docs/                       Architecture & screenshots
```

---

## Getting Started

### Prerequisites

- **Node.js** 20+ and **pnpm** 9+
- **Docker** (for PostgreSQL)
- API key from Anthropic, OpenAI, or OpenRouter

### Setup

```bash
# Clone and enter
git clone https://github.com/OmerYasirOnal/akis-platform.git
cd akis-platform/devagents

# Start PostgreSQL
./scripts/db-up.sh

# Backend
cd backend
cp .env.example .env       # Configure your API keys
pnpm install
pnpm db:migrate
pnpm dev                   # http://localhost:3000

# Frontend (new terminal)
cd frontend
pnpm install
pnpm dev                   # http://localhost:5173
```

### Key Environment Variables

| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_API_KEY` | AI agent API calls |
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_JWT_SECRET` | Session token signing (min 32 chars) |
| `GITHUB_OAUTH_CLIENT_ID` / `SECRET` | GitHub OAuth login |
| `GOOGLE_OAUTH_CLIENT_ID` / `SECRET` | Google OAuth login |

See [`backend/.env.example`](backend/.env.example) for the full configuration reference.

---

## Development

### Quality Gate

Run before every commit:

```bash
# Backend
pnpm -C backend typecheck && pnpm -C backend lint && pnpm -C backend test:unit && pnpm -C backend build

# Frontend
pnpm -C frontend typecheck && pnpm -C frontend lint && pnpm -C frontend test && pnpm -C frontend build
```

### Commit Convention

```
feat(pipeline): add retry backoff strategy
fix(auth): handle expired OAuth tokens
chore(deps): update drizzle-orm to 0.38
docs(readme): update screenshots
```

---

## API Reference

### Pipeline

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/pipelines` | Start a new pipeline |
| `GET` | `/api/pipelines` | List pipeline history |
| `GET` | `/api/pipelines/:id` | Get pipeline status |
| `POST` | `/api/pipelines/:id/message` | Send message to Scribe |
| `POST` | `/api/pipelines/:id/approve` | Approve spec (triggers Proto) |
| `POST` | `/api/pipelines/:id/reject` | Reject spec (Scribe re-asks) |
| `POST` | `/api/pipelines/:id/retry` | Retry a failed stage |
| `DELETE` | `/api/pipelines/:id` | Cancel pipeline |

### GitHub

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/github/status` | Connection status |
| `GET` | `/api/github/repos` | List user repos |
| `POST` | `/api/github/repos` | Create a new repo |
| `POST` | `/api/github/connect` | Connect via PAT |

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/login/start` | Start login (email step) |
| `POST` | `/auth/login/complete` | Complete login (password step) |
| `GET` | `/auth/profile` | Current user profile |
| `PUT` | `/auth/profile` | Update profile |

---

## Security

| Area | Implementation |
|------|---------------|
| **Authentication** | JWT sessions with httpOnly, secure, sameSite cookies |
| **Passwords** | bcrypt with 10 salt rounds |
| **API Key Storage** | AES-256-GCM with authenticated encryption (AEAD) |
| **Rate Limiting** | 120 req/min global via fastify-rate-limit |
| **CORS** | Strict origin whitelist |
| **Headers** | Helmet (CSP, HSTS, X-Frame-Options, X-Content-Type-Options) |
| **SQL** | Parameterized queries via Drizzle ORM |
| **Error Handling** | Sanitized responses, no stack traces in production |

---

## Deployment

AKIS is deployed on a single OCI ARM64 VM using Docker Compose with Caddy for automatic TLS.

**Production**: [https://akisflow.com](https://akisflow.com)

```bash
./scripts/staging_deploy_manual.sh \
  --host <IP> --user ubuntu --key ~/.ssh/id_ed25519 --confirm
```

CI/CD runs on GitHub Actions — type-checking, linting, unit tests, and build verification on every push.

---

## Academic Context

AKIS is developed as a senior thesis project at **Fatih Sultan Mehmet Vakif University (FSMVU)**.

| | |
|---|---|
| **Student** | Omer Yasir Onal (2221221562) |
| **Advisor** | Dr. Nazli Dogan |
| **Thesis** | Knowledge Integrity & Agent Verification in AI-Assisted Software Development |
| **Deadline** | May 2026 |

The core thesis contribution is the **verification chain** — a multi-layered validation approach where each AI agent's output is verified by either a human reviewer or a downstream agent before progressing, ensuring knowledge integrity throughout the automated development pipeline.

---

## License

MIT — see [`LICENSE`](LICENSE) for details.
