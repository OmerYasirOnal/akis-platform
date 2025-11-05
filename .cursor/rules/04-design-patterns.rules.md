# 04 – Design Patterns (Agents & Core)

## MUST
- **Factory & Registry** for agent creation (`core/agents/AgentFactory.ts`).
- **Orchestrator** manages agent lifecycles and tool injection.
- **FSM** for job states.
- **Strategy/Command** for AgentPlaybook execution.
- **Planner** + **Reflector** (plan → execute → reflect) for complex agents via `services/mcp/ai/AIService.ts`.

## SHOULD
- Agents expose contract-driven methods (see contracts/).

## FORBIDDEN
- Agents instantiating tools/adapters by themselves.
- Cross-agent method calls.

## Evidence Table
| Pattern | Where | Evidence |
|---|---|---|
| Factory/Registry | `core/agents/AgentFactory.ts` | Registry map of agent types; no `new` in orchestrator except factory use |
| Orchestrator | `core/orchestrator/AgentOrchestrator.ts` | Receives job, picks agent via factory, injects tools |
| FSM | `core/state/AgentStateMachine.ts` | Transitions pending→running→completed/failed |
| Strategy/Command | `core/contracts/AgentPlaybook.ts` | Commands/steps executed per strategy |
| Plan→Execute→Reflect | `services/mcp/ai/AIService.ts` | Planner & critique tool calls |

## PASS / FAIL Heuristics
- ✅ Orchestrator injects MCP adapters/AIService into agent ctor or init.
- ❌ `new GitHubMCPService()` inside agent code.
- ❌ Agent importing another agent’s class.
