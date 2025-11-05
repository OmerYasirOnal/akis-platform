# 00 – Architecture (NON-NEGOTIABLE)

## MUST
- **Modular Monolith** backend in a single deployable process.
- Central **AgentOrchestrator** coordinates agents; agents **never** call each other directly.
- Agent job lifecycle uses **FSM**: `pending → running → completed | failed`.

## SHOULD
- Keep process/plugins lightweight for OCI Free Tier (low CPU/RAM).
- Feature boundaries align to `core/`, `agents/`, `services/`, `api/`, `db/`.

## FORBIDDEN
- Splitting into microservices or extra long-lived processes.
- Direct agent-to-agent imports or calls.

## WHY
- Minimizes memory/CPU, reduces complexity, enforces a single source of truth for orchestration.

## PASS / FAIL Heuristics
- ✅ No new runtime/process beyond the Fastify server.
- ✅ Orchestrator exists at `backend/src/core/orchestrator/AgentOrchestrator.ts`.
- ❌ Any import between `backend/src/agents/*` modules (agent↔agent).
- ❌ New service manager that bypasses Orchestrator or FSM.
