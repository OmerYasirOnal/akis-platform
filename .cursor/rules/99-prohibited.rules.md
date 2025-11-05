# 99 – Prohibited (and What to Do Instead)

- ❌ **Next.js API Routes / NestJS / Server Actions**  
  ✅ Use Fastify routes in `backend/src/api/`.

- ❌ **Prisma**  
  ✅ Use **Drizzle** with PostgreSQL; define schema in `db/schema.ts`.

- ❌ **Direct REST SDKs** (Octokit/Jira/Confluence) outside MCP adapters  
  ✅ Implement/extend an MCP adapter in `services/mcp/adapters/` and inject via Orchestrator.

- ❌ **Agent-to-Agent calls/imports**  
  ✅ All coordination through `AgentOrchestrator`.

- ❌ **Multiple processes / microservices**  
  ✅ Keep Modular Monolith; add modules, not services.

- ❌ **Secrets in global singletons**  
  ✅ Fetch in Orchestrator; pass via constructors or DI.
