## Summary

Explain WHAT and WHY. Reference issues.



## AKIS Guard-Rails (Required)

- [ ] Modular Monolith preserved (no extra runtimes/services).

- [ ] Backend uses Fastify + TypeScript + Drizzle + PostgreSQL (no Prisma/Next/Nest).

- [ ] Frontend is React (Vite) + Tailwind SPA; no MCP/DB access from frontend.

- [ ] All external calls go through MCP adapters under `backend/src/services/mcp/adapters/`.

- [ ] Agents do not call each other; Orchestrator coordinates; tools injected (DI).

- [ ] FSM for agent jobs; Strategy/Command for playbooks; plan→execute→reflect used where needed.

- [ ] API routes have Zod schemas and delegate logic to orchestrator/services.

- [ ] Files comply with `03-directory-structure.rules.md`.



## Testing

- [ ] Unit tests cover Orchestrator state transitions / Factory creation (if touched).

- [ ] No live tokens/endpoints in tests.



## Screenshots / Notes

(Optional)

