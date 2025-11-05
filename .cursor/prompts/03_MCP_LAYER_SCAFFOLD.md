# TASK: Services layer (HTTP + MCP + AIService) placeholders

LOAD:
@.cursor/rules/rules.mdc
@.cursor/checklists/Security.md

WHAT
- In `backend/src/services/`:
  - `http/HttpClient.ts` (thin wrapper; timeout/backoff hooks)
  - `mcp/adapters/GitHubMCPService.ts`
  - `mcp/adapters/JiraMCPService.ts`
  - `mcp/adapters/ConfluenceMCPService.ts`
  - `mcp/ai/AIService.ts` (interfaces: plan(), reflect())
- Agents:
  - `backend/src/agents/scribe/ScribeAgent.ts`
  - `backend/src/agents/trace/TraceAgent.ts`
  - `backend/src/agents/proto/ProtoAgent.ts`
  (extend BaseAgent; signatures only)
- API:
  - `backend/src/api/agents.ts` stubs: submit job / get status → 501.

EXPECTED COMMIT
`feat(services): add MCP adapters and AIService interfaces; agents shells and API stubs`
