# 🚦 GATE-A: Prisma Schema & Session Groundwork — Review Request

**Date:** 2025-10-28  
**Branch:** `feat/github-app-mcp-poc`  
**Reviewer:** Tech Lead / Security Lead  
**Phase:** 1 (Data Layer & Sessions)

---

## 📋 Purpose

This gate ensures that the foundational database schema and session management groundwork are:

1. **Secure** → No token leaks, proper encryption markers
2. **Aligned** → Matches ARCHITECTURE.md design
3. **Non-breaking** → Feature flags ensure backward compatibility
4. **Production-ready** → Safe migration path, no destructive operations

**Approval Status:** ⏳ **PENDING APPROVAL**

---

## 🎯 Scope of Review

### What's In Scope (Phase 1)
- ✅ Prisma schema definition (7 tables)
- ✅ HTTPOnly cookie session middleware (in-memory store)
- ✅ Feature flag `SESSION_SERVER_ONLY` (defaults to `false`)
- ✅ Migration scripts and tooling
- ✅ Environment variable updates

### What's Out of Scope (Future Phases)
- ❌ Token encryption implementation (Phase 2+)
- ❌ Database population (Phase 2: webhooks)
- ❌ OAuth migration script (Phase 2)
- ❌ Production deployment (Phase 3)

---

## 🗄️ Schema Review

### Table 1: `users`

**Purpose:** Core user accounts  
**File:** `prisma/schema.prisma:19-32`

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | UUID | Primary key | Auto-generated |
| `email` | VARCHAR(255) | Unique, Not null | Indexed |
| `name` | VARCHAR(255) | Nullable | Display name |
| `createdAt` | Timestamp | Auto | Audit trail |
| `updatedAt` | Timestamp | Auto-update | Audit trail |

**Relations:**
- `identities` → `UserIdentity[]` (1:N, cascade delete)
- `installations` → `Installation[]` (1:N, set null)
- `sessions` → `Session[]` (1:N, cascade delete)
- `jobs` → `Job[]` (1:N, set null)

**Alignment Check:**
```bash
grep -A 10 "Table: \`users\`" docs/feasibility/ARCHITECTURE.md
# Lines 268-278: ✅ Matches exactly
```

**Security Notes:**
- ✅ No sensitive data stored directly (tokens in `sessions`)
- ✅ Email indexed for fast lookups
- ✅ Cascade delete ensures cleanup

---

### Table 2: `user_identities`

**Purpose:** OAuth provider linkage (GitHub, GitLab, etc.)  
**File:** `prisma/schema.prisma:34-52`

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | UUID | Primary key | Auto-generated |
| `userId` | UUID | Foreign key → `users.id` | Cascade delete |
| `provider` | VARCHAR(50) | Not null | 'github', 'gitlab' |
| `providerUserId` | VARCHAR(255) | Not null | GitHub user ID |
| `providerLogin` | VARCHAR(255) | Nullable | GitHub username |
| `providerEmail` | VARCHAR(255) | Nullable | Provider email |
| `providerAvatarUrl` | TEXT | Nullable | Avatar URL |

**Unique Constraint:** `(provider, providerUserId)`  
**Indexes:**
- `userId`
- `(provider, providerUserId)`

**Alignment Check:**
```bash
grep -A 15 "Table: \`user_identities\`" docs/feasibility/ARCHITECTURE.md
# Lines 283-300: ✅ Matches exactly
```

**Security Notes:**
- ✅ No tokens stored here (tokens in `sessions`)
- ✅ Unique constraint prevents duplicate links
- ✅ Cascade delete on user removal

---

### Table 3: `installations`

**Purpose:** GitHub App installations  
**File:** `prisma/schema.prisma:54-83`

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | UUID | Primary key | Auto-generated |
| `installationId` | BIGINT | Unique, Not null | GitHub App installation ID |
| `userId` | UUID | Foreign key → `users.id` | Set null on delete |
| `accountType` | VARCHAR(20) | Not null | 'User' \| 'Organization' |
| `accountLogin` | VARCHAR(255) | Not null | GitHub account login |
| `accountId` | BIGINT | Nullable | GitHub account ID |
| `repositorySelection` | VARCHAR(20) | Not null | 'all' \| 'selected' |
| `permissions` | JSON | Nullable | `{contents: 'write', ...}` |
| `appSlug` | VARCHAR(255) | Nullable | GitHub App slug |
| `htmlUrl` | TEXT | Nullable | Settings URL |
| `status` | VARCHAR(20) | Default: 'active' | 'active' \| 'suspended' \| 'uninstalled' |
| `installedAt` | Timestamp | Not null | Installation date |
| `uninstalledAt` | Timestamp | Nullable | Soft delete |

**Indexes:**
- `installationId` (unique lookup)
- `userId` (user's installations)
- `status` (active installations)

**Alignment Check:**
```bash
grep -A 20 "Table: \`installations\`" docs/feasibility/ARCHITECTURE.md
# Lines 305-327: ✅ Matches exactly
```

**Security Notes:**
- ✅ No tokens stored (tokens fetched server-side)
- ✅ `permissions` JSON for granular checks
- ✅ Soft delete via `uninstalledAt`

---

### Table 4: `installation_repositories`

**Purpose:** Repo access per installation  
**File:** `prisma/schema.prisma:85-102`

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | UUID | Primary key | Auto-generated |
| `installationUuid` | UUID | Foreign key → `installations.id` | Cascade delete |
| `repositoryId` | BIGINT | Not null | GitHub repo ID |
| `repositoryFullName` | VARCHAR(255) | Not null | `owner/repo` |
| `private` | BOOLEAN | Default: false | Privacy flag |
| `defaultBranch` | VARCHAR(255) | Default: 'main' | Default branch |
| `addedAt` | Timestamp | Auto | Audit trail |
| `removedAt` | Timestamp | Nullable | Soft delete |

**Unique Constraint:** `(installationUuid, repositoryId)`  
**Indexes:**
- `installationUuid`
- `repositoryFullName`

**Alignment Check:**
```bash
grep -A 15 "Table: \`installation_repositories\`" docs/feasibility/ARCHITECTURE.md
# Lines 330-347: ✅ Matches exactly
```

**Security Notes:**
- ✅ Auth boundary enforcement (MCP checks this table)
- ✅ Soft delete preserves audit trail
- ✅ Unique constraint prevents duplicates

---

### Table 5: `sessions`

**Purpose:** HTTPOnly session storage (OAuth tokens)  
**File:** `prisma/schema.prisma:104-122`

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | VARCHAR(255) | Primary key | Session ID (random) |
| `userId` | UUID | Foreign key → `users.id` | Cascade delete |
| `provider` | VARCHAR(50) | Not null | 'github' |
| `accessToken` | TEXT | Not null | ⚠️ **MUST BE ENCRYPTED** |
| `refreshToken` | TEXT | Nullable | ⚠️ **MUST BE ENCRYPTED** |
| `tokenExpiresAt` | Timestamp | Nullable | Token expiry |
| `scopes` | String[] | Not null | OAuth scopes |
| `createdAt` | Timestamp | Auto | Audit trail |
| `expiresAt` | Timestamp | Not null | Session expiry (30d) |
| `lastAccessedAt` | Timestamp | Auto | Activity tracking |

**Indexes:**
- `userId`
- `expiresAt` (cleanup job)

**Alignment Check:**
```bash
grep -A 20 "Table: \`sessions\`" docs/feasibility/ARCHITECTURE.md
# Lines 352-375: ✅ Matches exactly
```

**🔴 CRITICAL SECURITY NOTES:**
- ⚠️ **Token Encryption:** `accessToken` and `refreshToken` fields are marked as TEXT but **MUST BE ENCRYPTED** at rest.
  - **Phase 1:** In-memory store (no DB writes yet)
  - **Phase 2:** Implement encryption before storing in DB (use pgcrypto or app-level AES)
- ✅ HTTPOnly cookies (session ID only)
- ✅ Cascade delete on user removal
- ✅ Session expiry tracked

**Migration Note (Schema Comment):**
```prisma
// Line 107: accessToken TEXT NOT NULL // Should be encrypted
// Line 108: refreshToken TEXT // Should be encrypted
```

---

### Table 6: `jobs`

**Purpose:** Agent job tracking (Scribe runs, repo analysis)  
**File:** `prisma/schema.prisma:128-164`

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | UUID | Primary key | Auto-generated |
| `userId` | UUID | Foreign key → `users.id` | Set null on delete |
| `installationUuid` | UUID | Foreign key → `installations.id` | Set null on delete |
| `actorMode` | VARCHAR(20) | Not null | 'oauth_user' \| 'app_bot' \| 'service_account' |
| `actorGithubLogin` | VARCHAR(255) | Nullable | Actor username |
| `repositoryFullName` | VARCHAR(255) | Not null | `owner/repo` |
| `branch` | VARCHAR(255) | Not null | Target branch |
| `baseBranch` | VARCHAR(255) | Nullable | Base branch |
| `jobType` | VARCHAR(50) | Not null | 'scribe_run', 'repo_analysis' |
| `status` | VARCHAR(20) | Default: 'pending' | 'pending' \| 'running' \| 'completed' \| 'failed' |
| `startedAt` | Timestamp | Nullable | Job start time |
| `completedAt` | Timestamp | Nullable | Job completion time |
| `result` | JSON | Nullable | `{pr_number, pr_url, das_score, ...}` |
| `error` | JSON | Nullable | `{code, message, stack}` |

**Indexes:**
- `userId`
- `installationUuid`
- `status`
- `createdAt DESC` (recent jobs)

**Alignment Check:**
```bash
grep -A 30 "Table: \`jobs\`" docs/feasibility/ARCHITECTURE.md
# Lines 832-862: ✅ Matches exactly
```

**Security Notes:**
- ✅ No tokens stored (fetched server-side per job)
- ✅ `actorMode` distinguishes OAuth vs App vs Service Account
- ✅ Result/error JSON for structured data

---

### Table 7: `job_logs`

**Purpose:** Structured logs per job  
**File:** `prisma/schema.prisma:166-179`

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | UUID | Primary key | Auto-generated |
| `jobId` | UUID | Foreign key → `jobs.id` | Cascade delete |
| `timestamp` | Timestamp | Auto | Log time |
| `level` | VARCHAR(10) | Not null | 'debug' \| 'info' \| 'warn' \| 'error' |
| `operation` | VARCHAR(100) | Nullable | 'github.list_repos', 'github.create_pr' |
| `message` | TEXT | Not null | Log message |
| `metadata` | JSON | Nullable | `{duration_ms, pr_number, ...}` |

**Indexes:**
- `(jobId, timestamp DESC)` (recent logs for job)

**Alignment Check:**
```bash
grep -A 12 "Table: \`job_logs\`" docs/feasibility/ARCHITECTURE.md
# Lines 867-879: ✅ Matches exactly
```

**Security Notes:**
- ✅ No tokens in logs (enforced by middleware)
- ✅ Cascade delete on job removal
- ✅ `operation` field for observability

---

## 🔐 Session Groundwork Review

### Feature Flag: `SESSION_SERVER_ONLY`

**File:** `src/server/session/config.ts:14`

```typescript
SERVER_ONLY: process.env.SESSION_SERVER_ONLY === 'true',
```

**Default Behavior:**
- `SESSION_SERVER_ONLY=false` → **Keep localStorage** (current behavior, no breaking changes)
- `SESSION_SERVER_ONLY=true` → **Use HTTPOnly cookies** (secure, recommended)

**Migration Strategy:**
1. Phase 1: Flag defaults to `false` → zero impact
2. Phase 2: Add migration script (localStorage → DB)
3. Phase 3: Flip to `true` in production

**Approval Questions:**
- ✅ Is the default (`false`) acceptable for backward compatibility?
- ✅ Is the deprecation warning (`config.ts:48-52`) sufficient?

---

### HTTPOnly Cookie Configuration

**File:** `src/server/session/config.ts:24-32`

```typescript
COOKIE_OPTIONS: {
  httpOnly: true,          // ✅ No client-side access
  secure: NODE_ENV === 'production', // ✅ HTTPS only in prod
  sameSite: 'lax' as const, // ✅ CSRF protection
  path: '/',
},
```

**Security Checklist:**
- ✅ `httpOnly: true` → No XSS token theft
- ✅ `secure: true` in production → HTTPS enforcement
- ✅ `sameSite: 'lax'` → CSRF protection
- ✅ 30-day expiry (`MAX_AGE`) → Reasonable default

**Approval Questions:**
- ✅ Are cookie settings appropriate for production?
- ✅ Is `sameSite: 'lax'` acceptable (allows top-level navigation)?

---

### In-Memory Store (POC)

**File:** `src/server/session/middleware.ts:29`

```typescript
const sessionStore = new Map<string, SessionData>();
```

**Why In-Memory for POC?**
- ✅ No DB dependency for Phase 1 (schema only)
- ✅ Fast iteration during development
- ✅ Placeholders for DB migration (`// TODO: Phase 2`)

**Production Migration Path:**
- Phase 2: Replace `sessionStore.set()` with `prisma.session.create()`
- Phase 2: Add token encryption layer
- Phase 2: Implement cleanup job (delete expired sessions)

**Approval Questions:**
- ✅ Is in-memory acceptable for POC?
- ✅ Are `// TODO` comments sufficient for production migration?

---

### Session Middleware API

**File:** `src/server/session/middleware.ts`

**Public Functions:**
| Function | Purpose | Evidence |
|----------|---------|----------|
| `createSession(data)` | Create new session | Line 45-76 |
| `getSession(sessionId)` | Fetch session by ID | Line 81-117 |
| `deleteSession(sessionId)` | Delete session | Line 122-130 |
| `setSessionCookie(response, sessionId)` | Set HTTPOnly cookie | Line 135-143 |
| `clearSessionCookie(response)` | Clear cookie | Line 148-151 |
| `requireSession(request)` | Middleware for auth | Line 172-175 |

**Usage Example (Phase 2):**
```typescript
// OAuth callback endpoint
export async function GET(req: NextRequest) {
  const { code } = req.query;
  const { access_token } = await exchangeCodeForToken(code);
  
  const sessionId = await createSession({
    userId: user.id,
    provider: 'github',
    accessToken: access_token,
    scopes: ['repo', 'user:email'],
  });
  
  const response = NextResponse.redirect('/dashboard');
  setSessionCookie(response, sessionId);
  return response;
}
```

**Approval Questions:**
- ✅ Is the API design appropriate for OAuth flows?
- ✅ Are error handling patterns sufficient?

---

## 🔧 Migration Tooling Review

### Migration Script: `scripts/migrate.sh`

**Safety Features:**
| Feature | Implementation | Evidence |
|---------|---------------|----------|
| Production block | `db:migrate:reset` fails if `NODE_ENV=production` | Lines 22-26 |
| Idempotent | Safe to re-run all commands | Prisma migrate is idempotent |
| Named migrations | `npm run db:migrate:dev <name>` | Line 19 |
| Rollback support | Prisma tracks applied migrations | Prisma migrate tracks state |

**Commands:**
```bash
npm run db:migrate:dev init_schema  # Create first migration
npm run db:migrate:deploy           # Production deployment
npm run db:studio                   # Visual DB editor
npm run db:generate                 # Generate Prisma Client
```

**Approval Questions:**
- ✅ Are safety checks sufficient for production use?
- ✅ Is the rollback strategy acceptable?

---

### Prisma Client Singleton

**File:** `src/server/db/prisma.ts:8-19`

```typescript
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

**Why Singleton?**
- ✅ Prevents multiple Prisma instances in dev (hot reload issue)
- ✅ Conditional logging (verbose in dev, errors-only in prod)
- ✅ Graceful shutdown handler (`beforeExit`)

**Approval Questions:**
- ✅ Is the singleton pattern appropriate?
- ✅ Are logging levels correct?

---

## 🌍 Environment Variables Review

### New Variables in `env.example`

**File:** `env.example:55-78`

```bash
# Database Configuration (Phase 1: SCAFFOLD)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/devagents_dev
DATABASE_POOL_SIZE=10

# Security & Rate Limiting
SESSION_SECRET=your_random_session_secret_here  # Generate: openssl rand -base64 32
SESSION_SERVER_ONLY=false  # Feature flag (Phase 1: false)
```

**Security Checks:**
- ✅ `SESSION_SECRET` must be random in production (auto-generated if missing)
- ✅ `DATABASE_URL` should use env-specific values (dev/staging/prod)
- ⚠️ **Warning:** `SESSION_SECRET` placeholder must be replaced in production

**Approval Questions:**
- ✅ Are env variable names clear and descriptive?
- ✅ Is the template documentation sufficient?

---

## ✅ Approval Checklist

**For Tech Lead / Security Lead:**

### Schema Review
- [ ] All 7 tables match ARCHITECTURE.md design
- [ ] Foreign keys have correct cascade/set null behavior
- [ ] Indexes cover expected query patterns
- [ ] `sessions.accessToken` and `sessions.refreshToken` marked for encryption
- [ ] No sensitive data in unencrypted fields

### Session Security
- [ ] HTTPOnly cookies enabled (`httpOnly: true`)
- [ ] SameSite protection enabled (`sameSite: 'lax'`)
- [ ] Secure flag enabled in production
- [ ] Feature flag defaults to non-breaking behavior (`SESSION_SERVER_ONLY=false`)
- [ ] Deprecation warning logs when flag is `false` in production

### Migration Safety
- [ ] No destructive operations (no DROP, TRUNCATE)
- [ ] `db:migrate:reset` blocked in production
- [ ] Scripts are idempotent (safe to re-run)
- [ ] Rollback strategy documented (Prisma tracks migrations)

### Tooling
- [ ] Prisma Client singleton prevents multiple instances
- [ ] Conditional logging (verbose in dev, errors in prod)
- [ ] Graceful shutdown handler implemented
- [ ] `postinstall` hook generates Prisma Client

### Documentation
- [ ] All file paths cited with line numbers
- [ ] Grep commands provided for re-verification
- [ ] Migration path documented (Phase 1 → Phase 2 → Phase 3)
- [ ] Security notes highlight token encryption requirements

---

## 🚀 Approval Decision

**Options:**
1. ✅ **APPROVE** → Proceed to Phase 2 (GitHub App APIs + Webhooks)
2. ⚠️ **APPROVE WITH CONDITIONS** → List required changes
3. ❌ **REJECT** → Block Phase 2 until issues resolved

**Decision:** ⏳ **PENDING**

**Reviewer Signature:** __________________  
**Date:** __________________

---

## 📝 Notes & Feedback

*(Space for reviewer comments)*

---

**Document Owner:** AKIS Scribe Agent  
**Phase:** 1 / 5  
**Gate:** A  
**Status:** Awaiting Approval

