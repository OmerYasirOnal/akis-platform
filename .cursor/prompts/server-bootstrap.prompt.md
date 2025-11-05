TASK: Create Fastify server bootstrap.
LOCATION: `backend/src/server.ts`

RULES & CONSTRAINTS:
1) Bootstrap a Fastify instance and register routes from `src/api/*`.
2) Read runtime config from `process.env` (no hard-coded secrets).
3) Do not implement business logic here; just start the HTTP server and wire routes.
4) Keep module lightweight (OCI Free Tier friendly).

ACCEPTANCE CRITERIA:
- Exports a start function or starts when executed.
- Uses only Fastify; no Next/Nest/Prisma.
- Uses TypeScript.

OUT OF SCOPE:
- Route handlers’ business logic (delegated to orchestrator/services).
