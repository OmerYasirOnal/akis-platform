# API Reference

> This document describes the REST API endpoints for the AKIS DevAgents platform.

## Base URL
- Development: `http://localhost:3000`
- Production: `https://your-domain.vercel.app`

## Authentication

All GitHub-related endpoints require a valid GitHub App installation. The installation token is managed automatically by the backend.

---

## GitHub Integration

### Create/Checkout Branch
Create a new branch or verify an existing branch.

**Endpoint:** `POST /api/github/branch`

**Request Body:**
```json
{
  "owner": "string",
  "repo": "string",
  "baseRef": "string",
  "newBranchName": "string"
}
```

**Response (Success):**
```json
{
  "ok": true,
  "sha": "abc123...",
  "exists": false
}
```

**Response (Branch Exists):**
```json
{
  "ok": true,
  "sha": "abc123...",
  "exists": true
}
```

**Response (Error):**
```json
{
  "ok": false,
  "error": "Error message"
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid request body
- `500` - Server error

---

### List Repositories
Get all repositories accessible to the GitHub App installation.

**Endpoint:** `GET /api/github/repos`

**Response:**
```json
{
  "repositories": [
    {
      "id": 123456,
      "name": "repo-name",
      "full_name": "owner/repo-name",
      "private": false,
      "html_url": "https://github.com/owner/repo-name"
    }
  ]
}
```

**Status Codes:**
- `200` - Success
- `401` - Not authenticated
- `500` - Server error

---

### Connect GitHub App
Initiate GitHub App connection flow.

**Endpoint:** `POST /api/github/connect`

**Request Body:**
```json
{
  "code": "string",
  "installation_id": "string"
}
```

**Response:**
```json
{
  "success": true,
  "installation_id": "123456"
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid code or installation
- `500` - Server error

---

### Get Installation Details
Get GitHub App installation information.

**Endpoint:** `GET /api/github/app/installation`

**Response:**
```json
{
  "id": 123456,
  "account": {
    "login": "username",
    "type": "User"
  },
  "repositories_url": "https://api.github.com/installation/repositories"
}
```

**Status Codes:**
- `200` - Success
- `404` - Installation not found
- `500` - Server error

---

## Agent Endpoints

### Run Scribe Agent
Execute the Scribe documentation workflow.

**Endpoint:** `POST /api/agent/scribe/run`

**Request Body:**
```json
{
  "owner": "string",
  "repo": "string",
  "model": "string",
  "baseRef": "main"
}
```

**Response:**
```json
{
  "success": true,
  "prUrl": "https://github.com/owner/repo/pull/123",
  "branchName": "docs/repo-20250127-readme-refresh",
  "dasScore": 85
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid request
- `500` - Server error

---

### Analyze Documentation
Analyze repository documentation coverage.

**Endpoint:** `POST /api/agent/documentation/analyze`

**Request Body:**
```json
{
  "owner": "string",
  "repo": "string",
  "branch": "main"
}
```

**Response:**
```json
{
  "coverage": {
    "hasReadme": true,
    "hasChangelog": false,
    "hasContributing": false,
    "hasLicense": true,
    "hasQuickstart": true,
    "hasArchitecture": false,
    "hasAPI": false
  },
  "issues": [
    "Missing CHANGELOG.md",
    "Missing CONTRIBUTING.md"
  ],
  "score": 56
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid request
- `404` - Repository not found
- `500` - Server error

---

### Generate Documentation
Generate documentation artifacts for a repository.

**Endpoint:** `POST /api/agent/documentation/generate`

**Request Body:**
```json
{
  "owner": "string",
  "repo": "string",
  "branch": "main",
  "artifacts": ["README", "CHANGELOG", "CONTRIBUTING"]
}
```

**Response:**
```json
{
  "success": true,
  "artifacts": {
    "README": "# Title\n\nContent...",
    "CHANGELOG": "# Changelog\n\nContent...",
    "CONTRIBUTING": "# Contributing\n\nContent..."
  }
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid request
- `500` - Server error

---

## Logging & Diagnostics

### Get Logs
Retrieve application logs (development only).

**Endpoint:** `GET /api/logs`

**Response:**
```json
{
  "logs": [
    {
      "timestamp": "2025-01-27T19:45:38.250Z",
      "level": "info",
      "message": "GitHub App token acquired"
    }
  ]
}
```

**Status Codes:**
- `200` - Success
- `403` - Forbidden (production)

---

## Error Handling

All endpoints follow a consistent error format:

```json
{
  "ok": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE"
}
```

Common error codes:
- `VALIDATION_ERROR` - Request validation failed
- `AUTH_ERROR` - Authentication failed
- `GITHUB_API_ERROR` - GitHub API error
- `RATE_LIMIT` - GitHub rate limit exceeded
- `INTERNAL_ERROR` - Server error

---

## Rate Limiting

GitHub API rate limits apply:
- **Authenticated requests**: 5,000 requests/hour per installation
- **Rate limit headers** are passed through in responses
- **Caching**: Installation tokens cached for 1 hour

---

## Webhook Endpoints (Future)

> Placeholder for GitHub App webhook handling

**Endpoint:** `POST /api/webhooks/github`

Documentation to be added when webhook support is implemented.

