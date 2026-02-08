# Phase Gate 6 Execution Report

> **Gate:** Phase Gate 6 — AI Provider + Key Management Strategy
> **Executed:** 2026-01-28
> **Decision Patch Applied:** 2026-01-28
> **Branch:** `docs/restructure-2026-01`
> **Status:** APPROVED — Implementation-Ready

---

## 1. Gate Scope (Strict Adherence)

**Files Created:**
- `docs/ai/AI_PROVIDER_KEY_STRATEGY.md` (canonical strategy document)
- `docs/ops/PHASE_GATE_6_REPORT.md` (this file)

**Files NOT Modified (Outside Scope):**
- No code implementation (strategy document only)
- No database migrations (expected schema documented for future implementation)
- No AIService code (architecture mapping documented for future implementation)

**Directories Created:**
- `docs/ai/` (new directory for AI-related strategy and architecture docs)

---

## 2. Strategy Document Contents

### 2.1 Platform Default Model
**Defined:**
- Platform provides default AI model that works without user key configuration
- Zero-friction onboarding (users can start immediately)
- Platform-subsidized or included in base tier

**Key Decision:** Users do NOT need API keys to use basic platform functionality

### 2.2 Optional User Keys
**Supported Providers:**
1. OpenAI (GPT-4, GPT-3.5, etc.)
2. Anthropic Claude (Opus, Sonnet, Haiku)
3. OpenRouter (unified gateway)

**Benefits Documented:**
- Model selection control
- Direct billing to user account
- User's own rate limits
- Provider-specific features

**Configuration Location:** User Settings → AI Providers

### 2.3 Precedence Rules
**Hierarchy Defined (Highest to Lowest):**
```
1. Workspace/Organization Keys (org-level control)
   ↓
2. User-Provided Keys (individual choice)
   ↓
3. Platform Default Model (fallback)
```

**Example Scenarios:** 4 scenarios documented with rationale

### 2.4 Security Requirements (5 Categories)

#### 4.1 No Secrets in Logs
- API keys MUST NEVER appear in logs, error messages, or debug output
- Redaction format: `sk-ab***REDACTED***` or first 4 chars only
- Implementation checklist: 5 items (logs, errors, network inspector, etc.)
- Test case provided (BAD vs GOOD logging examples)

#### 4.2 Redaction Expectations
- All keys displayed in UI or logs MUST be redacted
- Redaction formats documented (first 4-6 chars + mask OR last 6 chars only)
- Implementation checklist: 4 items (Settings UI, API responses, copy-to-clipboard, audit logs)

#### 4.3 Storage Posture
- Keys MUST be encrypted at rest (AES-256 or equivalent)
- Keys MUST be encrypted in transit (HTTPS/TLS)
- Encryption keys stored separately from application database
- Implementation checklist: 5 items (database encryption, key vault, TLS, no frontend storage, backups)
- Expected database schema provided (user_api_keys table)

#### 4.4 Rotation Guidance
- Users MUST be able to rotate keys at any time
- Old keys invalidated immediately (no grace period)
- In-flight jobs NOT broken by rotation (graceful transition)
- Implementation checklist: 5 items (UI actions, validation, audit logging, etc.)
- Rotation flow documented (4 steps: provide → validate → replace → log)

#### 4.5 Auditability
- ALL key usage MUST be auditable (who, when, which provider)
- Audit log requirements: 5 items (creation, usage, rotation, deletion, retention)
- Expected audit log schema provided (api_key_audit_log table)

### 2.5 Architecture Mapping
**Existing Components Identified:**
- AIService (backend service for AI provider interactions)
- Orchestrator-Injected Tools (agent runtime with tool injection)
- Fastify 4.x backend (verified in package.json)
- PostgreSQL + Drizzle ORM (verified in package.json)

**Strategy → Architecture Mapping Table:**
| Strategy Concept | Architecture Component | Expected Implementation Location |
|------------------|------------------------|----------------------------------|
| Platform Default Model | AIService default provider config | backend/src/services/ai/ |
| User Keys | AIService key override logic | backend/src/services/ai/keyManager.ts |
| Precedence Rules | AIService key resolution | backend/src/services/ai/keyResolver.ts |
| Encryption | Database + encryption layer | backend/src/db/schema/userApiKeys.ts |
| Redaction | Logging middleware | backend/src/utils/redaction.ts |
| Audit Log | Audit logging service | backend/src/services/audit/apiKeyAudit.ts |

**Expected AIService Interface:** TypeScript interface documented with 5 key methods

**Orchestrator Integration:** AIService injected as tool, agent workflows transparent to key management

### 2.6 MCP-Only Integration Rule Compliance
**Clarification Documented:**
- **MCP-only rule applies to:** External service integrations (GitHub, Atlassian, Google Workspace)
- **AI provider keys EXEMPT:** Core platform functionality, storage required
- ✅ AI keys: Stored encrypted in backend database (this strategy)
- ❌ GitHub/Jira tokens: NEVER stored in backend (MCP-only per CONTEXT_ARCHITECTURE)

### 2.7 UX Expectations
**User Flows Documented:**
1. First-time user (no key) → platform default activates automatically
2. User adds own key → Settings flow with validation
3. Workspace admin configures org key → applies to all workspace members

**UI Indicators Defined:**
- 🟢 "Platform AI" — using platform default
- 🔵 "Your OpenAI Key" — using user-provided key
- 🟣 "Workspace AI" — using workspace/org key

**Settings Page Mockup:** Hierarchical display with redacted keys

### 2.8 Open Questions Flagged
**3 Decision Points Requiring Approval:**
1. **Workspace key scope:** Workspace-specific vs user-org-level? (Recommended: workspace-specific)
2. **Model selection granularity:** Provider-level vs provider+model? (Recommended: provider+model for control)
3. **Rate limit handling:** Fail gracefully vs fallback to platform? (Recommended: fail gracefully, no automatic fallback)

### 2.9 Acceptance Checklist
**27 Acceptance Criteria Defined:**
- 6 Functional Requirements (platform default works, user keys override, workspace precedence, validation, rotation)
- 6 Security Requirements (encryption, redaction, TLS, no frontend storage, backups)
- 5 Auditability Requirements (audit log events, retention, admin access)
- 5 UX Requirements (indicators, settings display, validation errors, copy-to-clipboard)
- 5 Architecture Integration Requirements (AIService resolution, orchestrator injection, MCP compliance)

### 2.10 Non-Goals
**5 Out-of-Scope Items Documented:**
- Model fine-tuning
- Self-hosted models
- Token usage analytics
- Key sharing between users
- Automatic key provisioning

---

## 3. Evidence Sources Used

**Architecture Context:**
- `.cursor/context/CONTEXT_ARCHITECTURE.md` — AIService component identification, MCP-only integration rule
- `.cursor/context/CONTEXT_SCOPE.md` — Platform requirements and scope

**Implementation Reality:**
- `backend/package.json` — Fastify 4.x + Drizzle ORM verification (for architecture mapping)
- `frontend/package.json` — React 19 + Vite verification (for architecture mapping)

**Auth Patterns Reference:**
- `backend/docs/Auth.md` — JWT + encryption patterns (applied to key storage design)

**Process Compliance:**
- `docs/ops/REPO_REALITY_BASELINE.md` — Evidence-driven approach mandate
- `docs/ops/PM_NAMING_SYSTEM.md` — Status vocabulary (used in acceptance checklist)

---

## 4. Key Decisions Made

### Decision 1: Platform Default Model Scope
**Choice:** Platform default model works without ANY user configuration
**Rationale:** Zero-friction onboarding, security (users don't manage sensitive keys), consistent experience
**Impact:** Users can start using AI agents immediately upon account creation

### Decision 2: Optional User Keys (Not Required)
**Choice:** User keys are OPTIONAL overrides, NOT required for platform functionality
**Rationale:** Balances user control (power users with own keys) with simplicity (casual users use default)
**Impact:** Two-tier experience: casual users (platform default) vs power users (own keys)

### Decision 3: Workspace Key Precedence
**Choice:** Workspace keys override user keys (highest precedence)
**Rationale:** Organizations need control over AI provider/costs across their members
**Impact:** Workspace admins can enforce org-wide AI provider policy

### Decision 4: AI Keys Exempt from MCP-Only Rule
**Choice:** AI provider keys stored encrypted in backend database (NOT MCP-only)
**Rationale:** AI keys are core platform functionality (not external service integration like GitHub/Jira)
**Impact:** Backend stores encrypted AI keys; MCP-only rule still applies to GitHub/Atlassian/Google tokens

### Decision 5: Explicit Security Checklist
**Choice:** Security requirements written as testable checklist items (not vague principles)
**Rationale:** Implementation teams need concrete, verifiable requirements
**Impact:** 27 specific acceptance criteria defined for QA validation

### Decision 6: Redaction Standard
**Choice:** Redact to first 4 chars + `***REDACTED***` (e.g., `sk-ab***REDACTED***`)
**Rationale:** Allows visual differentiation between keys while protecting full value
**Impact:** Consistent redaction format across logs, UI, error messages

### Decision 7: No Automatic Fallback on Rate Limit
**Choice:** When user key hits rate limit, FAIL gracefully (do NOT auto-fallback to platform default)
**Rationale:** Prevents unexpected platform costs, user expects to use their own quota
**Impact:** Users see clear error when their key quota exhausted

---

## 5. Open Questions for User Approval

### Question 1: Workspace Key Scope
**Context:** Should workspace keys apply to all workspaces the user belongs to, or only the specific workspace where configured?

**Option A (Recommended):** Workspace-specific (one org uses OpenAI, another uses Claude)
**Option B:** User belongs to org → all orgs' workspace keys apply based on current context

**Approval Needed:** Which option should be the canonical behavior?

### Question 2: Model Selection Granularity
**Context:** Should users select just the provider (OpenAI) or provider + specific model (OpenAI + GPT-4 Turbo)?

**Option A:** Provider-level only (system picks best model for provider)
**Option B (Recommended):** Provider + model selection (user chooses GPT-4 vs GPT-3.5)

**Approval Needed:** Which level of control should users have?

### Question 3: Rate Limit Handling
**Context:** What happens when user's API key hits rate limit during agent execution?

**Option A (Recommended):** Fail gracefully, show error to user, do NOT fallback to platform default
**Option B:** Automatic silent fallback to platform default (with notification)

**Approval Needed:** Should system fail or fallback when user key rate limited?

---

## 6. Validation Checklist

### Strategy Completeness
- [x] Platform default model defined (works without user keys)
- [x] Optional user keys documented (OpenAI, Anthropic, OpenRouter)
- [x] Precedence rules specified (workspace → user → platform)
- [x] Security requirements explicit and testable (27 acceptance criteria)
- [x] Architecture mapping completed (AIService, orchestrator, database)
- [x] MCP-only rule compliance verified (AI keys exempt)
- [x] UX expectations defined (flows, indicators, Settings page)
- [x] Non-goals documented (5 out-of-scope items)

### Security Checklist Coverage
- [x] No secrets in logs (requirement + implementation checklist + test case)
- [x] Redaction expectations (format + implementation checklist)
- [x] Storage posture (encryption at rest + in transit + implementation checklist + schema)
- [x] Rotation guidance (flow + implementation checklist)
- [x] Auditability (audit log requirements + schema + retention)

### Implementation Guidance
- [x] Expected database schema provided (user_api_keys, workspace_api_keys, audit_log)
- [x] AIService pseudocode provided (resolveProvider, saveUserKey, redactKey methods)
- [x] Redaction utility pseudocode provided (sanitizeLogData function)
- [x] Acceptance checklist provided (27 items across 5 categories)

### Documentation Quality
- [x] Clear section structure (12 sections)
- [x] Evidence sources cited (6 input documents)
- [x] Trade-offs explained (open questions section)
- [x] Examples provided (precedence scenarios, code snippets, UI mockups)
- [x] Non-goals explicit (prevents scope creep)

---

## 7. Summary Statistics

| Metric | Count | Details |
|--------|-------|---------|
| **Files Created** | 2 | AI_PROVIDER_KEY_STRATEGY.md, PHASE_GATE_6_REPORT.md |
| **Directories Created** | 1 | docs/ai/ |
| **Security Requirements** | 5 | Logs, redaction, storage, rotation, audit |
| **Acceptance Criteria** | 27 | Functional (6), Security (6), Audit (5), UX (5), Architecture (5) |
| **Supported Providers** | 3 | OpenAI, Anthropic, OpenRouter |
| **Open Questions** | 3 | Workspace scope, model granularity, rate limit handling |
| **Database Schemas** | 3 | user_api_keys, workspace_api_keys, api_key_audit_log |
| **Code Snippets** | 3 | AIService pseudocode, redaction utility, test cases |
| **Non-Goals** | 5 | Fine-tuning, self-hosted, analytics, key sharing, auto-provisioning |

---

## 8. Architecture Integration

### Existing Components Referenced
- **AIService:** Backend service for AI provider interactions (from CONTEXT_ARCHITECTURE.md)
- **Orchestrator:** Agent runtime with tool injection (from CONTEXT_ARCHITECTURE.md)
- **Fastify 4.x:** Backend framework (verified in backend/package.json)
- **Drizzle ORM:** Database layer (verified in backend/package.json)
- **JWT + Encryption:** Auth patterns (referenced from backend/docs/Auth.md)

### Expected Implementation Locations
| Component | Expected Path |
|-----------|---------------|
| AIService key resolver | backend/src/services/ai/keyResolver.ts |
| User key manager | backend/src/services/ai/keyManager.ts |
| Database schema | backend/src/db/schema/userApiKeys.ts |
| Redaction utility | backend/src/utils/redaction.ts |
| Audit logging | backend/src/services/audit/apiKeyAudit.ts |

**Note:** Paths are expected locations for future implementation (NOT created in this gate)

### MCP-Only Rule Compliance
**Clarification:** AI provider keys are EXEMPT from MCP-only integration rule
- **MCP-only applies to:** GitHub, Atlassian, Google Workspace tokens (NEVER stored in backend)
- **AI keys different:** Core platform functionality, encrypted storage required
- **Compliance:** Strategy explicitly documents this exemption with rationale

---

## 9. Security Posture Summary

### Encryption Requirements
- **At Rest:** AES-256 or equivalent for database storage
- **In Transit:** HTTPS/TLS for all key transmission
- **Key Management:** Encryption keys stored separately (environment variables or key vault)

### Redaction Requirements
- **Format:** `sk-ab***REDACTED***` (first 4 chars visible)
- **Scope:** ALL logs, error messages, UI displays, audit logs
- **Exception:** Copy-to-clipboard shows full key (with user confirmation)

### Audit Requirements
- **Events Logged:** created, used, rotated, deleted, validation_failed
- **Data Captured:** user_id, workspace_id, provider, model, job_id, timestamp, key_hash
- **Retention:** Minimum 90 days (compliance period)
- **Access:** Workspace admins can view org key audit logs

### Validation Requirements
- **On Save:** Test API call to provider (key must work before storage)
- **On Failure:** Reject key, show error to user, do NOT save
- **Audit:** Log validation_failed events for security monitoring

---

## 10. UX Design Decisions

### Status Indicators
**Defined 3 UI Badge States:**
- 🟢 "Platform AI" — using platform default
- 🔵 "Your OpenAI Key" — using user-provided key
- 🟣 "Workspace AI" — using workspace/org key

**Rationale:** Users need clear visibility into which AI provider is active

### Settings Page Structure
**Hierarchical Display:**
```
AI Providers
├── Platform Default: ✅ Active (no setup required)
├── Your Keys: (user-level configuration)
│   ├── OpenAI: sk-ab***REDACTED*** [Update] [Delete]
│   ├── Anthropic: (not configured) [Add Key]
│   └── OpenRouter: (not configured) [Add Key]
└── Workspace Keys: (configured by admin)
    └── OpenAI: sk-xy***REDACTED*** (overrides your personal key)
```

**Rationale:** Clear hierarchy shows precedence and override behavior

### User Flows
**3 Flows Documented:**
1. First-time user → platform default activates automatically (no configuration)
2. User adds own key → Settings → provider selection → validation → save
3. Workspace admin configures org key → applies to all workspace members

---

## 11. Final Decisions (Gate 6 Decision Patch)

### Decision 1: Workspace Key Scope (Q1 — RESOLVED)
**Decision:** Workspace keys are **FUTURE capability** (not in MVP scope).

**MVP Implementation:**
- User-level keys ONLY (no workspace/org keys in initial release)
- Platform default + user override precedence model (2-tier hierarchy)
- Architecture future-proofed for workspace keys post-MVP

**Future Implementation (Post-MVP):**
- Workspace keys will be **workspace-specific** (Option A selected)
- Each workspace has its own keys (Workspace A uses OpenAI, Workspace B uses Claude)
- Workspace → User → Platform precedence (3-tier hierarchy)

**Rationale:** MVP focuses on core user experience. Workspace-level control adds complexity suitable for post-MVP enterprise features.

### Decision 2: Model Selection Granularity (Q2 — RESOLVED)
**Decision:** Support both **Simple Mode** (provider-level) and **Advanced Mode** (provider + model).

**Simple Mode (Default):**
- User selects provider only (OpenAI / Anthropic / OpenRouter)
- System auto-selects default model for provider (e.g., OpenAI → GPT-4 Turbo)
- Zero configuration burden for casual users
- UI shows: "Your OpenAI Key" (model abstracted)

**Advanced Mode (Opt-In):**
- User toggles "Advanced" mode in Settings
- User selects provider + specific model (e.g., OpenAI → GPT-4 Turbo vs GPT-3.5 Turbo)
- More control over costs and capabilities for power users
- UI shows: "Your OpenAI (GPT-4 Turbo)" (model explicit)

**Rationale:** Balances frictionless experience (simple mode) with power user control (advanced mode). Hybrid approach combines best of both options.

### Decision 3: Rate Limit Handling (Q3 — RESOLVED)
**Decision:** Fail gracefully by default; allow fallback ONLY via explicit opt-in policy (future).

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

**Rationale:** Default behavior (fail gracefully) prevents unexpected platform costs. Opt-in fallback (future) provides convenience for users who prefer uninterrupted workflows.

### Decision Impact on Strategy Document
**Sections Updated in AI_PROVIDER_KEY_STRATEGY.md:**
- Section 3 (Precedence Rules): MVP vs Future scope clarified, workspace keys marked FUTURE
- Section 7 (UX Expectations): Simple/Advanced modes documented, rate limit handling detailed
- Section 8 (Open Questions): Replaced with "Final Decisions" documenting Q1-Q3 resolutions
- Section 9 (Acceptance Checklist): Split into MVP and Future requirements
- Section 11 (NEW): Authentication Consistency added (aligns with backend/docs/Auth.md)
- Section 12 (NEW): MVP vs Future Scope Summary added

**All Ambiguity Removed:** Strategy document is now implementation-ready with clear MVP scope.

---

## 12. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| User keys leaked in logs | Medium | High | Explicit redaction requirements + test cases + acceptance checklist |
| Encryption keys compromised | Low | Critical | Store separately from app DB, key vault recommended |
| Platform default costs spiral | Medium | High | Rate limiting + quota monitoring (future feature) |
| Invalid keys break agent workflows | Medium | Medium | Validation on save, clear error messages, fallback to platform default if user key fails |
| Workspace admins abuse org keys | Low | Medium | Audit logging + workspace admin access controls |

---

## 13. Success Criteria

✅ **Platform Default Model Defined:** Works without user keys
✅ **User Keys Optional:** OpenAI, Anthropic, OpenRouter supported
✅ **Precedence Rules Explicit:** Workspace → User → Platform hierarchy
✅ **Security Requirements Testable:** 27 acceptance criteria defined
✅ **Architecture Mapping Complete:** AIService, orchestrator, database integration documented
✅ **MCP-Only Rule Respected:** AI keys exempt, GitHub/Jira tokens still MCP-only
✅ **UX Expectations Defined:** User flows, indicators, Settings page mockup
✅ **Open Questions Flagged:** 3 decision points for approval
✅ **Acceptance Checklist Provided:** 27 items across 5 categories
✅ **Non-Goals Documented:** 5 out-of-scope items to prevent scope creep

---

## 14. Gate 6 Decision Patch Summary

**Patch Applied:** 2026-01-28 (Gate 6 Decision Patch)

**Changes Made:**
1. **Resolved Q1 (Workspace Key Scope):** Workspace keys marked FUTURE (not MVP), workspace-specific design when implemented
2. **Resolved Q2 (Model Selection):** Simple Mode (default, provider-level) + Advanced Mode (opt-in, provider+model)
3. **Resolved Q3 (Rate Limit):** Fail gracefully (MVP), opt-in fallback policy (future)
4. **Added Section 11:** Authentication Consistency (aligns with backend/docs/Auth.md, no contradictions)
5. **Added Section 12:** MVP vs Future Scope Summary (clear implementation boundaries)
6. **Updated Section 3:** Precedence rules split into MVP (2-tier) and Future (3-tier)
7. **Updated Section 7:** UX flows expanded with Simple/Advanced modes and rate limit handling
8. **Updated Section 9:** Acceptance checklist split into MVP and Future requirements
9. **Status Changed:** DRAFT → APPROVED (implementation-ready)

**Validation:**
- ✅ No contradictions with canonical auth docs (Auth.md: email/password primary, OAuth available)
- ✅ Platform default model preserved ("works out of the box" requirement maintained)
- ✅ Security requirements unchanged (27 acceptance criteria still intact)
- ✅ Architecture mapping unchanged (AIService, orchestrator, database schema)
- ✅ MCP-only rule compliance maintained (AI keys exempt, GitHub/Jira still MCP-only)

**Final Status:** Strategy document is implementation-ready. All open questions resolved. Proceed to Phase Gate 7.

---

*Gate 6 executed with security-first approach and evidence-based decisions. Decision Patch applied to finalize MVP scope and future roadmap. Strategy approved and ready for implementation.*
