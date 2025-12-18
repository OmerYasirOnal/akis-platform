# GitHub Integration: OAuth App vs GitHub App

AKIS uses **two separate GitHub integrations** for different purposes.

## OAuth App (User Login)

**Purpose**: Authenticate users signing into AKIS

**Environment Variables**:

```env
GITHUB_OAUTH_CLIENT_ID=Ov23li...
GITHUB_OAUTH_CLIENT_SECRET=...
```

**Endpoints Used**:

- `https://github.com/login/oauth/authorize`
- `https://github.com/login/oauth/access_token`
- `https://api.github.com/user`
- `https://api.github.com/user/emails`

**Scopes**: `user:email`

**Setup**: Create at https://github.com/settings/developers → OAuth Apps

## GitHub App (MCP Integration)

**Purpose**: Agent access to repositories (Scribe, Trace, Proto)

**Environment Variables**:

```env
GITHUB_APP_ID=123456
GITHUB_INSTALLATION_ID=12345678
GITHUB_APP_PRIVATE_KEY_PEM=...
```

**Endpoints Used**:

- `https://api.github.com/app/installations/{id}/access_tokens`
- Repository/Issue/PR APIs

**Setup**: Create at https://github.com/settings/apps

## Do NOT Mix These

| Action | Use OAuth App | Use GitHub App |
|--------|---------------|----------------|
| User login | ✅ | ❌ |
| Get user email | ✅ | ❌ |
| Read/write repos | ❌ | ✅ |
| Create issues/PRs | ❌ | ✅ |
| MCP integration | ❌ | ✅ |

## Common Errors

### "404" or "other account" during login

- Likely using wrong credentials
- Verify `GITHUB_OAUTH_CLIENT_ID` is from OAuth App, not GitHub App

### "oauth_not_configured"

- `GITHUB_OAUTH_CLIENT_ID` or `GITHUB_OAUTH_CLIENT_SECRET` missing in `.env`

## Dev Log Verification

In non-production mode, the OAuth flow logs the client_id prefix:

```
[OAuth:GitHub] Login using OAuth App client_id=Ov23li...
```

This helps verify the correct OAuth App credentials are being used.

