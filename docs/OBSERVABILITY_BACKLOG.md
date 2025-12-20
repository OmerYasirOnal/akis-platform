# Observability UI Backlog (Phase 2+)

**Created:** 2025-12-20  
**Status:** Backlog - For future PRs  
**Related PR:** #115 (Job Details UX Upgrade)

---

## Overview

This document captures the remaining observability improvements that were identified during the Phase 1 implementation but couldn't be completed within the 20-minute timebox. These are concrete, actionable tasks for future PRs.

---

## Phase 2 Tasks (Next PR)

### 1. Trace + Proto Agent UI Extensions
**Priority:** High  
**Effort:** 1-2 hours

- [ ] Add Proto-specific step labels (analyze-goal, scaffold, implement, test-prototype)
- [ ] Add Trace-specific step labels (parse-requirements, generate-tests, validate-tests)
- [ ] Customize timeline icons for each agent type
- [ ] Agent-specific empty states with relevant guidance

**Files to modify:**
- `frontend/src/components/agents/StepTimeline.tsx`
- `frontend/src/pages/JobDetailPage.tsx`

### 2. Diff View Enhancement
**Priority:** Medium  
**Effort:** 2-3 hours

- [ ] Fetch diff from GitHub PR files API when available
- [ ] Compare endpoint integration for non-PR diffs
- [ ] Syntax highlighting for different file types
- [ ] Side-by-side diff option
- [ ] "Diff unavailable" graceful fallback with guidance

**Files to modify:**
- `frontend/src/components/jobs/ArtifactPreview.tsx`
- `backend/src/services/mcp/adapters/GitHubMCPService.ts`

### 3. Real-time Progress Updates
**Priority:** Medium  
**Effort:** 2-3 hours

- [ ] WebSocket or SSE for live trace updates
- [ ] Progress indicator showing current step
- [ ] Animated timeline as events come in
- [ ] "Last updated X seconds ago" indicator

**Files to modify:**
- `backend/src/routes/jobs.ts`
- `frontend/src/hooks/useJob.ts`
- `frontend/src/pages/JobDetailPage.tsx`

### 4. Smoke Test Expansion
**Priority:** High  
**Effort:** 1 hour

- [ ] Playwright E2E test for Timeline grouped steps
- [ ] Test reasoningSummary visibility
- [ ] Test artifact Preview action
- [ ] Test PR metadata card states

**Files to create/modify:**
- `frontend/tests/e2e/job-details.spec.ts`

---

## Phase 3 Tasks (Documentation)

### 5. Trace Model Documentation
**Priority:** Medium  
**Effort:** 1-2 hours

Create `docs/observability/TRACE_MODEL.md`:
- Event types and their meanings
- Safe fields vs. redacted fields
- Redaction rules and patterns
- Example trace payloads

### 6. Agent Workflow Documentation
**Priority:** Medium  
**Effort:** 2-3 hours

Create workflow docs for each agent:
- `docs/agents/SCRIBE_WORKFLOW.md`
- `docs/agents/TRACE_WORKFLOW.md`
- `docs/agents/PROTO_WORKFLOW.md`

Each should include:
- Step-by-step workflow diagram
- Decision points and reasoning
- Success/failure paths
- Integration points (GitHub, Jira, Confluence)

### 7. Orchestrator Architecture
**Priority:** Low  
**Effort:** 2-3 hours

Create `docs/architecture/ORCHESTRATOR_OVERVIEW.md`:
- Core orchestrator design
- Trace pipeline flow
- State machine transitions
- Error handling strategy

---

## Phase 4 Tasks (Advanced Features)

### 8. Timeline Export
**Priority:** Low  
**Effort:** 1-2 hours

- [ ] Export timeline as JSON
- [ ] Export as Markdown report
- [ ] Share link generation (read-only)

### 9. Analytics Dashboard
**Priority:** Low  
**Effort:** 3-4 hours

- [ ] Aggregate metrics (avg duration, success rate)
- [ ] Trend charts over time
- [ ] Agent comparison view
- [ ] Token/cost tracking per job

### 10. Advanced Filtering
**Priority:** Low  
**Effort:** 1-2 hours

- [ ] Date range filter
- [ ] Search within trace events
- [ ] Filter by correlation ID
- [ ] Save filter presets

---

## Implementation Notes

### Security Considerations
- All reasoning summaries are pre-sanitized by backend
- No raw chain-of-thought should ever reach the frontend
- Token patterns are redacted: `ghp_*`, `sk-*`, `Bearer *`
- Limit preview sizes: 20 lines / 5KB inline, full via modal

### Design Principles
1. **Clarity over density** - Each event should be understandable at a glance
2. **Progressive disclosure** - Default collapsed, expand for details
3. **Safe defaults** - Auto-expand errors, hide noise
4. **Consistent patterns** - Reuse components across agent types

### Component Reusability
All components are designed to work with any agent type:
- `StepTimeline` - Works with any stepId/eventType
- `ArtifactPreview` - Works with any file type
- `PRMetadataCard` - Works with any GitHub result

---

## Acceptance Criteria (Phase 2)

- [ ] Trace and Proto have same UX quality as Scribe
- [ ] Diff view fetches from GitHub when available
- [ ] All tests pass (unit + E2E)
- [ ] Documentation is Confluence-ready
- [ ] No security regressions

