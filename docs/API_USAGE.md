# AKIS Platform API Usage Guide

> **Purpose:** Practical API usage examples and integration patterns  
> **Created:** 2026-01-29  
> **API Spec:** `backend/docs/API_SPEC.md` (canonical reference)

---

## Quick Reference

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/health` | GET | Backend health check | No |
| `/auth/signup/email/send-code` | POST | Start email signup | No |
| `/auth/me` | GET | Get current user | Yes (session) |
| `/api/agents/jobs` | POST | Create agent job | Yes |
| `/api/agents/jobs/:id` | GET | Get job details | Yes |
| `/api/integrations/github/status` | GET | GitHub connection status | Yes |

**Base URL (local dev):** `http://localhost:3000`

---

## 1. Authentication

### Signup Flow (Email-Based Multi-Step)

**Step 1: Send Verification Code**

```bash
curl -X POST http://localhost:3000/auth/signup/email/send-code \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

**Response:**
```json
{
  "codeSent": true,
  "expiresIn": "15m"
}
```

**Step 2: Verify Code + Set Password**

```bash
curl -X POST http://localhost:3000/auth/signup/email/verify \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "code": "123456",
    "password": "SecurePassword123!"
  }' \
  -c cookies.txt  # Save session cookie
```

**Response:**
```json
{
  "sessionId": "sess_abc123...",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "emailVerified": true
  }
}
```

**Step 3: Privacy Consent**

```bash
curl -X POST http://localhost:3000/auth/signup/consent \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"consent": true}'
```

**Response:**
```json
{
  "consentRecorded": true,
  "user": {
    "id": "user-uuid",
    "privacyConsent": true
  }
}
```

### Login Flow

```bash
# Step 1: Send code
curl -X POST http://localhost:3000/auth/login/email/send-code \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'

# Step 2: Verify code + password
curl -X POST http://localhost:3000/auth/login/email/verify \
  -H "Content-Type": "application/json" \
  -d '{
    "email": "user@example.com",
    "code": "123456",
    "password": "SecurePassword123!"
  }' \
  -c cookies.txt
```

### Session Management

**Check Current Session:**
```bash
curl -b cookies.txt http://localhost:3000/auth/me
```

**Response:**
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "emailVerified": true,
  "privacyConsent": true,
  "createdAt": "2026-01-29T00:00:00.000Z"
}
```

**Logout:**
```bash
curl -X POST http://localhost:3000/auth/logout -b cookies.txt
```

---

## 2. Agent Jobs

### Create Scribe Job (Config-Aware Mode)

**Requires:** Scribe config saved (via UI at `/dashboard/agents/scribe`)

```bash
curl -X POST http://localhost:3000/api/agents/jobs \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "type": "scribe",
    "payload": {
      "mode": "from_config",
      "dryRun": false
    }
  }'
```

**Response (Success):**
```json
{
  "jobId": "job-uuid",
  "state": "pending",
  "type": "scribe",
  "createdAt": "2026-01-29T08:30:00.000Z"
}
```

**Response (Error - No Config):**
```json
{
  "error": {
    "code": "CONFIG_NOT_FOUND",
    "message": "Scribe configuration not found. Please configure Scribe first at /dashboard/agents/scribe"
  }
}
```

### Create Scribe Job (Legacy Mode)

**Direct payload (no config required):**

```bash
curl -X POST http://localhost:3000/api/agents/jobs \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "type": "scribe",
    "payload": {
      "owner": "OmerYasirOnal",
      "repo": "akis-platform-devolopment",
      "baseBranch": "main",
      "targetPlatform": "github",
      "targetConfig": {
        "path": "docs/"
      },
      "dryRun": false
    }
  }'
```

### Get Job Status

```bash
curl -b cookies.txt http://localhost:3000/api/agents/jobs/job-uuid
```

**Response:**
```json
{
  "id": "job-uuid",
  "type": "scribe",
  "state": "completed",
  "payload": {
    "owner": "OmerYasirOnal",
    "repo": "akis-platform-devolopment",
    "baseBranch": "main"
  },
  "result": {
    "status": "success",
    "filesUpdated": 3,
    "prUrl": "https://github.com/OmerYasirOnal/akis-platform-devolopment/pull/42"
  },
  "createdAt": "2026-01-29T08:30:00.000Z",
  "updatedAt": "2026-01-29T08:32:15.000Z"
}
```

### List Jobs (Paginated)

```bash
# All jobs for current user
curl -b cookies.txt "http://localhost:3000/api/agents/jobs?limit=20"

# Filter by type
curl -b cookies.txt "http://localhost:3000/api/agents/jobs?type=scribe&limit=20"

# Filter by state
curl -b cookies.txt "http://localhost:3000/api/agents/jobs?state=completed&limit=20"

# Pagination (cursor-based)
curl -b cookies.txt "http://localhost:3000/api/agents/jobs?limit=20&cursor=eyJpZCI6ImpvYi0xMjMiLCJjcmVhdGVkQXQiOiIyMDI2LTAxLTI5VDA4OjMwOjAwLjAwMFoifQ=="
```

**Response:**
```json
{
  "items": [
    {
      "id": "job-uuid-1",
      "type": "scribe",
      "state": "completed",
      "createdAt": "2026-01-29T08:30:00.000Z",
      "updatedAt": "2026-01-29T08:32:15.000Z"
    },
    {
      "id": "job-uuid-2",
      "type": "scribe",
      "state": "running",
      "createdAt": "2026-01-29T08:25:00.000Z",
      "updatedAt": "2026-01-29T08:26:10.000Z"
    }
  ],
  "nextCursor": "eyJpZCI6ImpvYi11dWlkLTIiLCJjcmVhdGVkQXQiOiIyMDI2LTAxLTI5VDA4OjI1OjAwLjAwMFoifQ==",
  "hasMore": true
}
```

---

## 3. Integrations

### GitHub Integration

**Get Connection Status:**
```bash
curl -b cookies.txt http://localhost:3000/api/integrations/github/status
```

**Response (Connected):**
```json
{
  "connected": true,
  "username": "OmerYasirOnal",
  "scopes": ["repo", "user:email"]
}
```

**Response (Not Connected):**
```json
{
  "connected": false,
  "authUrl": "http://localhost:3000/api/integrations/github/oauth/initiate"
}
```

**GitHub Discovery (Requires Connection):**

```bash
# List owners (user + orgs)
curl -b cookies.txt http://localhost:3000/api/integrations/github/owners

# List repos for owner
curl -b cookies.txt "http://localhost:3000/api/integrations/github/repos?owner=OmerYasirOnal"

# List branches for repo
curl -b cookies.txt "http://localhost:3000/api/integrations/github/branches?owner=OmerYasirOnal&repo=akis-platform-devolopment"
```

### Atlassian Integration (Future)

**Status:** Planned (OAuth endpoints defined, not yet implemented)

```bash
# Get connection status
curl -b cookies.txt http://localhost:3000/api/integrations/atlassian/status

# Initiate OAuth flow
curl -b cookies.txt http://localhost:3000/api/integrations/atlassian/oauth/initiate
```

---

## 4. AI Keys Management (Future)

**Status:** UI implemented, API endpoints planned

**Planned Endpoints:**
```bash
# Save AI key (user-level)
POST /api/settings/ai-keys
{
  "provider": "openai" | "anthropic" | "openrouter",
  "key": "sk-...",
  "isActive": true
}

# List AI keys
GET /api/settings/ai-keys

# Delete AI key
DELETE /api/settings/ai-keys/:id
```

**See:** `backend/docs/API_SPEC.md` (Multi-Provider AI Keys section)

---

## 5. Error Handling

### Common Error Responses

**401 Unauthorized:**
```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Not authenticated"
}
```

**400 Validation Error:**
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "validation": {
    "body": {
      "email": "must be a valid email"
    }
  }
}
```

**500 Internal Server Error:**
```json
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "message": "An unexpected error occurred",
  "requestId": "req-uuid"
}
```

### Rate Limiting (Future)

**Planned:**
```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1706554200
Retry-After: 60

{
  "statusCode": 429,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Try again in 60 seconds."
}
```

---

## 6. Testing Examples

### Manual API Testing (cURL)

**Save Session:**
```bash
# Create cookies.txt file
touch cookies.txt

# Use -c to save, -b to send
curl -X POST http://localhost:3000/auth/login/email/verify \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","code":"123456","password":"pass"}' \
  -c cookies.txt -b cookies.txt
```

**Automated Test Script:**
```bash
#!/bin/bash
# scripts/test-api-flow.sh

BASE_URL="http://localhost:3000"
EMAIL="test-$(date +%s)@example.com"
PASSWORD="TestPass123!"

echo "1. Sending verification code..."
curl -X POST "$BASE_URL/auth/signup/email/send-code" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\"}"

echo "\n2. Enter verification code:"
read CODE

echo "3. Verifying code and setting password..."
curl -X POST "$BASE_URL/auth/signup/email/verify" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"code\":\"$CODE\",\"password\":\"$PASSWORD\"}" \
  -c cookies.txt -b cookies.txt

echo "\n4. Recording privacy consent..."
curl -X POST "$BASE_URL/auth/signup/consent" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"consent":true}'

echo "\n5. Creating test job..."
curl -X POST "$BASE_URL/api/agents/jobs" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"type":"scribe","payload":{"mode":"from_config","dryRun":true}}'

echo "\nDone!"
```

### Integration Testing (Vitest)

```typescript
// backend/tests/integration/api/jobs.test.ts
import { describe, it, expect } from 'vitest';
import { createTestServer } from '../helpers/test-server';

describe('POST /api/agents/jobs', () => {
  it('should create a Scribe job', async () => {
    const server = await createTestServer();

    const response = await server.inject({
      method: 'POST',
      url: '/api/agents/jobs',
      payload: {
        type: 'scribe',
        payload: { mode: 'from_config' }
      },
      headers: {
        cookie: 'sessionId=test-session'
      }
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toHaveProperty('jobId');
    expect(body.type).toBe('scribe');
    expect(body.state).toBe('pending');
  });
});
```

---

## 7. SDK Usage (Future)

**Status:** No official SDK yet

**Planned TypeScript SDK:**
```typescript
// @akis/client (planned)
import { AkisClient } from '@akis/client';

const client = new AkisClient({
  baseUrl: 'http://localhost:3000',
  sessionId: 'sess_abc123...'
});

// Async/await
const job = await client.jobs.create({
  type: 'scribe',
  payload: { mode: 'from_config' }
});

console.log(`Job ${job.id} created with state ${job.state}`);

// Poll for completion
const completed = await client.jobs.waitFor(job.id, {
  timeout: 300000 // 5 minutes
});

console.log(`Job completed: ${completed.result.prUrl}`);
```

---

## 8. Webhooks (Future)

**Status:** Not yet implemented

**Planned:**
- Job completion webhook
- Integration connection/disconnection webhook
- Rate limit warning webhook

**Example Payload:**
```json
{
  "event": "job.completed",
  "timestamp": "2026-01-29T08:32:15.000Z",
  "data": {
    "jobId": "job-uuid",
    "type": "scribe",
    "state": "completed",
    "result": {
      "status": "success",
      "prUrl": "https://github.com/..."
    }
  }
}
```

---

## 9. Common Integration Patterns

### Pattern 1: Job Creation + Polling

```typescript
// Create job
const createResponse = await fetch('http://localhost:3000/api/agents/jobs', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Cookie': 'sessionId=...'
  },
  body: JSON.stringify({
    type: 'scribe',
    payload: { mode: 'from_config' }
  })
});

const { jobId } = await createResponse.json();

// Poll for completion
const pollInterval = 2000; // 2 seconds
const timeout = 300000; // 5 minutes

const startTime = Date.now();

while (Date.now() - startTime < timeout) {
  const statusResponse = await fetch(`http://localhost:3000/api/agents/jobs/${jobId}`, {
    headers: { 'Cookie': 'sessionId=...' }
  });

  const job = await statusResponse.json();

  if (job.state === 'completed' || job.state === 'failed') {
    console.log('Job finished:', job);
    break;
  }

  await new Promise(resolve => setTimeout(resolve, pollInterval));
}
```

### Pattern 2: GitHub OAuth + Scribe Job

```typescript
// 1. Check GitHub connection
const statusResponse = await fetch('http://localhost:3000/api/integrations/github/status', {
  headers: { 'Cookie': 'sessionId=...' }
});

const { connected, authUrl } = await statusResponse.json();

if (!connected) {
  // Redirect user to OAuth flow
  window.location.href = authUrl;
  return;
}

// 2. Discover repos
const reposResponse = await fetch('http://localhost:3000/api/integrations/github/repos?owner=OmerYasirOnal', {
  headers: { 'Cookie': 'sessionId=...' }
});

const { repos } = await reposResponse.json();

// 3. Create Scribe job
const jobResponse = await fetch('http://localhost:3000/api/agents/jobs', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Cookie': 'sessionId=...'
  },
  body: JSON.stringify({
    type: 'scribe',
    payload: {
      owner: 'OmerYasirOnal',
      repo: repos[0].name,
      baseBranch: 'main',
      targetPlatform: 'github'
    }
  })
});
```

---

## 10. Related Documentation

- [API_SPEC.md](../backend/docs/API_SPEC.md) - Complete API reference (canonical)
- [Auth.md](../backend/docs/Auth.md) - Authentication deep dive
- [TESTING.md](TESTING.md) - API testing strategies
- [ENV_SETUP.md](ENV_SETUP.md) - Backend configuration

---

*For complete API schema definitions, see `backend/docs/API_SPEC.md`.*
