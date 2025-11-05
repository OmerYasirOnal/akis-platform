# 03 – Directory Structure (MANDATORY)

akis-platform/
├── backend/
│ ├── src/
│ │ ├── core/
│ │ │ ├── orchestrator/ (AgentOrchestrator.ts)
│ │ │ ├── agents/ (IAgent.ts, BaseAgent.ts, AgentFactory.ts)
│ │ │ ├── state/ (AgentStateMachine.ts)
│ │ │ └── contracts/ (AgentContract.ts, AgentPlaybook.ts)
│ │ ├── agents/
│ │ │ ├── scribe/ (ScribeAgent.ts)
│ │ │ ├── trace/
│ │ │ └── proto/
│ │ ├── services/
│ │ │ ├── http/ (HttpClient.ts)
│ │ │ └── mcp/
│ │ │ ├── adapters/ (GitHubMCPService.ts, JiraMCPService.ts, ...)
│ │ │ └── ai/ (AIService.ts - Planner, Reflector)
│ │ ├── api/ (Fastify routes, e.g., agents.ts)
│ │ ├── db/ (schema.ts, client.ts)
│ │ └── server.ts
├── frontend/
│ └── src/ (components/, hooks/, pages/, services/)

## MUST
- New files live only within the above boundaries.
- Single Orchestrator file and single AgentFactory file at the paths shown.

## FORBIDDEN
- Agents under arbitrary folders.
- Services outside `services/http` or `services/mcp`.

## PASS / FAIL Heuristics
- ✅ New module matches a node in this tree.
- ❌ Creating `backend/src/integrations/github/*` (use `services/mcp/adapters/`).
