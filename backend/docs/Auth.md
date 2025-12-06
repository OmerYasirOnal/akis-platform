# AKIS Backend – Authentication & Authorization

**Version:** 1.0  
**Last Updated:** 2025-12-06  
**Purpose:** Define the authentication architecture, user lifecycle, and authorization model for AKIS Platform

---

## 1. Overview

AKIS Platform uses a **JWT-based authentication** system with email/password credentials as the primary method. The auth flow is designed to match a **Cursor-style, multi-step onboarding experience** for improved UX and security.

### Key Principles

- **Email/password primary:** All users start with email+password auth
- **Multi-step signup:** Name/email → password → email verification → consent flows
- **OAuth future state:** Google/GitHub OAuth is planned (S0.4.2) but not currently implemented
- **Stateless sessions:** JWT tokens stored in HTTP-only cookies
- **Zero trust:** Every protected endpoint validates the token

---

## 2. User Account Lifecycle

### 2.1 Account States

```typescript
enum UserStatus {
  PENDING_VERIFICATION = 'pending_verification',  // Email not yet verified
  ACTIVE = 'active',                              // Email verified, can use platform
  DISABLED = 'disabled',                          // Admin disabled
  DELETED = 'deleted'                             // Soft deleted
}
```

**State Transitions:**

```
[New Signup]
    ↓
PENDING_VERIFICATION
    ↓ (email verification)
ACTIVE
    ↓ (admin action or self-delete)
DISABLED / DELETED
```

### 2.2 User Data Model

```typescript
interface User {
  id: string;                       // UUID
  email: string;                    // Unique, lowercase
  name: string;                     // Full name
  passwordHash: string;             // bcrypt hash
  status: UserStatus;               // Account state
  emailVerified: boolean;           // Email verification flag
  emailVerificationCode: string | null;   // 6-digit code (expires)
  emailVerificationCodeExpiresAt: Date | null;
  dataSharingConsent: boolean | null;     // null = not yet shown, true/false = user choice
  hasSeenBetaWelcome: boolean;      // Whether user saw beta notice
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 3. Authentication Flow Design

### 3.1 Sign Up (Multi-Step)

**Step 1: Name + Email (`POST /api/auth/signup/start`)**

- Input: `{ firstName, lastName, email }`
- Backend:
  1. Validate email format and uniqueness
  2. Create user record with `status: PENDING_VERIFICATION`
  3. Generate 6-digit verification code (store with 15min expiry)
  4. Send email with code (dev: log to console)
  5. Return: `{ userId, email, message: "Verification code sent" }`

**Step 2: Set Password (`POST /api/auth/signup/password`)**

- Input: `{ userId, password }` (min 8 chars)
- Backend:
  1. Validate userId exists and status is `PENDING_VERIFICATION`
  2. Hash password with bcrypt (12 rounds)
  3. Store `passwordHash`
  4. Return: `{ ok: true }`

**Step 3: Verify Email (`POST /api/auth/verify-email`)**

- Input: `{ userId, code }` (6 digits)
- Backend:
  1. Check code matches and not expired
  2. Update: `emailVerified: true`, `status: ACTIVE`
  3. Generate JWT session token
  4. Set HTTP-only cookie: `akis_session`
  5. Return: `{ user: sanitized, token }`

**Step 4-5: Beta Welcome & Data Sharing**

- These are **frontend-only** flows initially
- User preferences stored via:
  - `POST /api/auth/update-preferences`
  - Input: `{ dataSharingConsent, hasSeenBetaWelcome }`

**Future: Email Delivery**

- Current (dev): Codes logged to console
- Production: Integrate with email service (e.g., SendGrid, AWS SES)
- Rate limiting: Max 3 verification attempts per 15min window

---

### 3.2 Sign In (Multi-Step)

**Step 1: Email Check (`POST /api/auth/login/start`)**

- Input: `{ email }`
- Backend:
  1. Look up user by email (case-insensitive)
  2. If not found: `404 { error: "No account found with this email" }`
  3. If found but `PENDING_VERIFICATION`: `403 { error: "Please verify your email first", userId }`
  4. If found and `ACTIVE`: `200 { userId, email, requiresPassword: true }`

**Step 2: Password (`POST /api/auth/login/complete`)**

- Input: `{ userId, password }`
- Backend:
  1. Verify password against stored hash
  2. If invalid: `401 { error: "Invalid password" }`
  3. If valid:
     - Generate JWT
     - Set cookie
     - Check if `dataSharingConsent === null`
     - Return: `{ user, needsDataSharingConsent: boolean }`

**Post-Login Flow (Frontend):**

- If `needsDataSharingConsent`: redirect to `/auth/privacy-consent`
- If `!hasSeenBetaWelcome`: redirect to `/auth/welcome-beta`
- Otherwise: redirect to `/dashboard`

---

### 3.3 Sign Out

**Endpoint:** `POST /api/auth/logout`

- Clears `akis_session` cookie (set maxAge=0)
- Returns: `{ ok: true }`
- Client redirects to `/login`

---

## 4. JWT Token Structure

### 4.1 Token Payload

```typescript
interface JWTPayload {
  sub: string;       // User ID (UUID)
  email: string;
  name: string;
  iat: number;       // Issued at (Unix timestamp)
  exp: number;       // Expires at (Unix timestamp)
}
```

### 4.2 Token Lifecycle

- **Issuer:** Backend signs with `JWT_SECRET` (env var)
- **Expiry:** 7 days (configurable via `JWT_EXPIRES_IN`)
- **Storage:** HTTP-only cookie named `akis_session`
- **Refresh:** Not implemented yet (future: refresh tokens)

### 4.3 Cookie Options

```typescript
const cookieOpts = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',  // HTTPS only in prod
  sameSite: 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days in ms
};
```

---

## 5. Authorization & Protected Routes

### 5.1 Middleware: `requireAuth`

All dashboard and agent endpoints require authentication:

```typescript
// Pseudocode
async function requireAuth(request, reply) {
  const token = request.cookies.akis_session;
  
  if (!token) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }
  
  try {
    const payload = await verify(token);
    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.sub)
    });
    
    if (!user || user.status !== 'active') {
      clearCookie(reply);
      return reply.code(401).send({ error: 'Invalid session' });
    }
    
    request.user = sanitizeUser(user);  // Attach to request
  } catch {
    return reply.code(401).send({ error: 'Invalid token' });
  }
}
```

### 5.2 Role-Based Access Control (RBAC)

**Current:** Not implemented (all authenticated users have same permissions)

**Future (S0.5+):**

```typescript
enum Role {
  USER = 'user',
  ADMIN = 'admin'
}

// Middleware: requireRole('admin')
```

---

## 6. Security Considerations

### 6.1 Password Security

- **Hashing:** bcrypt with 12 rounds (via `@node-rs/bcrypt`)
- **Minimum length:** 8 characters (enforced at API + UI)
- **No complexity requirements** initially (may add later)

### 6.2 Rate Limiting

**Current (via `@fastify/rate-limit`):**

- Global: 100 requests/min per IP
- Auth endpoints (future): 5 attempts/15min per IP/email

### 6.3 CORS

**Dev:** `http://localhost:5173` (Vite)  
**Prod:** Configured via `CORS_ORIGINS` env var

### 6.4 Cookie Security

- `httpOnly: true` → No JS access (XSS mitigation)
- `secure: true` (prod) → HTTPS only
- `sameSite: 'lax'` → CSRF protection

### 6.5 Token Expiry

- 7-day expiry enforced at JWT level
- Backend validates `exp` claim on every request

---

## 7. OAuth Integration (Future State)

### 7.1 Planned Providers

- Google
- GitHub
- (Optional: Apple)

### 7.2 OAuth Flow (Planned for S0.4.2)

**Endpoints:**

- `GET /api/auth/oauth/:provider` → Redirect to provider
- `GET /api/auth/oauth/:provider/callback` → Handle OAuth callback

**Process:**

1. User clicks "Continue with Google"
2. Redirect to Google OAuth consent screen
3. Callback returns authorization code
4. Backend exchanges code for access token
5. Fetch user profile (email, name)
6. If email exists → link account; else → create new user
7. Generate JWT and set cookie
8. Redirect to dashboard

**Implementation Notes:**

- OAuth providers will be implemented via **Fastify plugins**
- User linking logic: Match by email (if verified)
- Store provider tokens in `oauth_accounts` table (separate from users)

---

## 8. Error Handling

### 8.1 Auth Error Codes

| Code | HTTP Status | Message | Action |
|------|-------------|---------|--------|
| `EMAIL_IN_USE` | 409 | Email already registered | Show "Already have an account? Sign in" |
| `INVALID_CREDENTIALS` | 401 | Invalid email or password | Generic message (no hint) |
| `EMAIL_NOT_VERIFIED` | 403 | Email not verified | Offer resend verification code |
| `INVALID_CODE` | 400 | Verification code invalid or expired | Allow retry (max 3) |
| `TOO_MANY_ATTEMPTS` | 429 | Too many attempts | Show "Wait 15 minutes" |
| `UNAUTHORIZED` | 401 | Token missing or invalid | Redirect to login |

### 8.2 Error Response Format

```json
{
  "error": "Human-readable message",
  "code": "ERROR_CODE",
  "details": {}  // Optional context
}
```

---

## 9. API Endpoints Summary

### 9.1 Implemented (Current)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Single-step signup (legacy) |
| POST | `/api/auth/login` | Single-step login (legacy) |
| POST | `/api/auth/logout` | Clear session cookie |
| GET | `/api/auth/me` | Get current user |

### 9.2 Planned (Multi-Step)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup/start` | Step 1: Name + email |
| POST | `/api/auth/signup/password` | Step 2: Set password |
| POST | `/api/auth/verify-email` | Step 3: Verify 6-digit code |
| POST | `/api/auth/resend-code` | Resend verification email |
| POST | `/api/auth/login/start` | Step 1: Email check |
| POST | `/api/auth/login/complete` | Step 2: Password |
| POST | `/api/auth/update-preferences` | Update consent flags |
| GET | `/api/auth/oauth/:provider` | OAuth redirect |
| GET | `/api/auth/oauth/:provider/callback` | OAuth callback |

---

## 10. Database Schema

### 10.1 `users` Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending_verification',
  email_verified BOOLEAN DEFAULT FALSE,
  email_verification_code VARCHAR(6),
  email_verification_code_expires_at TIMESTAMP,
  data_sharing_consent BOOLEAN,
  has_seen_beta_welcome BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
```

### 10.2 `oauth_accounts` Table (Future)

```sql
CREATE TABLE oauth_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,  -- 'google', 'github'
  provider_account_id VARCHAR(255) NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(provider, provider_account_id)
);
```

---

## 11. Testing Strategy

### 11.1 Unit Tests

- Password hashing/verification
- JWT sign/verify
- Email validation logic

### 11.2 Integration Tests

- Signup flow: start → password → verify
- Login flow: start → complete
- Session validation (valid/expired/missing token)
- Logout clears cookie

### 11.3 E2E Tests (Future)

- Full signup → login → dashboard flow
- OAuth flow (mocked providers)

---

## 12. Migration Path

### Current → Target

**Phase 1 (This PR):**

- Add new multi-step endpoints
- Keep legacy `/signup` and `/login` for compatibility
- Update frontend to use new flow
- Add email verification logic (console logging for now)

**Phase 2 (S0.4.2):**

- Remove legacy endpoints
- Implement OAuth providers
- Add real email delivery
- Implement rate limiting per endpoint

**Phase 3 (S0.5+):**

- Add refresh tokens
- Implement RBAC
- Add 2FA (optional)

---

## 13. Environment Variables

```bash
# Required
JWT_SECRET=<random-256-bit-string>
DATABASE_URL=postgresql://...

# Optional (with defaults)
JWT_EXPIRES_IN=7d
AUTH_COOKIE_NAME=akis_session
NODE_ENV=development
CORS_ORIGINS=http://localhost:5173

# Future
SENDGRID_API_KEY=...
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
GITHUB_OAUTH_CLIENT_ID=...
GITHUB_OAUTH_CLIENT_SECRET=...
```

---

## 14. References

- **API Spec:** `backend/docs/API_SPEC.md` (auth section)
- **Frontend IA:** `docs/WEB_INFORMATION_ARCHITECTURE.md` (auth pages)
- **UI Design:** `docs/UI_DESIGN_SYSTEM.md` (auth form patterns)
- **Architecture:** `.cursor/context/CONTEXT_ARCHITECTURE.md`
- **JWT Standard:** RFC 7519
- **bcrypt:** @node-rs/bcrypt (Rust-based, ARM-compatible)

---

**Status:** This document describes the **target state** for S0.4.4. Implementation is in progress.

