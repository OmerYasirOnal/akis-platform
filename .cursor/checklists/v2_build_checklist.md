# v2 Build Checklist (DoD)
- [ ] Fastify server boots and `/api/health` returns `{ ok: true }`.
- [ ] Core contracts + FSM compile and unit test basic transitions.
- [ ] `AgentFactory` registry creates `ScribeAgent` successfully.
- [ ] `/api/agents/scribe/run` returns `success: true` with stub data.
- [ ] Drizzle configured, migrations run end-to-end on local Postgres.
- [ ] No Prisma anywhere. No Next.js backend routes.
- [ ] Project structure exactly matches workspace rules.
- [ ] Vitest installed; at least one smoke test passes.