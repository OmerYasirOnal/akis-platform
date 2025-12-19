# GitHub Discovery API Documentation

**Version**: S0.4.6  
**Base Path**: `/api/integrations/github`

---

## Overview

These endpoints allow authenticated users to browse their GitHub repositories and branches for Scribe configuration.

---

## Endpoints

### GET /api/integrations/github/owners

Returns the authenticated user and their GitHub organizations.

**Authentication**: Required (session cookie)

**Response 200**:
```json
{
  "owners": [
    { "login": "username", "type": "User", "avatarUrl": "https://..." },
    { "login": "my-org", "type": "Organization", "avatarUrl": "https://..." }
  ]
}
```

**Errors**:
| Code | Status | Cause |
|------|--------|-------|
| UNAUTHORIZED | 401 | Not authenticated |
| GITHUB_NOT_CONNECTED | 412 | User has not connected GitHub |

---

### GET /api/integrations/github/repos

Returns repositories for a given owner.

**Authentication**: Required (session cookie)

**Query Parameters**:
| Name | Required | Description |
|------|----------|-------------|
| owner | Yes | GitHub username or organization |

**Response 200**:
```json
{
  "repos": [
    {
      "name": "my-repo",
      "fullName": "owner/my-repo",
      "defaultBranch": "main",
      "private": false,
      "description": "Repository description"
    }
  ]
}
```

**Errors**:
| Code | Status | Cause |
|------|--------|-------|
| UNAUTHORIZED | 401 | Not authenticated |
| MISSING_OWNER | 400 | owner query param missing |
| GITHUB_NOT_CONNECTED | 412 | User has not connected GitHub |

---

### GET /api/integrations/github/branches

Returns branches for a repository.

**Authentication**: Required (session cookie)

**Query Parameters**:
| Name | Required | Description |
|------|----------|-------------|
| owner | Yes | GitHub username or organization |
| repo | Yes | Repository name |

**Response 200**:
```json
{
  "branches": [
    { "name": "main", "isDefault": true },
    { "name": "develop", "isDefault": false }
  ],
  "defaultBranch": "main"
}
```

**Errors**:
| Code | Status | Cause |
|------|--------|-------|
| UNAUTHORIZED | 401 | Not authenticated |
| MISSING_PARAMS | 400 | owner or repo missing |
| GITHUB_NOT_CONNECTED | 412 | User has not connected GitHub |

---

## Error Response Format

All errors follow this format:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

---

## Integration Flow

1. User opens Scribe config page
2. Frontend calls `GET /api/integrations/github/owners`
3. If 412 (GITHUB_NOT_CONNECTED), show "Connect GitHub" button
4. User clicks Connect → redirected to `GET /api/integrations/connect/github`
5. After OAuth, user is redirected back
6. Frontend can now fetch repos and branches

---

## Testing

```bash
# Should return 401 (not authenticated)
curl http://localhost:3000/api/integrations/github/owners

# With session cookie (authenticated)
curl -b "session=..." http://localhost:3000/api/integrations/github/repos?owner=myuser
```

---

## Files

| File | Description |
|------|-------------|
| `backend/src/api/integrations.ts` | Route handlers |
| `backend/test/integration/github-discovery.test.ts` | Integration tests |
| `frontend/src/services/api/github-discovery.ts` | Frontend client |

