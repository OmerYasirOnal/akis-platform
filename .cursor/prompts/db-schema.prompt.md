TASK: Define initial Drizzle schema and client.
LOCATION: 
- `backend/src/db/schema.ts`
- `backend/src/db/client.ts`

RULES & CONSTRAINTS:
1) PostgreSQL only; URL from `DATABASE_URL`.
2) Schema includes tables minimally required for agent jobs (jobs, runs, logs—names may vary).
3) Typed relations; avoid raw SQL unless justified.
4) Export a reusable typed client.

ACCEPTANCE CRITERIA:
- `schema.ts` and `client.ts` exist with correct exports.
- No Prisma artifacts or config in repo.
- No production SQLite usage.

OUT OF SCOPE:
- Migrations execution scripts (can be added later).
