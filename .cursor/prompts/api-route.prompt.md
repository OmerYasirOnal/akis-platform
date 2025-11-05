TASK: Create a Fastify route module for agents.
LOCATION: `backend/src/api/agents.ts`

RULES & CONSTRAINTS:
1) Register routes on a provided Fastify instance.
2) Validate input/output with Zod schemas.
3) Delegate business logic to Orchestrator/services; no DB/MCP calls in handlers.
4) Keep HTTP-only concerns here.

ACCEPTANCE CRITERIA:
- Exports a function that registers routes.
- Zod validation present before calling Orchestrator.
- Directory and file name match LOCATION.

OUT OF SCOPE:
- Orchestrator or DB logic inside handlers.
