TASK: <One clear deliverable, e.g., "Create the `X` class">
LOCATION: <Exact repo path, e.g., `backend/src/.../X.ts`>

RULES & CONSTRAINTS:
1) Follow AKIS non-negotiables (Monolith, Fastify+TS+Drizzle+PostgreSQL, MCP adapters).
2) Do NOT instantiate external services directly inside agents; tools are injected by the Orchestrator.
3) Keep files within mandated directory structure (`.cursor/rules/03-directory-structure.rules.md`).
4) No direct REST SDKs (Octokit/Jira/Confluence); use MCP Client Adapters.
5) No Prisma, no Next/Nest API routes.

ACCEPTANCE CRITERIA:
- File created at LOCATION with correct name/exports.
- References respect DI and MCP boundaries.
- No architecture/pattern violations.

OUT OF SCOPE:
- No unrelated scaffolding or secondary features.
