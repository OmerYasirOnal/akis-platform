TASK: Add a new MCP Client Adapter (e.g., `GitHubMCPService`).
LOCATION: `backend/src/services/mcp/adapters/<ServiceName>.ts`

RULES & CONSTRAINTS:
1) High-level methods only (e.g., `commitFile`, `getIssue`) — no low-level REST SDKs.
2) Receive tokens/config via constructor (injected by Orchestrator).
3) No global singletons with secrets.
4) Keep types/interfaces local; no agent imports.

ACCEPTANCE CRITERIA:
- Adapter resides under `services/mcp/adapters/`.
- Public methods are side-effectful wrappers ready for orchestration.
- No `Octokit`/vendor SDK import outside MCP layer.

OUT OF SCOPE:
- Direct usage in routes/agents here (that belongs to Orchestrator).
