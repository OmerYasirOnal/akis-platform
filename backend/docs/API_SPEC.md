# AKIS Backend API Specification

**Version**: 0.1.0  
**Base URL**: `http://localhost:3000`

## Table of Contents

1. [Health & Meta Endpoints](#health--meta-endpoints)
2. [Agent Jobs API](#agent-jobs-api)
3. [Authentication](#authentication)
4. [Error Handling](#error-handling)

---

## Health & Meta Endpoints

### GET /health

Health check endpoint (always returns 200 if server is running).

**Response**:
```json
{
  "status": "ok"
}
```

### GET /ready

Readiness check (verifies database connectivity).

**Response (200)**:
```json
{
  "ready": true
}
```

**Response (503)**:
```json
{
  "ready": false,
  "error": "Database not reachable"
}
```

### GET /version

Returns application version from package.json.

**Response**:
```json
{
  "version": "0.1.0"
}
```

### GET /

Root endpoint with application info.

**Response**:
```json
{
  "name": "AKIS Backend",
  "status": "ok"
}
```

---

## Agent Jobs API

Base path: `/api/agents`

### POST /api/agents/jobs

Submit a new agent job.

**Request Body**:
```json
{
  "type": "scribe" | "trace" | "proto",
  "payload": { ... },
  "requiresStrictValidation": false
}
```

**Payload by Agent Type**:

| Type | Required Fields | Description |
|------|-----------------|-------------|
| `scribe` | `doc` (string) | Documentation content/topic |
| `trace` | `spec` (string) | Requirements/specification text |
| `proto` | `feature` (string) | Feature description for prototyping |

**Response (200)**:
```json
{
  "jobId": "uuid-string",
  "state": "pending" | "running" | "completed" | "failed"
}
```

**Response (400)** - Invalid payload:
```json
{
  "error": "Validation failed",
  "details": [...]
}
```

### GET /api/agents/jobs/:id

Get job status and result.

**Parameters**:
- `id` (path) - Job UUID

**Response (200)**:
```json
{
  "id": "uuid-string",
  "type": "scribe",
  "state": "completed",
  "payload": { ... },
  "result": { ... },
  "error": null,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:01.000Z"
}
```

**Response (404)**:
```json
{
  "error": "Job not found"
}
```

### GET /api/agents/jobs

List all jobs (paginated).

**Query Parameters**:
- `limit` (optional, default: 50) - Max results
- `offset` (optional, default: 0) - Skip count
- `type` (optional) - Filter by agent type
- `state` (optional) - Filter by state

**Response (200)**:
```json
{
  "jobs": [...],
  "total": 100,
  "limit": 50,
  "offset": 0
}
```

---

## Authentication

### POST /api/auth/login

Authenticate user and receive session token.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200)**:
```json
{
  "token": "jwt-token",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

### POST /api/auth/register

Register a new user account.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name"
}
```

### POST /api/auth/logout

Invalidate current session.

**Headers**:
- `Authorization: Bearer <token>`

---

## Error Handling

All errors follow a consistent format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request payload |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Rate Limiting

- Default: 100 requests per minute per IP
- Configurable via `RATE_LIMIT_MAX` environment variable
- Returns `429 Too Many Requests` when exceeded

## CORS

- Allowed origins configurable via `CORS_ORIGINS` environment variable
- Default: `http://localhost:5173` (development)

---

## Metrics

### GET /metrics

Prometheus metrics endpoint.

**Response**: Text format (Prometheus exposition format)

```
# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",path="/health",status="200"} 42
...
```

