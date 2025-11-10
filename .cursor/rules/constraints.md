---
description: "Hard Constraints & Invariants"
globs:
  - "**/*"
alwaysApply: true
---

# HARD CONSTRAINTS
- Backend: **Fastify + TypeScript (strict)**, DB: **PostgreSQL**, ORM: **Drizzle**.
- **pnpm** tek lockfile: `pnpm-lock.yaml` (repo kökü). Alt lockfile YASAK.
- **No Prisma**, **No Next.js (backend)**, **No yarn/npm lock**.
- CI yeşil kapı: `typecheck`, `lint`, `build`, `test`.
- Güvenlik eklentileri: `@fastify/helmet`, `@fastify/cors`, `@fastify/rate-limit` (prod’da açık).
- Her yeni backend özelliğine **en az 1 test** (fastify.inject).