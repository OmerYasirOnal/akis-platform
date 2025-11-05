# Typical Violations and Fixes

❌ `backend/src/services/github/GitHubService.ts` using Octokit  
✅ `backend/src/services/mcp/adapters/GitHubMCPService.ts` with token injection

❌ `backend/src/agents/proto/ProtoAgent.ts` imports `ScribeAgent`  
✅ ProtoAgent communicates via Orchestrator only

❌ `backend/src/api/agents.ts` writes to DB and calls GitHub directly  
✅ Route validates with Zod, then calls Orchestrator; DB & MCP are in services

❌ `backend/src/serverless/index.ts` creating a second runtime  
✅ Keep single Fastify runtime in `backend/src/server.ts`
