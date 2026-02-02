# AKIS Platform - OAuth Setup Guide

This guide explains how to configure GitHub and Google OAuth for user authentication.

## Quick Reference

| Provider | Console URL | Callback URL |
|----------|-------------|--------------|
| GitHub | https://github.com/settings/developers | `https://staging.akisflow.com/auth/oauth/github/callback` |
| Google | https://console.cloud.google.com/apis/credentials | `https://staging.akisflow.com/auth/oauth/google/callback` |

## GitHub OAuth Setup

### Step 1: Create GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Click **OAuth Apps** → **New OAuth App**
3. Fill in:
   - **Application name**: `AKIS Staging` (or `AKIS Production`)
   - **Homepage URL**: `https://staging.akisflow.com`
   - **Authorization callback URL**: `https://staging.akisflow.com/auth/oauth/github/callback`
4. Click **Register application**
5. Copy the **Client ID**
6. Click **Generate a new client secret** and copy it immediately

### Step 2: Add to Server Environment

SSH into the server and add to `/opt/akis/.env`:

```bash
ssh ubuntu@your-server-ip
cd /opt/akis

# Add OAuth credentials (replace with your actual values)
cat >> .env << 'EOF'

# GitHub OAuth (User Login)
GITHUB_OAUTH_CLIENT_ID=your_github_client_id_here
GITHUB_OAUTH_CLIENT_SECRET=your_github_client_secret_here
EOF

# Secure the file
chmod 600 .env
```

### Step 3: Restart Backend

```bash
cd /opt/akis
docker compose restart backend
```

### Step 4: Verify

```bash
# Should return 302 redirect to GitHub (not 503)
curl -sS -I https://staging.akisflow.com/auth/oauth/github | head -5

# Expected output:
# HTTP/2 302
# location: https://github.com/login/oauth/authorize?client_id=...
```

## Google OAuth Setup

### Step 1: Create Google OAuth Client

1. Go to https://console.cloud.google.com/apis/credentials
2. Create a project if needed
3. Click **Create Credentials** → **OAuth client ID**
4. Select **Web application**
5. Add authorized redirect URI: `https://staging.akisflow.com/auth/oauth/google/callback`
6. Click **Create**
7. Copy **Client ID** and **Client Secret**

### Step 2: Add to Server Environment

```bash
cat >> /opt/akis/.env << 'EOF'

# Google OAuth (User Login)
GOOGLE_OAUTH_CLIENT_ID=your_google_client_id_here
GOOGLE_OAUTH_CLIENT_SECRET=your_google_client_secret_here
EOF
```

### Step 3: Restart and Verify

```bash
docker compose restart backend

# Verify
curl -sS -I https://staging.akisflow.com/auth/oauth/google | head -5
```

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_OAUTH_CLIENT_ID` | For GitHub login | GitHub OAuth App Client ID |
| `GITHUB_OAUTH_CLIENT_SECRET` | For GitHub login | GitHub OAuth App Client Secret |
| `GOOGLE_OAUTH_CLIENT_ID` | For Google login | Google OAuth Client ID |
| `GOOGLE_OAUTH_CLIENT_SECRET` | For Google login | Google OAuth Client Secret |

## Troubleshooting

### OAuth returns 503 "not configured"

**Cause:** Missing `GITHUB_OAUTH_CLIENT_ID` or `GITHUB_OAUTH_CLIENT_SECRET` in environment.

**Fix:**
```bash
# Check if variables are set
docker compose exec backend printenv | grep OAUTH

# If empty, add them to .env and restart
```

### OAuth returns 502 Bad Gateway

**Cause:** nginx intercepting traffic instead of Caddy edge proxy.

**Fix:** See [EDGE_PROXY_RUNBOOK.md](./EDGE_PROXY_RUNBOOK.md) for nginx removal steps.

### OAuth callback fails with "invalid state"

**Cause:** Session cookie not being set properly, often due to:
- Missing `AUTH_COOKIE_DOMAIN` configuration
- Cookie `Secure` flag mismatch

**Fix:**
```bash
# Ensure these are set in .env
AUTH_COOKIE_DOMAIN=.akisflow.com
AUTH_COOKIE_SECURE=true
AUTH_COOKIE_SAMESITE=lax
```

### OAuth works but user not created

**Check backend logs:**
```bash
docker compose logs backend --tail=100 | grep -i oauth
```

**Common causes:**
- Database not migrated (`oauth_accounts` table missing)
- User email not public on GitHub

## Production Setup

For production (`akisflow.com`), create **separate** OAuth apps with production URLs:

- Homepage URL: `https://akisflow.com`
- Callback URL: `https://akisflow.com/auth/oauth/github/callback`

**Never share OAuth secrets between staging and production.**

## Related Documentation

- [Staging Deployment Guide](./STAGING_DEPLOYMENT.md)
- [Edge Proxy Runbook](./EDGE_PROXY_RUNBOOK.md)
- [Environments and Releases](./ENVIRONMENTS_AND_RELEASES.md)
