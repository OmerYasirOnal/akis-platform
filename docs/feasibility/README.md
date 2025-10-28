# Feasibility Review Package: GitHub App/OAuth & MCP

**Date:** 2025-01-28  
**Status:** ✅ Complete  
**Reviewer:** AKIS Scribe Agent (Principal Engineer Mode)

---

## 📦 Package Contents

This feasibility review validates the implementation approach for two critical modules:

- **Module A:** GitHub App / OAuth (Identity & Authorization Layer)
- **Module B:** Model Context Protocol (MCP) Tooling Layer

### Deliverables

| Artifact | Description | Path |
|----------|-------------|------|
| **ANALYSIS.md** | Evidence-backed feasibility analysis with repo survey, risks, alternatives, and open questions | [ANALYSIS.md](./ANALYSIS.md) |
| **ARCHITECTURE.md** | Detailed technical design with sequence diagrams, DB schemas, API contracts, and security model | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| **github-app.yml** | OpenAPI 3.1 specification for GitHub App API endpoints | [openapi/github-app.yml](./openapi/github-app.yml) |
| **github.schema.json** | JSON Schema for MCP GitHub tools (7 tools with validation) | [mcp/tools/github.schema.json](./mcp/tools/github.schema.json) |
| **POC_PLAN.md** | Minimal slice implementation plan with acceptance tests and HITL gates | [POC_PLAN.md](./POC_PLAN.md) |
| **EVIDENCE.md** | Traceable evidence catalog with file:line references and grep commands | [EVIDENCE.md](./EVIDENCE.md) |

---

## 🎯 Executive Summary

### Feasibility Verdict: ✅ **APPROVED with Conditions**

The AKIS DevAgents repository demonstrates **strong architectural foundations** for both modules, but requires **production hardening** before deployment.

#### Strengths ✅
- ✅ Solid server-side token provider with JWT → Installation Token flow
- ✅ Actor system enables headless operation (oauth_user, app_bot, service_account)
- ✅ Intelligent App vs OAuth routing with safe-by-default fallback
- ✅ Good API structure and diagnostics UI

#### Critical Gaps 🚨
- 🚨 Client-side token storage (localStorage) — **security risk**
- 🚨 No MCP server implementation — **Module B is a stub**
- 🚨 No database persistence — **in-memory/localStorage only**
- 🚨 No installation tracking — **single-installation limit**
- 🚨 No webhook handling — **installation changes not detected**

#### Effort Estimate
- **Module A (GitHub App/OAuth):** ~40 hours (database, session migration, webhooks)
- **Module B (MCP):** ~80 hours (server implementation, tool schemas, transport layer)
- **Total:** ~120 hours (~3 weeks, 1 FTE)

---

## 📊 Key Findings

### Module A: GitHub App/OAuth

| Component | Status | Notes |
|-----------|--------|-------|
| Actor System | ✅ Implemented | 3 modes: oauth_user, app_bot, service_account |
| Token Provider | ✅ Implemented | JWT flow, 5-min cache, server-only |
| OAuth Fallback | ⚠️ Dev-only | Gated by env var (safe-by-default) |
| Installation API | ✅ Implemented | Diagnostics endpoint with permission checks |
| Token Storage | 🚨 localStorage | **Security risk** — needs server-side sessions |
| Database | ❌ Not implemented | No persistence layer |
| Webhooks | ❌ Not implemented | Installation changes not tracked |

**Evidence:**
- 452 references to `GITHUB_APP_*` env vars across 89 files
- Actor resolution logic: `src/shared/lib/auth/actor.ts:88-135`
- Token provider: `src/modules/github/token-provider.ts:177-234`
- localStorage usage: `src/shared/lib/auth/storage.ts:18,32,100-101`

---

### Module B: MCP Tooling Layer

| Component | Status | Notes |
|-----------|--------|-------|
| MCP Client | ⚠️ Placeholder | Wrapper around direct GitHub REST calls |
| MCP Server | ❌ Not implemented | `src/modules/mcp/server/` is empty |
| Tool Schemas | ✅ Designed | 7 tools defined in JSON Schema (new) |
| Auth Boundary | ⚠️ Partial | Env-based check only (no DB) |
| Observability | ⚠️ Basic | Correlation IDs exist, structured logs partial |

**Evidence:**
- MCP stub: `src/shared/services/mcp.ts:31,48,65,84,150` (console.warn fallbacks)
- Empty directory: `src/modules/mcp/server/` (0 files)
- Designed tools: `github.list_repos`, `github.get_file`, `github.create_branch`, `github.commit_files`, `github.create_pr`, `github.add_pr_comment`, `github.get_repo_tree`

---

## 🏗️ Proposed Architecture

### High-Level Design

```
┌───────────────────────────────────────────────────────┐
│ Next.js Frontend (Client)                            │
│  - Connect GitHub UI                                 │
│  - Status Widget (permissions, coverage)             │
│  - No tokens in client (HTTPOnly cookies only)       │
└─────────────┬─────────────────────────────────────────┘
              │ HTTPS (API Routes)
┌─────────────▼─────────────────────────────────────────┐
│ API Layer (Server-Side)                              │
│  - /api/github/app/status                            │
│  - /api/github/app/install-link                      │
│  - /api/integrations/github/connect (OAuth)          │
│  - /api/github/app/webhooks                          │
└─────────────┬─────────────────────────────────────────┘
              │
┌─────────────▼─────────────────────────────────────────┐
│ Core Services                                        │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────┐  │
│  │ Token        │  │ GitHub Client │  │ MCP      │  │
│  │ Provider     │  │ (REST API)    │  │ Client   │  │
│  │ - JWT flow   │  │ - Rate limit  │  │ - Tools  │  │
│  │ - 5min cache │  │ - Retry logic │  │ - Jobs   │  │
│  └──────────────┘  └───────────────┘  └──────────┘  │
└─────────────┬─────────────────────────────────────────┘
              │
┌─────────────▼─────────────────────────────────────────┐
│ Data Layer                                           │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │ PostgreSQL │  │ Redis Cache  │  │ Job Logs    │  │
│  │ - users    │  │ - sessions   │  │ - S3/Local  │  │
│  │ - installs │  │ - tokens     │  │             │  │
│  │ - jobs     │  │              │  │             │  │
│  └────────────┘  └──────────────┘  └─────────────┘  │
└───────────────────────────────────────────────────────┘
              │
┌─────────────▼─────────────────────────────────────────┐
│ External Services                                    │
│  ┌───────────────┐         ┌─────────────────────┐   │
│  │ GitHub API    │         │ MCP Server          │   │
│  │ (REST)        │         │ (HTTP/REST)         │   │
│  │               │         │ - Tool registry     │   │
│  └───────────────┘         │ - Auth boundary     │   │
│                            │ - GitHub wrapper    │   │
│                            └─────────────────────┘   │
└───────────────────────────────────────────────────────┘
```

---

## 🗂️ Database Schema (Proposed)

### Core Tables

```sql
-- Identity management
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_identities (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  provider VARCHAR(50) NOT NULL,     -- 'github'
  provider_user_id VARCHAR(255),     -- GitHub user ID
  provider_login VARCHAR(255),       -- GitHub username
  UNIQUE(provider, provider_user_id)
);

-- GitHub App installations
CREATE TABLE installations (
  id UUID PRIMARY KEY,
  installation_id BIGINT UNIQUE NOT NULL,  -- GitHub installation ID
  user_id UUID REFERENCES users(id),
  account_type VARCHAR(20),                 -- 'User' | 'Organization'
  account_login VARCHAR(255),
  repository_selection VARCHAR(20),         -- 'all' | 'selected'
  permissions JSONB,
  status VARCHAR(20) DEFAULT 'active',
  installed_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE installation_repositories (
  id UUID PRIMARY KEY,
  installation_uuid UUID REFERENCES installations(id),
  repository_id BIGINT,
  repository_full_name VARCHAR(255),
  added_at TIMESTAMP,
  UNIQUE(installation_uuid, repository_id)
);

-- OAuth sessions (server-side)
CREATE TABLE sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  access_token TEXT NOT NULL,        -- Encrypted
  token_expires_at TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,     -- Session expiry
  last_accessed_at TIMESTAMP
);

-- Job tracking
CREATE TABLE jobs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  installation_uuid UUID REFERENCES installations(id),
  actor_mode VARCHAR(20),            -- 'oauth_user' | 'app_bot'
  repository_full_name VARCHAR(255),
  branch VARCHAR(255),
  job_type VARCHAR(50),              -- 'scribe_run'
  status VARCHAR(20),                -- 'pending' | 'running' | 'completed' | 'failed'
  result JSONB,
  created_at TIMESTAMP
);
```

---

## 🧪 POC Implementation Plan

### Minimal Slice (2 weeks)

**Goal:** Validate feasibility with minimal end-to-end implementation

**Scope:**
1. ✅ GitHub App installation status check (server-side)
2. ✅ MCP server with 2 read-only tools: `list_repos`, `get_file`
3. ✅ Agent → MCP client integration
4. ✅ UI status widget showing installation + permissions
5. ✅ "List Repos" demo action

**Out of Scope:**
- ❌ Database (use env vars for POC)
- ❌ Write operations (branch, commit, PR)
- ❌ OAuth migration (keep localStorage)
- ❌ Webhooks

### Acceptance Tests

| ID | Test | Pass Criteria |
|----|------|---------------|
| AT-1 | No installation | Shows "Install App" with URL |
| AT-2 | Missing permissions | Shows specific permission gaps |
| AT-3 | MCP list_repos | Returns only authorized repos |
| AT-4 | Token security | No tokens in client (DevTools audit) |
| AT-5 | Structured logs | Contains operation_id, correlation_id |

### HITL Gates

| Gate | Approval Required | Approver |
|------|------------------|----------|
| Gate-A | Database schema & API contract | Tech Lead |
| Gate-B | MCP tool schemas & auth boundary | Security Lead |
| Gate-C | UX wireflow and copy | Product |

---

## 🔐 Security Model

### Threat Mitigations

| Threat | Current State | Mitigation |
|--------|--------------|------------|
| XSS Token Theft | 🚨 localStorage | Move to HTTPOnly cookies |
| CSRF | ⚠️ Partial | Add SameSite=Lax + CSRF tokens |
| Token Leakage (logs) | ⚠️ Full tokens logged | Redact (show last 4 chars) |
| Man-in-the-Middle | ✅ HTTPS | Enforce HSTS headers |
| Privilege Escalation | ⚠️ No DB boundary | Enforce installation → repo mapping |

---

## 🚀 Next Steps

### Immediate Actions

1. **Review Package** (2 hours)
   - Read ANALYSIS.md (findings & risks)
   - Review ARCHITECTURE.md (technical design)
   - Approve database schema (Gate-A)

2. **HITL Gate Approvals** (1 week)
   - Gate-A: Database schema & API contract
   - Gate-B: MCP tool schemas & auth boundary
   - Gate-C: UX wireflow and copy

3. **POC Implementation** (2 weeks)
   - Follow POC_PLAN.md
   - Implement minimal slice
   - Pass all 5 acceptance tests

### Production Roadmap

**Phase 1: Database & Sessions** (1 week)
- Implement Prisma schema
- Migrate OAuth to server-side sessions
- Implement webhook handlers

**Phase 2: MCP Server** (2 weeks)
- Build HTTP MCP server
- Implement 7 tools with schemas
- Add auth boundary (DB-backed)

**Phase 3: Production Hardening** (1 week)
- Rate limiting & retry logic
- Observability stack (metrics, logs)
- Security audit & penetration testing

---

## 📞 Contact & Support

**Questions?** Contact AKIS Platform Team

**Issues?** Check EVIDENCE.md for file:line references and grep commands

**Updates?** Re-run grep commands to verify evidence if codebase changes

---

## ✅ Validation Checklist

Before proceeding to implementation:

- [ ] All 6 artifacts reviewed
- [ ] Database schema approved (Gate-A)
- [ ] MCP tool schemas approved (Gate-B)
- [ ] UX wireflow approved (Gate-C)
- [ ] POC acceptance tests defined
- [ ] Security risks acknowledged
- [ ] Effort estimate accepted (~3 weeks)

---

**Generated by:** AKIS Scribe Agent  
**Review Date:** 2025-01-28  
**Package Status:** ✅ Complete & Ready for Review  
**Go/No-Go Decision:** ✅ **GO** — Core architecture is sound, gaps are addressable

