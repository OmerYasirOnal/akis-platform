# TASK: Core agent engine placeholders

LOAD:
@.cursor/rules/rules.mdc
@.cursor/context/CONTEXT_SCOPE.md

WHAT
- Create under `backend/src/core/`:
  - `orchestrator/AgentOrchestrator.ts` (class shell, TODOs)
  - `agents/IAgent.ts`, `agents/BaseAgent.ts`, `agents/AgentFactory.ts`
  - `state/AgentStateMachine.ts`
  - `contracts/AgentContract.ts`, `contracts/AgentPlaybook.ts`

RULES
- Factory + Registry required; no direct agent instantiation outside the factory.
- FSM states: pending, running, completed, failed.

EXPECTED COMMIT
`feat(core): scaffold orchestrator, factory/registry, FSM, and contracts`
