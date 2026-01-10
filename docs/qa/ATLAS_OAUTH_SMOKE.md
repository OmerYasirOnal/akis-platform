# Atlassian OAuth 2.0 (3LO) Smoke Test Guide

This document provides curl-based verification commands to test the Atlassian OAuth integration.

## Prerequisites

1. Backend running at `http://localhost:3000`
2. Valid AKIS session (login first to get session cookie)
3. Atlassian OAuth configured (see `docs/integrations/ATLASSIAN_OAUTH_SETUP.md`)

## Get Session Cookie

First, log into AKIS using the multi-step auth flow and save the session cookie:

```bash
# Step 1: Get userId from email
USER_ID=$(curl -s -X POST http://localhost:3000/auth/login/start \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com"}' | jq -r '.userId')

echo "User ID: $USER_ID"

# Step 2: Complete login with userId and password
curl -c cookies.txt -X POST http://localhost:3000/auth/login/complete \
  -H "Content-Type: application/json" \
  -d "{\"userId\":\"$USER_ID\",\"password\":\"your-password\"}"
```

## Health Check

```bash
# 1. Backend health check
curl -s http://localhost:3000/health | jq .
# Expected: { "status": "ok" }

# 2. Backend ready check
curl -s http://localhost:3000/ready | jq .
# Expected: { "ready": true }
```

## Atlassian OAuth Status (Before Connect)

```bash
# 3. Atlassian OAuth status (before connecting)
curl -s -b cookies.txt http://localhost:3000/api/integrations/atlassian/status | jq .
# Expected:
# {
#   "connected": false,
#   "configured": true,  // or false if env vars not set
#   "jiraAvailable": false,
#   "confluenceAvailable": false
# }
```

## Jira/Confluence Status (Should Never 500)

```bash
# 4. Jira status (should never return 500)
curl -s -b cookies.txt http://localhost:3000/api/integrations/jira/status | jq .
# Expected: { "connected": false } or { "connected": true, ... }

# 5. Confluence status (should never return 500)
curl -s -b cookies.txt http://localhost:3000/api/integrations/confluence/status | jq .
# Expected: { "connected": false } or { "connected": true, ... }
```

## OAuth Connect Flow (Browser Required)

The OAuth flow requires browser interaction:

1. Open browser: `http://localhost:3000/api/integrations/atlassian/oauth/start`
2. You'll be redirected to Atlassian consent screen
3. Approve the connection
4. You'll be redirected back to `http://localhost:5173/dashboard/integrations?atlassian=connected`

## Atlassian OAuth Status (After Connect)

```bash
# 6. Atlassian OAuth status (after connecting)
curl -s -b cookies.txt http://localhost:3000/api/integrations/atlassian/status | jq .
# Expected:
# {
#   "connected": true,
#   "configured": true,
#   "siteUrl": "https://your-site.atlassian.net",
#   "cloudId": "abc123...",
#   "jiraAvailable": true,
#   "confluenceAvailable": true,
#   "scopes": "offline_access read:me read:jira-work ..."
# }

# 7. Jira status (should show connected via OAuth)
curl -s -b cookies.txt http://localhost:3000/api/integrations/jira/status | jq .
# Expected:
# {
#   "connected": true,
#   "siteUrl": "https://your-site.atlassian.net",
#   "viaOAuth": true
# }

# 8. Confluence status (should show connected via OAuth)
curl -s -b cookies.txt http://localhost:3000/api/integrations/confluence/status | jq .
# Expected:
# {
#   "connected": true,
#   "siteUrl": "https://your-site.atlassian.net",
#   "viaOAuth": true
# }
```

## All Integrations Status

```bash
# 9. All integrations status
curl -s -b cookies.txt http://localhost:3000/api/integrations | jq .
# Expected: Combined status for github, atlassian, jira, confluence
```

## Disconnect

```bash
# 10. Disconnect Atlassian OAuth
curl -s -X POST -b cookies.txt http://localhost:3000/api/integrations/atlassian/disconnect | jq .
# Expected: { "ok": true }

# 11. Verify both Jira and Confluence are now disconnected
curl -s -b cookies.txt http://localhost:3000/api/integrations/jira/status | jq .
# Expected: { "connected": false }

curl -s -b cookies.txt http://localhost:3000/api/integrations/confluence/status | jq .
# Expected: { "connected": false }
```

## Error Cases

### OAuth Not Configured

If `ATLASSIAN_OAUTH_CLIENT_ID` is not set:

```bash
curl -s -b cookies.txt http://localhost:3000/api/integrations/atlassian/status | jq .
# Expected:
# {
#   "connected": false,
#   "configured": false,
#   "jiraAvailable": false,
#   "confluenceAvailable": false
# }
```

### Not Authenticated

Without session cookie:

```bash
curl -s http://localhost:3000/api/integrations/atlassian/status | jq .
# Expected: { "error": { "code": "UNAUTHORIZED", ... } }
```

## Checklist

- [ ] Health endpoints return 200
- [ ] Atlassian status shows `configured: true` when env vars set
- [ ] Jira/Confluence status endpoints never return 500
- [ ] OAuth connect flow redirects properly
- [ ] After connect, both Jira and Confluence show `connected: true`
- [ ] Disconnect removes connection for both products
- [ ] `viaOAuth: true` field present when connected via OAuth

## Troubleshooting

### redirect_uri mismatch

Callback URL must match EXACTLY what's configured in Atlassian Developer Console:
- `http://localhost:3000/api/integrations/atlassian/oauth/callback`

### No refresh token

Ensure `offline_access` scope is enabled in Atlassian Developer Console under Permissions.

### Token refresh fails

If token refresh fails with `invalid_grant`, the refresh token may have been:
- Already used (rotating tokens)
- Expired due to 90-day inactivity
- Revoked by the user

User needs to re-authenticate via the OAuth flow.
