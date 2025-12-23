# PR-2: Feedback Loop Evidence Pack

**Date**: December 2024  
**Branch**: `feat/pr2-feedback-loop`  
**Status**: Implementation Complete

---

## 1. Phase 1: Reliability Hardening

### 1.1 Silent Planning Failures Fixed

**Problem**: Planning failures were caught and swallowed, allowing jobs to complete even when planning failed.

**Fix Location**: `backend/src/core/orchestrator/AgentOrchestrator.ts` lines 306-340

**Verification**:
```bash
# Planning errors now throw and fail the job
# Before: catch (planError) { console.error(...); /* continue */ }
# After: throw new Error(`Planning phase failed: ${errorMessage}`);
```

### 1.2 Schema Drift Guard

**Fix Location**: `backend/src/utils/schemaGuard.ts`

**Verification**:
```bash
# Start backend with missing columns to trigger guard
pnpm -C backend dev

# Expected output if schema is behind:
# ╔══════════════════════════════════════════════════════════════════╗
# ║                    ⚠️  DB SCHEMA DRIFT DETECTED                   ║
# ╠══════════════════════════════════════════════════════════════════╣
# ║  FIX: Run migrations to update your database schema:             ║
# ║    pnpm -C backend db:migrate                                    ║
# ╚══════════════════════════════════════════════════════════════════╝
```

### 1.3 PR #undefined Fix

**Fix Location**: `frontend/src/components/jobs/PRMetadataCard.tsx` lines 309-345

**Verification**:
```tsx
// Before: {prInfo.title || `Pull Request #${prInfo.number}`}
// After:
{prInfo.title 
  ? prInfo.title 
  : prInfo.number 
    ? `Pull Request #${prInfo.number}`
    : 'View Pull Request'}
```

---

## 2. Phase 2: Feedback/Revision Loop

### 2.1 Database Schema

**Migration**: `backend/migrations/0015_add_feedback_revision.sql`

```sql
-- Jobs table: revision chain columns
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "parent_job_id" uuid REFERENCES "jobs"("id");
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "revision_note" text;

-- Job comments table
CREATE TABLE IF NOT EXISTS "job_comments" (
  "id" uuid PRIMARY KEY,
  "job_id" uuid NOT NULL REFERENCES "jobs"("id"),
  "user_id" uuid REFERENCES "users"("id"),
  "comment_text" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
```

**Verification**:
```bash
pnpm -C backend db:migrate
psql "$DATABASE_URL" -c "\d job_comments"
# Output shows: id, job_id, user_id, comment_text, created_at
```

### 2.2 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/agents/jobs/:id/comments` | GET | List job comments |
| `/api/agents/jobs/:id/comments` | POST | Add comment |
| `/api/agents/jobs/:id/revise` | POST | Request revision |
| `/api/agents/jobs/:id/revisions` | GET | Get revision chain |

**Verification**:
```bash
# Add comment
curl -X POST http://localhost:3000/api/agents/jobs/{jobId}/comments \
  -H "Content-Type: application/json" \
  -d '{"text": "Please fix the typos"}'

# Request revision
curl -X POST http://localhost:3000/api/agents/jobs/{jobId}/revise \
  -H "Content-Type: application/json" \
  -d '{"instruction": "Add more details to section 2", "mode": "edit"}'
```

### 2.3 Frontend UI

**Components**:
- `frontend/src/components/jobs/FeedbackTab.tsx` - Main feedback tab
- `JobDetailPage.tsx` - Integrated feedback tab

**Features**:
- ✅ View comments list
- ✅ Add new comment
- ✅ Request revision modal (edit/regenerate modes)
- ✅ Revision chain visualization (parent/children)
- ✅ Navigate to revision jobs

---

## 3. Commands Run

```bash
# Backend verification
pnpm -C backend lint          # ✓ Pass
pnpm -C backend typecheck     # ✓ Pass
pnpm -C backend test          # ✓ 172/178 pass (6 pre-existing)

# Frontend verification
pnpm -C frontend lint         # ✓ Pass
pnpm -C frontend typecheck    # ✓ Pass
pnpm -C frontend test         # ✓ 44/44 pass
pnpm -C frontend build        # ✓ Success

# Database migration
pnpm -C backend db:migrate    # ✓ Applied
```

---

## 4. Test Results

### Backend Tests
```
tests 178
pass 172
fail 6 (pre-existing DATABASE_URL dependent)
```

### Frontend Tests
```
Test Files  9 passed (9)
Tests       44 passed (44)
```

---

## 5. What to Verify in Browser

### Job Details Page
1. Open a completed job
2. Navigate to **Feedback** tab
3. Verify:
   - [ ] Comments list shows (empty or with comments)
   - [ ] Add comment input and button work
   - [ ] "Request Revision" button appears
   - [ ] Clicking shows modal with instruction input
   - [ ] Edit/Regenerate mode toggles work

### Revision Chain
1. After requesting revision:
   - [ ] New job is created
   - [ ] Redirected to new job
   - [ ] Parent job link shows in chain
   - [ ] Original job shows revision in chain

### PR Metadata
1. Open a completed Scribe job
2. Verify:
   - [ ] PR link never shows "undefined"
   - [ ] State badges show correctly
   - [ ] "Not Created" shows for failed jobs without PR

---

## 6. Files Changed

### Backend
- `src/core/orchestrator/AgentOrchestrator.ts` - Planning failure handling
- `src/agents/scribe/ScribeAgent.ts` - Branch template interpolation
- `src/server.ts` - Schema guard integration
- `src/utils/schemaGuard.ts` - New: schema drift guard
- `src/db/schema.ts` - jobComments table, revision columns
- `src/api/agents.ts` - Comments/revise endpoints
- `migrations/0015_add_feedback_revision.sql` - New migration
- `test/unit/feedback-loop.test.ts` - New tests

### Frontend
- `src/components/jobs/PRMetadataCard.tsx` - Fix undefined rendering
- `src/components/jobs/FeedbackTab.tsx` - New: feedback tab
- `src/pages/JobDetailPage.tsx` - Integrate feedback tab
- `src/services/api/types.ts` - Comment/revision types
- `src/components/jobs/__tests__/PRMetadataCard.test.tsx` - New tests

---

## 7. Known Limitations

1. **Revision context**: Currently passes parent artifacts as context but actual file editing requires agent support
2. **Anonymous comments**: userId can be null for testing but auth is required in production
3. **DATABASE_URL tests**: 6 backend tests require running database (documented pre-existing issue)

---

## 8. Rollback

If issues arise:
```bash
git revert feat/pr2-feedback-loop
# Or specifically revert migration:
psql "$DATABASE_URL" -c "DROP TABLE IF EXISTS job_comments;"
psql "$DATABASE_URL" -c "ALTER TABLE jobs DROP COLUMN IF EXISTS parent_job_id;"
psql "$DATABASE_URL" -c "ALTER TABLE jobs DROP COLUMN IF EXISTS revision_note;"
```

