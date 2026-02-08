---
description: "Security Checklist"
---

## Runtime Security
- [ ] `@fastify/helmet` + `@fastify/cors` + `@fastify/rate-limit` registered.
- [ ] CORS in production uses **allowlist**; no `*`.
- [ ] Input validation (zod/valibot) on critical endpoints.
- [ ] No PII/tokens in logs; error stacks never leak to client.
- [ ] DB migrations versioned; script: `backend/scripts/migrate.ts`.

## Secrets Hygiene
- [ ] **No real secrets in git** — ever. This includes `.env.staging`, SSH keys, API tokens, IPs, usernames.
- [ ] `.env.example` exists for both `backend/` and `frontend/`.
- [ ] `.gitignore` covers: `.env`, `.env.local`, `.env.staging`, `.env.*.local`, `.cursor/mcp.json`.
- [ ] Staging secrets live in: GitHub repository secrets, `~/.ssh/`, or team password manager.

## Staging Access
> Canonical: `docs/deploy/OCI_STAGING_RUNBOOK.md` § Security Checklist.

- [ ] No hardcoded IPs or hostnames in source code.
- [ ] SSH key is not committed; path referenced via placeholder only.
- [ ] OAuth callback URLs use staging domain, not localhost.
