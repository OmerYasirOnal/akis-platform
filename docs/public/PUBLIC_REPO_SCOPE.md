# Public Portfolio Repo — Scope & Rationale

> What goes into the public `akis-platform` repo and why.

## Strategy

**Allowlist-based export** — only explicitly approved paths are copied.
A denylist scan runs after export to catch accidental secret leakage.

## Included (Allowlist)

### Documentation
| Path | Why |
|------|-----|
| `README.md` | Generated from `docs/PUBLIC_PORTFOLIO.md` template |
| `LICENSE` | MIT license |
| `SECURITY.md` | Public-safe disclosure guidance |
| `docs/agents/AGENT_CONTRACTS_S0.5.md` | Shows agent I/O design |
| `docs/agents/CONTEXT_PACKS.md` | Shows RAG architecture decision |
| `docs/UI_DESIGN_SYSTEM.md` | Shows frontend design system |
| `docs/WEB_INFORMATION_ARCHITECTURE.md` | Shows UX thinking |
| `backend/docs/API_SPEC.md` | Shows API design |
| `backend/docs/Auth.md` | Shows auth flow design |
| `backend/docs/AGENT_WORKFLOWS.md` | Shows agent pipeline |

### Source Code (Showcase)
| Path | Why |
|------|-----|
| `backend/src/core/orchestrator/` | Central orchestration engine |
| `backend/src/core/state/` | FSM state machine |
| `backend/src/core/events/` | Event bus + SSE |
| `backend/src/core/tracing/` | Trace recording |
| `backend/src/core/contracts/` | Agent contract types |
| `backend/src/core/planning/` | Plan generation |
| `backend/src/services/quality/` | Quality scoring |
| `backend/src/core/watchdog/` | Stale job detection |
| `backend/src/agents/scribe/` | Scribe agent implementation |
| `backend/src/agents/trace/` | Trace agent implementation |
| `backend/src/agents/proto/` | Proto agent implementation |
| `backend/src/services/mcp/adapters/` | MCP protocol adapters |
| `frontend/src/pages/dashboard/` | Dashboard pages |
| `frontend/src/pages/dashboard/agents/` | Agent console pages |
| `frontend/src/components/agents/` | Agent UI components |
| `frontend/src/components/jobs/` | Job management UI |
| `frontend/src/components/dashboard/` | Dashboard widgets |

### Assets
| Path | Why |
|------|-----|
| `docs/public/assets/` | Screenshots, demo GIFs |

## Excluded (Denylist)

### Always excluded — security risk
- `.env*`, `*.env`, `.env.example` (even examples can hint at infrastructure)
- `*key*`, `*secret*`, `*.pem`, `*.p12`, `*.pfx`
- `deploy/` (staging/prod infrastructure details)
- `.github/workflows/` (CI secrets references)
- `scripts/` (operational scripts with internal hostnames)
- `docs/deploy/` (runbooks with VM/SSH details)
- `docs/planning/` (internal sprint planning)
- `docs/qa/` (internal QA checklists)
- `mcp-gateway/` (full service source — keep internal)

### Excluded — not useful for portfolio
- `node_modules/`, `dist/`, `*.lock`, `pnpm-lock.yaml`
- `.cursor/`, `.agent/`, `.codex/`
- Test files (`*.test.*`, `__tests__/`)
- `backend/test/` (full test suite — keep internal)
- `backend/src/db/` (schema reveals internal structure)
- `backend/src/config/` (env parsing)
- `backend/src/api/` (route handlers — boring boilerplate)
- `backend/migrations/` (SQL migration files)
- `frontend/src/i18n/` (translation files)
- `frontend/src/services/api/` (HTTP client internals)

## Denylist Scan Patterns

The export script scans all exported files for these patterns:

```
# Tokens / API keys
sk-[a-zA-Z0-9]{20,}
ghp_[a-zA-Z0-9]{36}
gho_[a-zA-Z0-9]{36}
GOCSPX-[a-zA-Z0-9_-]+
re_[a-zA-Z0-9]{20,}
whsec_[a-zA-Z0-9]+
xoxb-[a-zA-Z0-9-]+

# Private IPs / hostnames
\b(?:10|172\.(?:1[6-9]|2\d|3[01])|192\.168)\.\d{1,3}\.\d{1,3}\b
staging\.akisflow\.com/auth/oauth.*callback
/opt/akis
opc@

# Internal filenames that should never appear
\.env\.staging
STAGING_SSH_KEY
STAGING_HOST
```

## Verification

After export, run:
1. `scripts/public-repo/export.sh` (creates `dist/public-repo/`)
2. Script automatically runs denylist scan
3. Manual review: `ls -la dist/public-repo/` and spot-check files
4. Create public repo from the output directory
