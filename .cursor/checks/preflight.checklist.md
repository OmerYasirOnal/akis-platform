# Pre-Commit Preflight Checklist

- [ ] New file path matches mandated tree in `03-directory-structure.rules.md`.
- [ ] No agent↔agent imports; only Orchestrator coordinates.
- [ ] Backend uses Fastify + TypeScript + Drizzle + PostgreSQL (no Prisma/Next/Nest).
- [ ] Integrations only via MCP adapters (no Octokit/Jira SDK in agents).
- [ ] Orchestrator injects tools; agents are tool-agnostic.
- [ ] Any new route has Zod input/output schemas.
- [ ] No production SQLite usage.
- [ ] Tests isolate network and cover FSM transitions.
