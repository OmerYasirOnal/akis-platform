# TASK: Backend scaffold (Fastify + Drizzle)

LOAD:
@.cursor/rules/rules.mdc
@.cursor/checklists/Performance.md
@.cursor/context/CONTEXT_ARCHITECTURE.md

WHAT
- Create `backend/` package with TS.
- Files:
  - `src/server.ts` (Fastify bootstrap)
  - `src/api/health.ts`, `src/api/agents.ts` (routes; agents returns 501)
  - `src/db/schema.ts` (jobs: id, type, state, payload JSON, createdAt, updatedAt)
  - `src/db/client.ts` (Drizzle client)
  - `drizzle.config.ts`, migrations/
  - `package.json` scripts: dev, build, start, lint, typecheck
  - tsconfig, eslint, prettier

EXPECTED COMMIT
`feat(backend): scaffold Fastify server with Drizzle setup`
