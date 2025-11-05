# 08 – Testing & Definition of Done

## MUST
- Unit tests for: AgentFactory creation, Orchestrator state transitions, MCP adapter error paths.
- Smoke test for planner→execute→reflect flow (no external calls; use fakes).

## SHOULD
- Log metrics (names only) during tests: Time-to-MVP, Diff-Coverage, First-Run Green.

## FORBIDDEN
- Tests that depend on real external tokens/endpoints.

## PASS / FAIL Heuristics
- ✅ Tests isolate Orchestrator and use fake adapters.
- ❌ Live network calls or env-bound secrets in test code.

## DoD (checklist)
- [ ] Contract/Playbook respected.
- [ ] FSM transitions covered.
- [ ] MCP-only integration paths.
- [ ] API schemas (Zod) validated.
- [ ] OCI perf sanity acknowledged (no heavy frameworks added).
