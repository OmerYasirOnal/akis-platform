# AKIS — Claude Code Project Memory

## Mission

Work autonomously: execute end-to-end without asking questions or requiring plan approval.
Primary goal: keep the repo green (frontend + backend dev, build, typecheck, tests).
Secondary goal: incremental product quality improvements.

## Repo Layout

```
devagents/
├── frontend/     React 19 + Vite 7 SPA (Tailwind 4, React Router 7)
├── backend/      Fastify 4 + TypeScript backend (Drizzle ORM, PostgreSQL)
├── mcp-gateway/  MCP adapter layer
├── scripts/      Local dev helpers (DB, etc.)
└── docs/         Product + architecture references
```

## Architecture Constraints

- **Backend**: Fastify + TypeScript, PostgreSQL + Drizzle. No Express, NestJS, Prisma, Next.js.
- **Frontend**: React SPA + Vite. No SSR frameworks.
- **Integrations**: External systems MUST go through MCP adapters (no direct vendor SDKs).
- **Agents**: Orchestrator controls lifecycle; agents never call each other.
  - Tools injected by orchestrator; agents do NOT instantiate DB/MCP clients.
  - Factory + Registry for agent creation (`AgentFactory.register`).
  - Persisted FSM: `pending → running → completed|failed`.
  - Complex agents: planner → execute steps → reflect/critique.

## Canonical Commands

### Frontend (`pnpm -C frontend`)

| Task | Command |
|------|---------|
| Dev server | `pnpm -C frontend dev` |
| Build | `pnpm -C frontend build` |
| Typecheck | `pnpm -C frontend typecheck` |
| Lint | `pnpm -C frontend lint` |
| Test | `pnpm -C frontend test` |
| Format | `pnpm -C frontend format` |

### Backend (`pnpm -C backend`)

| Task | Command |
|------|---------|
| Dev server | `pnpm -C backend dev` |
| Build | `pnpm -C backend build` |
| Typecheck | `pnpm -C backend typecheck` |
| Lint | `pnpm -C backend lint` |
| Unit tests | `pnpm -C backend test:unit` |
| Integration tests | `pnpm -C backend test:integration` |
| DB migrate | `pnpm -C backend db:migrate` |
| DB studio | `pnpm -C backend db:studio` |
| Format | `pnpm -C backend format` |

### Database

| Task | Command |
|------|---------|
| Start PostgreSQL | `./scripts/db-up.sh` |

## UI/UX Direction

- Preserve "liquid-glass / frosted surfaces" theme.
- Reduce harsh pure-white; use neutral/tinted surfaces from design tokens.
- Key CSS tokens: `bg-white/[0.03]`, `backdrop-blur-sm`, `border-white/[0.06]`.
- Theme vars: `--ak-bg`, `--ak-surface`, `--ak-surface-2`, `--ak-primary`, `--ak-text-primary`, `--ak-text-secondary`.

## Logging Rules

- No spam on polling endpoints (`/api/agents/jobs/running`, `/health`, `/ready`).
- Use `request.routeOptions?.url` (not deprecated `request.routerPath`).
- Meaningful logs only: job lifecycle, step events, validation errors.

## Model Policy (Agent AI)

Users choose model per agent. Centralize allowed models in one config.
- Default: `gpt-5-mini` (balanced)
- Cheap: `gpt-4o-mini`
- Escalation: `gpt-5.2`

## Commit Conventions

- Prefix: `feat()`, `fix()`, `refactor()`, `docs()`, `chore()`
- Co-author: `Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>`
- Logical chunks, not monolithic dumps.

## Guardrails

- Never silence errors by disabling lint rules unless fully justified.
- Minimal code comments (only non-obvious logic).
- Prefer small, correct, readable changes.
- Always run typecheck + build before committing.
