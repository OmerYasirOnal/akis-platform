# Documentation & CI Hardening Plan

## Objectives
- Raise DAS to ≥ 80% and keep it there with a PR gate.
- Normalize repo docs (README, Quickstart, Changelog, Env, Architecture, API, Contributing).
- Improve Scribe heuristics for stack and Quickstart detection.

## Deliverables
- CONTRIBUTING.md
- docs/GETTING_STARTED.md
- docs/ARCHITECTURE.md
- docs/API.md
- .github/workflows/docs-quality.yml
- .github/pull_request_template.md
- .github/ISSUE_TEMPLATE/docs_improvement.yml
- CODEOWNERS

## Acceptance Criteria
- CI blocks merge if Quickstart or required docs are missing.
- DAS report ≥ 80% on this PR.
- README contains "## Quickstart" or "## Getting Started".
- Architecture and API skeletons present with TODO markers.

