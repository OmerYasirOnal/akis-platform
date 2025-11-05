# 06 – Database & Persistence

## MUST
- **Drizzle** schema at `backend/src/db/schema.ts`.
- Drizzle client at `backend/src/db/client.ts`.
- PostgreSQL as the database engine.

## SHOULD
- Typed queries via Drizzle; wrap raw SQL sparingly with justification.

## FORBIDDEN
- Prisma artifacts.
- Production writes to SQLite.

## PASS / FAIL Heuristics
- ✅ Imports from `db/client` and `db/schema`.
- ❌ Any `node_modules/@prisma/*` or `schema.prisma`.
- ❌ `better-sqlite3` used in production code paths.
