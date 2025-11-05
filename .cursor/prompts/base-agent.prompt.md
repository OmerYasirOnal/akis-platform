TASK: Create base agent interfaces and abstract base.
LOCATION:
- `backend/src/core/agents/IAgent.ts`
- `backend/src/core/agents/BaseAgent.ts`

RULES & CONSTRAINTS:
1) IAgent aligns with AgentContract; uses generics for input/output.
2) BaseAgent holds shared wiring: id, name, playbook ref, and DI hook for tools (MCP/AI/Http).
3) No direct creation of adapters; only typed fields/placeholders for injected tools.
4) No cross-agent imports.

ACCEPTANCE CRITERIA:
- Interfaces exported; BaseAgent is abstract; no SDK usage.
- Fits directory and naming rules.

OUT OF SCOPE:
- Concrete Scribe/Trace/Proto logic.
