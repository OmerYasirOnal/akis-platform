TASK: Create the Agent State Machine (FSM).
LOCATION: `backend/src/core/state/AgentStateMachine.ts`

RULES & CONSTRAINTS:
1) States: `pending` → `running` → `completed | failed`.
2) Provide typed guards/events; export a minimal driver used by Orchestrator.
3) No side-effects here (no DB/HTTP). Pure transition logic.

ACCEPTANCE CRITERIA:
- File exports types for states/events and a small transition utility.
- No external services or SDKs.

OUT OF SCOPE:
- Persistence and logging.
