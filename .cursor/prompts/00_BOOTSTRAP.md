# TASK: Initialize repo & branch

LOAD:
@.cursor/rules/rules.mdc
@.cursor/context/CONTEXT_ARCHITECTURE.md
@.cursor/context/CONTEXT_SCOPE.md
@.cursor/checklists/DoD.md

GIT
1) Create and switch to branch: feature/akis-bootstrap
2) Use small Conventional Commits.

WHAT
- At root: `.editorconfig`, `.gitignore`, `LICENSE` placeholder, `README.md`.
- `.env.example`:
  - DATABASE_URL=postgres://user:pass@localhost:5432/akis
  - MCP_GITHUB_TOKEN=
  - MCP_JIRA_TOKEN=
  - MCP_CONFLUENCE_TOKEN=
- `docs/` with an index referencing checklists.

EXPECTED COMMIT
`chore(bootstrap): add repo-level scaffolding and env template`
