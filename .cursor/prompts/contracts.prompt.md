TASK: Create agent contracts.
LOCATION:
- `backend/src/core/contracts/AgentContract.ts`
- `backend/src/core/contracts/AgentPlaybook.ts`

RULES & CONSTRAINTS:
1) Contracts define WHAT, not HOW. Types/interfaces only.
2) AgentContract exposes minimal operations (e.g., `init(tools)`, `plan?(input)`, `execute(input)`, `reflect?(output)`).
3) AgentPlaybook encodes Strategy/Command steps and flags like `requires_planning`.
4) No business logic; no imports from agents or services; type-only imports allowed.

ACCEPTANCE CRITERIA:
- Two files exist at LOCATION with exported types/interfaces.
- `requires_planning` present in playbook shape.
- No runtime code or external SDKs.

OUT OF SCOPE:
- Concrete implementations.
