# API Base URL Standard

**Version:** 1.0
**Last Updated:** 2026-02-02
**Purpose:** Document the frontend API base URL standard and prevent /api/api double prefix issues

---

## Overview

The AKIS frontend uses a centralized `getApiBaseUrl()` utility to determine the API base URL. This document explains the standard and how to troubleshoot common issues.

## The Standard

| Component | Value | Example |
|-----------|-------|---------|
| **Base URL** | Origin only (no path suffix) | `https://staging.akisflow.com` |
| **API paths** | Include `/api` prefix | `/api/agents/jobs/running` |
| **Auth paths** | Include `/auth` prefix | `/auth/login` |
| **Full URL** | Base + Path | `https://staging.akisflow.com/api/agents/jobs/running` |

### Why This Matters

If the base URL includes `/api` (e.g., `https://staging.akisflow.com/api`) and paths also include `/api/` (e.g., `/api/agents/jobs`), the result is a double prefix:

```
https://staging.akisflow.com/api/api/agents/jobs  ← WRONG (404)
```

The correct URL is:

```
https://staging.akisflow.com/api/agents/jobs      ← CORRECT
```

## Implementation

### Centralized Utility

All API services use `getApiBaseUrl()` from `frontend/src/services/api/config.ts`:

```typescript
import { getApiBaseUrl } from './config';

// Returns origin only: "https://staging.akisflow.com"
const baseUrl = getApiBaseUrl();

// API paths include /api prefix
fetch(`${baseUrl}/api/agents/jobs/running`);
```

### Environment Variables

| Variable | Purpose | Example | Used By |
|----------|---------|---------|---------|
| `VITE_BACKEND_URL` | Explicit backend origin (dev mode) | `http://localhost:3000` | `getApiBaseUrl()` |
| `VITE_API_URL` | **DEPRECATED** - Do not use | - | Ignored if relative |

**Important:** Do NOT set `VITE_API_URL=/api` in production builds. This causes double prefix issues.

### How getApiBaseUrl() Works

1. If `VITE_BACKEND_URL` is set → Use it (stripped of any `/api` suffix)
2. If `VITE_API_URL` is an absolute URL → Extract origin only
3. Otherwise → Use `window.location.origin` (same-origin requests)
4. Fallback → `http://localhost:3000` (dev/SSR)

## Edge Proxy Routing

The Caddy edge proxy routes requests based on path prefix:

| Route | Destination | Notes |
|-------|-------------|-------|
| `/api/*` | backend:3000 | **No path stripping** |
| `/auth/*` | backend:3000 | **No path stripping** |
| `/*` | Static frontend | SPA fallback |

Backend receives the full path including `/api/` prefix.

## Troubleshooting

### Symptom: 404 on API calls

**Check 1:** Open browser DevTools → Network tab → Look for `/api/api/...` requests

If you see double `/api`:
- The base URL includes `/api` suffix
- Check `VITE_API_URL` or `VITE_BACKEND_URL` values
- Ensure all API services use `getApiBaseUrl()`

**Check 2:** Verify the request URL in browser DevTools

```
Expected:  https://staging.akisflow.com/api/agents/jobs/running
Wrong:     https://staging.akisflow.com/api/api/agents/jobs/running
```

### Symptom: "Failed to load AI provider status"

This error in Settings → AI Keys typically means the API call failed:

1. Open DevTools → Network
2. Look for `/api/settings/ai-keys/status` request
3. Check the actual URL being called
4. If 404: Check for `/api/api` issue
5. If 401: Authentication issue (not this document's scope)

### Symptom: Deploy smoke check fails

The CI pipeline includes a smoke check that verifies API endpoints don't return 404:

```bash
# These should NOT return 404:
curl -sI https://staging.akisflow.com/api/agents/jobs/running | head -3
curl -sI https://staging.akisflow.com/api/settings/ai-keys/status | head -3
```

If these return 404, check:
1. Edge proxy Caddyfile routing
2. Backend routes are registered
3. Frontend isn't calling wrong URLs

## Files Reference

| File | Purpose |
|------|---------|
| `frontend/src/services/api/config.ts` | Centralized `getApiBaseUrl()` |
| `frontend/src/services/api/HttpClient.ts` | HTTP client (uses base URL) |
| `frontend/src/services/api/*.ts` | API service files |
| `devops/compose/Caddyfile.edge` | Edge proxy routing |
| `.github/workflows/deploy-staging.yml` | CI/CD (smoke checks) |

## History

| Date | Change |
|------|--------|
| 2026-02-02 | Initial standard documented, `/api/api` issue fixed |

---

## Related Documentation

- [Edge Proxy Runbook](./EDGE_PROXY_RUNBOOK.md)
- [Staging Deployment Guide](../deploy/STAGING_DEPLOYMENT.md)
- [Environments and Releases](./ENVIRONMENTS_AND_RELEASES.md)
