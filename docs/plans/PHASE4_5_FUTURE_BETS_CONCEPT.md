# Phase 4/5 Future Bets Concept (Decision Memo)

**Status:** Proposed only. Gated after Phase 1 production demo + Phase 2 hosting baseline.

## Why gated
- Phase 1 demo validates core workflows and QA readiness.
- Phase 2 hosting baseline proves OCI limits, ops, and cost control.
- Prevents scope creep while Phase 0-3 deliverables are active.

## Goals
- Phase 4: Premium Quality RAG System
  - Self-hosted on OCI Free Tier using an open-source LLM and advanced RAG to raise answer quality and doc accuracy.
  - Improve reliability of Scribe/Trace outputs against approved knowledge sources.
- Phase 5: AKIS Operator / Device-Link
  - Secure tunnel to controlled computer operations for gated actions.
  - Expand what the Orchestrator can safely delegate while keeping human oversight.

## Deliverables (proposed, gated)
- Phase 4 deliverables
  - RAG evaluation criteria and baseline measurements (doc accuracy, first-run green).
  - OCI resource envelope validated for self-hosted model + RAG.
  - Quality improvements measured against the current Scribe/Trace baseline.
- Phase 5 deliverables
  - Secure device-link capability with explicit operator approvals.
  - Auditable action logs and defined safety boundaries.
  - Minimal, safe action catalog for controlled operations.

## Not in scope before gates
- No active schedule or priority changes in Phase 0-3 planning.
- No implementation work or vendor SDK integration guidance.
- No changes to canonical auth flows or agent architecture.
- No production commitments or release dates for Phase 4/5.

## Constraints
- OCI Free Tier limits (CPU, RAM, storage, bandwidth) remain the hard ceiling.
- Modular monolith and centralized Orchestrator remain the core architecture.
- MCP adapters remain the only external integration surface for tools.
- Cost control and privacy requirements apply to all Phase 4/5 exploration.

## Integration points
- Orchestrator: central control of new agent workflows and gating.
- MCP adapters: single integration layer for external systems.
- Agent contracts/playbooks: define inputs, outputs, and validations.
- UI surfaces: optional read-only status visibility only if core gates are met.

## Data and security boundaries
- Treat repo contents, logs, and user data as sensitive; minimize retention.
- Keep data access scoped to least privilege and explicit user consent.
- Separate evaluation data from production data when feasible.
- No direct execution on user systems without explicit operator gate and audit trail.

## Risk register
| Risk | Description | Mitigation focus |
|------|-------------|------------------|
| Model size/latency | Self-hosted models may be too slow on OCI Free Tier | Model sizing, caching, staged rollouts |
| Storage growth | Vector stores and artifacts can exceed free tier limits | Retention policy, pruning, tiered storage |
| Privacy leakage | RAG can surface sensitive data or prompt leaks | Access controls, redaction, audit logs |
| Evaluation drift | Quality regressions without grounded metrics | Golden sets, doc accuracy checks, FRG tracking |
| Cost control | Hidden compute/storage costs if usage spikes | Usage caps, quotas, clear kill-switches |
| Operational complexity | Running LLM + RAG stack increases ops burden | Simple deployment, observability, fail-closed |

## Success metrics (aligned to North Star)
- Time saved per workflow (north-star metric: time saved)
- Doc Accuracy Score improvement on Scribe outputs
- Diff-Coverage for documentation updates
- First-Run Green rate for generated artifacts
- Time-to-MVP reduction where Proto workflows are used
- RAG answer correctness and latency targets (measured against approved eval sets)

## Decision gate
Proceed only after:
- Phase 1 production demo completed with QA sign-off
- Phase 2 hosting baseline stable on OCI Free Tier
