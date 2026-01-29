# AKIS Platform Security Policy

> **Purpose:** Operational security practices and incident response procedures  
> **Last Updated:** 2026-01-29  
> **Status:** Active

---

## Quick Reference

| Area | Practice | Implementation | Priority |
|------|----------|----------------|----------|
| Secrets | Never commit to repo | `.gitignore` + env vars | Critical |
| Auth | Session-based cookies | HttpOnly, Secure, SameSite | Critical |
| Rates | Fail gracefully | No hard limits yet | Medium |
| Audit | All auth events logged | Pino structured logging | High |
| Input | Validate at boundary | Zod schemas | Critical |

---

## 1. Secrets Management

### No Secrets in Repository

**Rules:**
- ❌ Never commit API keys, tokens, passwords to git
- ❌ Never hardcode secrets in source code
- ✅ Use environment variables exclusively
- ✅ Provide `.env.example` with placeholder values

**Protected Secrets:**
- Database credentials (`DATABASE_URL`)
- AI Provider API keys (`AI_API_KEY`, `OPENAI_API_KEY`, `OPENROUTER_API_KEY`)
- GitHub OAuth credentials (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`)
- Atlassian OAuth credentials (`ATLASSIAN_OAUTH_CLIENT_ID`, `ATLASSIAN_OAUTH_CLIENT_SECRET`)
- GitHub Personal Access Tokens (`GITHUB_TOKEN` for MCP Gateway)
- Session secrets (`SESSION_SECRET`)

### Environment Variable Strategy

**File Hierarchy:**
```
1. Shell environment (export DATABASE_URL=...)  ← Highest priority
2. .env.local                                   ← Personal overrides (gitignored)
3. .env                                         ← Project defaults (committed as example)
```

**Example (`backend/.env.example`):**
```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/akis_v2

# AI Provider (use .env.local for real keys!)
AI_PROVIDER=mock
AI_API_KEY=your-api-key-here

# GitHub OAuth (use .env.local for real values!)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Session (CHANGE IN PRODUCTION!)
SESSION_SECRET=change-me-in-production
```

**`.gitignore` Protection:**
```
# Secrets
.env.local
.env.production
*.pem
*.key
cookies.txt
```

### Fail-Fast Validation

**Backend startup validation:**
```typescript
// backend/src/config/validate-env.ts
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  SESSION_SECRET: z.string().min(32),
  AI_PROVIDER: z.enum(['mock', 'openrouter', 'openai']).default('mock'),
  AI_API_KEY: z.string().optional(),
});

export function validateEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Environment validation failed:', result.error.format());
    process.exit(1);
  }
  return result.data;
}
```

---

## 2. Authentication Security

### Session-Based Authentication

**Strategy:** Cookie-based sessions (no JWT for MVP)

**Session Cookie Configuration:**
```typescript
// backend/src/auth/session.ts
export const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  cookie: {
    httpOnly: true,        // Prevents XSS access
    secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    sameSite: 'lax',       // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/'
  },
  saveUninitialized: false,
  resave: false
};
```

**Security Properties:**
- **HttpOnly:** Cookie not accessible via JavaScript (prevents XSS theft)
- **Secure:** Cookie only sent over HTTPS in production
- **SameSite=Lax:** Cookie not sent on cross-site POST requests (CSRF protection)
- **MaxAge:** Session expires after 7 days (configurable)

### Password Security

**Hashing:** Bcrypt with 12 rounds (industry standard)

```typescript
// backend/src/auth/password.ts
import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12); // 12 rounds (2^12 iterations)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

**Password Requirements:**
- Minimum 8 characters (configurable)
- No maximum length (bcrypt handles up to 72 bytes)
- No complexity requirements yet (future: require mix of character types)

### Email Verification

**Flow:**
1. User provides email
2. Backend generates 6-digit code
3. Code stored in_database with 15-minute expiry
4. Code sent via email (mock in dev, real SMTP in prod)
5. User enters code + sets password
6. Account created, session established

**Security:**
- Codes expire after 15 minutes
- Codes are single-use (deleted after verification)
- Rate limit on code requests (future)

---

## 3. OAuth Security

### GitHub OAuth

**Configuration:**
- **Client ID:** Public (safe to expose)
- **Client Secret:** Private (never committed)
- **Callback URL:** Must match GitHub app settings exactly
- **Scopes:** `repo`, `user:email` (minimal required)

**Security Measures:**
- State parameter prevents CSRF
- Tokens encrypted at rest in database
- Tokens never logged
- Tokens refreshed automatically (future)

**Token Storage:**
```typescript
// backend/src/db/schema/integrations.ts
export const githubConnections = pgTable('github_connections', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('access_token').notNull(), // Encrypted in future
  refreshToken: text('refresh_token'),         // Encrypted in future
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
```

**Future:** Encrypt `accessToken` and `refreshToken` columns using AES-256

### Atlassian OAuth (Planned)

**Additional Security:**
- Offline access scope for refresh tokens
- Refresh tokens rotated on each use
- All tokens encrypted at rest

---

## 4. Cookie Security

### Session Cookies

**Attributes:**
```http
Set-Cookie: sessionId=abc123...; 
  HttpOnly; 
  Secure; 
  SameSite=Lax; 
  Max-Age=604800; 
  Path=/
```

**Security Analysis:**
- **HttpOnly:** ✅ Prevents XSS theft
- **Secure:** ✅ HTTPS only (production)
- **SameSite=Lax:** ✅ CSRF protection for state-changing operations
- **Domain:** Not set (defaults to current domain)
- **Path=/:** Accessible to all routes

### CSRF Protection

**Current:** SameSite=Lax provides baseline protection

**Future (if needed):**
- CSRF tokens for sensitive operations
- Double-submit cookie pattern

**Not at Risk:**
- GET requests (read-only, no side effects)
- API designed to be safe for cross-origin reads

**Protected:**
- POST/PUT/DELETE (state-changing operations)
- SameSite=Lax prevents cross-site POST

---

## 5. Rate Limiting Strategy

### Current Approach: Fail Gracefully (MVP)

**Philosophy:** No hard rate limits yet, design to handle abuse gracefully

**Implementation:**
- AI Provider: Use free tier limits (handled by provider, not AKIS)
- GitHub API: 5000 requests/hour (authenticated), handled gracefully
- Database: Connection pooling prevents resource exhaustion

**Graceful Failure Examples:**
```typescript
// AI Provider rate limit
try {
  const response = await aiProvider.generate(prompt);
} catch (error) {
  if (error.status === 429) {
    return {
      status: 'failed',
      error: 'AI provider rate limit exceeded. Please try again later.'
    };
  }
  throw error;
}

// GitHub API rate limit
try {
  const repos = await githubClient.listRepos(owner);
} catch (error) {
  if (error.status === 403 && error.message.includes('rate limit')) {
    return {
      error: 'GitHub API rate limit exceeded. Resets at ' + error.resetAt
    };
  }
  throw error;
}
```

### Future Rate Limiting (Post-MVP)

**Planned:**
- User-level rate limits (e.g., 100 jobs/day)
- IP-based rate limits for unauthenticated endpoints
- Token bucket algorithm for burst handling

**Implementation (Planned):**
```typescript
// Using fastify-rate-limit
import rateLimit from '@fastify/rate-limit';

fastify.register(rateLimit, {
  max: 100,              // 100 requests
  timeWindow: '1 hour',  // per hour
  cache: 10000,          // cache size
  skipOnError: true      // fail open, not closed
});
```

---

## 6. Audit Logging

### What to Log

**Security Events (Always):**
- ✅ Signup attempts (success/failure)
- ✅ Login attempts (success/failure)
- ✅ Logout
- ✅ Password changes
- ✅ OAuth connections/disconnections
- ✅ Job creation (with sanitized payload)
- ✅ API errors (400, 401, 403, 500)

**What NOT to Log:**
- ❌ Passwords (plaintext or hashed)
- ❌ Session IDs
- ❌ OAuth tokens
- ❌ API keys
- ❌ Personal identifiable information (PII) unless necessary

### Log Format (Pino Structured Logging)

**Example Logs:**
```json
{
  "level": 30,
  "time": 1706553600000,
  "msg": "User signup successful",
  "userId": "user-uuid",
  "email": "user@example.com",
  "verificationMethod": "email"
}

{
  "level": 40,
  "time": 1706553700000,
  "msg": "Login failed: invalid code",
  "email": "user@example.com",
  "reason": "code_expired"
}

{
  "level": 30,
  "time": 1706553800000,
  "msg": "Job created",
  "jobId": "job-uuid",
  "userId": "user-uuid",
  "type": "scribe",
  "mode": "from_config"
}
```

### Log Retention

**Local Dev:**
- Console only (ephemeral)

**Production (Future):**
- 30 days retention
- Rotate daily
- Archive to object storage (OCI)

**Implementation:**
```typescript
// backend/src/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      '*.password',
      '*.accessToken',
      '*.refreshToken'
    ],
    remove: true
  },
  serializers: {
    // Custom serializers to sanitize
    user: (user) => ({
      id: user.id,
      email: user.email
      // Omit sensitive fields
    })
  }
});
```

---

## 7. Input Validation

### Validate at API Boundary

**Strategy:** Use Zod for all input validation

**Example:**
```typescript
// backend/src/routes/jobs.ts
import { z } from 'zod';

const createJobSchema = z.object({
  type: z.enum(['scribe', 'trace', 'proto']),
  payload: z.object({
    mode: z.enum(['from_config', 'direct']).optional(),
    owner: z.string().optional(),
    repo: z.string().optional(),
    baseBranch: z.string().optional(),
    dryRun: z.boolean().default(false)
  })
});

fastify.post('/api/agents/jobs', async (request, reply) => {
  const validationResult = createJobSchema.safeParse(request.body);
  
  if (!validationResult.success) {
    return reply.code(400).send({
      error: 'Validation failed',
      details: validationResult.error.format()
    });
  }

  const { type, payload } = validationResult.data;
  // Proceed with validated data
});
```

### Sanitize Outputs

**HTML Escaping (Frontend):**
- React automatically escapes JSX expressions
- Use `dangerouslySetInnerHTML` only for trusted content

**SQL Injection Prevention:**
- Drizzle ORM parameterizes all queries
- Never concatenate user input into SQL strings

**NoSQL Injection Prevention:**
- Not applicable (PostgreSQL only)

---

## 8. Data Privacy (GDPR/KVKK Compliance)

### User Consent

**Required:**
- Privacy consent before account activation
- Stored in `users.privacyConsent` column
- Cannot use platform without consent

**User Rights:**
- Right to access data (future: export endpoint)
- Right to deletion (future: delete account endpoint)
- Right to portability (future: export jobs as JSON)

### Data Minimization

**What We Store:**
- Email (for auth)
- Password hash (bcrypt)
- OAuth tokens (GitHub, Atlassian)
- Job history (for user dashboard)

**What We DON'T Store:**
- Unnecessary PII
- AI prompts/responses (logged temporarily, not persisted)
- User IP addresses (only in transient logs)

---

## 9. Incident Response

### Security Incident Classification

| Severity | Definition | Response Time |
|----------|------------|---------------|
| **P0 (Critical)** | Secret exposed in public repo | Immediate (< 1 hour) |
| **P1 (High)** | Auth bypass, data breach | < 4 hours |
| **P2 (Medium)** | XSS, CSRF vulnerability | < 24 hours |
| **P3 (Low)** | Rate limit abuse, minor bug | < 1 week |

### Incident Response Procedure

**1. Identify:**
- User report
- Automated security scan
- Code review finding

**2. Contain:**
- Rotate exposed secrets immediately
- Disable vulnerable endpoint if needed
- Deploy emergency patch

**3. Investigate:**
- Check audit logs for evidence of exploitation
- Assess scope of impact
- Document timeline

**4. Remediate:**
- Fix root cause
- Deploy patched version
- Notify affected users (if needed)

**5. Post-Mortem:**
- Document incident in `docs/security/incidents/`
- Update security practices
- Add preventive controls

### Emergency Contacts

**Maintainer:** Ömer Yasir Önal (Product Owner / Tech Lead)  
**QA Lead:** Sadi Önal

---

## 10. Reporting Security Issues

### Responsible Disclosure

**How to Report:**
1. **Do NOT create a public GitHub issue**
2. Email maintainers privately (address TBD - add to README contact section)
3. Include:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

**What to Expect:**
- Acknowledgment within 48 hours
- Regular updates as investigation proceeds
- Credit in security advisory (if desired)

### Bounties

**Current:** No bug bounty program (MVP stage)  
**Future:** Consider program after Phase 2.5 (early users)

---

## 11. Security Checklist

### Pre-Deployment

- [ ] No secrets committed to repository
- [ ] All environment variables validated at startup
- [ ] Session cookies use HttpOnly, Secure, SameSite
- [ ] Passwords hashed with bcrypt (12 rounds)
- [ ] All API inputs validated with Zod
- [ ] OAuth secrets encrypted at rest (future)
- [ ] Audit logging for all auth events
- [ ] Rate limits configured (future)

### Post-Deployment

- [ ] Monitor auth failure rate (detect brute force)
- [ ] Review logs for suspicious activity
- [ ] Verify HTTPS certificate validity
- [ ] Test session expiry (7 days)
- [ ] Verify tokens never logged

---

## 12. Security References

| Topic | Document |
|-------|----------|
| Authentication | `backend/docs/Auth.md` |
| API Security | `backend/docs/API_SPEC.md` |
| Environment Setup | `docs/ENV_SETUP.md` |
| Context Architecture | `.cursor/context/CONTEXT_ARCHITECTURE.md` |
| Security Checklist | `.cursor/checklists/Security.md` |

---

## 13. Known Limitations (MVP)

**Accepted Risks:**
- No rate limiting on API endpoints (fail gracefully)
- OAuth tokens not encrypted at rest (future enhancement)
- No CSRF tokens (SameSite=Lax sufficient for MVP)
- No WAF (Web Application Firewall) yet
- No DDoS protection beyond OCI baseline

**Future Enhancements:**
- Implement rate limiting (Phase 2.5)
- Encrypt OAuth tokens (Phase 2.5)
- Add 2FA support (Phase 3)
- Security headers (CSP, HSTS, X-Frame-Options)
- Automated security scanning (Phase 3)

---

*For security-related questions or incident reports, contact project maintainers privately (see Reporting section above).*
