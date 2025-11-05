# AKIS .cursor Guard-Rails

**Purpose**  
These guard-rails hard-enforce the AKIS architecture and tech constraints for every new file, folder, and feature.

**Canonical Sources**  
- `CONTEXT_ARCHITECTURE.md`  
- `CONTEXT_SCOPE.md`

**How to use**  
Before adding or moving files, open `.cursor/rules/*` and check ✅ MUST / ❌ FORBIDDEN.  
Run through `.cursor/checks/preflight.checklist.md` before each commit.

**Non-Negotiables (summary)**  
- Modular Monolith with a central **AgentOrchestrator**.  
- Backend: **Fastify + TypeScript + Drizzle + PostgreSQL**.  
- Frontend: **React (Vite) + Tailwind** SPA (decoupled).  
- External services via **MCP Client Adapters** (no direct REST SDKs).  
- Agents: **Factory & Registry**, lifecycle **FSM**, **Strategy/Command** for playbooks, **plan → execute → reflect** pattern, DI from Orchestrator.
