# 02 – Frontend Stack

## MUST
- **React (Vite)** SPA in `frontend/`.
- **Tailwind CSS** as the styling system.
- Frontend consumes backend **HTTP API** only.

## SHOULD
- Keep API calls encapsulated in `frontend/src/services/`.
- Use RTK Query/SWR or lightweight fetch wrappers (no tight backend coupling).

## FORBIDDEN
- SSR/ISR (Next.js), Server Actions.
- Direct DB or MCP access from the frontend.

## WHY
- Decoupling preserves modularity and reduces hosting costs; security boundary is backend.

## PASS / FAIL Heuristics
- ✅ `frontend` has Vite config and Tailwind setup.
- ❌ Frontend imports server secrets or DB clients.
- ❌ Any MCP adapter usage inside frontend code.
