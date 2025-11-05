TASK: Create the `AgentFactory` (Factory + Registry).
LOCATION: `backend/src/core/agents/AgentFactory.ts`

RULES & CONSTRAINTS:
1) Implement Factory & Registry patterns; map agentType → concrete agent constructor.
2) Singleton; expose `getInstance()` or equivalent.
3) No tool/service creation inside agents; only pass dependencies later via Orchestrator.
4) Registry must include: `ScribeAgent`, `TraceAgent`, `ProtoAgent` (paths under `backend/src/agents/...`).
5) Throw explicit error on unknown agentType.

ACCEPTANCE CRITERIA:
- Central create method: `create(agentType: string)` (or discriminated union).
- No direct MCP/DB/HTTP logic.
- File path and exports match LOCATION.

OUT OF SCOPE:
- Agent implementations themselves.
