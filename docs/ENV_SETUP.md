# Environment Setup (Canonical)

## Local Development

### Backend

1. Copy `backend/.env.example` to `backend/.env`.
2. Set required values (`DATABASE_URL`, auth and app settings).
3. Start backend:

```bash
pnpm -C backend dev
```

### Frontend

1. Copy `frontend/.env.example` to `frontend/.env` if needed.
2. Start frontend:

```bash
pnpm -C frontend dev
```

## Staging Environment

- Runtime source of truth: `/opt/akis/.env`
- Snapshot process: `docs/ops/STAGING_ENV_SNAPSHOT.md`
- Deployment and operations: `docs/deploy/OCI_STAGING_RUNBOOK.md`

## OAuth and Integration Essentials

### GitHub MCP (required for agent GitHub operations in staging)

- Set `GITHUB_TOKEN` in staging `/opt/akis/.env`.
- Ensure `GITHUB_MCP_BASE_URL` points to reachable gateway URL.

### Atlassian OAuth (if enabled)

- Set `ATLASSIAN_OAUTH_CLIENT_ID`
- Set `ATLASSIAN_OAUTH_CLIENT_SECRET`
- Set `ATLASSIAN_OAUTH_CALLBACK_URL`

## Security Rules

- Never commit real secrets.
- Keep personal overrides in ignored files (`backend/.env.local`, `frontend/.env.local`).
- Do not copy staging secrets into tracked template files.
