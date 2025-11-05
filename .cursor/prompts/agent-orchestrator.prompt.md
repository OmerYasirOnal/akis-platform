TASK: Create the `AgentOrchestrator` class.
LOCATION: `backend/src/core/orchestrator/AgentOrchestrator.ts`

RULES & CONSTRAINTS:
1) Orchestrator is the single coordinator; agents never call each other.
2) Use `AgentFactory` (`../agents/AgentFactory.ts`) to get agent instances; no direct `new Agent()`.
3) Manage lifecycle via FSM (`../state/AgentStateMachine.ts`): pending → running → completed|failed.
4) Inject Tools at runtime: MCP Adapters under `src/services/mcp/adapters/` and `AIService` under `src/services/mcp/ai/`.
5) If agent playbook requires planning: call Planner first, then execute, then Reflector.
6) Persist job state via Drizzle client in `src/db/`.
7) Keep file-local concerns only; no route logic here.

ACCEPTANCE CRITERIA:
- Imports reference Factory, FSM, MCP adapters, AIService via proper paths.
- No agent-to-agent imports.
- Public API exposes “submitJob/executeJob/getStatus” (names may vary but intent must match).

OUT OF SCOPE:
- HTTP routes, UI, or direct REST SDK usage.
