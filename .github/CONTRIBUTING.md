# Contributing — AKIS v2

- Work ONLY on branch `v2-fastify-architecture`.

- Use Conventional Commits: `type(scope): subject`

- Scopes: backend | frontend | core | agents | services | api | db | infra | docs

- Commit with `.gitmessage-akis.txt` template for guard-rails checklist.



## Quick Rules

- No Prisma, Next.js API Routes, NestJS, direct REST SDKs. Use MCP adapters only.

- Orchestrator injects tools; agents never depend on SDKs directly.

- Keep repo tree as in `.cursor/rules/03-directory-structure.rules.md`.

- Add Zod schemas for every new API route.

