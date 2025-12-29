# Dashboard Task Composer — V1 UX Specification

## Intent & Scope
- Codex-like “Task Composer” inside the authenticated dashboard.
- V1 = **Scribe end-to-end functional**; Trace + Proto shown but disabled with “coming soon” labels.
- Must reuse existing authentication/session model and current job/orchestrator FSM.
- Layout respects `docs/WEB_INFORMATION_ARCHITECTURE.md` and visual tokens from `docs/UI_DESIGN_SYSTEM.md`.

## Layout & Information Architecture
- **Left rail (Agent + Model)**
  - Agent selector cards: Scribe (enabled), Trace (disabled), Proto (disabled). Disabled cards show “Coming soon” tooltip/text and cannot be focused/selected.
  - Model picker: providerId + modelId, optional non-secret tuning (e.g., temperature, maxOutputTokens). Inputs are configuration-only; no vendor SDK calls.
- **Main panel (Task input)**
  - Large textarea titled “Define the task”.
  - Helper text: concise prompt guidance + character counter (soft guidance, no hard limit in V1).
- **Right panel (Agent settings)**
  - Uses Agent Settings Registry components.
  - Scribe panel shows **Required** and **Optional/Advanced** groupings; optional never blocks Run.
- **Bottom bar (Run + status/logs)**
  - Primary CTA: “Run task”. Disabled until required fields are satisfied.
  - Status chip reflects job FSM: pending → running → completed | failed.
  - Log feed with timestamped entries (starts empty; fills after submission/polling), plus inline error callouts.

## States & UX Rules
- **Empty**: No agent selected or task/model incomplete. Run CTA disabled; inline cues call required fields.
- **Ready**: Scribe selected, model picker filled, required Scribe fields + task present. Run CTA enabled.
- **Running**: Submission in-flight or job state `running/pending`. Inputs locked; status shows spinner + “Running” copy.
- **Completed**: Job state `completed`. Status chip green; logs show completion entry and any artifacts summary link.
- **Failed**: Job state `failed`. Status chip red; error banner with message + correlation/request id when available. “Try again” keeps filled inputs.
- **Validation**: Missing required fields show inline text under the field and block Run. Optional/advanced settings never prevent progression.

## Agent Settings Registry — Field Rules (V1)
- **Scribe (enabled)**
  - Required: repositoryOwner, repositoryName, baseBranch, task prompt (from main panel), model provider/model.
  - Optional/Advanced: targetPath, featureBranch, branchPattern, includeGlobs/excludeGlobs, targetPlatform + targetConfig, dryRun flag.
  - Validation: required fields non-empty strings; include/exclude arrays accept comma or newline separated values; no secret/credential inputs allowed.
- **Trace (coming soon)** & **Proto (coming soon)**
  - Render disabled placeholder explaining V1 scope.
  - Registry still returns definitions so future enablement is a toggle.

## Model Picker Abstraction
- Data model: `{ providerId: string; modelId: string; optionalNonSecretTuning?: Record<string, number | string | boolean> }`.
- Purpose: configuration passthrough only. No client-side SDK invocation; payload flows to backend job creation.
- UX: dropdowns or text inputs that accept provider + model; tuning shown in collapsible “Advanced”. Fields are optional except providerId/modelId.

## Interaction Flow (End-to-End)
1) Select Agent (default: Scribe) — disabled cards cannot be selected.
2) Select Model — fill providerId + modelId (tuning optional).
3) Configure Agent Options — Scribe settings in right panel.
4) Define the task — textarea in main panel.
5) Run — validate required fields; POST to job endpoint with agentType, modelConfig, agentConfig, payload.
6) Observe status/logs — poll job state; show pending/running/completed/failed chips and add log lines per state change.
7) View artifacts — when present, show link/summary from job result or artifacts payload (no SDK calls client-side).

## Error Handling
- Missing required fields: inline error + disable Run. Combined error summary near CTA for quick scanning.
- Network/API errors: banner in bottom panel, retains form values, allows retry.
- Backend validation errors: surface `message` and optional `code/requestId`; log entry created in feed.

## Responsiveness & Accessibility
- Mobile: panels stack (agent/model above task, settings collapsible). Buttons full-width on small screens.
- Keyboard: focus ring uses `ak-primary`; disabled cards removed from tab order.
- Copy: plain-language labels, no jargon; status text mirrors FSM terms.
