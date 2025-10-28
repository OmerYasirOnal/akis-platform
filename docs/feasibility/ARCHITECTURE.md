# Architecture Design: GitHub App/OAuth & MCP Tooling Layer

**Version:** 1.0  
**Date:** 2025-01-28  
**Status:** Feasibility Review  
**Owner:** AKIS Platform Team

---

## Table of Contents

1. [Overview](#overview)
2. [Module A: GitHub App/OAuth](#module-a-github-appoauth)
3. [Module B: MCP Tooling Layer](#module-b-mcp-tooling-layer)
4. [Database Schema](#database-schema)
5. [API Contracts](#api-contracts)
6. [Security Model](#security-model)
7. [Observability](#observability)

---

## Overview

### Design Principles

1. **Server-First Security:** Tokens never exposed to client
2. **Intelligent Fallback:** App (production) → OAuth (dev) → Fail with CTA
3. **Actor-Based:** Unified context for oauth_user, app_bot, service_account
4. **Observability:** Correlation IDs, structured logs, operation tracking
5. **Fail-Safe:** Graceful degradation, actionable error messages

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         AKIS Platform                           │
├─────────────────────────────────────────────────────────────────┤
│  Next.js Frontend                                               │
│  ┌─────────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Connect GitHub  │  │ Repo Picker  │  │ Job Status   │      │
│  │ Button          │  │              │  │ Widget       │      │
│  └────────┬────────┘  └──────┬───────┘  └──────┬───────┘      │
│           │                   │                  │              │
├───────────┼───────────────────┼──────────────────┼──────────────┤
│  API Layer (Server-Side)                        │              │
│           │                   │                  │              │
│  ┌────────▼────────┐  ┌──────▼───────┐  ┌──────▼───────┐      │
│  │ Auth Endpoints  │  │ GitHub Ops   │  │ Job Tracker  │      │
│  │ - OAuth flow    │  │ - List repos │  │ - Create job │      │
│  │ - App install   │  │ - Create PR  │  │ - Stream logs│      │
│  │ - Status check  │  │ - Commit     │  │              │      │
│  └────────┬────────┘  └──────┬───────┘  └──────┬───────┘      │
│           │                   │                  │              │
├───────────┼───────────────────┼──────────────────┼──────────────┤
│  Core Services                                  │              │
│           │                   │                  │              │
│  ┌────────▼────────┐  ┌──────▼───────┐  ┌──────▼───────┐      │
│  │ Token Provider  │  │ GitHub Client│  │ MCP Client   │      │
│  │ - JWT → Token   │  │ - REST calls │  │ - Tool calls │      │
│  │ - Cache (5min)  │  │ - Rate limit │  │ - Job binding│      │
│  └────────┬────────┘  └──────┬───────┘  └──────┬───────┘      │
│           │                   │                  │              │
├───────────┼───────────────────┼──────────────────┼──────────────┤
│  Data Layer                                     │              │
│           │                   │                  │              │
│  ┌────────▼────────┐  ┌──────▼───────┐  ┌──────▼───────┐      │
│  │ Session Store   │  │ Database     │  │ Job Logs     │      │
│  │ (Redis/Mem)     │  │ (PostgreSQL) │  │ (S3/Local)   │      │
│  └─────────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
          ┌───────────────────────────────────────┐
          │  External Services                     │
          │  ┌─────────────┐   ┌─────────────┐   │
          │  │ GitHub API  │   │ MCP Server  │   │
          │  │ (REST)      │   │ (HTTP)      │   │
          │  └─────────────┘   └─────────────┘   │
          └───────────────────────────────────────┘
```

---

## Module A: GitHub App/OAuth

### A.1 Authentication Flow (Detailed)

#### Sequence 1: GitHub App Installation & Token Acquisition

```
User          Next.js UI        API Route       Token Provider    GitHub API
 │                │                │                  │                │
 │ 1. Click      │                │                  │                │
 │ "Install App" │                │                  │                │
 ├───────────────►                │                  │                │
 │                │                │                  │                │
 │ 2. Redirect to GitHub App Install URL             │                │
 │◄───────────────┤                │                  │                │
 │                                 │                  │                │
 │ 3. User authorizes & installs   │                  │                │
 ├─────────────────────────────────►                  │                │
 │                                 │                  │                │
 │ 4. GitHub redirects to /setup (with installation_id)               │
 │◄─────────────────────────────────                  │                │
 │                                 │                  │                │
 │ 5. Store installation_id in DB │                  │                │
 ├─────────────────────────────────►                  │                │
 │                                 │                  │                │
 │ 6. User triggers Scribe Agent   │                  │                │
 ├─────────────────────────────────►                  │                │
 │                │                │ 7. Request token │                │
 │                │                ├──────────────────►                │
 │                │                │                  │ 8. Read env:   │
 │                │                │                  │  - APP_ID      │
 │                │                │                  │  - PRIVATE_KEY │
 │                │                │                  │  - INSTALL_ID  │
 │                │                │                  │                │
 │                │                │                  │ 9. Create JWT  │
 │                │                │                  │  (RS256, 10min)│
 │                │                │                  │                │
 │                │                │                  │ 10. POST /app/installations/{id}/access_tokens
 │                │                │                  ├────────────────►
 │                │                │                  │                │
 │                │                │                  │ 11. Return     │
 │                │                │                  │  installation  │
 │                │                │                  │  access token  │
 │                │                │                  │  (expires ~1hr)│
 │                │                │                  ◄────────────────┤
 │                │                │                  │                │
 │                │                │ 12. Cache token  │                │
 │                │                │  (5min buffer)   │                │
 │                │                ◄──────────────────┤                │
 │                │                │                  │                │
 │                │ 13. Execute GitHub ops with token │                │
 │                │                ├──────────────────────────────────►
 │                │                │                  │                │
```

**Key Points:**
- JWT signed with private key (RS256)
- Installation token scoped to repos + permissions
- Token cached in-memory with 5-minute refresh buffer
- No long-lived secrets in client

---

#### Sequence 2: OAuth Flow (Dev Mode)

```
User          Next.js UI        API Route       GitHub OAuth      Session Store
 │                │                │                  │                │
 │ 1. Click      │                │                  │                │
 │ "Connect      │                │                  │                │
 │  GitHub"      │                │                  │                │
 ├───────────────►                │                  │                │
 │                │ 2. POST /api/integrations/github/connect          │
 │                ├────────────────►                  │                │
 │                │                │ 3. Generate OAuth URL             │
 │                │                │  ?client_id=...  │                │
 │                │                │  &redirect_uri=...│                │
 │                │                │  &scope=repo,... │                │
 │                │ 4. Return authUrl                 │                │
 │                ◄────────────────┤                  │                │
 │                │                │                  │                │
 │ 5. Redirect to GitHub OAuth     │                  │                │
 ├─────────────────────────────────►                  │                │
 │                                 │                  │                │
 │ 6. User authorizes              │                  │                │
 │                                 │                  │                │
 │ 7. GitHub redirects with ?code=...                 │                │
 │◄─────────────────────────────────                  │                │
 │                │                │                  │                │
 │ 8. GET /api/integrations/github/callback?code=... │                │
 ├─────────────────────────────────►                  │                │
 │                │                │ 9. Exchange code for token        │
 │                │                │  POST /login/oauth/access_token   │
 │                │                ├──────────────────►                │
 │                │                │                  │                │
 │                │                │ 10. Return       │                │
 │                │                │  access_token    │                │
 │                │                ◄──────────────────┤                │
 │                │                │                  │                │
 │                │                │ 11. Fetch user info (GET /user)   │
 │                │                ├──────────────────►                │
 │                │                │                  │                │
 │                │                │ 12. Create session (server-side)  │
 │                │                ├──────────────────────────────────►
 │                │                │                  │                │
 │                │ 13. Set HTTPOnly cookie (session_id)               │
 │◄─────────────────────────────────                  │                │
 │                │                │                  │                │
```

**Key Points:**
- OAuth used ONLY in dev mode (gated by env var)
- Token stored server-side in session
- Client receives HTTPOnly cookie (session ID only)
- ⚠️ **Migration Required:** Current implementation uses localStorage (insecure)

---

### A.2 State Machine: Connect GitHub Lifecycle

```
┌──────────────┐
│              │
│ DISCONNECTED │ ◄─────────────────────────┐
│              │                           │
└──────┬───────┘                           │
       │                                   │
       │ User clicks "Connect GitHub"      │
       │ OR "Install App"                  │
       │                                   │
       ▼                                   │
┌──────────────┐                           │
│              │                           │
│ OAUTH_LINKED │                           │
│              │                           │
└──────┬───────┘                           │
       │                                   │
       │ GitHub App installed              │
       │ (webhook: installation.created)   │
       │                                   │
       ▼                                   │
┌──────────────┐                           │
│              │                           │
│ APP_INSTALLED│                           │
│              │                           │
└──────┬───────┘                           │
       │                                   │
       │ Permissions validated             │
       │ (diagnostics API check)           │
       │                                   │
       ▼                                   │
┌──────────────┐                           │
│              │                           │
│    READY     │                           │
│              │                           │
└──────┬───────┘                           │
       │                                   │
       │ Error detected:                   │
       │ - Token expired (unlikely)        │
       │ - Permissions revoked             │
       │ - App uninstalled                 │
       │ - 2FA required                    │
       │                                   │
       ▼                                   │
┌──────────────┐                           │
│              │                           │
│    ERROR     │───────────────────────────┘
│              │  User fixes issue
└──────────────┘  or disconnects

States:
- DISCONNECTED: No OAuth, no App installation
- OAUTH_LINKED: User authenticated via OAuth (dev mode only)
- APP_INSTALLED: GitHub App installed, checking permissions
- READY: All checks passed, can execute operations
- ERROR: Failure detected (show specific error + CTA)
```

---

### A.3 Database Schema (Module A)

#### Table: `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
```

---

#### Table: `user_identities`
```sql
CREATE TABLE user_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'github', 'gitlab', etc.
  provider_user_id VARCHAR(255) NOT NULL, -- GitHub user ID
  provider_login VARCHAR(255), -- GitHub username
  provider_email VARCHAR(255),
  provider_avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(provider, provider_user_id)
);

CREATE INDEX idx_identities_user_id ON user_identities(user_id);
CREATE INDEX idx_identities_provider ON user_identities(provider, provider_user_id);
```

---

#### Table: `installations`
```sql
CREATE TABLE installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  installation_id BIGINT UNIQUE NOT NULL, -- GitHub App installation ID
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Link to user who installed
  account_type VARCHAR(20) NOT NULL, -- 'User' | 'Organization'
  account_login VARCHAR(255) NOT NULL, -- GitHub account login
  account_id BIGINT, -- GitHub account ID
  repository_selection VARCHAR(20) NOT NULL, -- 'all' | 'selected'
  permissions JSONB, -- {contents: 'write', pull_requests: 'write', ...}
  app_slug VARCHAR(255), -- GitHub App slug (e.g., 'akis-scribe')
  html_url TEXT, -- GitHub installation settings URL
  status VARCHAR(20) DEFAULT 'active', -- 'active' | 'suspended' | 'uninstalled'
  installed_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  uninstalled_at TIMESTAMP
);

CREATE INDEX idx_installations_installation_id ON installations(installation_id);
CREATE INDEX idx_installations_user_id ON installations(user_id);
CREATE INDEX idx_installations_status ON installations(status);
```

---

#### Table: `installation_repositories`
```sql
CREATE TABLE installation_repositories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  installation_uuid UUID NOT NULL REFERENCES installations(id) ON DELETE CASCADE,
  repository_id BIGINT NOT NULL, -- GitHub repo ID
  repository_full_name VARCHAR(255) NOT NULL, -- owner/repo
  private BOOLEAN DEFAULT false,
  default_branch VARCHAR(255) DEFAULT 'main',
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  removed_at TIMESTAMP,
  
  UNIQUE(installation_uuid, repository_id)
);

CREATE INDEX idx_inst_repos_installation ON installation_repositories(installation_uuid);
CREATE INDEX idx_inst_repos_full_name ON installation_repositories(repository_full_name);
```

---

#### Table: `sessions` (OAuth)
```sql
CREATE TABLE sessions (
  id VARCHAR(255) PRIMARY KEY, -- Session ID (UUID or secure random)
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'github'
  access_token TEXT NOT NULL, -- Encrypted
  refresh_token TEXT, -- Encrypted
  token_expires_at TIMESTAMP,
  scopes TEXT[], -- OAuth scopes granted
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL, -- Session expiry (e.g., 30 days)
  last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
```

**Security Notes:**
- `access_token` and `refresh_token` MUST be encrypted at rest (use pgcrypto or app-level encryption)
- Session cookie: HTTPOnly, Secure, SameSite=Lax
- Session expiry: 30 days (configurable)
- Cleanup job: Delete expired sessions daily

---

### A.4 API Contract (OpenAPI - see openapi/github-app.yml)

**Key Endpoints:**

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/api/github/app/status` | Session | Installation status, permissions, missing scopes |
| `GET` | `/api/github/app/install-link` | Session | Generate installation URL for current user |
| `POST` | `/api/github/app/webhooks` | Webhook Secret | Handle installation events |
| `GET` | `/api/integrations/github/connect` | Public | Initiate OAuth flow |
| `GET` | `/api/integrations/github/callback` | Public | OAuth callback handler |
| `POST` | `/api/integrations/github/disconnect` | Session | Revoke OAuth, clear session |

---

### A.5 UI/UX Wireflow

```
┌─────────────────────────────────────────────────────────────┐
│ Dashboard                                                   │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │ Integrations                                       │   │
│  │                                                     │   │
│  │  ┌──────────────────────────────────────────────┐ │   │
│  │  │ 🐙 GitHub                                    │ │   │
│  │  │                                              │ │   │
│  │  │ Status: ⚠️ Not Connected                     │ │   │
│  │  │                                              │ │   │
│  │  │ [Connect GitHub (OAuth)]  OR                │ │   │
│  │  │                                              │ │   │
│  │  │ [Install AKIS GitHub App] (Recommended)     │ │   │
│  │  └──────────────────────────────────────────────┘ │   │
│  └────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

After connecting:

┌─────────────────────────────────────────────────────────────┐
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 🐙 GitHub                                              │ │
│  │                                                        │ │
│  │ Status: ✅ Connected                                   │ │
│  │                                                        │ │
│  │ ┌────────────────────────────────────────────────┐   │ │
│  │ │ 🤖 GitHub App Mode: Active                     │   │ │
│  │ │ Installed on: @username (User)                 │   │ │
│  │ │ Repository access: Selected (5 repos)          │   │ │
│  │ │                                                 │   │ │
│  │ │ Required Permissions: ✅ 3/3                    │   │ │
│  │ │  ✓ contents: write                             │   │ │
│  │ │  ✓ pull_requests: write                        │   │ │
│  │ │  ✓ metadata: read                              │   │ │
│  │ │                                                 │   │ │
│  │ │ [Manage Installation] [Add More Repos]         │   │ │
│  │ └────────────────────────────────────────────────┘   │ │
│  │                                                        │ │
│  │ [Disconnect]                                           │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

Error state:

┌─────────────────────────────────────────────────────────────┐
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 🐙 GitHub                                              │ │
│  │                                                        │ │
│  │ Status: ⚠️ Missing Permissions                         │ │
│  │                                                        │ │
│  │ ┌────────────────────────────────────────────────┐   │ │
│  │ │ ⚠️ The AKIS GitHub App is missing required    │   │ │
│  │ │    permissions to function properly:           │   │ │
│  │ │                                                 │   │ │
│  │ │  ❌ contents: write (current: read)            │   │ │
│  │ │  ✓ pull_requests: write                        │   │ │
│  │ │  ✓ metadata: read                              │   │ │
│  │ │                                                 │   │ │
│  │ │ [Fix Permissions]                              │   │ │
│  │ └────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Module B: MCP Tooling Layer

### B.1 MCP Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  AKIS Scribe Agent (MCP Client)                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │ Agent Runner                                       │   │
│  │  - Accepts job (user_id, repo, branch)            │   │
│  │  - Resolves Actor (OAuth or App Bot)              │   │
│  │  - Creates MCP client with installation_id        │   │
│  └────────────────┬───────────────────────────────────┘   │
│                   │                                        │
│                   │ MCP Tool Calls (JSON-RPC)             │
│                   ▼                                        │
│  ┌────────────────────────────────────────────────────┐   │
│  │ MCP Client                                         │   │
│  │  - Tool schema validation                          │   │
│  │  - Correlation ID propagation                      │   │
│  │  - Error handling & retry                          │   │
│  └────────────────┬───────────────────────────────────┘   │
└────────────────────┼────────────────────────────────────────┘
                     │ HTTP/REST
                     │ POST /mcp/tools/{tool_name}
                     │
┌────────────────────▼────────────────────────────────────────┐
│  MCP Server (Custom GitHub Server)                         │
│  ┌────────────────────────────────────────────────────┐   │
│  │ Tool Registry                                      │   │
│  │  - github.list_repos                               │   │
│  │  - github.get_file                                 │   │
│  │  - github.create_branch                            │   │
│  │  - github.commit_files                             │   │
│  │  - github.create_pr                                │   │
│  └────────────────┬───────────────────────────────────┘   │
│                   │                                        │
│  ┌────────────────▼───────────────────────────────────┐   │
│  │ Auth Boundary                                      │   │
│  │  - Validate installation_id                        │   │
│  │  - Check repo access (installation_repositories)   │   │
│  │  - Fetch installation token (server-side only)     │   │
│  └────────────────┬───────────────────────────────────┘   │
│                   │                                        │
│  ┌────────────────▼───────────────────────────────────┐   │
│  │ GitHub Client                                      │   │
│  │  - REST API calls with installation token          │   │
│  │  - Rate limit handling                             │   │
│  │  - Retry with exponential backoff                  │   │
│  └────────────────┬───────────────────────────────────┘   │
└────────────────────┼────────────────────────────────────────┘
                     │ HTTPS
                     ▼
          ┌──────────────────────┐
          │  GitHub REST API     │
          └──────────────────────┘
```

---

### B.2 MCP Tool Schemas (JSON Schema)

#### Tool: `github.list_repos`

```json
{
  "name": "github.list_repos",
  "description": "List repositories accessible by the installation",
  "inputSchema": {
    "type": "object",
    "properties": {
      "installation_id": {
        "type": "number",
        "description": "GitHub App installation ID"
      },
      "page": {
        "type": "number",
        "default": 1,
        "minimum": 1
      },
      "per_page": {
        "type": "number",
        "default": 30,
        "minimum": 1,
        "maximum": 100
      }
    },
    "required": ["installation_id"]
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "repositories": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "id": { "type": "number" },
            "name": { "type": "string" },
            "full_name": { "type": "string" },
            "owner": { "type": "string" },
            "private": { "type": "boolean" },
            "default_branch": { "type": "string" }
          }
        }
      },
      "total_count": { "type": "number" },
      "has_next_page": { "type": "boolean" }
    }
  }
}
```

---

#### Tool: `github.get_file`

```json
{
  "name": "github.get_file",
  "description": "Get file content from repository",
  "inputSchema": {
    "type": "object",
    "properties": {
      "installation_id": { "type": "number" },
      "owner": { "type": "string" },
      "repo": { "type": "string" },
      "path": { "type": "string" },
      "ref": {
        "type": "string",
        "description": "Branch, tag, or commit SHA (default: default_branch)"
      }
    },
    "required": ["installation_id", "owner", "repo", "path"]
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "path": { "type": "string" },
      "content": { "type": "string", "description": "UTF-8 decoded content" },
      "sha": { "type": "string" },
      "size": { "type": "number" }
    }
  }
}
```

---

#### Tool: `github.create_branch`

```json
{
  "name": "github.create_branch",
  "description": "Create a new branch from base ref",
  "inputSchema": {
    "type": "object",
    "properties": {
      "installation_id": { "type": "number" },
      "owner": { "type": "string" },
      "repo": { "type": "string" },
      "branch": { "type": "string", "pattern": "^[a-zA-Z0-9/_-]+$" },
      "base_ref": { "type": "string", "description": "Base branch/tag/SHA (default: default_branch)" }
    },
    "required": ["installation_id", "owner", "repo", "branch"]
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "ref": { "type": "string" },
      "sha": { "type": "string" }
    }
  }
}
```

---

#### Tool: `github.commit_files`

```json
{
  "name": "github.commit_files",
  "description": "Commit one or more files to a branch",
  "inputSchema": {
    "type": "object",
    "properties": {
      "installation_id": { "type": "number" },
      "owner": { "type": "string" },
      "repo": { "type": "string" },
      "branch": { "type": "string" },
      "files": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "path": { "type": "string" },
            "content": { "type": "string", "description": "UTF-8 content" }
          },
          "required": ["path", "content"]
        },
        "minItems": 1,
        "maxItems": 50
      },
      "message": { "type": "string", "minLength": 1, "maxLength": 500 },
      "author": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "email": { "type": "string", "format": "email" }
        }
      }
    },
    "required": ["installation_id", "owner", "repo", "branch", "files", "message"]
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "commits": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "path": { "type": "string" },
            "sha": { "type": "string" },
            "url": { "type": "string" }
          }
        }
      }
    }
  }
}
```

---

#### Tool: `github.create_pr`

```json
{
  "name": "github.create_pr",
  "description": "Create a pull request",
  "inputSchema": {
    "type": "object",
    "properties": {
      "installation_id": { "type": "number" },
      "owner": { "type": "string" },
      "repo": { "type": "string" },
      "title": { "type": "string", "minLength": 1, "maxLength": 200 },
      "body": { "type": "string", "maxLength": 65536 },
      "head": { "type": "string", "description": "Source branch" },
      "base": { "type": "string", "description": "Target branch (default: default_branch)" },
      "draft": { "type": "boolean", "default": true },
      "labels": {
        "type": "array",
        "items": { "type": "string" },
        "maxItems": 10
      }
    },
    "required": ["installation_id", "owner", "repo", "title", "head"]
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "number": { "type": "number" },
      "html_url": { "type": "string" },
      "state": { "type": "string", "enum": ["open", "closed"] },
      "draft": { "type": "boolean" }
    }
  }
}
```

---

### B.3 Auth Boundary Enforcement

**Rule:** MCP Server MUST validate every tool call against installation permissions.

```typescript
// MCP Server: Auth Middleware
async function validateToolCall(req: MCPToolRequest): Promise<void> {
  const { installation_id, owner, repo } = req.params;
  
  // 1. Check installation exists and is active
  const installation = await db.query(
    'SELECT * FROM installations WHERE installation_id = $1 AND status = $2',
    [installation_id, 'active']
  );
  
  if (!installation) {
    throw new MCPError('INSTALLATION_NOT_FOUND', 'Installation not found or inactive');
  }
  
  // 2. Check repo is linked to installation
  if (owner && repo) {
    const repoLink = await db.query(
      `SELECT * FROM installation_repositories 
       WHERE installation_uuid = $1 AND repository_full_name = $2 AND removed_at IS NULL`,
      [installation.id, `${owner}/${repo}`]
    );
    
    if (!repoLink) {
      throw new MCPError('REPO_NOT_AUTHORIZED', `Repo ${owner}/${repo} not installed`);
    }
  }
  
  // 3. Validate required permissions for tool
  const requiredPerms = TOOL_PERMISSIONS[req.tool_name]; // e.g., {contents: 'write'}
  const actualPerms = installation.permissions;
  
  for (const [key, required] of Object.entries(requiredPerms)) {
    const actual = actualPerms[key];
    if (!actual || (required === 'write' && actual !== 'write')) {
      throw new MCPError('INSUFFICIENT_PERMISSIONS', `Missing ${key}:${required}`);
    }
  }
  
  // 4. Fetch installation token (server-side)
  const token = await getInstallationToken({ installation_id });
  req.githubToken = token; // Attach for downstream use
}
```

---

### B.4 Observability & Error Handling

#### Structured Logs

```json
{
  "timestamp": "2025-01-28T10:30:45.123Z",
  "level": "info",
  "service": "mcp-server",
  "tool": "github.create_pr",
  "operation_id": "op_abc123",
  "correlation_id": "cor_xyz789",
  "job_id": "job_456",
  "installation_id": 12345,
  "repo": "owner/repo",
  "message": "PR created successfully",
  "pr_number": 42,
  "pr_url": "https://github.com/owner/repo/pull/42",
  "duration_ms": 1234
}
```

#### Error Taxonomies

| Code | HTTP Status | Description | User Action |
|------|-------------|-------------|-------------|
| `INSTALLATION_NOT_FOUND` | 404 | Installation not in DB or inactive | Install GitHub App |
| `REPO_NOT_AUTHORIZED` | 403 | Repo not linked to installation | Add repo in GitHub App settings |
| `INSUFFICIENT_PERMISSIONS` | 403 | Missing required permissions | Grant permissions in GitHub App |
| `RATE_LIMIT_EXCEEDED` | 429 | GitHub API rate limit hit | Retry after X seconds |
| `TOKEN_EXPIRED` | 401 | Installation token expired | Auto-refresh (should not happen) |
| `INVALID_PARAMS` | 400 | Schema validation failed | Check tool parameters |
| `GITHUB_API_ERROR` | 502 | GitHub API returned error | Check GitHub status, retry |

---

## Database Schema (Full)

See [Module A.3](#a3-database-schema-module-a) for `users`, `user_identities`, `installations`, `installation_repositories`, `sessions`.

### Additional Tables for Module B

#### Table: `jobs`
```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  installation_uuid UUID REFERENCES installations(id) ON DELETE SET NULL,
  actor_mode VARCHAR(20) NOT NULL, -- 'oauth_user' | 'app_bot' | 'service_account'
  actor_github_login VARCHAR(255),
  
  repository_full_name VARCHAR(255) NOT NULL,
  branch VARCHAR(255) NOT NULL,
  base_branch VARCHAR(255),
  
  job_type VARCHAR(50) NOT NULL, -- 'scribe_run', 'repo_analysis', etc.
  status VARCHAR(20) DEFAULT 'pending', -- 'pending' | 'running' | 'completed' | 'failed'
  
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  result JSONB, -- {pr_number, pr_url, files_changed, das_score, ...}
  error JSONB, -- {code, message, stack}
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_jobs_user_id ON jobs(user_id);
CREATE INDEX idx_jobs_installation ON jobs(installation_uuid);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);
```

---

#### Table: `job_logs`
```sql
CREATE TABLE job_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  level VARCHAR(10) NOT NULL, -- 'debug' | 'info' | 'warn' | 'error'
  operation VARCHAR(100), -- 'github.list_repos', 'github.create_pr', etc.
  message TEXT NOT NULL,
  metadata JSONB -- {duration_ms, pr_number, file_count, ...}
);

CREATE INDEX idx_job_logs_job_id ON job_logs(job_id, timestamp DESC);
```

---

## Security Model

### Threat Model

| Threat | Mitigation |
|--------|------------|
| **XSS Token Theft** | No tokens in localStorage/client; HTTPOnly cookies only |
| **CSRF** | SameSite=Lax cookies, CSRF tokens for state-changing ops |
| **Token Leakage (logs)** | Redact tokens in logs (show last 4 chars only) |
| **Man-in-the-Middle** | Enforce HTTPS everywhere, HSTS headers |
| **Privilege Escalation** | Auth boundary enforces installation → repo mapping |
| **Replay Attacks** | Short-lived tokens (~1hr), nonce for OAuth |

---

### Secret Management

| Secret | Storage | Access |
|--------|---------|--------|
| `GITHUB_APP_PRIVATE_KEY_PEM` | Env var (Vercel/Railway encrypted) | Server-only |
| `GITHUB_CLIENT_SECRET` | Env var (encrypted) | Server-only |
| `SESSION_SECRET` | Env var (encrypted) | Server-only |
| OAuth `access_token` | Database (encrypted with pgcrypto) | Server-only |
| Installation `access_token` | In-memory cache (5min TTL) | Server-only |

---

## Observability

### Metrics (to instrument)

- `github_api_calls_total{operation, status}` (Counter)
- `github_api_duration_seconds{operation}` (Histogram)
- `github_api_rate_limit_remaining{installation_id}` (Gauge)
- `mcp_tool_calls_total{tool, status}` (Counter)
- `mcp_tool_duration_seconds{tool}` (Histogram)
- `jobs_total{type, status}` (Counter)
- `token_cache_hits_total` (Counter)
- `token_cache_misses_total` (Counter)

---

### Logging Standards

- Correlation ID in every log entry
- Operation ID for each MCP tool call
- Redact tokens (show last 4 chars)
- Include `installation_id`, `repo`, `job_id` for traceability

---

## Next Steps

1. Review POC_PLAN.md for MVP implementation
2. Approve HITL Gates A-C
3. Implement database migrations (Prisma or raw SQL)
4. Build MCP server with HTTP transport
5. Migrate OAuth storage to sessions
6. Implement webhooks for installation tracking

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-28  
**Reviewers:** (To be assigned)

