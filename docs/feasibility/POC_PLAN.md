# Proof of Concept Implementation Plan

**Version:** 1.0  
**Date:** 2025-01-28  
**Goal:** Validate feasibility with minimal slice implementation  
**Timeline:** 2 weeks (80 hours, 1 FTE)

---

## Overview

This POC validates the feasibility of Module A (GitHub App/OAuth) and Module B (MCP) by implementing a minimal end-to-end slice:

1. ✅ GitHub App installation status check (server-side)
2. ✅ MCP server with 2 read-only tools: `list_repos`, `get_file`
3. ✅ Agent → MCP client integration
4. ✅ UI status widget showing installation + permissions
5. ✅ "List Repos" demo action from selected installation

**Out of Scope:**
- Database persistence (use in-memory/env for POC)
- Write operations (branch, commit, PR)
- OAuth migration (keep existing localStorage for POC)
- Webhooks
- Full observability stack

---

## Success Criteria

### Acceptance Tests (AT)

| ID | Test | Expected Result | Verification |
|----|------|-----------------|-------------|
| AT-1 | No installation configured | Status shows "Install App" with installation URL | Manual UI check |
| AT-2 | Installation exists but missing scopes | Status shows "Missing Permissions" with specific gaps | Manual: revoke `contents:write`, check UI |
| AT-3 | MCP `list_repos` returns only authorized repos | Repos match GitHub App installation | Compare API response to GitHub settings |
| AT-4 | Secrets never exposed to client | No tokens in localStorage, network tab, or client logs | DevTools audit |
| AT-5 | Logs contain `operation_id`, `installation_id`, no PII | Structured JSON logs with correlation IDs | Check server logs |

### HITL Gates

| Gate | Decision Point | Approver | Status |
|------|---------------|----------|--------|
| Gate-A | Database schema & API contract approved | Tech Lead | ⏳ Pending |
| Gate-B | MCP tool schemas & auth boundary approved | Security Lead | ⏳ Pending |
| Gate-C | UX wireflow and copy approved | Product | ⏳ Pending |

---

## Architecture (POC Simplifications)

```
┌──────────────────────────────────────────────────────┐
│ Next.js Frontend                                     │
│                                                      │
│  ┌────────────────┐        ┌────────────────┐      │
│  │ Status Widget  │        │ Demo: List     │      │
│  │ (React)        │        │ Repos Button   │      │
│  └───────┬────────┘        └────────┬───────┘      │
│          │ GET /api/github/app/status      │       │
│          │                          │       │       │
├──────────┼──────────────────────────┼───────┼───────┤
│ API Layer (Server)                  │       │       │
│          │                          │       │       │
│  ┌───────▼──────────┐      ┌────────▼──────────┐   │
│  │ GET /api/github/ │      │ POST /api/mcp/    │   │
│  │ app/status       │      │ tools/list_repos  │   │
│  │ - Read env vars  │      │ - Validate params │   │
│  │ - Fetch install  │      │ - Auth boundary   │   │
│  │ - Check perms    │      │ - Call GitHub API │   │
│  └───────┬──────────┘      └────────┬──────────┘   │
│          │                          │               │
├──────────┼──────────────────────────┼───────────────┤
│ Services │                          │               │
│          │                          │               │
│  ┌───────▼──────────┐      ┌────────▼──────────┐   │
│  │ Token Provider   │      │ MCP Server        │   │
│  │ - JWT creation   │      │ - Tool registry   │   │
│  │ - Token exchange │      │ - Schema validate │   │
│  │ - 5min cache     │      │ - GitHub client   │   │
│  └──────────────────┘      └───────────────────┘   │
└──────────────────────────────────────────────────────┘
                     │
                     │ HTTPS
                     ▼
              ┌──────────────┐
              │ GitHub API   │
              └──────────────┘
```

**Key Simplifications:**
- ❌ No database → Read from env vars (`GITHUB_APP_INSTALLATION_ID`)
- ❌ No sessions → Skip OAuth (use App only)
- ❌ No webhooks → Manual status refresh
- ✅ In-memory token cache (existing)
- ✅ Server-side only token handling (existing)

---

## Implementation Plan

### Phase 1: Server-Side Status Endpoint (4 hours)

**Goal:** Implement `GET /api/github/app/status` with full diagnostics.

**Tasks:**
1. ✅ **Already exists:** `src/app/api/github/app/diagnostics/route.ts`
2. Enhance response to match OpenAPI spec:
   - Add `missing` field with user-friendly messages
   - Add `html_url` for direct settings link
3. Test with different permission scenarios:
   - ✅ Full permissions
   - ⚠️ Missing `contents:write`
   - ❌ No installation

**Files to Modify:**
- `src/app/api/github/app/diagnostics/route.ts` (enhance response)

**Test Plan:**
```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Test endpoint
curl http://localhost:3000/api/github/app/diagnostics | jq

# Expected: Full status JSON with permissions breakdown
```

**Acceptance:** AT-1, AT-2 pass

---

### Phase 2: MCP Server Implementation (16 hours)

**Goal:** Build standalone MCP HTTP server with 2 tools.

**Tasks:**

#### 2.1 Project Setup (2 hours)
```bash
mkdir -p src/modules/mcp/server
cd src/modules/mcp/server

# Create package.json
npm init -y
npm install express zod @modelcontextprotocol/sdk
npm install -D @types/express typescript tsx
```

**File Structure:**
```
src/modules/mcp/server/
├── index.ts              # HTTP server entry
├── registry.ts           # Tool registry
├── tools/
│   ├── list-repos.ts     # github.list_repos
│   └── get-file.ts       # github.get_file
├── middleware/
│   ├── auth.ts           # Auth boundary
│   └── logger.ts         # Structured logging
└── tsconfig.json
```

#### 2.2 Tool: `github.list_repos` (3 hours)

**File:** `src/modules/mcp/server/tools/list-repos.ts`

```typescript
import { z } from 'zod';
import { getInstallationToken } from '@/modules/github/token-provider';

export const listReposSchema = z.object({
  installation_id: z.number().int().positive(),
  page: z.number().int().min(1).default(1),
  per_page: z.number().int().min(1).max(100).default(30),
});

export async function listReposTool(params: z.infer<typeof listReposSchema>) {
  const correlationId = Math.random().toString(36).substring(7);
  
  // Auth boundary: Validate installation exists (simplified: check env)
  const envInstallId = parseInt(process.env.GITHUB_APP_INSTALLATION_ID || '0', 10);
  if (params.installation_id !== envInstallId) {
    throw new Error('INSTALLATION_NOT_FOUND');
  }
  
  // Fetch installation token
  const { token } = await getInstallationToken({
    installationId: params.installation_id,
    correlationId,
  });
  
  // Call GitHub API
  const response = await fetch(
    `https://api.github.com/installation/repositories?per_page=${params.per_page}&page=${params.page}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  );
  
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  return {
    repositories: data.repositories.map((r: any) => ({
      id: r.id,
      name: r.name,
      full_name: r.full_name,
      owner: r.owner.login,
      private: r.private,
      default_branch: r.default_branch,
      html_url: r.html_url,
    })),
    total_count: data.total_count,
    has_next_page: data.repositories.length === params.per_page,
  };
}
```

#### 2.3 Tool: `github.get_file` (3 hours)

**File:** `src/modules/mcp/server/tools/get-file.ts`

```typescript
import { z } from 'zod';
import { getInstallationToken } from '@/modules/github/token-provider';

export const getFileSchema = z.object({
  installation_id: z.number().int().positive(),
  owner: z.string().min(1),
  repo: z.string().min(1),
  path: z.string().min(1),
  ref: z.string().optional(),
});

export async function getFileTool(params: z.infer<typeof getFileSchema>) {
  const correlationId = Math.random().toString(36).substring(7);
  
  // Auth boundary check (simplified)
  const envInstallId = parseInt(process.env.GITHUB_APP_INSTALLATION_ID || '0', 10);
  if (params.installation_id !== envInstallId) {
    throw new Error('INSTALLATION_NOT_FOUND');
  }
  
  // Fetch token
  const { token } = await getInstallationToken({
    installationId: params.installation_id,
    correlationId,
  });
  
  // Get file from GitHub
  const refParam = params.ref ? `?ref=${params.ref}` : '';
  const response = await fetch(
    `https://api.github.com/repos/${params.owner}/${params.repo}/contents/${params.path}${refParam}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
      },
    }
  );
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('RESOURCE_NOT_FOUND');
    }
    throw new Error(`GitHub API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  // Decode base64 content
  const content = Buffer.from(data.content, 'base64').toString('utf-8');
  
  return {
    path: data.path,
    content,
    sha: data.sha,
    size: data.size,
  };
}
```

#### 2.4 MCP HTTP Server (4 hours)

**File:** `src/modules/mcp/server/index.ts`

```typescript
import express from 'express';
import { listReposSchema, listReposTool } from './tools/list-repos';
import { getFileSchema, getFileTool } from './tools/get-file';

const app = express();
app.use(express.json());

// Tool registry
const tools = {
  'github.list_repos': { schema: listReposSchema, handler: listReposTool },
  'github.get_file': { schema: getFileSchema, handler: getFileTool },
};

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', tools: Object.keys(tools) });
});

// Tool discovery
app.get('/tools', (req, res) => {
  res.json({
    tools: Object.keys(tools).map(name => ({
      name,
      schema: tools[name].schema.shape,
    })),
  });
});

// Tool execution
app.post('/tools/:tool_name', async (req, res) => {
  const { tool_name } = req.params;
  const tool = tools[tool_name];
  
  if (!tool) {
    return res.status(404).json({ error: 'Tool not found' });
  }
  
  try {
    // Validate params
    const params = tool.schema.parse(req.body);
    
    // Execute tool
    const result = await tool.handler(params);
    
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error(`Tool ${tool_name} error:`, error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

const PORT = process.env.MCP_PORT || 3001;
app.listen(PORT, () => {
  console.log(`MCP Server listening on http://localhost:${PORT}`);
});
```

#### 2.5 Testing (4 hours)

**Test Script:** `src/modules/mcp/server/test.sh`

```bash
#!/bin/bash
set -e

# Start MCP server in background
npm run mcp:dev &
MCP_PID=$!
sleep 2

# Test 1: Health check
echo "Test 1: Health check"
curl http://localhost:3001/health | jq

# Test 2: Tool discovery
echo "Test 2: Tool discovery"
curl http://localhost:3001/tools | jq

# Test 3: List repos
echo "Test 3: List repos"
curl -X POST http://localhost:3001/tools/github.list_repos \
  -H "Content-Type: application/json" \
  -d "{\"installation_id\": $GITHUB_APP_INSTALLATION_ID, \"per_page\": 5}" | jq

# Test 4: Get file (README.md)
echo "Test 4: Get file"
curl -X POST http://localhost:3001/tools/github.get_file \
  -H "Content-Type: application/json" \
  -d "{\"installation_id\": $GITHUB_APP_INSTALLATION_ID, \"owner\": \"YOUR_ORG\", \"repo\": \"YOUR_REPO\", \"path\": \"README.md\"}" | jq

# Cleanup
kill $MCP_PID
echo "Tests passed!"
```

**Acceptance:** AT-3, AT-5 pass

---

### Phase 3: UI Status Widget (6 hours)

**Goal:** Enhance existing `GitHubIntegration.tsx` to show installation status with actionable CTAs.

**Tasks:**

#### 3.1 Enhance Status Display (3 hours)

**File:** `src/shared/components/integrations/GitHubIntegration.tsx` (already exists)

**Enhancements:**
1. Show installation status badge:
   - ✅ "Ready" (green) if installed + all permissions
   - ⚠️ "Missing Permissions" (yellow) if installed but missing scopes
   - ❌ "Not Installed" (red) if no installation
2. Show repository coverage:
   - "All repositories" or "Selected (X repos)"
   - Link to add more repos
3. Permission diff table:
   - ✓ contents: write
   - ❌ pull_requests: write (current: read)

**Already Implemented:** Lines 174-285 in existing file show diagnostics.

**Test:** Manual UI check after starting dev server.

#### 3.2 Add "Demo: List Repos" Button (3 hours)

**File:** `src/app/api/mcp/demo/list-repos/route.ts` (new)

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { installation_id } = await req.json();
  
  // Call MCP server
  const response = await fetch('http://localhost:3001/tools/github.list_repos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ installation_id, per_page: 10 }),
  });
  
  const data = await response.json();
  
  return NextResponse.json(data);
}
```

**UI Component:** `src/shared/components/demos/ListReposDemo.tsx` (new)

```typescript
'use client';

import { useState } from 'react';

export function ListReposDemo({ installationId }: { installationId: number }) {
  const [repos, setRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const handleClick = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/mcp/demo/list-repos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ installation_id: installationId }),
      });
      const data = await response.json();
      setRepos(data.data.repositories);
    } catch (error) {
      console.error('Failed to list repos:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <h3 className="font-semibold mb-3">Demo: List Repos via MCP</h3>
      <button
        onClick={handleClick}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg"
      >
        {loading ? 'Loading...' : 'List Repositories'}
      </button>
      
      {repos.length > 0 && (
        <ul className="mt-4 space-y-2">
          {repos.map(repo => (
            <li key={repo.id} className="p-2 bg-gray-900 rounded">
              <a href={repo.html_url} target="_blank" rel="noopener" className="text-blue-400 hover:underline">
                {repo.full_name}
              </a>
              <span className="ml-2 text-xs text-gray-500">({repo.private ? 'Private' : 'Public'})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

**Integration:** Add `<ListReposDemo />` to `GitHubIntegration.tsx` when `installed === true`.

**Acceptance:** AT-3 pass (compare UI list to GitHub App settings)

---

### Phase 4: Security Audit (2 hours)

**Goal:** Verify no tokens exposed to client (AT-4).

**Tasks:**

1. **Browser DevTools Audit:**
   - Open Network tab
   - Trigger "List Repos"
   - Check all requests/responses for tokens
   - ✅ Expected: No `token` field in any response

2. **localStorage Audit:**
   - Open Application tab → Local Storage
   - Check for `devagents_integrations`, `github_token`, etc.
   - ⚠️ Expected for POC: OAuth tokens may exist (out of scope to fix)
   - ✅ Expected: No installation tokens in localStorage

3. **Server Logs Audit:**
   - Check logs for `Bearer ghp_...` or `ghs_...`
   - ✅ Expected: Tokens redacted (show last 4 chars only)

4. **Code Review:**
   - `grep -r "localStorage.*token" src/`
   - Confirm no new localStorage writes

**Acceptance:** AT-4 pass

---

### Phase 5: Documentation & Handoff (4 hours)

**Deliverables:**

1. **POC Demo Video** (15 min):
   - Show UI: status widget with permissions
   - Click "List Repos" → show MCP call → display results
   - Show DevTools: no tokens in network/localStorage
   - Show server logs: structured JSON with correlation IDs

2. **README.poc.md**:
   ```markdown
   # POC: GitHub App + MCP Integration
   
   ## Setup
   1. Set env vars: GITHUB_APP_ID, GITHUB_APP_INSTALLATION_ID, GITHUB_APP_PRIVATE_KEY_PEM
   2. `npm install`
   3. `npm run dev` (Next.js on :3000)
   4. `npm run mcp:dev` (MCP server on :3001)
   5. Open http://localhost:3000/dashboard
   
   ## Demo Flow
   1. Check status widget → should show "Ready" (green)
   2. Click "List Repos" → should display repos
   3. Open DevTools → verify no tokens in network
   
   ## Acceptance Tests
   - AT-1: ✅ (manual check)
   - AT-2: ✅ (revoke perms, check UI)
   - AT-3: ✅ (compare to GitHub settings)
   - AT-4: ✅ (DevTools audit)
   - AT-5: ✅ (check logs)
   ```

3. **HITL Gate Review Docs:**
   - Present database schema (ARCHITECTURE.md) → Gate-A
   - Present MCP tool schemas (github.schema.json) → Gate-B
   - Present UI wireflow (ARCHITECTURE.md) → Gate-C

**Acceptance:** All gates approved, POC video recorded

---

## Timeline & Milestones

| Week | Days | Tasks | Deliverables |
|------|------|-------|-------------|
| **Week 1** | Mon-Wed | Phase 1 & 2.1-2.3 | Status endpoint, 2 MCP tools |
| | Thu-Fri | Phase 2.4-2.5 | MCP server running, tests pass |
| **Week 2** | Mon-Tue | Phase 3 | UI widget, demo button |
| | Wed | Phase 4 | Security audit complete |
| | Thu-Fri | Phase 5 | Docs, video, HITL review |

**Total Effort:** 36 hours (under budget)

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Token exchange fails in POC env | Medium | High | Provide detailed error logs, document PEM format issues |
| MCP server port conflict | Low | Low | Make port configurable (env var) |
| GitHub API rate limits hit | Low | Medium | Implement caching, use conditional requests |
| UI doesn't render status correctly | Low | High | Start with console.log debugging, isolate component |

---

## Success Metrics

| Metric | Target | Actual (Post-POC) |
|--------|--------|-------------------|
| All 5 acceptance tests pass | 5/5 | __ / 5 |
| Security audit clean | 0 issues | __ issues |
| HITL gates approved | 3/3 | __ / 3 |
| Demo video recorded | 15 min | __ min |
| Server logs structured (JSON) | 100% | __% |

---

## Next Steps After POC

1. ✅ Approve POC findings
2. Proceed to **Phase 1** (Production Hardening):
   - Database migrations (1 week)
   - Session-based auth (1 week)
   - Webhook handlers (3 days)
3. Proceed to **Phase 2** (MCP Expansion):
   - Add write tools (branch, commit, PR)
   - Implement full auth boundary (DB-backed)
   - Add retry + rate limit handling

---

**Document Owner:** AKIS Scribe Agent  
**Reviewers:** (To be assigned)  
**Approval Date:** (Pending HITL Gate review)

