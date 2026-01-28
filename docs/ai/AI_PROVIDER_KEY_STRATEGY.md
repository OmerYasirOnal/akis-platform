# AI Provider + Key Management Strategy

> **Status:** APPROVED — Gate 6 Decision Patch Applied (2026-01-28)
> **Created:** 2026-01-28
> **Purpose:** Canonical strategy for AI provider configuration, user key management, and security constraints

---

## 1. Platform Default Model

### Default Configuration
The AKIS Platform provides a **default AI model** that works immediately without requiring users to configure API keys.

**Platform Default:**
- **Provider:** Platform-managed AI service (implementation details abstracted)
- **Model Tier:** General-purpose language model (suitable for standard agent workflows)
- **User Action Required:** NONE — works out of the box
- **Cost Model:** Platform-subsidized or included in base tier

### Rationale
- **Zero-friction onboarding:** Users can start using AI agents immediately
- **Security:** Users don't need to manage sensitive API keys for basic functionality
- **Platform control:** Consistent default experience across all users

---

## 2. Optional User Keys

Users MAY optionally provide their own API keys to override the platform default.

### Supported Providers
1. **OpenAI** (e.g., GPT-4, GPT-3.5)
2. **Anthropic Claude** (e.g., Claude 3 Opus, Sonnet, Haiku)
3. **OpenRouter** (unified gateway to multiple models)

### User Key Benefits
- **Model selection:** Access to specific models (e.g., GPT-4, Claude Opus)
- **Cost control:** Direct billing to user's provider account
- **Rate limits:** User's own quota instead of platform shared pool
- **Advanced features:** Provider-specific capabilities (vision, extended context, etc.)

### User Key Configuration
- **Location:** User Settings → AI Providers
- **Storage:** Encrypted at rest (see Security Requirements)
- **Scope:** User-level keys apply to all agent workflows (MVP scope)
- **Validation:** Keys validated on save (test API call to provider)
- **Mode Selection:** Simple mode (provider auto-selects model) + Advanced mode (provider + model selection)

---

## 3. Precedence Rules

When multiple key sources exist, the system follows this precedence hierarchy (highest to lowest):

### Precedence Order (MVP + Future)
```
1. Workspace/Organization Keys (FUTURE — not in MVP scope)
   ↓ (if not set)
2. User-Provided Keys (MVP — user-level configuration)
   ↓ (if not set)
3. Platform Default Model (MVP — works out of the box)
```

### MVP Implementation (Current)
**Current MVP prioritizes user-level keys:**
- **User keys override platform default:** Individual user choice respected (MVP)
- **Platform default fallback:** Always available if no user key configured (MVP)
- **Workspace keys:** FUTURE capability (architecture future-proofed, NOT in MVP)

### Future Workspace Key Scope (Post-MVP)
**Decision (Q1 Resolution):** Workspace keys will be **workspace-specific** when implemented.
- Each workspace has its own keys (Workspace A uses OpenAI, Workspace B uses Claude)
- Workspace keys override user keys within that specific workspace only
- Users in multiple workspaces see different providers based on workspace context

### Example Scenarios (MVP)
| Workspace Key | User Key | Result Used | Rationale |
|---------------|----------|-------------|-----------|
| (not implemented) | Claude (user) | **Claude (user)** | MVP: User override |
| (not implemented) | (not set) | **Platform Default** | MVP: Fallback |

### Example Scenarios (Future — Post-MVP)
| Workspace Key | User Key | Result Used | Rationale |
|---------------|----------|-------------|-----------|
| OpenAI (org) | Claude (user) | **OpenAI (org)** | Future: Workspace precedence |
| (not set) | Claude (user) | **Claude (user)** | Future: User override |
| OpenRouter (org) | (not set) | **OpenRouter (org)** | Future: Workspace precedence |

---

## 4. Security Requirements

### 4.1 No Secrets in Logs
**Requirement:** API keys MUST NEVER appear in logs, error messages, or debug output.

**Implementation Checklist:**
- [ ] API keys redacted before logging (replace with `***REDACTED***` or first 4 chars only)
- [ ] Error messages do NOT include full keys (even if API call fails)
- [ ] Debug logs for AI calls redact `Authorization` headers
- [ ] Frontend network inspector NEVER shows full keys
- [ ] Server logs sanitize keys from request/response bodies

**Test Case:**
```typescript
// BAD: Key leaked in log
logger.error(`API call failed with key: ${apiKey}`);

// GOOD: Key redacted
logger.error(`API call failed with key: ${redactKey(apiKey)}`);
// Output: "API call failed with key: sk-ab***REDACTED***"
```

### 4.2 Redaction Expectations
**Requirement:** All API keys displayed in UI or logs MUST be redacted.

**Redaction Format:**
- **Full key:** `sk-abc123def456ghi789` (32+ chars)
- **Redacted display:** `sk-ab***REDACTED***` (first 4-6 chars + mask)
- **OR:** `***...ghi789` (last 6 chars only)

**Implementation Checklist:**
- [ ] User Settings UI shows redacted keys only
- [ ] API response bodies redact keys before sending to frontend
- [ ] Copy-to-clipboard functionality includes full key (with user confirmation)
- [ ] Audit logs show redacted keys only

### 4.3 Storage Posture
**Requirement:** API keys MUST be encrypted at rest and in transit.

**Implementation Checklist:**
- [ ] Keys encrypted using AES-256 or equivalent before database storage
- [ ] Encryption keys stored separately from application database (e.g., environment variables, key vault)
- [ ] HTTPS/TLS for all key transmission (frontend ↔ backend)
- [ ] Keys NEVER stored in frontend localStorage or cookies
- [ ] Database backups include encrypted keys (NOT plaintext)

**Database Schema Expectation:**
```sql
CREATE TABLE user_api_keys (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  provider VARCHAR(50), -- 'openai', 'anthropic', 'openrouter'
  encrypted_key TEXT NOT NULL, -- AES-256 encrypted
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);
```

### 4.4 Rotation Guidance
**Requirement:** Users MUST be able to rotate (update/delete) their keys at any time.

**Implementation Checklist:**
- [ ] User Settings UI includes "Update Key" and "Delete Key" actions
- [ ] Key rotation does NOT break in-flight agent jobs (graceful transition)
- [ ] Old keys invalidated immediately after rotation (no grace period)
- [ ] Users notified if key rotation fails (e.g., new key invalid)
- [ ] Audit log entry created on every rotation event

**Rotation Flow:**
1. User provides new key in Settings
2. System validates new key (test API call)
3. If valid: Replace old key, invalidate old key, log rotation event
4. If invalid: Reject update, show validation error to user

### 4.5 Auditability
**Requirement:** All API key usage MUST be auditable (who, when, which provider).

**Audit Log Requirements:**
- [ ] Log every API key creation event (user_id, provider, timestamp)
- [ ] Log every API key usage event (user_id, provider, model, timestamp, job_id)
- [ ] Log every API key rotation/deletion event (user_id, provider, timestamp)
- [ ] Audit logs accessible to workspace admins (for org keys)
- [ ] Audit logs retained for compliance period (e.g., 90 days minimum)

**Audit Log Schema Expectation:**
```sql
CREATE TABLE api_key_audit_log (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  event_type VARCHAR(50), -- 'created', 'used', 'rotated', 'deleted'
  provider VARCHAR(50),
  model VARCHAR(100), -- if event_type = 'used'
  job_id UUID, -- if event_type = 'used'
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. Architecture Mapping

### Existing Architecture Components

**From CONTEXT_ARCHITECTURE.md:**
- **AIService:** Backend service handling AI provider interactions
- **Orchestrator-Injected Tools:** Agent execution environment with tool injection
- **Backend Framework:** Fastify 4.x (verified in package.json)
- **Database:** PostgreSQL + Drizzle ORM (verified in package.json)

### How This Strategy Maps to Architecture

| Strategy Concept | Architecture Component | Implementation Location |
|------------------|------------------------|-------------------------|
| Platform Default Model | AIService default provider config | `backend/src/services/ai/` (expected) |
| User-Provided Keys | AIService user key override logic | `backend/src/services/ai/keyManager.ts` (expected) |
| Precedence Rules | AIService key resolution logic | `backend/src/services/ai/keyResolver.ts` (expected) |
| Key Storage (encrypted) | Database + encryption layer | `backend/src/db/schema/userApiKeys.ts` (expected) |
| Redaction Utility | Logging middleware | `backend/src/utils/redaction.ts` (expected) |
| Audit Log | Audit logging service | `backend/src/services/audit/apiKeyAudit.ts` (expected) |

**AIService Expected Interface:**
```typescript
interface AIService {
  // Resolves which provider/key to use based on precedence rules
  resolveProvider(userId: string, workspaceId?: string): Promise<AIProvider>;

  // Executes AI call with resolved provider
  executeCall(provider: AIProvider, prompt: string, options?: CallOptions): Promise<AIResponse>;

  // Key management
  saveUserKey(userId: string, provider: string, encryptedKey: string): Promise<void>;
  rotateUserKey(userId: string, provider: string, newEncryptedKey: string): Promise<void>;
  deleteUserKey(userId: string, provider: string): Promise<void>;
}
```

**Orchestrator Integration:**
- Orchestrator injects AIService as tool to agent runtime
- Agent workflows call AIService.executeCall() without knowing about key management
- AIService handles provider resolution transparently

---

## 6. MCP-Only Integration Rule

### Constraint (from CONTEXT_ARCHITECTURE.md)
> **MCP-only integration for GitHub, Atlassian, etc.:** Backend NEVER stores GitHub/Jira tokens in its own database.

### Application to AI Provider Keys
**AI provider keys (OpenAI, Anthropic, OpenRouter) are EXEMPT from MCP-only rule.**

**Rationale:**
- **MCP-only rule applies to:** External service integrations (GitHub, Atlassian, Google Workspace)
- **AI provider keys are different:** Core platform functionality, not external service integrations
- **Storage required:** Backend MUST store encrypted AI keys for platform default + user override functionality

**Clarification:**
- ✅ **AI provider keys:** Stored encrypted in backend database (this strategy)
- ❌ **GitHub/Jira/Google tokens:** NEVER stored in backend (MCP-only per CONTEXT_ARCHITECTURE)

---

## 7. UX Expectations

### User Experience Flow (MVP)

#### First-Time User (No Key Configured)
1. User creates account
2. User starts first agent workflow
3. **Platform default model activates automatically** (no configuration required)
4. User sees "Using platform AI model" indicator in UI
5. Agent executes successfully

#### User Wants to Use Own Key (Simple Mode — Default)
1. User navigates to Settings → AI Providers
2. User selects provider (OpenAI / Anthropic / OpenRouter)
3. User enters API key
4. **System auto-selects default model for provider** (e.g., OpenAI → GPT-4 Turbo)
5. System validates key (test call)
6. If valid: Key saved (encrypted), user sees "Using your OpenAI key" indicator
7. If invalid: Error shown, key NOT saved, platform default continues working

#### User Wants Model Control (Advanced Mode — Optional)
1. User navigates to Settings → AI Providers
2. User toggles "Advanced" mode
3. User selects provider (OpenAI / Anthropic / OpenRouter)
4. **User selects specific model** (e.g., OpenAI → GPT-4 Turbo vs GPT-3.5 Turbo)
5. User enters API key
6. System validates key with selected model
7. If valid: Key + model saved, user sees "Using your OpenAI (GPT-4 Turbo)" indicator

#### Rate Limit Handling (Default Behavior)
**When user's API key hits rate limit:**
1. Agent workflow fails gracefully
2. User sees error: "Your OpenAI key has reached rate limit. Please wait or switch providers."
3. **No automatic fallback to platform default** (prevents unexpected costs)
4. User can manually switch to platform default or wait for quota reset

**Optional Fallback Policy (User/Workspace Setting — Future):**
- User can opt-in to "Allow fallback to platform default on rate limit"
- If enabled: System automatically switches to platform default when user key fails
- User notified: "Switched to platform AI due to rate limit on your OpenAI key"
- **MVP: Fallback policy NOT implemented (fail gracefully only)**

#### Workspace Admin Configures Org Key (FUTURE — Not MVP)
1. Admin navigates to Workspace Settings → AI Providers
2. Admin enters workspace-level key (applies to all workspace members)
3. System validates key
4. If valid: All workspace users now use org key (overrides individual user keys)
5. Users see "Using workspace AI model" indicator

### UI Indicators
**Status Badge in Agent Execution View (MVP):**
- 🟢 **"Platform AI"** — Using platform default
- 🔵 **"Your OpenAI Key"** — Using user-provided key (simple mode)
- 🔵 **"Your OpenAI (GPT-4 Turbo)"** — Using user-provided key + specific model (advanced mode)

**Status Badge (Future — Post-MVP):**
- 🟣 **"Workspace AI"** — Using workspace/org key

**Settings Page Display (MVP — Simple Mode):**
```
AI Providers
├── Platform Default: ✅ Active (no setup required)
├── Your Keys (Simple Mode):
│   ├── OpenAI: sk-ab***REDACTED*** [Auto: GPT-4 Turbo] [Update] [Delete]
│   ├── Anthropic: (not configured) [Add Key]
│   └── OpenRouter: (not configured) [Add Key]
└── [Toggle: Switch to Advanced Mode]
```

**Settings Page Display (MVP — Advanced Mode):**
```
AI Providers
├── Platform Default: ✅ Active (no setup required)
├── Your Keys (Advanced Mode):
│   ├── OpenAI: sk-ab***REDACTED***
│   │   └── Model: GPT-4 Turbo [Change] [Update] [Delete]
│   ├── Anthropic: (not configured) [Add Key + Select Model]
│   └── OpenRouter: (not configured) [Add Key + Select Model]
└── [Toggle: Switch to Simple Mode]
```

**Settings Page Display (Future — Workspace Keys):**
```
AI Providers
├── Platform Default: ✅ Active (no setup required)
├── Your Keys:
│   ├── OpenAI: sk-ab***REDACTED*** [Update] [Delete]
│   ├── Anthropic: (not configured) [Add Key]
│   └── OpenRouter: (not configured) [Add Key]
└── Workspace Keys: (configured by admin — FUTURE)
    └── OpenAI: sk-xy***REDACTED*** (overrides your personal key)
```

---

## 8. Final Decisions (Gate 6 Decision Patch Applied)

### Decision 1: Workspace Key Scope (Q1 Resolution)
**Decision:** Workspace keys are a **FUTURE capability** (not in MVP scope).

**MVP Implementation:**
- User-level keys ONLY (no workspace/org keys in initial release)
- Platform default + user override precedence model
- Architecture future-proofed for workspace keys post-MVP

**Future Implementation (Post-MVP):**
- Workspace keys will be **workspace-specific** (Option A selected)
- Each workspace has its own keys (Workspace A uses OpenAI, Workspace B uses Claude)
- Workspace keys override user keys within that specific workspace only
- Users in multiple workspaces see different providers based on workspace context

**Rationale:** MVP focuses on core user experience (platform default + user keys). Workspace-level control adds complexity suitable for post-MVP enterprise features.

### Decision 2: Model Selection Granularity (Q2 Resolution)
**Decision:** Support both **Simple Mode** (provider-level) and **Advanced Mode** (provider + model).

**Simple Mode (Default):**
- User selects provider (OpenAI / Anthropic / OpenRouter)
- System auto-selects default model for provider (e.g., OpenAI → GPT-4 Turbo)
- Zero configuration burden for casual users
- UI shows: "Your OpenAI Key" (model abstracted)

**Advanced Mode (Opt-In):**
- User toggles "Advanced" mode in Settings
- User selects provider + specific model (e.g., OpenAI → GPT-4 Turbo vs GPT-3.5 Turbo)
- More control over costs and capabilities for power users
- UI shows: "Your OpenAI (GPT-4 Turbo)" (model explicit)

**Rationale:** Balances frictionless experience (simple mode) with power user control (advanced mode). No user forced to choose models unless they want granular control.

### Decision 3: Rate Limit Handling (Q3 Resolution)
**Decision:** Fail gracefully by default; allow fallback ONLY via explicit opt-in policy.

**Default Behavior (MVP):**
- When user's API key hits rate limit, agent workflow fails gracefully
- User sees error: "Your OpenAI key has reached rate limit. Please wait or switch providers."
- **No automatic fallback to platform default** (prevents unexpected platform costs)
- User must manually switch to platform default or wait for quota reset

**Future Fallback Policy (Post-MVP):**
- User/workspace setting: "Allow fallback to platform default on rate limit"
- If enabled: System automatically switches to platform default when user key fails
- User notified: "Switched to platform AI due to rate limit on your OpenAI key"
- Fallback is opt-in, NEVER silent

**Rationale:** Default behavior prevents unexpected platform costs (user expects to use their own quota). Opt-in fallback provides convenience for users who prefer uninterrupted workflows over cost control.

### Decision Summary Table
| Question | Decision | MVP Scope | Future Scope |
|----------|----------|-----------|--------------|
| Q1: Workspace Key Scope | Workspace-specific | NOT in MVP | Post-MVP: workspace-specific precedence |
| Q2: Model Selection | Simple + Advanced modes | MVP: both modes | Advanced mode with more models |
| Q3: Rate Limit Handling | Fail gracefully | MVP: fail gracefully only | Post-MVP: opt-in fallback policy |

---

## 9. Acceptance Checklist

### Implementation Complete When:

#### Functional Requirements (MVP)
- [ ] Platform default model executes agent workflows without user key configuration
- [ ] Users can add/update/delete API keys for OpenAI, Anthropic, OpenRouter
- [ ] User-provided keys override platform default (precedence verified)
- [ ] Invalid keys rejected on save (validation test call passes)
- [ ] Key rotation updates immediately (no stale key usage)
- [ ] Simple mode: Provider selection auto-selects default model
- [ ] Advanced mode: Provider + model selection available
- [ ] Rate limit handling: Fail gracefully with clear error message (no automatic fallback)

#### Security Requirements
- [ ] API keys encrypted at rest (AES-256 or equivalent)
- [ ] API keys NEVER appear in logs (redacted to first 4 chars or `***REDACTED***`)
- [ ] API keys NEVER appear in error messages (redaction verified)
- [ ] API keys transmitted over HTTPS only (TLS verified)
- [ ] Keys NOT stored in frontend localStorage/cookies (verified in DevTools)
- [ ] Database backups contain encrypted keys only (NOT plaintext)

#### Auditability Requirements (MVP)
- [ ] Audit log entry created on key creation (user_id, provider, timestamp)
- [ ] Audit log entry created on key usage (user_id, provider, model, job_id, timestamp)
- [ ] Audit log entry created on key rotation (user_id, provider, timestamp)
- [ ] Audit log entry created on key deletion (user_id, provider, timestamp)
- [ ] Audit logs retained for compliance period (90 days minimum)

#### Auditability Requirements (Future — Post-MVP)
- [ ] Workspace admins can view org key audit logs (requires workspace key feature)

#### UX Requirements (MVP)
- [ ] UI indicator shows which provider is active ("Platform AI" / "Your OpenAI Key")
- [ ] Settings page displays redacted keys (first 4 chars visible)
- [ ] Key validation errors displayed clearly ("Invalid API key for OpenAI")
- [ ] Copy-to-clipboard includes full key (with user confirmation prompt)
- [ ] Simple/Advanced mode toggle functional in Settings
- [ ] Advanced mode shows model selection dropdown
- [ ] Rate limit errors show actionable message (wait or switch providers)

#### UX Requirements (Future — Post-MVP)
- [ ] "Workspace AI" indicator (requires workspace key feature)
- [ ] Workspace Settings page for org-level key configuration

#### Architecture Integration
- [ ] AIService resolves provider based on precedence rules
- [ ] Orchestrator injects AIService as tool to agent runtime
- [ ] Agent workflows agnostic to key source (transparent to agent code)
- [ ] MCP-only integration rule NOT violated (AI keys exempt, GitHub/Jira tokens still MCP-only)

---

## 10. Implementation Notes

### Database Schema (Expected)
```sql
-- User-level API keys
CREATE TABLE user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL CHECK (provider IN ('openai', 'anthropic', 'openrouter')),
  encrypted_key TEXT NOT NULL,
  key_hash VARCHAR(64) NOT NULL, -- SHA-256 hash for audit/comparison without decryption
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  UNIQUE(user_id, provider) -- One key per provider per user
);

-- Workspace-level API keys (org settings)
CREATE TABLE workspace_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL CHECK (provider IN ('openai', 'anthropic', 'openrouter')),
  encrypted_key TEXT NOT NULL,
  key_hash VARCHAR(64) NOT NULL,
  configured_by UUID REFERENCES users(id), -- Admin who configured
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  UNIQUE(workspace_id, provider)
);

-- Audit log for key lifecycle events
CREATE TABLE api_key_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  workspace_id UUID REFERENCES workspaces(id), -- NULL if user-level event
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('created', 'used', 'rotated', 'deleted', 'validation_failed')),
  provider VARCHAR(50) NOT NULL,
  model VARCHAR(100), -- NULL unless event_type = 'used'
  job_id UUID, -- NULL unless event_type = 'used'
  key_hash VARCHAR(64), -- Hash of key involved (allows correlation without exposing key)
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB -- Additional context (error messages, IP address, etc.)
);

CREATE INDEX idx_audit_user ON api_key_audit_log(user_id, timestamp DESC);
CREATE INDEX idx_audit_workspace ON api_key_audit_log(workspace_id, timestamp DESC);
CREATE INDEX idx_audit_event_type ON api_key_audit_log(event_type, timestamp DESC);
```

### AIService Pseudocode (Expected)
```typescript
class AIService {
  async resolveProvider(userId: string, workspaceId?: string): Promise<AIProvider> {
    // Precedence: workspace → user → platform default

    // 1. Check workspace key (highest precedence)
    if (workspaceId) {
      const workspaceKey = await this.getWorkspaceKey(workspaceId);
      if (workspaceKey) {
        await this.auditLog(userId, workspaceId, 'used', workspaceKey.provider);
        return { provider: workspaceKey.provider, key: decrypt(workspaceKey.encrypted_key) };
      }
    }

    // 2. Check user key (middle precedence)
    const userKey = await this.getUserKey(userId);
    if (userKey) {
      await this.auditLog(userId, null, 'used', userKey.provider);
      return { provider: userKey.provider, key: decrypt(userKey.encrypted_key) };
    }

    // 3. Platform default (fallback)
    await this.auditLog(userId, null, 'used', 'platform_default');
    return { provider: 'platform_default', key: process.env.PLATFORM_AI_KEY };
  }

  async saveUserKey(userId: string, provider: string, plainKey: string): Promise<void> {
    // Validate key with test call
    const isValid = await this.validateKey(provider, plainKey);
    if (!isValid) {
      await this.auditLog(userId, null, 'validation_failed', provider);
      throw new Error(`Invalid API key for ${provider}`);
    }

    // Encrypt and store
    const encryptedKey = encrypt(plainKey);
    const keyHash = sha256(plainKey);
    await db.insert(userApiKeys).values({ userId, provider, encryptedKey, keyHash });
    await this.auditLog(userId, null, 'created', provider);
  }

  private redactKey(key: string): string {
    if (key.length < 8) return '***REDACTED***';
    return `${key.slice(0, 4)}***REDACTED***`;
  }
}
```

### Redaction Utility (Expected)
```typescript
// backend/src/utils/redaction.ts
export function redactApiKey(key: string): string {
  if (!key || key.length < 8) return '***REDACTED***';
  return `${key.slice(0, 4)}***REDACTED***`;
}

export function sanitizeLogData(data: any): any {
  // Recursively redact fields named 'apiKey', 'api_key', 'authorization', etc.
  if (typeof data === 'string') {
    if (data.startsWith('sk-') || data.startsWith('Bearer ')) {
      return redactApiKey(data);
    }
    return data;
  }
  if (Array.isArray(data)) {
    return data.map(sanitizeLogData);
  }
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes('key') || lowerKey.includes('token') || lowerKey.includes('secret') || lowerKey === 'authorization') {
        sanitized[key] = redactApiKey(String(value));
      } else {
        sanitized[key] = sanitizeLogData(value);
      }
    }
    return sanitized;
  }
  return data;
}
```

---

## 11. Authentication Consistency

### Alignment with Canonical Auth Documentation
This AI provider key strategy is consistent with `backend/docs/Auth.md` canonical authentication architecture.

**Key Alignment Points:**
1. **Email/Password Primary:** User authentication uses email/password + verification as primary method (from Auth.md)
2. **AI Keys Secondary:** AI provider keys are user preferences, NOT authentication credentials
3. **JWT Pattern Reuse:** Encryption patterns from JWT implementation apply to AI key storage
4. **OAuth Available:** Auth.md confirms OAuth (Google/GitHub) available but NOT primary; same pattern applies to AI providers (optional, not required)

**No Contradictions:**
- ✅ Auth.md states email/password + verification remains primary → This strategy does NOT change authentication flows
- ✅ Auth.md confirms OAuth available (S0.4.2, PR #90) → This strategy adds AI provider keys as separate concern
- ✅ Auth.md uses JWT + encryption → This strategy reuses same encryption patterns for AI keys

**Clarification:**
- **User authentication:** Email/password + verification (primary), OAuth available (Auth.md)
- **AI provider configuration:** Platform default (works immediately), user keys optional (this strategy)
- **These are separate concerns:** Users authenticate with email/password, then optionally configure AI keys

---

## 12. MVP vs Future Scope Summary

### MVP (Current Implementation Scope)
**Included in MVP:**
- ✅ Platform default model (works without user keys)
- ✅ User-level keys (OpenAI, Anthropic, OpenRouter)
- ✅ Simple mode (provider auto-selects model)
- ✅ Advanced mode (provider + model selection)
- ✅ User → Platform precedence only
- ✅ Fail gracefully on rate limit (no fallback)
- ✅ Encryption at rest + in transit
- ✅ Redaction in logs/UI
- ✅ Audit logging (user-level events)
- ✅ Key rotation (update/delete)

**NOT in MVP (Future Scope):**
- ❌ Workspace/organization keys (post-MVP)
- ❌ Workspace → User → Platform precedence (post-MVP)
- ❌ Opt-in fallback to platform default on rate limit (post-MVP)
- ❌ Workspace admin audit log access (post-MVP)
- ❌ Token usage analytics (future feature)

### Future Roadmap (Post-MVP)
1. **Workspace Keys:** Org-level AI provider control (workspace-specific scope)
2. **Fallback Policy:** Opt-in automatic fallback to platform default on rate limit
3. **Usage Analytics:** Detailed cost tracking per user/workspace
4. **Model Catalog Expansion:** Support for more providers and models
5. **Self-Hosted Models:** Local LLM support (long-term future)

---

## 13. Non-Goals (Out of Scope)

This strategy does NOT cover:
- **Model fine-tuning:** Users cannot upload fine-tuned models
- **Self-hosted models:** No support for local LLMs or on-prem deployments
- **Token usage analytics:** Detailed cost tracking per user (future feature)
- **Key sharing between users:** Each user has their own keys (no team key pools)
- **Automatic key provisioning:** Users must manually enter their own keys

---

## 12. References

**Input Documents:**
- `.cursor/context/CONTEXT_ARCHITECTURE.md` — AIService architecture
- `.cursor/context/CONTEXT_SCOPE.md` — Platform scope and requirements
- `docs/ops/REPO_REALITY_BASELINE.md` — Evidence-driven approach mandate

**Related Architecture:**
- `backend/docs/Auth.md` — Authentication patterns (JWT, encryption)
- `backend/src/services/ai/` — AIService implementation (expected location)

**Compliance:**
- `docs/ops/PM_NAMING_SYSTEM.md` — Status vocabulary (Not Started / In Progress / Done)
- MCP-only integration rule (GitHub/Atlassian tokens) — AI keys EXEMPT

---

*Gate 6 Decision Patch applied 2026-01-28. Strategy approved and implementation-ready. All open questions resolved (Q1: Workspace keys future-scoped, Q2: Simple+Advanced modes, Q3: Fail gracefully with opt-in fallback future).*
