# Atlassian OAuth 2.0 (3LO) Setup Guide

This guide explains how to configure Atlassian OAuth 2.0 for AKIS to enable Jira and Confluence integration.

## Overview

AKIS uses Atlassian OAuth 2.0 (3LO - 3-Legged OAuth) to securely connect to your Atlassian Cloud instance. A single OAuth connection enables both Jira and Confluence access.

## Prerequisites

- Atlassian Cloud account with admin access
- Access to [Atlassian Developer Console](https://developer.atlassian.com/console)

## Step 1: Create OAuth 2.0 App

1. Go to [Atlassian Developer Console](https://developer.atlassian.com/console)
2. Click **Create** → **OAuth 2.0 integration**
3. Enter a name (e.g., "AKIS Platform")
4. Accept the terms and click **Create**

## Step 2: Configure Callback URLs

In your app settings, go to **Authorization** and add these callback URLs:

### Development
```
http://localhost:3000/api/integrations/atlassian/oauth/callback
```

### Production
```
https://your-domain.com/api/integrations/atlassian/oauth/callback
```

**Important**: The callback URL must match EXACTLY. Trailing slashes matter!

## Step 3: Configure Permissions (Scopes)

Go to **Permissions** and enable the following scopes:

### User Identity (Required)
- `read:me` - Read user profile information
- `read:account` - Read account information

### Jira (Required for Jira features)
- `read:jira-work` - Read Jira issues and projects
- `read:jira-user` - Read Jira user information

### Confluence (Required for Confluence features)
- `read:confluence-content.all` - Read Confluence pages
- `read:confluence-user` - Read Confluence user information

### Refresh Tokens (CRITICAL)
- `offline_access` - **MUST BE ENABLED** for refresh tokens

> **Warning**: Without `offline_access`, the integration will stop working when the access token expires (typically 1 hour).

## Step 4: Get Client Credentials

1. Go to **Settings**
2. Copy the **Client ID**
3. Copy the **Client Secret** (click to reveal)

**Security**: Never commit these values to version control!

## Step 5: Configure AKIS Environment

Add these environment variables to your `.env` or `.env.local` file:

```bash
# Atlassian OAuth 2.0 (3LO)
ATLASSIAN_OAUTH_CLIENT_ID=your-client-id-here
ATLASSIAN_OAUTH_CLIENT_SECRET=your-client-secret-here
ATLASSIAN_OAUTH_CALLBACK_URL=http://localhost:3000/api/integrations/atlassian/oauth/callback
```

## Step 6: Verify Configuration

1. Start the backend: `pnpm --filter backend dev`
2. Start the frontend: `pnpm --filter frontend dev`
3. Log into AKIS
4. Go to **Integrations** page
5. Click **Connect with Atlassian**
6. You should be redirected to Atlassian consent screen
7. After approval, both Jira and Confluence should show as connected

## Troubleshooting

### "redirect_uri mismatch" Error

The callback URL in your Atlassian app doesn't match what AKIS is sending.

**Solution**:
1. Check `ATLASSIAN_OAUTH_CALLBACK_URL` in your env
2. Verify the EXACT same URL is in Atlassian Developer Console
3. Check for trailing slashes, http vs https

### "No refresh token received"

The `offline_access` scope is not enabled.

**Solution**:
1. Go to Atlassian Developer Console → Your App → Permissions
2. Enable `offline_access` under "User identity"
3. Users may need to re-authenticate

### "Token refresh failed"

Atlassian uses rotating refresh tokens. Each refresh returns a NEW refresh token.

**Possible causes**:
- Old refresh token was already used
- 90-day inactivity expiry
- User revoked access in Atlassian settings

**Solution**: User needs to re-connect via OAuth flow.

### "No accessible resources"

Your Atlassian account doesn't have access to any sites.

**Solution**:
1. Ensure you have access to at least one Atlassian Cloud site
2. Check that the OAuth app has correct permissions

## Security Best Practices

1. **Never commit secrets**: Use `.env.local` (gitignored) for local development
2. **Rotate secrets periodically**: Regenerate client secret if compromised
3. **Minimum scopes**: Only request scopes you actually need
4. **Monitor access**: Regularly review OAuth connections in Atlassian admin

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `ATLASSIAN_OAUTH_CLIENT_ID` | Yes | OAuth 2.0 Client ID from Atlassian Developer Console |
| `ATLASSIAN_OAUTH_CLIENT_SECRET` | Yes | OAuth 2.0 Client Secret |
| `ATLASSIAN_OAUTH_CALLBACK_URL` | No | Callback URL (default: `http://localhost:3000/api/integrations/atlassian/oauth/callback`) |

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           AKIS Platform                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────┐     ┌────────────────────┐     ┌─────────────────┐ │
│  │  Frontend  │────▶│  Backend Routes    │────▶│  OAuth Service  │ │
│  │            │     │  /atlassian/oauth/ │     │                 │ │
│  └────────────┘     └────────────────────┘     └────────┬────────┘ │
│                                                          │          │
│                                                          ▼          │
│                                            ┌─────────────────────┐  │
│                                            │  Encrypted Storage  │  │
│                                            │  (AES-256-GCM)      │  │
│                                            └─────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
                    ┌─────────────────────────┐
                    │   Atlassian Cloud       │
                    │   (auth.atlassian.com)  │
                    └─────────────────────────┘
```

## Related Documentation

- [Atlassian OAuth 2.0 (3LO) Docs](https://developer.atlassian.com/cloud/confluence/oauth-2-3lo-apps/)
- [Jira REST API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)
- [Confluence REST API](https://developer.atlassian.com/cloud/confluence/rest/v2/)
- [AKIS Smoke Tests](../qa/ATLAS_OAUTH_SMOKE.md)
