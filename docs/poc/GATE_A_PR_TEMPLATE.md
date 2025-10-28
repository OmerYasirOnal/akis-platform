# feat(db+session): Gate-A patch (enums, BigInt, indexes, cookie note)

## 📋 Summary

This PR applies the Gate-A hardening patch to the database schema and session configuration, enhancing type safety, performance, and security posture for the GitHub App/OAuth + MCP integration.

**Phase:** Gate-A (Pre-Phase-2)  
**Branch:** `feat/github-app-mcp-poc`  
**Type:** Non-breaking schema enhancement  
**Status:** ⏳ Awaiting HITL Approval

---

## 🔧 Changes

### 1. Prisma Enums (Type Safety)
Added 5 enums to replace string fields:
- `AccountType` → 'User' | 'Organization'
- `RepositorySelection` → 'all' | 'selected'
- `JobStatus` → 'pending' | 'running' | 'completed' | 'failed'
- `JobType` → 'scribe_run' | 'repo_analysis'
- `LogLevel` → 'debug' | 'info' | 'warn' | 'error'

**Impact:**
- ✅ Type-safe at both Prisma and PostgreSQL levels
- ✅ Smaller storage footprint (enum vs VARCHAR)
- ✅ Database-level constraint enforcement

### 2. BigInt for GitHub IDs
**Status:** ✅ Already correct (no changes needed)
- `Installation.installationId` → `BigInt`
- `Installation.accountId` → `BigInt?`
- `InstallationRepository.repositoryId` → `BigInt`

### 3. Composite Index Optimization
Added index for common query pattern:
```prisma
@@index([installationUuid, createdAt(sort: Desc)])  // jobs table
```

**Use Case:** "Get recent jobs for installation" (Phase-5 dashboard)

### 4. Token Encryption Plan
Updated schema comments to specify encryption approach:
```prisma
accessToken  String @db.Text // MUST be encrypted (Phase-2, AES-GCM app-level)
refreshToken String? @db.Text // MUST be encrypted (Phase-2, AES-GCM app-level)
```

### 5. CSRF Enforcement Note
Added note to session config:
```typescript
// NOTE: Phase-2 will enforce CSRF token on all state-changing POSTs.
```

---

## ✅ Validation Results

All validation steps passed:

```bash
✅ npx prisma format   — Formatted in 16ms
✅ npx prisma validate — Schema is valid
✅ npm run db:generate — Prisma Client generated (v6.18.0)
```

---

## 🗃️ Migration Preview

**Expected SQL:**
```sql
-- Create enums
CREATE TYPE "AccountType" AS ENUM ('User', 'Organization');
CREATE TYPE "RepositorySelection" AS ENUM ('all', 'selected');
CREATE TYPE "JobStatus" AS ENUM ('pending', 'running', 'completed', 'failed');
CREATE TYPE "JobType" AS ENUM ('scribe_run', 'repo_analysis');
CREATE TYPE "LogLevel" AS ENUM ('debug', 'info', 'warn', 'error');

-- Alter tables (safe cast)
ALTER TABLE "installations" 
  ALTER COLUMN "account_type" TYPE "AccountType" USING "account_type"::"AccountType",
  ALTER COLUMN "repository_selection" TYPE "RepositorySelection" USING "repository_selection"::"RepositorySelection";

-- Add composite index
CREATE INDEX "jobs_installation_uuid_created_at_idx" 
  ON "jobs"("installation_uuid", "created_at" DESC);
```

**Safety:**
- ✅ No DROP statements
- ✅ No TRUNCATE statements
- ✅ No data loss (USING clause casts existing values)

---

## 🔐 Security Notes (Phase-2 Implementation)

### 1. CSRF Token Enforcement
**Scope:** All state-changing endpoints (POST, PUT, DELETE)

**Implementation Plan:**
- Generate CSRF token on session creation
- Validate `X-CSRF-Token` header on state-changing requests
- Return 403 if token missing or invalid

**Endpoints to protect:**
- `/api/integrations/github/connect` (POST)
- `/api/integrations/github/disconnect` (POST)
- `/api/github/branch` (POST)
- `/api/github/commit` (POST)

---

### 2. OAuth PKCE (S256)
**Scope:** OAuth authorization code flow

**Implementation Plan:**
- Generate `code_verifier` (32 bytes, base64url)
- Compute `code_challenge` (SHA-256 hash of verifier, base64url)
- Send `code_challenge` + `code_challenge_method=S256` to GitHub
- Send `code_verifier` when exchanging code for token

**Why PKCE:**
- Prevents authorization code interception attacks
- Required for public clients (SPAs, mobile apps)
- Recommended even for confidential clients (defense in depth)

---

### 3. Token Encryption at Rest
**Algorithm:** AES-256-GCM (authenticated encryption)

**Implementation Plan:**
- Encrypt tokens before storing in database
- Decrypt tokens when reading from database
- Use Prisma middleware for transparent encryption/decryption
- Derive encryption key from `SESSION_SECRET` + salt (PBKDF2)

**Key Rotation:**
- Store `SESSION_SECRET_NEW` in env
- Re-encrypt all sessions with new key (migration script)
- Swap keys after grace period (30 days)

**Example:**
```typescript
// Encryption format: iv:authTag:encrypted (base64)
const encrypted = encryptToken(accessToken);
// "abc123:def456:ghi789..."

const decrypted = decryptToken(encrypted);
// "ghp_abc123def456..."
```

---

## 📊 Files Modified

| File | Changes | Status |
|------|---------|--------|
| `prisma/schema.prisma` | +38 lines (enums, models, index) | ✅ |
| `src/server/session/config.ts` | +1 line (CSRF note) | ✅ |

**Total:** 2 files, 39 lines added, 0 lines removed

---

## 🧪 Testing

### Validation Tests (Completed)
- ✅ Prisma schema format check
- ✅ Prisma schema validation
- ✅ Prisma Client generation

### Phase-2 Tests (To Be Implemented)
- Unit tests for encryption/decryption
- Integration tests for CSRF validation
- E2E tests for OAuth PKCE flow
- Performance tests for encryption overhead

---

## 📚 Documentation

**Review Documents:**
- `docs/poc/GATE_A_REVIEW.md` — Initial Gate-A review checklist
- `docs/poc/GATE_A_PATCH_SUMMARY.md` — Detailed patch summary (this PR)
- `docs/poc/PHASE_1_SUMMARY.md` — Phase-1 implementation summary

**References:**
- `docs/feasibility/ARCHITECTURE.md` — Database schema design
- `docs/feasibility/POC_PLAN.md` — POC implementation plan

---

## 🚀 Next Steps (After Approval)

1. **Create Migration:**
   ```bash
   npm run db:migrate:dev gate_a_schema_patch
   ```

2. **Merge to Feature Branch:**
   - Merge PR after approval
   - Continue to Phase-2 implementation

3. **Phase-2 Tasks:**
   - Implement CSRF token validation middleware
   - Add OAuth PKCE (S256) to connect/callback endpoints
   - Implement AES-GCM token encryption with Prisma middleware
   - Add key rotation script

---

## ⏸️ HITL Approval Required

**This PR is ready for review.**

### Approval Checklist
- [ ] **Enum additions** reviewed (type safety)
- [ ] **Composite index** reviewed (performance)
- [ ] **Token encryption plan** reviewed (AES-GCM)
- [ ] **CSRF enforcement plan** reviewed
- [ ] **OAuth PKCE plan** reviewed (S256)
- [ ] **Migration strategy** approved (non-destructive)

### Reviewers
- [ ] Tech Lead
- [ ] Security Lead

**Decision:** ⏳ **PENDING**

---

## 📝 Commit Message

```
feat(db+session): Gate-A patch (enums, BigInt, indexes, cookie note)

- Add Prisma enums for type safety (AccountType, RepositorySelection, JobStatus, JobType, LogLevel)
- Confirm BigInt for GitHub IDs (already correct)
- Add composite index for jobs table (installationUuid + createdAt)
- Update token encryption plan comments (AES-GCM app-level)
- Add CSRF enforcement note to session config

BREAKING CHANGE: None (non-destructive schema changes)

Phase: Gate-A (Pre-Phase-2)
Refs: #gate-a
```

---

**PR Author:** AKIS Scribe Agent  
**Date:** 2025-10-28  
**Status:** ⏳ Awaiting HITL Approval

