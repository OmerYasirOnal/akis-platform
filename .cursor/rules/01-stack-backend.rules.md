# 01 – Backend Stack

## MUST
- **Fastify** server at `backend/src/server.ts`.
- **TypeScript** for all backend sources.
- **Drizzle ORM** with **PostgreSQL**.
- HTTP utilities under `backend/src/services/http/`.

## SHOULD
- Fastify plugins/modules kept small; prefer composition over inheritance.
- Zod for request/response validation (see API rules).

## FORBIDDEN
- Next.js API Routes, NestJS controllers.
- **Prisma** (ORM) anywhere.
- SQLite/MySQL for production (PostgreSQL is mandatory).

## WHY
- Fast startup, low memory, type-safe queries; consistent governance.

## PASS / FAIL Heuristics
- ✅ `server.ts` boots a Fastify app.
- ✅ `db/` uses Drizzle schema & client.
- ❌ `import { PrismaClient }` detected.
- ❌ Any Next/Nest server artifacts in backend.
