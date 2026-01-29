# API Usage Examples

> **Status:** ACTIVE
> **Last Updated:** 2026-01-29
> **Scope:** Common API workflows with curl examples

---

## Table of Contents

1. [Authentication](#authentication)
2. [Agent Jobs Workflow](#agent-jobs-workflow)
3. [Model Selection](#model-selection)
4. [Job Lifecycle Control](#job-lifecycle-control)
5. [Integrations](#integrations)

---

## Authentication

All authenticated endpoints require the `akis_session` cookie. The cookie is set automatically after login.

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "your-password"
  }' \
  -c cookies.txt  # Save cookies for subsequent requests
```

### Using Saved Cookies

```bash
curl -X GET http://localhost:3000/api/agents/jobs \
  -b cookies.txt  # Load cookies from previous login
```

---

## Agent Jobs Workflow

### 1. Start a Scribe Job (Platform AI)

Submit a job using the platform default AI model (no API key required):

```bash
curl -X POST http://localhost:3000/api/agents/jobs \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "type": "scribe",
    "payload": {
      "owner": "myorg",
      "repo": "myrepo",
      "baseBranch": "main",
      "targetPath": "docs/",
      "taskDescription": "Update API documentation for new endpoints"
    }
  }'
```

**Response**:
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "state": "pending"
}
```

### 2. Poll Job Status

```bash
curl -X GET "http://localhost:3000/api/agents/jobs/550e8400-e29b-41d4-a716-446655440000" \
  -b cookies.txt
```

**Response (Running)**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "scribe",
  "state": "running",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:05.000Z"
}
```

**Response (Completed with AI Metadata)**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "scribe",
  "state": "completed",
  "payload": { ... },
  "result": {
    "files": [
      { "path": "docs/api.md", "operation": "create" }
    ]
  },
  "aiProvider": "openai",
  "aiModel": "gpt-4o-mini",
  "aiTotalDurationMs": 12345,
  "aiInputTokens": 1200,
  "aiOutputTokens": 850,
  "aiTotalTokens": 2050,
  "aiEstimatedCostUsd": "0.001234",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:15.000Z"
}
```

---

## Model Selection

### Using Platform Default AI

No additional configuration needed. Simply submit the job:

```bash
curl -X POST http://localhost:3000/api/agents/jobs \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "type": "scribe",
    "payload": { ... }
  }'
```

The job will automatically use the platform default model (configured via `AI_MODEL_DEFAULT` environment variable).

### Using Your Own API Key

**Step 1:** Configure your API key in Settings (via frontend or API)

**Step 2:** Submit job (your key will be used automatically based on active provider):

```bash
curl -X POST http://localhost:3000/api/agents/jobs \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "type": "scribe",
    "payload": {
      "owner": "myorg",
      "repo": "myrepo",
      "baseBranch": "main"
    }
  }'
```

The backend will automatically use your configured API key based on precedence rules (User Key → Platform Default).

**Checking Model Used:**

After job completes, check the `aiProvider` and `aiModel` fields in the response to see which model was actually used.

---

## Job Lifecycle Control

### Cancel a Running Job

```bash
curl -X POST "http://localhost:3000/api/agents/jobs/550e8400-e29b-41d4-a716-446655440000/cancel" \
  -b cookies.txt
```

**Response (Success)**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "state": "failed",
  "message": "Job cancelled successfully"
}
```

**Response (Already Completed - 409 Conflict)**:
```json
{
  "error": {
    "code": "INVALID_STATE_TRANSITION",
    "message": "Cannot cancel job in completed state",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "path": "/api/agents/jobs/550e8400-e29b-41d4-a716-446655440000/cancel"
  }
}
```

### Retry a Failed Job

To retry a failed job, simply re-submit with the same payload:

```bash
# Get original job payload
curl -X GET "http://localhost:3000/api/agents/jobs/550e8400-e29b-41d4-a716-446655440000" \
  -b cookies.txt \
  | jq '.payload' > payload.json

# Submit new job with same payload
curl -X POST http://localhost:3000/api/agents/jobs \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d @payload.json
```

A new job will be created with a fresh ID.

---

## Integrations

### Connect Atlassian (Jira + Confluence)

**Note:** Atlassian OAuth is a browser-based flow. Use the frontend UI at `/dashboard/integrations` to initiate the connection.

**Backend OAuth Flow:**

1. **Start OAuth:**
   ```
   GET http://localhost:3000/api/integrations/atlassian/auth
   ```
   (Redirects to Atlassian OAuth consent screen)

2. **OAuth Callback:**
   ```
   GET http://localhost:3000/api/integrations/atlassian/callback?code=...&state=...
   ```
   (Automatically handled by backend; exchanges code for token)

3. **Check Status:**
   ```bash
   curl -X GET http://localhost:3000/api/integrations/atlassian/status \
     -b cookies.txt
   ```

   **Response:**
   ```json
   {
     "connected": true,
     "configured": true,
     "jiraAvailable": true,
     "confluenceAvailable": true,
     "siteUrl": "https://your-site.atlassian.net",
     "cloudId": "your-cloud-id"
   }
   ```

### Disconnect Atlassian

```bash
curl -X DELETE http://localhost:3000/api/integrations/atlassian \
  -b cookies.txt
```

**Response:**
```json
{
  "ok": true,
  "message": "Atlassian disconnected successfully"
}
```

**Note:** Disconnecting Atlassian removes access to both Jira and Confluence (single connector).

---

## Error Handling

All API errors follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "path": "/api/path/that/failed"
  }
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `JOB_NOT_FOUND` | 404 | Job ID not found |
| `INVALID_STATE_TRANSITION` | 409 | Cannot perform action in current state (e.g., cancel completed job) |
| `AI_KEY_MISSING` | 412 | Selected model requires API key but none configured |
| `MODEL_NOT_ALLOWED` | 400 | Selected model not in allowlist |
| `DUPLICATE_JOB` | 409 | Job already running for this repo/branch |
| `GITHUB_NOT_CONNECTED` | 412 | GitHub integration required but not connected |
| `ATLASSIAN_NOT_CONNECTED` | 412 | Atlassian integration required but not connected |

---

## Advanced Examples

### Submit Job with Strict Validation

Use a stronger model for final validation (premium feature):

```bash
curl -X POST http://localhost:3000/api/agents/jobs \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "type": "scribe",
    "payload": {
      "owner": "myorg",
      "repo": "myrepo",
      "baseBranch": "main"
    },
    "requiresStrictValidation": true
  }'
```

The job will use a more capable model for final review/validation phase.

### List Jobs with Filters

```bash
# List only completed Scribe jobs
curl -X GET "http://localhost:3000/api/agents/jobs?type=scribe&state=completed&limit=10" \
  -b cookies.txt

# List all failed jobs
curl -X GET "http://localhost:3000/api/agents/jobs?state=failed" \
  -b cookies.txt
```

---

## Best Practices

1. **Polling:** Poll job status every 2-5 seconds while `state` is `pending` or `running`. Stop polling when state becomes `completed` or `failed`.

2. **Error Handling:** Always check `errorCode` and `errorMessage` fields for failed jobs. Display user-friendly messages based on error codes.

3. **Model Selection:** Use platform default for quick testing; configure your own API key for production workloads to avoid platform rate limits.

4. **Cancellation:** Cancel endpoint is idempotent. Multiple cancel requests for the same job are safe (will return 409 if already in terminal state).

5. **Retries:** Implement exponential backoff for transient errors (e.g., rate limits, network issues).

6. **AI Metadata:** Use `aiEstimatedCostUsd` field for cost tracking and budgeting. Note that estimates may vary from actual provider billing.

---

*Last Updated: 2026-01-29 (S2.0.2)*
