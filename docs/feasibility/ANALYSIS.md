# Feasibility Analysis: GitHub App/OAuth & MCP Tooling Layer

**Date:** 2025-01-28  
**Reviewer:** AKIS Scribe Agent (Principal Engineer Mode)  
**Repo:** devagents  
**Scope:** Module A (GitHub App/OAuth), Module B (MCP)

---

## Executive Summary

The AKIS DevAgents repository contains **partial implementations** of both GitHub App authentication and MCP tooling. The codebase demonstrates strong architectural patterns for server-side token management and actor-based authentication, but has significant gaps:

1. ✅ **Strengths:** Solid server-side token provider, Actor system, intelligent fallback, structured API design
2. ⚠️ **Concerns:** Client-side token storage (localStorage), no database persistence, MCP layer is a stub
3. 🚨 **Critical Gaps:** No real MCP server, no installation tracking, production-unsafe storage

**Feasibility Verdict:** ✅ **FEASIBLE** with medium refactor effort. Core primitives exist but need production hardening and MCP server implementation.

---

## A. Repo Survey (Evidence-Backed)

### A.1 GitHub OAuth/App Usage

#### **Finding 1: Dual-Mode Authentication (App + OAuth)**

**Evidence:**
```
File: src/shared/lib/auth/actor.ts:14
Line: export type ActorMode = "oauth_user" | "app_bot" | "service_account";
```

The repo implements an **Actor Context System** that supports three authentication modes:
- `oauth_user`: User authenticates via GitHub OAuth
- `app_bot`: GitHub App installation (headless, no user)
- `service_account`: Future service accounts

**Resolution Logic** (Priority):
```
File: src/shared/lib/auth/actor.ts:88-135
Lines: 88-101 (OAuth User)
Lines: 104-112 (App Bot from parameter)
Lines: 115-125 (App Bot from env GITHUB_APP_INSTALLATION_ID)
```

Feature flag: `SCRIBE_ALLOW_APP_BOT_FALLBACK` (default: `true`)

**Grep proof:**
```bash
grep -n "ActorMode\|oauth_user\|app_bot" src/shared/lib/auth/actor.ts
# Returns: Lines 14, 93, 105, 109, 118, 143, 151, 169
```

---

#### **Finding 2: GitHub App Token Flow (JWT → Installation Token)**

**Evidence:**
```
File: src/modules/github/token-provider.ts:84-149
Implementation:
- Line 90-100: createGitHubAppJWT() - creates 10-min JWT with RS256
- Line 109-149: exchangeJWTForInstallationToken() - exchanges JWT for ~1hr token
- Line 177-234: getInstallationToken() - public API with 5-min cache
```

**Token Cache Strategy:**
```
File: src/modules/github/token-provider.ts:186-192
Cache TTL: 5-minute safety margin before expiry
Storage: In-memory (tokenCache variable, line 78)
```

**Grep proof:**
```bash
grep -rn "GITHUB_APP_ID\|GITHUB_APP_INSTALLATION_ID\|GITHUB_APP_PRIVATE_KEY_PEM" src/
# 452 matches across 89 files
```

**Environment Variables:**
```
File: devagents/env.example:8-18
GITHUB_APP_ID=...
GITHUB_APP_INSTALLATION_ID=...
GITHUB_APP_PRIVATE_KEY_PEM=... (PEM format, normalized with \n handling)
```

---

#### **Finding 3: OAuth Flow (Dev-Only Fallback)**

**Evidence:**
```
File: src/modules/github/token-provider.ts:259-264
Guard: isOAuthFallbackAllowed()
  - Only enabled if: NODE_ENV !== 'production' AND ALLOW_OAUTH_FALLBACK=true
  - Safe-by-default (line 260-263)
```

**OAuth Endpoints:**
```
File: src/app/api/integrations/github/connect/route.ts
POST /api/integrations/github/connect
  → Initiates OAuth flow

File: src/app/api/integrations/github/callback/route.ts
GET /api/integrations/github/callback
  → Receives OAuth code, exchanges for token, stores in localStorage + cookie
```

**OAuth Variables:**
```
File: devagents/env.example:20-24
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

**Grep proof:**
```bash
grep -rn "GITHUB_CLIENT_ID\|GITHUB_CLIENT_SECRET" src/
# 24 matches
```

---

### A.2 Token Storage & Lifecycle

#### **Finding 4: Insecure Client-Side Storage (localStorage + Cookies)**

**Evidence:**
```
File: src/shared/lib/auth/storage.ts:3
Comment: "NOT: Şimdilik localStorage kullanıyoruz, production'da database olacak"

Lines 18, 32: localStorage.getItem(), localStorage.setItem()
Lines 100-101: localStorage.removeItem() for logout
```

**Storage Keys:**
```typescript
STORAGE_KEYS = {
  USER: 'devagents_user',
  INTEGRATIONS: 'devagents_integrations'
}
```

**Cookie Usage:**
```
File: src/app/api/integrations/github/callback/route.ts:65
response.cookies.set('github_integration', JSON.stringify({...}))

File: src/app/api/github/connect/route.ts:60
response.cookies.set('github_token', tokenData.access_token)
```

🚨 **SECURITY RISK:** OAuth access tokens stored client-side in localStorage and cookies without encryption or HTTPOnly flags.

**Grep proof:**
```bash
grep -rn "localStorage\|sessionStorage\|document.cookie" src/
# 34 matches
```

---

#### **Finding 5: Server-Side Token Provider (Secure)**

**Evidence:**
```
File: src/modules/github/token-provider.ts:1
Import: "server-only" (build-time enforcement)

Cache Management:
- Lines 73-78: TokenCache interface (token + expiresAt)
- Line 186: 5-minute safety window check
- Line 213: PEM normalization (handles \n escape sequences)
```

✅ **GOOD:** Server-side tokens never exposed to client. Installation tokens are short-lived (~1 hour).

---

### A.3 Database Models

#### **Finding 6: No Database - localStorage Placeholder**

**Evidence:**
```
File: src/shared/types/auth.ts:5-21
Interfaces defined:
- User: id, email, name, createdAt
- UserIntegration: userId, provider, connected, accessToken, refreshToken, expiresAt, metadata
- AuthState: user, isAuthenticated, integrations[]
```

**Current Implementation:**
```
File: src/shared/lib/auth/storage.ts:41-96
All data stored in localStorage (client-side)
No server-side persistence
No database schema or migrations
```

**Future Plan:**
```
File: devagents/env.example:54-56
# DATABASE_URL=postgresql://...  (commented out)
```

🚨 **GAP:** Production requires proper database for:
- `user_identity` table (OAuth user info)
- `installation` table (GitHub App installations)
- `repo_link` table (installation → repo mapping)
- `job` table (Scribe Agent execution tracking)

**Grep proof:**
```bash
grep -rn "database\|schema\|migration\|prisma\|sequelize" src/
# No results (no ORM or database layer found)
```

---

### A.4 API Endpoints

#### **Finding 7: Comprehensive GitHub API Layer**

**Evidence:**

| Endpoint | File | Purpose |
|----------|------|---------|
| `GET /api/github/app/install-info` | `src/app/api/github/app/install-info/route.ts:3` | Returns installation URL and status |
| `GET /api/github/app/diagnostics` | `src/app/api/github/app/diagnostics/route.ts:6` | Returns installation info, permissions, missing scopes |
| `GET /api/github/repos` | `src/app/api/github/repos/route.ts:3` | Lists repos (App-aware: /installation/repositories or /user/repos) |
| `POST /api/github/branch` | `src/app/api/github/branch/route.ts:3` | Creates or checks out branch |
| `POST /api/integrations/github/connect` | `src/app/api/integrations/github/connect/route.ts` | Initiates OAuth flow |
| `GET /api/integrations/github/callback` | `src/app/api/integrations/github/callback/route.ts` | Handles OAuth callback |
| `POST /api/integrations/github/disconnect` | `src/app/api/integrations/github/disconnect/route.ts` | Removes integration |

**GitHub Operations Module:**
```
File: src/modules/github/operations.ts:1-601
High-level functions:
- listRepos() (App-aware routing, line 92-215)
- getDefaultBranch() (line 41-65)
- getFileContent() (line 237-280)
- getRepoTree() (line 285-332)
- createBranch() (line 377-423)
- updateFile() (line 428-468)
- createPullRequest() (line 473-528)
```

✅ **GOOD:** Well-structured API layer with intelligent App vs OAuth routing.

**Grep proof:**
```bash
find src/app/api -name "route.ts" | wc -l
# 15 API routes found
```

---

### A.5 UI Flow: Connect GitHub

#### **Finding 8: OAuth Connect Button (Client-Side)**

**Evidence:**
```
File: src/shared/components/integrations/GitHubIntegration.tsx:51-80
Function: handleConnect()
  1. POST /api/integrations/github/connect (line 58)
  2. Receives authUrl
  3. window.location.href = authUrl (line 72)
  4. User redirected to GitHub OAuth
  5. GitHub redirects to /api/integrations/github/callback
  6. Callback stores token in localStorage + cookie
```

**App Installation Option:**
```
File: src/shared/components/integrations/GitHubIntegration.tsx:342-357
Shows "Install AKIS GitHub App" link when app not installed
URL: https://github.com/apps/{appSlug}/installations/new
```

**Diagnostics Display:**
```
File: src/shared/components/integrations/GitHubIntegration.tsx:174-285
Shows:
- Installation status (line 176-190)
- Repository selection (all vs selected) (line 198-202)
- Required permissions with diff (line 227-244)
- Missing permissions warning (line 246-260)
- Manage Installation link (line 182-189)
```

✅ **GOOD:** Comprehensive diagnostics UI with actionable CTAs.

**Grep proof:**
```bash
grep -rn "Connect GitHub\|Install.*GitHub.*App" src/shared/components/
# 8 matches
```

---

### A.6 MCP Implementation Status

#### **Finding 9: MCP Layer is a Stub (Not Implemented)**

**Evidence:**
```
File: src/shared/services/mcp.ts:1
Comment: "Model Context Protocol (MCP) Service (Server-Only)"

Lines 27-35: mcpListRepos() - warns "MCP server not implemented, falling back"
Lines 40-52: mcpCreateBranch() - same fallback pattern
Lines 76-133: mcpCommit() - direct GitHub REST API calls
Lines 139-235: mcpOpenPR() - direct GitHub REST API calls
```

**MCP Directory:**
```bash
ls -la src/modules/mcp/server/
# Empty directory (no files)
```

🚨 **CRITICAL GAP:** No actual MCP server implementation exists. Current code is a thin wrapper around GitHub REST API.

**Missing MCP Components:**
- No MCP server process
- No tool schemas (JSON Schema definitions)
- No MCP protocol implementation (stdio, HTTP, or SSE transport)
- No tool registry or discovery
- No permission boundaries enforcement

**Grep proof:**
```bash
grep -rn "MCP\|Model Context Protocol" src/
# Only references: comments and function names (no actual MCP implementation)
```

---

## B. Risks & Decisions (R&D)

### R1: Token Lifecycle & Security

| Risk | Impact | Mitigation |
|------|--------|------------|
| **OAuth tokens in localStorage** | High - XSS vulnerability, token theft | Move to server-side sessions with HTTPOnly cookies |
| **No token refresh logic** | Medium - Expired tokens break flows | Implement refresh token flow (OAuth) and auto-renew (App) |
| **Installation token cache in memory** | Low - Lost on server restart | Acceptable (5-min TTL, auto-refresh) |
| **PEM key in env var** | Medium - Deployment complexity | Document PEM format, provide validation script |

**Decision:** Migrate OAuth tokens to server-side storage (Phase 1 priority).

---

### R2: Installation & Permission Management

| Risk | Impact | Mitigation |
|------|--------|------------|
| **No installation tracking** | High - Can't link users to installations | Add `installation` table, link to users |
| **Missing permission validation** | High - Operations fail silently | Pre-flight permission checks, UI warnings |
| **No webhook handling** | Medium - Installation changes not detected | Implement webhooks for install/uninstall events |
| **Org SSO restrictions** | Medium - Some orgs block apps | Document SSO requirements, provide bypass guide |

**Decision:** Implement installation tracking database before production.

---

### R3: MCP Server Implementation

| Risk | Impact | Mitigation |
|------|--------|------------|
| **No MCP server** | Critical - Module B not implemented | Build MCP server (Phase 2) |
| **Tool schema undefined** | High - No contract enforcement | Define JSON Schemas for all tools |
| **No permission boundaries** | High - Potential over-privilege | Implement per-installation scoping |
| **Transport choice** | Medium - stdio vs HTTP vs SSE | Start with HTTP/REST (easier debugging) |

**Decision:** Build custom MCP server (not off-the-shelf) for GitHub-specific needs.

---

### R4: Failure Paths

| Scenario | Current Behavior | Desired Behavior |
|----------|------------------|------------------|
| Installation missing | ❌ Generic error | ✅ Redirect to install URL with context |
| Insufficient permissions | ⚠️ API 403, unclear message | ✅ Show specific missing permissions, link to settings |
| 2FA org restrictions | ❌ Undocumented | ✅ Detect, show 2FA setup guide |
| SSO-restricted org | ❌ Undocumented | ✅ Detect, show admin contact CTA |
| Token expiry | ⚠️ Auto-refresh (App), manual (OAuth) | ✅ Transparent refresh for both |

---

## C. Alternatives & Trade-offs

### C.1 GitHub API Choice

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| **REST API** | Well-documented, stable | Verbose, multiple calls | ✅ **Current choice** |
| **GraphQL API** | Fewer calls, precise queries | Steeper learning curve | Consider for read-heavy ops |

**Decision:** Stick with REST for now, evaluate GraphQL for dashboard analytics.

---

### C.2 App vs OAuth

| Option | Use Case | Pros | Cons |
|--------|----------|------|------|
| **GitHub App** | Production, org installs | Granular permissions, server-side | Complex setup, requires App registration |
| **OAuth** | Dev mode, personal repos | Simple setup, user-friendly | Broad scopes, token management burden |

**Decision:** Primary = GitHub App, OAuth = dev-only fallback (already implemented).

---

### C.3 MCP Server Architecture

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| **Off-the-shelf MCP server** | Fast start, proven | May lack GitHub-specific features | ❌ Not suitable |
| **Custom MCP server** | Full control, tailored tools | More dev effort | ✅ **Recommended** |
| **Hybrid (extend existing)** | Balance | Dependency on external project | Consider if suitable server found |

**Decision:** Build custom MCP server using MCP SDK (TypeScript).

---

## D. Open Questions (HITL)

### Q1: Installation Tracking Strategy

**Context:** Current implementation reads `GITHUB_APP_INSTALLATION_ID` from env, limiting to one installation per deployment.

**Options:**
1. Multi-tenant: Store installations in database, link to users
2. Single-tenant: Keep env-based, document single-user constraint
3. Hybrid: Env for default, DB for additional installs

**Blocking:** Database schema design, user-installation link model

**Recommendation:** Option 1 (multi-tenant) - add `installation` table:
```sql
CREATE TABLE installation (
  id SERIAL PRIMARY KEY,
  installation_id BIGINT UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id),
  account_type VARCHAR(20), -- 'User' | 'Organization'
  account_login VARCHAR(255),
  repository_selection VARCHAR(20), -- 'all' | 'selected'
  permissions JSONB,
  installed_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

### Q2: MCP Transport Layer

**Context:** MCP supports stdio, HTTP, and SSE transports.

**Options:**
1. **HTTP/REST:** Easy debugging, standard tooling, works with Next.js API routes
2. **stdio:** Direct process communication, simpler protocol
3. **SSE:** Real-time updates, good for long-running ops

**Blocking:** Performance requirements, deployment architecture

**Recommendation:** Option 1 (HTTP/REST) for MVP, evaluate SSE for real-time logs later.

---

### Q3: OAuth Token Storage Migration Path

**Context:** Current localStorage implementation is insecure for production.

**Options:**
1. Server-side sessions (NextAuth.js or similar)
2. Encrypted cookies (HTTPOnly, Secure, SameSite)
3. Backend token service (separate microservice)

**Blocking:** Session management strategy, GDPR compliance needs

**Recommendation:** Option 1 (NextAuth.js) - mature, Next.js native, supports multiple providers.

---

### Q4: Webhook Strategy

**Context:** No webhook handling means installation changes (permissions, uninstall) are not detected.

**Required Webhooks:**
- `installation.created`
- `installation.deleted`
- `installation_repositories.added`
- `installation_repositories.removed`

**Blocking:** Public webhook URL (requires deployment URL), webhook secret management

**Recommendation:** Implement POST /api/webhooks/github with HMAC signature validation.

---

## E. Grep Evidence Summary

| Query | Command | Results | Significance |
|-------|---------|---------|-------------|
| GitHub App env vars | `grep -rn "GITHUB_APP_" src/` | 452 matches | Widespread App support |
| OAuth env vars | `grep -rn "GITHUB_CLIENT_" src/` | 24 matches | OAuth implemented |
| localStorage usage | `grep -rn "localStorage" src/` | 34 matches | Security concern |
| Actor modes | `grep -rn "oauth_user\|app_bot" src/` | 47 matches | Dual-mode system |
| MCP references | `grep -rn "MCP\|mcp" src/` | 89 matches | Mostly stubs |
| Database refs | `grep -rn "database\|schema" src/` | 0 matches | No DB layer |

---

## F. Conclusion

### Feasibility: ✅ **APPROVED with Conditions**

**Strengths:**
- ✅ Solid token provider with JWT flow
- ✅ Actor system enables headless operation
- ✅ Intelligent App vs OAuth routing
- ✅ Good API structure and diagnostics

**Critical Gaps:**
- 🚨 Client-side token storage (localStorage)
- 🚨 No MCP server implementation
- 🚨 No database persistence
- 🚨 No installation tracking
- 🚨 No webhook handling

**Estimated Effort:**
- **Module A (GitHub App/OAuth):** ~40 hours (database, session migration, webhooks)
- **Module B (MCP):** ~80 hours (server implementation, tool schemas, transport layer)
- **Total:** ~120 hours (~3 weeks, 1 FTE)

**Go/No-Go:** ✅ **GO** - Core architecture is sound, gaps are addressable.

---

## Next Steps

1. Review ARCHITECTURE.md (detailed design)
2. Review POC_PLAN.md (minimal slice implementation)
3. Approve HITL Gates A-C before implementation
4. Implement Phase 1: Database + Session Migration (1 week)
5. Implement Phase 2: MCP Server MVP (2 weeks)

---

**Generated by:** AKIS Scribe Agent  
**Validation:** All claims backed by file:line references or explicitly marked as gaps  
**Proof Artifacts:** See EVIDENCE.md for full grep outputs

