# 07 – API Conventions (Fastify)

## MUST
- Routes live under `backend/src/api/*.ts`.
- **Zod** schemas for input/output validation per route.
- Routes delegate to orchestrator/services (no business logic in handlers).

## SHOULD
- Error handling returns typed errors; log state transitions.

## FORBIDDEN
- In-route DB/MCP orchestration logic.
- Sharing route handlers across domains without types.

## PASS / FAIL Heuristics
- ✅ Each route file exports a function that registers endpoints with Fastify.
- ✅ Zod parse before calling orchestration.
- ❌ Direct DB writes in route handler.
