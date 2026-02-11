# Yasir Preferences

## 2026-02-11

- Prefer explicit, visible execution transparency in UI.
  Example: Agent/automation runs should remain in chat history with phase messages and live progress.

- Prefer measurable quality signals shown directly in product surfaces.
  Example: Doc quality/completeness indicators should be visible in Agent Hub and Job Details views.

- Prefer conversation continuity over ephemeral run logs.
  Example: Users should reopen previous agent/automation chats and continue from the same thread.

- Prefer docs pages to feel polished and consistent in both TR/EN locales.
  Example: Agent docs should include structured sections, references, and visual blocks instead of plain text walls.

- Prefer strong readability and contrast in both dark and light themes.
  Example: Buttons must keep text visible regardless of background or theme mode.

- Prefer guided prototype runs with 3-4 multiple-choice questions before execution.
  Example: Trace should ask quick option-based questions, send those answers to the LLM, then generate a tailored prototype.

- Prefer per-agent live runtime control inside the IDE (temperature + command policy) with visible settings access.
  Example: Every agent surface should expose a Settings button and support instant runtime behavior changes.

- Prefer steer queue control during active runs (reorder, delete, run-now) instead of blocking new user instructions.
  Example: If user sends a new message while an agent is running, queue it and let user manage execution order.

- Prefer repository hygiene actions to be bundled with delivery when requested.
  Example: After feature implementation, include branch/PR cleanup and merge flow preparation in the same execution cycle.

- Prefer preserving the full AKIS wordmark on hero/marketing while using mark-only assets for compact UI and favicons.
  Example: Keep `akis-official-logo@*` in hero sections, route compact/logo-small and favicon usage to A-mark assets.

- Prefer strict branch naming aligned with milestone scope and avoid direct work on `main`.
  Example: Use `feat/S0.5.X-short-desc` or `fix/S0.5.X-short-desc` before making changes.

- Prefer Scribe quality score to reflect real execution evidence (accuracy + coverage), not sparse payload defaults.
  Example: Derive quality metrics from agent result, diagnostics, and artifacts so completed runs do not stay at `10/100` when docs are actually produced.
