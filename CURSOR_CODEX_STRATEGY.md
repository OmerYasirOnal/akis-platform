# Cursor + Codex Usage Strategy (AKIS)

This guide defines how the AKIS team uses Cursor and Codex so work stays aligned with canonical docs, guardrails, and platform constraints. It is a policy guide, not an implementation guide.

## Baseline guardrails (always on)
- Backend: Fastify + TypeScript (Node 20) with PostgreSQL + Drizzle.
- Frontend: React + Vite SPA (no Next.js).
- Integrations: MCP-only adapters; no direct REST SDKs or ad-hoc API clients.
- Auth: keep the existing Cursor-style multi-step signup and login flows intact.
- Constraints: OCI Free Tier mindset (lightweight deps, single deployable backend, no heavy hot-path overhead).

## 1) Mode selection rules (Agent vs Ask)
- Ask mode: use for scoping, reading canonical docs, risk analysis, and when no file edits are needed.
- Agent mode: use for any task that requires edits, multi-file changes, or doc updates.
- If requirements conflict with canonical docs or guardrails, stay in Ask mode and resolve first.
- Prefer small, reviewable change sets; split work if scope grows.

## 2) Model role matrix
| Model | Primary role | Best used for | Not used for |
| --- | --- | --- | --- |
| Codex | Execution and edits | Multi-file changes, refactors, tests, doc updates, repo-wide consistency | Deep architectural debates without a clear decision to implement |
| GPT-5.2 Thinking | High-stakes reasoning | Architecture decisions, risk analysis, complex root-cause analysis, tradeoffs | Routine edits or bulk mechanical changes |
| GPT-4 class | Fast drafting | Summaries, small copy edits, lightweight review notes | Critical design decisions or large refactors |

Rule of thumb: use GPT-5.2 Thinking to decide, Codex to implement, GPT-4 class to draft or summarize.

## 3) Context layering order (canonical docs first)
1) Canonical planning chain: `docs/PROJECT_TRACKING_BASELINE.md` -> `docs/ROADMAP.md` -> `docs/NEXT.md`
2) Core context: `.cursor/context/CONTEXT_SCOPE.md` and `.cursor/context/CONTEXT_ARCHITECTURE.md`
3) Guardrails and constraints: `.cursor/rules/rules.mdc`, `.cursor/checklists/DoD.md`, `.cursor/checklists/Security.md`, `.cursor/checklists/Performance.md`, `docs/constraints.md`
4) Domain docs: `backend/docs/API_SPEC.md`, `backend/docs/AGENT_WORKFLOWS.md`, `docs/UI_DESIGN_SYSTEM.md`, `docs/WEB_INFORMATION_ARCHITECTURE.md`
5) Environment and integration docs: `docs/ENV_SETUP.md`, `docs/DEV_SETUP.md`, `docs/GITHUB_MCP_SETUP.md`, `docs/MCP_ENV_SECURITY_IMPLEMENTATION.md`
6) Evidence and reports: `docs/qa/*`, release notes, and audits (validation only)

If a user request conflicts with the first three layers, pause and reconcile before editing. Avoid using `docs/archive/*` as a source of truth unless explicitly requested.

## 4) Prompt templates (TASK/LOCATION/RULES)
Template: Targeted doc update
TASK: Update a single doc to align with canonical constraints and current stack.
LOCATION: docs/<target>.md
RULES: No code, ASCII only, reference relevant canonical docs, keep scope tight.

Template: Backend change
TASK: Implement a backend change that respects Fastify + TS, PostgreSQL + Drizzle, and MCP-only integrations.
LOCATION: backend/src/...
RULES: Follow .cursor guardrails, preserve auth flows, include quality gates and DoD checks.

Template: Frontend change
TASK: Update the Vite React SPA without altering Cursor-style auth flow steps.
LOCATION: frontend/src/...
RULES: Align with UI design system and IA docs, add or update tests as needed, keep performance constraints in mind.

Template: Investigation only
TASK: Analyze and summarize the current state and risks of <topic>.
LOCATION: Read-only, cite canonical docs first.
RULES: No edits, flag conflicts, list open questions.

## 5) Quality gates and Definition of Done
- Quality gates: typecheck, lint, build, and test suites must pass for the workspace.
- Tests: backend changes include at least one fastify.inject test; frontend changes add or update vitest coverage.
- Security: helmet, cors, and rate-limit are registered; no secrets in repo; requestId is present in logs.
- Docs: update README/NEXT/ENV docs when behavior or configuration changes.
- PR hygiene: conventional commit style, focused scope, and evidence attached to validate outcomes.

## 6) Anti-patterns (what not to do)
- Bypass canonical docs, or treat archived docs as authoritative.
- Introduce Prisma, Next.js backend, or non-MCP integrations.
- Short-circuit or redesign the multi-step auth flows without explicit agreement.
- Add nested lockfiles, commit build artifacts, or loosen CI quality gates.
- Add heavy dependencies or blocking work in request paths without OCI Free Tier justification.
- Ship changes without tests, evidence, or DoD alignment.
