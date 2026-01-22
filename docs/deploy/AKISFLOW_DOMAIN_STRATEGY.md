# AKIS Platform - akisflow.com Domain Strategy

**Version**: 1.0.0  
**Date**: 2026-01-13  
**Status**: DECISION APPROVED  
**Scope**: Staging and Production domain architecture under akisflow.com

---

## Executive Summary

This document defines the domain layout for AKIS Platform staging and production environments using the `akisflow.com` domain. The strategy addresses:

- Subdomain architecture for frontend and backend
- HTTPS requirements for secure auth cookies
- Cross-origin cookie constraints (CORS + credentials)
- OAuth callback/redirect URL configuration
- SPA-compatible routing decisions

---

## 1. Domain Architecture Decision

### 1.1 Selected Strategy: Same-Origin API Pattern

**Decision**: Host backend API and frontend SPA on the **same origin** using path-based routing.

| Environment | Frontend URL | Backend URL (API) |
|-------------|-------------|-------------------|
| **Staging** | `https://staging.akisflow.com` | `https://staging.akisflow.com/api` |
| **Production** | `https://akisflow.com` | `https://akisflow.com/api` |

**Rationale**:
- **Cookie Simplicity**: Same-origin eliminates cross-origin cookie issues
- **No CORS Required**: Same origin means no preflight requests
- **Auth Security**: `SameSite=Lax` cookies work without configuration
- **SPA Compatible**: Caddy serves SPA and proxies `/api` to backend

### 1.2 Alternative Considered (Not Selected)

| Pattern | Frontend | Backend | Why Not Chosen |
|---------|----------|---------|----------------|
| **Subdomain Split** | `app.akisflow.com` | `api.akisflow.com` | Requires `SameSite=None` + CORS; more complex |
| **Separate Domains** | `akisflow.com` | `akisflow-api.com` | Cross-site cookies blocked by browsers |

---

## 2. HTTPS Requirement for Secure Auth Cookies

### 2.1 Cookie Security Configuration

**Production Requirements** (MANDATORY):

| Cookie Attribute | Value | Purpose |
|------------------|-------|---------|
| `httpOnly` | `true` | Prevent XSS access |
| `secure` | `true` | HTTPS-only transmission |
| `sameSite` | `Lax` | CSRF protection |
| `path` | `/` | Available to entire site |
| `domain` | (not set) | Defaults to exact origin |

**Staging Configuration** (RECOMMENDED same as production):

| Setting | Value | Notes |
|---------|-------|-------|
| `AUTH_COOKIE_SECURE` | `true` | Set to `true` since staging uses HTTPS |
| `AUTH_COOKIE_SAMESITE` | `Lax` | Default, protects against CSRF |

### 2.2 Why HTTPS is Mandatory

1. **Secure Cookie Flag**: `secure=true` cookies only sent over HTTPS
2. **Browser Requirements**: Modern browsers block mixed content
3. **OAuth Providers**: GitHub, Google, Atlassian require HTTPS redirect URIs
4. **Let's Encrypt**: Free, automatic TLS via Caddy

### 2.3 Certificate Management

Caddy automatically provisions and renews TLS certificates:

- **Staging**: `https://staging.akisflow.com` → automatic Let's Encrypt cert
- **Production**: `https://akisflow.com` → automatic Let's Encrypt cert

---

## 3. Cross-Origin Constraints (CORS)

### 3.1 Same-Origin Strategy (No CORS Needed)

With the selected same-origin pattern, CORS is **not required for API calls**:

| Request | Origin | Target | CORS Status |
|---------|--------|--------|-------------|
| Frontend → `/api/*` | `https://akisflow.com` | `https://akisflow.com/api` | Same-origin ✅ |
| Auth cookie | Set by backend | Read by backend | Same-origin ✅ |

### 3.2 Backend CORS Configuration

For local development (frontend on `:5173`, backend on `:3000`):

**Environment Variables**:

| Environment | `CORS_ORIGINS` |
|-------------|----------------|
| Local Dev | `http://localhost:5173` |
| Staging | `https://staging.akisflow.com` |
| Production | `https://akisflow.com` |

**Implementation** (already in codebase):
- Backend reads `CORS_ORIGINS` from environment
- Sets `credentials: true` for cookie support
- Allows `Content-Type`, `Authorization` headers

### 3.3 Cross-Origin Cookie Rules

If subdomain pattern were used (NOT our strategy), these rules would apply:

| Cookie Setting | Requirement |
|----------------|-------------|
| `SameSite` | `None` (allows cross-site) |
| `Secure` | `true` (required with SameSite=None) |
| `Domain` | `.akisflow.com` (parent domain) |
| CORS | `Access-Control-Allow-Credentials: true` |

**Our Strategy Avoids This Complexity** by using same-origin.

---

## 4. URL Mapping Configuration

### 4.1 Environment Variables

| Variable | Staging Value | Production Value |
|----------|---------------|------------------|
| `BACKEND_URL` | `https://staging.akisflow.com` | `https://akisflow.com` |
| `FRONTEND_URL` | `https://staging.akisflow.com` | `https://akisflow.com` |
| `CORS_ORIGINS` | `https://staging.akisflow.com` | `https://akisflow.com` |

**Note**: `BACKEND_URL` does NOT include `/api` suffix. The routing is handled by Caddy.

### 4.2 Frontend Configuration

**Vite Build-Time Variable**:

| Variable | Local Dev | Staging | Production |
|----------|-----------|---------|------------|
| `VITE_API_URL` | `/api` | `/api` | `/api` |

**Note**: Frontend uses relative `/api` path, which works because both SPA and API are served from the same origin.

### 4.3 Caddy Routing Configuration

**Path Routing** (same-origin pattern):

| Path Pattern | Target | Description |
|--------------|--------|-------------|
| `/api/*` | `backend:3000` | API requests |
| `/auth/*` | `backend:3000` | Auth endpoints |
| `/health` | `backend:3000` | Liveness check |
| `/ready` | `backend:3000` | Readiness check |
| `/version` | `backend:3000` | Version info |
| `/docs*` | `backend:3000` | OpenAPI docs |
| `/*` (fallback) | Static SPA | React app |

---

## 5. OAuth Callback URL Strategy

### 5.1 Callback URL Pattern

OAuth callbacks point directly to the backend via the shared domain:

```
https://{environment}.akisflow.com/auth/oauth/{provider}/callback
```

### 5.2 Staging OAuth Configuration

| Provider | Authorization Callback URL |
|----------|---------------------------|
| **GitHub** | `https://staging.akisflow.com/auth/oauth/github/callback` |
| **Google** | `https://staging.akisflow.com/auth/oauth/google/callback` |
| **Atlassian** | `https://staging.akisflow.com/auth/oauth/atlassian/callback` |

**Setup Steps**:

1. Create separate OAuth Apps for staging in each provider console
2. Set callback URLs to staging domain
3. Configure environment variables:
   - `GITHUB_OAUTH_CLIENT_ID` (staging-specific)
   - `GITHUB_OAUTH_CLIENT_SECRET` (staging-specific)
   - Similar for Google and Atlassian

### 5.3 Production OAuth Configuration

| Provider | Authorization Callback URL |
|----------|---------------------------|
| **GitHub** | `https://akisflow.com/auth/oauth/github/callback` |
| **Google** | `https://akisflow.com/auth/oauth/google/callback` |
| **Atlassian** | `https://akisflow.com/auth/oauth/atlassian/callback` |

**Important**: Production OAuth Apps must be separate from staging.

### 5.4 OAuth Provider Setup Guide

**GitHub OAuth App**:
1. Go to: https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - Application name: `AKIS Platform Staging` (or Production)
   - Homepage URL: `https://staging.akisflow.com`
   - Authorization callback URL: `https://staging.akisflow.com/auth/oauth/github/callback`
4. Copy Client ID and Client Secret to GitHub Secrets

**Google OAuth**:
1. Go to: https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Add Authorized redirect URI:
   - `https://staging.akisflow.com/auth/oauth/google/callback`
4. Copy Client ID and Client Secret to GitHub Secrets

**Atlassian OAuth (3LO)**:
1. Go to: https://developer.atlassian.com/console/myapps/
2. Create new OAuth 2.0 app
3. Configure callback URL:
   - `https://staging.akisflow.com/auth/oauth/atlassian/callback`
4. Enable Jira and Confluence API scopes
5. Copy Client ID and Client Secret to GitHub Secrets

### 5.5 Promotion from Staging to Production

**OAuth Migration Checklist**:

- [ ] Create new OAuth Apps for production domain
- [ ] Configure production callback URLs
- [ ] Add production OAuth secrets to GitHub Secrets
- [ ] Create production `.env` with production credentials
- [ ] Test OAuth flows post-deployment

**Note**: Never reuse staging OAuth credentials for production.

---

## 6. SPA Compatibility

### 6.1 Client-Side Routing

AKIS frontend is a React SPA with client-side routing (React Router).

**Requirements**:
- All non-API routes return `index.html`
- Browser handles routing via JavaScript
- History API support (pushState)

**Caddy Configuration** (from `Caddyfile.staging`):

```
handle {
    root * /srv/frontend
    try_files {path} /index.html
    file_server
}
```

This serves:
- Exact file matches (e.g., `/assets/logo.svg`)
- Fallback to `index.html` for all other paths

### 6.2 No SSR Required

AKIS uses **client-side rendering only**:
- No Next.js or SSR framework
- All rendering happens in browser
- SEO handled via meta tags in `index.html`

This simplifies deployment:
- Static file serving only
- No Node.js required for frontend
- CDN-compatible (future optimization)

---

## 7. Complete Environment Configuration

### 7.1 Staging Environment

**GitHub Secrets**:

| Secret Name | Example Value |
|-------------|---------------|
| `STAGING_BACKEND_URL` | `https://staging.akisflow.com` |
| `STAGING_FRONTEND_URL` | `https://staging.akisflow.com` |
| `STAGING_CORS_ORIGINS` | `https://staging.akisflow.com` |
| `STAGING_GITHUB_OAUTH_CLIENT_ID` | `Iv1.abc123...` |
| `STAGING_GITHUB_OAUTH_CLIENT_SECRET` | `***` |
| `STAGING_GOOGLE_OAUTH_CLIENT_ID` | `123456.apps.googleusercontent.com` |
| `STAGING_GOOGLE_OAUTH_CLIENT_SECRET` | `***` |

**VM .env File**:

```
BACKEND_URL=https://staging.akisflow.com
FRONTEND_URL=https://staging.akisflow.com
CORS_ORIGINS=https://staging.akisflow.com
AUTH_COOKIE_SECURE=true
AUTH_COOKIE_SAMESITE=lax
AUTH_COOKIE_NAME=akis_session
```

### 7.2 Production Environment

**GitHub Secrets**:

| Secret Name | Example Value |
|-------------|---------------|
| `PROD_BACKEND_URL` | `https://akisflow.com` |
| `PROD_FRONTEND_URL` | `https://akisflow.com` |
| `PROD_CORS_ORIGINS` | `https://akisflow.com` |
| `PROD_GITHUB_OAUTH_CLIENT_ID` | `Iv1.def456...` (different from staging) |
| `PROD_GITHUB_OAUTH_CLIENT_SECRET` | `***` |
| `PROD_GOOGLE_OAUTH_CLIENT_ID` | `789012.apps.googleusercontent.com` |
| `PROD_GOOGLE_OAUTH_CLIENT_SECRET` | `***` |

**VM .env File**:

```
BACKEND_URL=https://akisflow.com
FRONTEND_URL=https://akisflow.com
CORS_ORIGINS=https://akisflow.com
AUTH_COOKIE_SECURE=true
AUTH_COOKIE_SAMESITE=lax
AUTH_COOKIE_NAME=akis_session
```

---

## 8. DNS Configuration

### 8.1 Required DNS Records

| Record Type | Name | Value | TTL |
|-------------|------|-------|-----|
| A | `staging.akisflow.com` | `<OCI_STAGING_IP>` | 300 |
| A | `akisflow.com` | `<OCI_PROD_IP>` | 300 |
| A | `www.akisflow.com` | `<OCI_PROD_IP>` | 300 |

### 8.2 Optional: WWW Redirect

Caddy can handle `www` subdomain redirect:

```
www.akisflow.com {
    redir https://akisflow.com{uri} permanent
}
```

---

## 9. Decision Summary

### Key Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Domain Pattern** | Same-origin (path routing) | Simplest cookie handling |
| **API Path** | `/api/*` on same domain | No CORS needed |
| **Cookie SameSite** | `Lax` | Default, secure, no cross-site |
| **TLS Provider** | Let's Encrypt via Caddy | Free, automatic |
| **OAuth Apps** | Separate per environment | Security isolation |
| **SPA Routing** | Client-side only | No SSR complexity |

### Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| Caddyfile routing | ✅ Ready | Path routing configured |
| Backend URL handling | ✅ Ready | Environment-driven |
| Frontend API calls | ✅ Ready | Uses relative `/api` |
| OAuth routes | ✅ Ready | Callback URLs configurable |
| Cookie settings | ✅ Ready | Environment-driven |

### Remaining Actions

| Action | Owner | Deadline |
|--------|-------|----------|
| Create staging OAuth Apps | DevOps | Before first deploy |
| Configure DNS records | DevOps | Before first deploy |
| Create production OAuth Apps | DevOps | Before production launch |
| Document credentials handoff | DevOps | With production launch |

---

## Appendix A: Troubleshooting

### Cookie Not Sent

| Check | Expected | Fix |
|-------|----------|-----|
| HTTPS in use | Yes | Enable TLS |
| `secure` flag | `true` for HTTPS | Set `AUTH_COOKIE_SECURE=true` |
| Same origin | API and SPA on same domain | Use path-based routing |
| Browser DevTools | Cookie visible | Check domain/path |

### OAuth Callback Error

| Error | Cause | Fix |
|-------|-------|-----|
| `redirect_uri_mismatch` | URL doesn't match OAuth App | Update callback URL in provider console |
| `invalid_client` | Wrong Client ID | Check environment variables |
| SSL certificate error | TLS not configured | Ensure Caddy running with HTTPS |

### CORS Error

| Error | Cause | Fix |
|-------|-------|-----|
| `No 'Access-Control-Allow-Origin'` | Missing CORS header | Check `CORS_ORIGINS` env var |
| `Credentials not supported` | CORS misconfigured | Ensure same-origin or proper CORS |

---

**Document History**

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-13 | Initial domain strategy document |
