# Feedback API Endpoints

This document describes the feedback loop API endpoints for job comments and revisions.

## Overview

The feedback system enables users to:
- Add comments to completed/failed jobs
- Request revisions with specific instructions
- Track revision chains (parent → child jobs)

## Endpoints

### GET /api/agents/jobs/:jobId/comments

Retrieve all comments for a job.

**Response:**
```json
{
  "comments": [
    {
      "id": "uuid",
      "jobId": "uuid",
      "userId": "uuid | null",
      "commentText": "string",
      "createdAt": "ISO datetime"
    }
  ]
}
```

**Status Codes:**
- `200`: Success
- `404`: Job not found

### POST /api/agents/jobs/:jobId/comments

Add a comment to a job.

**Request Body:**
```json
{
  "text": "string (required)"
}
```

**Response:**
```json
{
  "comment": {
    "id": "uuid",
    "jobId": "uuid",
    "userId": "uuid | null",
    "commentText": "string",
    "createdAt": "ISO datetime"
  }
}
```

**Status Codes:**
- `201`: Comment created
- `400`: Invalid request (missing text)
- `404`: Job not found

### GET /api/agents/jobs/:jobId/revisions

Get the revision chain for a job.

**Response:**
```json
{
  "parentJob": {
    "id": "uuid",
    "state": "completed | failed | ...",
    "createdAt": "ISO datetime"
  } | null,
  "revisions": [
    {
      "id": "uuid",
      "state": "pending | running | completed | failed",
      "createdAt": "ISO datetime",
      "revisionNote": "string | null"
    }
  ],
  "isRevision": boolean,
  "revisionNote": "string | null"
}
```

**Status Codes:**
- `200`: Success
- `404`: Job not found

### POST /api/agents/jobs/:jobId/revise

Request a revision of a completed/failed job.

**Request Body:**
```json
{
  "instruction": "string (required)",
  "mode": "edit | regenerate (default: edit)"
}
```

**Response:**
```json
{
  "newJobId": "uuid",
  "state": "pending",
  "parentJobId": "uuid"
}
```

**Status Codes:**
- `201`: Revision job created
- `400`: Invalid request or job not in revisable state
- `404`: Job not found

## Revision Modes

### Edit Mode (`mode: "edit"`)
- Modifies existing outputs based on instruction
- Preserves context from parent job
- Faster execution (incremental changes)

### Regenerate Mode (`mode: "regenerate"`)
- Creates new outputs from scratch
- Uses instruction as primary guidance
- Ignores parent job outputs (but references artifacts as context)

## Frontend Integration

The `FeedbackTab` component (`frontend/src/components/jobs/FeedbackTab.tsx`) provides:

1. **Comments Section**
   - Display existing comments
   - Add new comment form
   - Empty state when no comments

2. **Revision Chain**
   - Visual display of parent/child relationships
   - Quick navigation between revisions
   - State indicators (completed, failed, running)

3. **Revision Request Modal**
   - Instruction input
   - Mode selection (Edit/Regenerate)
   - Submits revision request

## API Path Configuration

Frontend uses `VITE_API_URL` environment variable:

```typescript
// FeedbackTab.tsx
const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : '/api';
```

**Important:** The `/api` prefix is appended to `VITE_API_URL` to match backend route paths.

## Error Handling

### Frontend
- 404 responses for comments/revisions return empty arrays (graceful empty state)
- Error messages displayed in UI error banner
- Non-blocking: Feedback tab failures don't crash job detail page

### Backend
- All errors include `requestId` for debugging
- Consistent error response format:
  ```json
  {
    "error": {
      "code": "ERROR_CODE",
      "message": "Human-readable message",
      "requestId": "uuid"
    }
  }
  ```

## Database Schema

### job_comments table
```sql
CREATE TABLE job_comments (
  id UUID PRIMARY KEY,
  job_id UUID REFERENCES jobs(id),
  user_id UUID REFERENCES users(id) NULL,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### jobs table (revision fields)
```sql
ALTER TABLE jobs ADD COLUMN parent_job_id UUID REFERENCES jobs(id);
ALTER TABLE jobs ADD COLUMN revision_note TEXT;
```

