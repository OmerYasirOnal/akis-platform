# AKIS Platform

**AI Agent Workflow Engine** — Automate repetitive software development tasks with autonomous agents.

AKIS Platform orchestrates AI-powered agents that handle documentation updates, test generation, and MVP prototyping—so developers can focus on what matters.

---

## Features

- **Scribe** — Automatically updates technical documentation when code changes
- **Trace** — Generates test cases from specifications and code analysis  
- **Proto** — Rapid MVP prototyping with AI assistance

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Fastify + TypeScript (Node 20+) |
| Database | PostgreSQL + Drizzle ORM |
| Frontend | React + Vite + Tailwind CSS |
| Integrations | MCP (Model Context Protocol) adapters |

---

## Quickstart

### Prerequisites

- Node.js ≥ 20
- PostgreSQL
- Docker (for MCP Gateway)
- pnpm

### 1. Clone and Install

```bash
git clone https://github.com/OmerYasirOnal/akis-platform-devolopment.git
cd akis-platform-devolopment/devagents
pnpm install
```

### 2. Environment Setup

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your database URL and API keys

# Frontend (optional)
cp frontend/.env.example frontend/.env
```

### 3. Database Setup

```bash
./scripts/db-up.sh
pnpm -C backend db:migrate
```

### 4. Start Development

```bash
# Terminal 1: Backend
pnpm -C backend dev

# Terminal 2: Frontend
pnpm -C frontend dev
```

- Backend: http://localhost:3000
- Frontend: http://localhost:5173

---

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend   │────▶│  MCP Gateway│
│  (React)    │     │  (Fastify)  │     │  (GitHub)   │
└─────────────┘     └──────┬──────┘     └─────────────┘
                          │
                    ┌─────▼─────┐
                    │ PostgreSQL │
                    └───────────┘
```

**Key flows:**
- User configures agent → Backend creates job → MCP Gateway executes GitHub operations
- Real-time job status via SSE streaming
- OAuth integration for GitHub/Atlassian

---

## Documentation

| Topic | Link |
|-------|------|
| Getting Started | [docs/DEV_SETUP.md](docs/DEV_SETUP.md) |
| API Specification | [backend/docs/API_SPEC.md](backend/docs/API_SPEC.md) |
| Agent Workflows | [backend/docs/AGENT_WORKFLOWS.md](backend/docs/AGENT_WORKFLOWS.md) |
| MCP Setup | [docs/GITHUB_MCP_SETUP.md](docs/GITHUB_MCP_SETUP.md) |
| Environment Variables | [docs/ENV_SETUP.md](docs/ENV_SETUP.md) |

---

## Security

- **Never commit secrets** — Use `.env.local` for sensitive values
- **API keys are masked** — UI displays only last 4 characters
- **Session-based auth** — HttpOnly, Secure, SameSite cookies

For security policy and reporting vulnerabilities, see [SECURITY.md](SECURITY.md).

---

## Contributing

1. Read [CONTRIBUTING.md](CONTRIBUTING.md) and [.cursor/rules/rules.mdc](.cursor/rules/rules.mdc)
2. Use conventional commits: `feat:`, `fix:`, `docs:`, `chore:`
3. Ensure CI passes: `pnpm -r typecheck && pnpm -r lint && pnpm -r test`

---

## License

MIT License — see [LICENSE](LICENSE)

---

## Status

| Phase | Status | Description |
|-------|--------|-------------|
| 0.1–0.4 | ✅ Complete | Foundations, Web Shell |
| 0.5 | ✅ Complete | GitHub Integration |
| 1.0 | 🔄 In Progress | Scribe MVP, Quality Scoring, AI Provider UX |

**Current milestone:** Sprint 3 — Scribe MVP with quality persistence and multi-model support
