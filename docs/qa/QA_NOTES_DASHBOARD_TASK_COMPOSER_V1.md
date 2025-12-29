# QA Notes — Dashboard Task Composer V1

## Scope
- Scribe end-to-end run via Task Composer.
- Trace/Proto surfaced but disabled.
- Model picker + agent settings included in request payload.

## Test Cases
1. **Select Scribe agent (enabled)**
   - Open `/dashboard/task-composer`.
   - Verify Scribe card is selectable; Trace/Proto show “Coming soon” and are disabled.
2. **Select model**
   - Fill `providerId` + `modelId`.
   - Advanced tuning fields optional; leaving them blank still enables Run when other requirements are met.
3. **Required-field validation**
   - Leave repository owner/name/base branch empty and attempt Run → Run disabled or inline errors shown.
   - Empty task prompt blocks Run with inline message.
4. **Run creation**
   - With required fields populated, click Run.
   - Verify POST `/api/agents/jobs` includes `agentType: "scribe"`, `modelConfig` fields, and `agentConfig` with repo coordinates.
5. **Status transitions**
   - Observe status chip/logs: `pending` → `running` → (`completed` | `failed`).
   - Logs add entries on submission and state changes.
6. **Failure handling**
   - Simulate backend error (e.g., invalid repo) → failure banner/log entry shows error message or request/correlation id when available.

## Evidence Checklist
- Screenshots:
  - Empty state (before filling form).
  - Ready state (all required fields entered, Run enabled).
  - Running state (status chip + log entry).
  - Completed state (success chip/log).
  - Failed state (error chip/log).
