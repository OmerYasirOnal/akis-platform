<p align="center">
  <img src="frontend/src/assets/branding/akis-mark-512.png" alt="AKIS Logo" width="100" />
</p>

<h1 align="center">AKIS Platform</h1>

<p align="center">
  <strong>AI Agent Workflows Engine for Software Development</strong><br/>
  Fikrinizi anlatın — spec, kod ve testler otomatik oluşturulsun.
</p>

<p align="center">
  <a href="https://akisflow.com"><img src="https://img.shields.io/badge/demo-akisflow.com-07D1AF?style=for-the-badge" alt="Demo" /></a>
  <img src="https://img.shields.io/badge/version-0.2.0-blue?style=for-the-badge" alt="Version" />
  <img src="https://img.shields.io/github/actions/workflow/status/OmerYasirOnal/akis-platform/ci.yml?style=for-the-badge&label=CI" alt="CI" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Fastify-4-black?logo=fastify" alt="Fastify" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Claude-Sonnet_4.6-D97757?logo=anthropic" alt="Claude" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License" />
</p>

---

## What is AKIS?

AKIS is an open-source AI agent orchestration platform that transforms natural language ideas into working software projects through a verified, multi-agent pipeline.

```
Your Idea  →  Scribe (spec)  →  Human Approval  →  Proto (code)  →  Trace (tests)  →  Working Project
```

Each stage produces verified output — Scribe's spec is approved by humans, Proto's code is verified by Trace, and Trace's tests run automatically. This **Knowledge Integrity** chain ensures quality at every step.

---

## Screenshots

<p align="center">
  <img src="docs/screenshots/01-landing.png" alt="Landing Page" width="720" /><br/>
  <em>Landing Page — "Fikirden Koda, Dakikalar İçinde"</em>
</p>

<p align="center">
  <img src="docs/screenshots/02-chat-pipeline.png" alt="Chat & Pipeline" width="720" /><br/>
  <em>Chat Interface — Scribe clarification, spec review, real-time progress</em>
</p>

<p align="center">
  <img src="docs/screenshots/03-pipeline-result.png" alt="Pipeline Result" width="720" /><br/>
  <em>Pipeline Result — Generated files, test coverage, GitHub integration</em>
</p>

---

## Key Features

| Feature | Description |
|---------|-------------|
| **Sequential Agent Pipeline** | Scribe → Human Gate → Proto → Trace |
| **Real-time Streaming** | SSE-powered live agent activity feed |
| **GitHub Integration** | Auto repo creation, branch, commit, PR |
| **Welcome Wizard** | Animated 3-step onboarding for new users |
| **Profile Setup** | 4-step wizard: profile, GitHub, AI key, preferences |
| **Pipeline Stats** | Dashboard with success rate, agent durations, history |
| **Multi-provider AI** | Anthropic, OpenAI, OpenRouter support |
| **OAuth Login** | GitHub + Google authentication |
| **Turkish + English** | Fully localized UI |

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
│  │  │ SCRIBE │ →  │ PROTO  │ →  │ TRACE │          │    │
│  │  │ idea→  │    │ spec→  │    │ code→ │          │    │
│  │  │ spec   │    │ code   │    │ tests │          │    │
│  │  └────────┘    └────────┘    └───────┘          │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  Auth · GitHub API · AI Service · Pipeline Stats        │
├─────────────────────────────────────────────────────────┤
│  INFRA — PostgreSQL 16 · Drizzle ORM · Docker · Caddy   │
└─────────────────────────────────────────────────────────┘
```

### Pipeline FSM

```
scribe_clarifying → scribe_generating → awaiting_approval
                                              │
                                    ┌─────────┤
                                    │ approve  │ reject
                                    ▼          ↺
                             proto_building
                                    │
                                    ▼
                             trace_testing
                                    │
                              ┌─────┴──────┐
                              ▼            ▼
                          completed   completed_partial

Every stage → failed (3 retries, backoff) | cancelled
```

### Verification Chain

| Stage | Producer | Verifier | Method |
|-------|----------|----------|--------|
| Spec | Scribe | **Human** | Review & approve/reject in UI |
| Code | Proto | **Trace** | Reads real code from GitHub, writes tests |
| Tests | Trace | **Automated** | Playwright tests execute automatically |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 7, Tailwind CSS 4, React Router 7 |
| **Backend** | Fastify 4, TypeScript 5.9 |
| **Database** | PostgreSQL 16, Drizzle ORM |
| **AI** | Anthropic Claude API (claude-sonnet-4-6), OpenAI, OpenRouter |
| **Integration** | GitHub REST API (OAuth + PAT) |
| **Auth** | JWT sessions, bcrypt, AES-256-GCM encryption, OAuth 2.0 |
| **Testing** | Vitest (1576 unit tests), Playwright (E2E by Trace) |
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
│       │   ├── adapters/       GitHubRESTAdapter
│       │   └── api/            pipeline.routes.ts, pipeline.plugin.ts
│       ├── api/                REST API (auth, github, settings, health)
│       ├── db/                 Drizzle ORM schema + migrations
│       └── services/           AI, auth, email services
├── frontend/                   React 19 + Vite 7 SPA
│   └── src/
│       ├── pages/              chat/, settings/, auth/, LandingPage, DocsPage
│       ├── components/         chat/, onboarding/, ui/, pipeline/
│       ├── hooks/              usePipelineStream, useProfileCompleteness
│       └── services/api/       HttpClient, workflows, auth
├── deploy/                     Docker Compose, Caddy, deploy scripts
└── docs/                       Architecture & API documentation
```

---

## Getting Started

### Prerequisites

- Node.js 22+ and pnpm 9+
- Docker & Docker Compose
- Anthropic API key (or OpenAI/OpenRouter)

### Quick Start

```bash
git clone https://github.com/OmerYasirOnal/akis-platform.git
cd akis-platform/devagents

# Start database
./scripts/db-up.sh

# Backend
cd backend
cp .env.example .env       # Configure API keys
pnpm install && pnpm dev   # → http://localhost:3000

# Frontend (separate terminal)
cd frontend
pnpm install && pnpm dev   # → http://localhost:5173
```

Open `http://localhost:5173` in your browser.

### Environment Variables

See [`backend/.env.example`](backend/.env.example) for the full list. Key variables:

| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_API_KEY` | AI agent API calls |
| `DATABASE_URL` | PostgreSQL connection |
| `AUTH_JWT_SECRET` | Session token signing (min 32 chars) |
| `GITHUB_OAUTH_CLIENT_ID/SECRET` | GitHub login |
| `GOOGLE_OAUTH_CLIENT_ID/SECRET` | Google login |

---

## Development

```bash
# Quality gate (run before committing)
pnpm -C backend typecheck && pnpm -C backend lint && pnpm -C backend test:unit && pnpm -C backend build
pnpm -C frontend typecheck && pnpm -C frontend lint && pnpm -C frontend test && pnpm -C frontend build
```

### Commit Convention

```
feat(scope): description    # New feature
fix(scope): description     # Bug fix
chore(scope): description   # Maintenance
docs(scope): description    # Documentation
```

---

## Security

- **Authentication**: JWT sessions with httpOnly secure cookies
- **Password**: bcrypt with 10 salt rounds
- **Encryption**: AES-256-GCM for API keys and OAuth tokens
- **Rate Limiting**: 120 req/min global
- **CORS**: Whitelist-based origin validation
- **Headers**: Helmet (CSP, HSTS, X-Frame-Options, nosniff)
- **SQL**: Parameterized queries via Drizzle ORM (no raw SQL)
- **Errors**: Sanitized responses, no stack trace leakage

---

## Deployment

AKIS runs on a single OCI ARM64 VM with Docker Compose + Caddy (auto-SSL).

**Live**: [https://akisflow.com](https://akisflow.com)

```bash
# Manual deploy
./scripts/staging_deploy_manual.sh \
  --host 141.147.25.123 --user ubuntu --key ~/.ssh/id_ed25519 --confirm
```

---

## Academic Context

AKIS is developed as a senior thesis project at Fatih Sultan Mehmet Vakif University (FSMVU).

- **Student**: Omer Yasir Onal (2221221562)
- **Advisor**: Dr. Nazli Dogan
- **Thesis**: Knowledge Integrity & Agent Verification in AI-Assisted Software Development
- **Deadline**: May 1, 2026

---

## License

MIT — see [`LICENSE`](LICENSE) for details.
