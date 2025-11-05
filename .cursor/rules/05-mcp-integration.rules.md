# 05 – MCP Integration (Single Door Policy)

## MUST
- All external systems go through **MCP Client Adapters** under `backend/src/services/mcp/adapters/`.
- Required adapters: `GitHubMCPService`, `JiraMCPService`, `ConfluenceMCPService` (names reserved).
- Tokens/credentials are **obtained by Orchestrator** and **injected** into adapters.

## SHOULD
- Adapter methods are high-level (e.g., `commitFile`, `getIssue`, `createPage`).

## FORBIDDEN
- Octokit or direct REST SDK usage from agents/services not under `mcp/adapters/`.
- Storing secrets in global singletons.

## PASS / FAIL Heuristics
- ✅ Adapters reside in `services/mcp/adapters/`.
- ✅ Constructors accept tokens; no ambient globals.
- ❌ `import { Octokit }` or vendor SDK in agents.
