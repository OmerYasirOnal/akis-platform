# AKIS Workstream API Spec

## 1. Auth Strategy
Uses existing AKIS session authentication:
- JWT in HttpOnly cookie
- `requireAuth` guard on protected marketplace APIs

## 2. Endpoints

### POST /api/profile
Create or update profile.

Request:
```json
{
  "headline": "Frontend Developer",
  "bio": "5 years React",
  "seniority": "mid",
  "languages": ["en", "tr"],
  "preferredLocations": ["remote"],
  "salaryFloor": 1200,
  "excludedIndustries": ["gambling"]
}
```

Response:
```json
{ "profile": { "id": "uuid", "userId": "uuid" } }
```

### GET /api/jobs
List ingested jobs.

Query:
- `limit` (default 20)
- `offset` (default 0)

Response:
```json
{ "items": [], "total": 0 }
```

### POST /api/jobs/ingest
Manual ingest for MVP.

Request:
```json
{
  "source": "manual",
  "jobs": [
    {
      "externalId": "sample-1",
      "title": "React Developer",
      "description": "Build dashboard",
      "requiredSkills": ["react", "typescript"],
      "seniority": "mid",
      "language": "en",
      "location": "remote"
    }
  ]
}
```

Response:
```json
{ "ingested": 1 }
```

### POST /api/match/run
Compute matches for authenticated user profile.

Request:
```json
{ "jobIds": ["uuid-1", "uuid-2"] }
```

Response:
```json
{ "created": 2 }
```

### GET /api/match
List computed matches for authenticated user.

Response:
```json
{
  "items": [
    {
      "id": "uuid",
      "jobPostId": "uuid",
      "score": 0.82,
      "explanation": {
        "summary": "Strong skill overlap",
        "top_factors": ["skill_overlap", "language_fit"]
      }
    }
  ]
}
```

### POST /api/proposals/generate
Generate proposal draft from profile + job.

Request:
```json
{ "jobPostId": "uuid" }
```

Response:
```json
{ "proposal": { "id": "uuid", "content": "..." } }
```

## 3. Validation and Errors
- Zod validation for all request bodies and query params.
- Standard AKIS error envelope:
```json
{
  "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [] },
  "requestId": "..."
}
```

## 4. TODO
- TODO: Connector-specific ingest endpoints after partner API policies are verified.
