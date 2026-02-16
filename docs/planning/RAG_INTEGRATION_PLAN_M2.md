# RAG Integration Plan (M2)

## Scope

This plan defines incremental, production-safe RAG integration work for M2 without refactoring AKIS architecture.

- Backend stack remains Fastify + Drizzle + Postgres.
- Frontend remains React + Vite.
- External vendor calls remain behind MCP adapters.

## Workstreams

### M2-RAG-1: Service Readiness

- Confirm `PIRI_BASE_URL` runtime wiring and status visibility (`/api/rag/status`).
- Keep graceful degradation when Piri is unavailable.

### M2-RAG-2: Hybrid Retrieval

- Add `keyword + semantic` fusion endpoint:
  - `POST /api/knowledge/retrieval/hybrid`
- Fusion behavior:
  - deterministic weighting (`keywordWeight`, `semanticWeight`)
  - token-budget aware result capping
  - fallback to keyword-only when semantic service is unavailable

### M2-RAG-3: Evaluation Surface

- Extend dashboard RAG page with:
  - evaluation tab (`POST /api/rag/evaluation/run`)
  - fixed 5-metric contract (`relevance`, `coverage`, `freshness`, `provenance`, `stability`)
  - per-query stability + retrieval mix details
- Keep existing Ask/Search/WebSearch/Learn tabs intact.

### M2-RAG-4: Knowledge Governance UI

- Add knowledge governance tab:
  - list documents by lifecycle status (`proposed | approved | deprecated`)
  - approve/deprecate actions
  - manual document upload (`POST /api/knowledge/documents/upload`)
  - release/CVE signal sync actions

## API Contract

- `POST /api/knowledge/retrieval/hybrid`
  - request: `{ query, topK?, maxTokens?, includeProposed?, keywordWeight?, semanticWeight? }`
  - response: `{ query, count, results[] }`
- `POST /api/rag/evaluation/run`
  - request: `{ queries[], topK?, maxTokens?, includeProposed?, keywordWeight?, semanticWeight?, minResultsThreshold? }`
  - response: `{ runId, executedAt, config, metrics, queries[] }`
- `GET /api/knowledge/documents?status=&limit=&offset=`
- `POST /api/knowledge/documents/upload`
- `POST /api/knowledge/documents/:id/approve`
- `POST /api/knowledge/documents/:id/deprecate`
- `POST /api/knowledge/signals/releases/sync`
- `POST /api/knowledge/signals/cve/sync`

## Acceptance Criteria

1. Hybrid retrieval returns deterministic ordering for the same query and weights.
2. Piri downtime does not block retrieval endpoint (keyword fallback path).
3. Evaluation endpoint returns stable 5 metrics and per-query diagnostics.
4. Admin can upload documents, then move them through lifecycle states.
5. CVE sync deduplicates by `CVE-*` identifier.
6. Docs references in `NEXT.md` and `ROADMAP.md` resolve to existing files.

## Risks and Mitigations

- **Risk:** false confidence in semantic results.
  - **Mitigation:** explicit retrieval method labels in UI and score display.
- **Risk:** advisory noise / false positives.
  - **Mitigation:** CVE dedupe + severity normalization + admin workflow.
- **Risk:** scope creep in RAG UI.
  - **Mitigation:** confine to one page with minimal tab additions.
