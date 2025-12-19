# Scribe Improvement Plan

AKIS Scribe Agent için iyileştirme yol haritası.

---

## Current State (S0.4.6)

### What Works
- ✅ GitHub-only mode (Confluence optional)
- ✅ Config-aware job creation (`mode: from_config`)
- ✅ MCP Gateway integration for local development
- ✅ Job creation and listing
- ✅ Correlation ID tracking for debugging
- ✅ Fail-fast validation for missing dependencies

### Known Limitations
- ⚠️ Job execution depends on LLM provider availability
- ⚠️ No real-time job status updates (polling required)
- ⚠️ Error messages could be more user-friendly in UI
- ⚠️ No retry mechanism for transient failures
- ⚠️ Limited observability (no metrics/tracing)

---

## Near-Term Fixes (Next 2 Sprints)

### 1. Payload Validation Hardening

**Goal**: Prevent runtime errors from malformed payloads

| Task | Priority | Complexity |
|------|----------|------------|
| Add Zod schema versioning | High | Medium |
| Validate config before job start | High | Low |
| Return field-level validation errors | Medium | Low |
| Add payload sanitization | Medium | Medium |

**Implementation Notes**:
- Use `z.preprocess()` for backward compatibility
- Include `schema_version` in payloads
- Surface specific field errors in API response

### 2. MCP Integration Hardening

**Goal**: Reliable GitHub MCP communication

| Task | Priority | Complexity |
|------|----------|------------|
| Add retry with exponential backoff | High | Medium |
| Implement circuit breaker | Medium | High |
| Add connection health monitoring | Medium | Medium |
| Cache GitHub metadata (repos, branches) | Low | Low |

**Implementation Notes**:
- Use correlation IDs for tracing
- Log all MCP request/response cycles (sanitized)
- Set aggressive timeouts (30s max)

### 3. Observability

**Goal**: Understand what's happening in production

| Task | Priority | Complexity |
|------|----------|------------|
| Add structured logging (pino) | High | Low |
| Track job duration metrics | High | Medium |
| Add request tracing | Medium | Medium |
| Create health dashboard | Low | High |

**Metrics to Track**:
```
- scribe.job.created (counter)
- scribe.job.completed (counter, with status label)
- scribe.job.duration_ms (histogram)
- scribe.mcp.request_count (counter)
- scribe.mcp.request_duration_ms (histogram)
- scribe.mcp.error_count (counter, with code label)
```

---

## UI/UX Improvements

### 1. Job Status Real-Time Updates

**Current**: User must manually refresh to see job status
**Target**: Live status updates via WebSocket or polling

```typescript
// Proposed API
GET /api/agents/jobs/:id/status
{
  "status": "running",
  "progress": 0.45,
  "currentStep": "Analyzing repository structure",
  "logs": [...last 10 lines...],
  "updatedAt": "2025-12-19T14:00:00Z"
}
```

### 2. Error Surfacing

**Current**: Generic "Request validation failed" messages
**Target**: Actionable, contextual error messages

| Error Type | Current Message | Improved Message |
|------------|-----------------|------------------|
| Missing repo | "Validation failed" | "Please select a GitHub repository" |
| No GitHub | "Service unavailable" | "Connect your GitHub account to continue" |
| MCP timeout | "Internal error" | "GitHub is slow to respond. Retry?" |

### 3. Retry Mechanism

Add UI for job retry with options:
- **Retry with same config**: Re-run failed job
- **Retry with modified config**: Edit and re-run
- **Auto-retry**: Enable for transient failures

```typescript
// Proposed UI component
<JobRetryButton 
  jobId={job.id}
  canModify={job.status === 'failed'}
  autoRetryEnabled={config.autoRetry}
/>
```

### 4. Progress Visualization

Show clear progress during job execution:

```
┌─────────────────────────────────────────────────┐
│ Scribe Job: Generating Documentation            │
├─────────────────────────────────────────────────┤
│ ● Fetching repository structure    ✓ Done       │
│ ● Analyzing code files             ⋯ Running    │
│ ○ Generating documentation         Pending      │
│ ○ Creating pull request            Pending      │
├─────────────────────────────────────────────────┤
│ [████████████░░░░░░░░░░░░░░░░░░] 45%            │
└─────────────────────────────────────────────────┘
```

---

## Test Strategy

### Unit Tests

**Coverage Target**: 80%+

| Area | Current | Target |
|------|---------|--------|
| Scribe Agent | ~60% | 85% |
| MCP Service | ~50% | 80% |
| Job Orchestrator | ~70% | 85% |

**Focus Areas**:
- Payload validation edge cases
- Error handling paths
- Config transformation logic

### Integration Tests

**What to Test**:
- Job creation → execution → completion flow
- MCP Gateway communication (mock server)
- Database state transitions
- API contract compliance

**Test Environment**:
```yaml
# docker-compose.test.yml
services:
  postgres:
    image: postgres:16
  mcp-mock:
    image: akis/mcp-mock:latest
```

### E2E Tests

**Priority Scenarios**:
1. GitHub-only happy path: Config → Job → Success
2. Error handling: Missing connection → Clear error
3. Retry flow: Failed job → Retry → Success

**Framework**: Playwright (recommended)

```typescript
test('Scribe GitHub-only flow', async ({ page }) => {
  await page.goto('/dashboard/agents/scribe');
  
  // Select GitHub repo
  await page.click('[data-testid="repo-select"]');
  await page.click('[data-testid="repo-option-myrepo"]');
  
  // Run job
  await page.click('[data-testid="run-now-button"]');
  
  // Verify job started
  await expect(page.locator('[data-testid="job-status"]'))
    .toHaveText('Running');
});
```

### Definition of Done

A Scribe feature is "done" when:

- [ ] Unit tests pass (80%+ coverage for new code)
- [ ] Integration tests cover the happy path
- [ ] E2E test covers the primary user flow
- [ ] Error cases have specific tests
- [ ] Documentation updated (if user-facing)
- [ ] Observability: logs and metrics in place
- [ ] QA sign-off on staging environment

---

## Milestones

### Iteration 1 (Current Sprint)
**Theme**: Stability & Reliability

- [x] MCP Gateway V2 with correlation IDs
- [x] GitHub-only mode working
- [x] Config-aware job validation
- [ ] Add job status endpoint
- [ ] Improve error messages (top 5)

**Exit Criteria**: Job creation and listing work reliably for GitHub-only mode

### Iteration 2 (Next Sprint)
**Theme**: Observability & UX

- [ ] Add structured logging
- [ ] Track job metrics
- [ ] Real-time job status (polling)
- [ ] Retry button in UI
- [ ] Error message improvements

**Exit Criteria**: Can debug any job failure within 5 minutes using logs/metrics

### Iteration 3 (Sprint +2)
**Theme**: Resilience & Scale

- [ ] Implement retry with backoff
- [ ] Add circuit breaker for MCP
- [ ] Cache GitHub metadata
- [ ] E2E test suite
- [ ] Performance benchmarks

**Exit Criteria**: System handles 100 concurrent jobs without degradation

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| LLM provider rate limits | High | Queue jobs, implement backoff |
| MCP Gateway crashes | Medium | Auto-restart, health checks |
| GitHub API limits | Medium | Cache metadata, batch requests |
| Large repos timeout | Medium | Chunked processing, progress reporting |
| User auth token expiry | Low | Refresh token flow, clear error |

---

## References

- [MCP Gateway Setup](./GITHUB_MCP_SETUP.md)
- [API Specification](../backend/docs/API_SPEC.md)
- [Agent Workflows](../backend/docs/AGENT_WORKFLOWS.md)
- [QA Manual](./QA_SCRIBE_S0.4.6_MANUAL.md)

