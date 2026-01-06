# GitHub OAuth Setup Guide

AKIS platform uses **OAuth redirect flow** for GitHub integration. Users click "Connect" on the Integrations page and are redirected to GitHub to authorize the application.

## Required Environment Variables

### Backend (.env or .env.local)

```bash
# GitHub OAuth App Credentials
GITHUB_OAUTH_CLIENT_ID=your_github_oauth_client_id
GITHUB_OAUTH_CLIENT_SECRET=your_github_oauth_client_secret

# OAuth Callback URL (must match GitHub App settings)
GITHUB_OAUTH_CALLBACK_URL=http://localhost:3000/api/integrations/github/oauth/callback

# App Public URL (for redirects after OAuth)
APP_PUBLIC_URL=http://localhost:5173

# Backend/Frontend URLs
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173
```

## GitHub OAuth App Configuration

### 1. Create a GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **"New OAuth App"**
3. Fill in the details:
   - **Application name**: AKIS Platform (Local Dev)
   - **Homepage URL**: `http://localhost:5173`
   - **Authorization callback URL**: `http://localhost:3000/api/integrations/github/oauth/callback`
4. Click **"Register application"**

### 2. Get Client ID and Secret

After creating the app:
1. Copy the **Client ID**
2. Click **"Generate a new client secret"**
3. Copy the **Client Secret** (you won't be able to see it again)

### 3. Update Environment Variables

Add the credentials to your `backend/.env.local`:

```bash
GITHUB_OAUTH_CLIENT_ID=Iv1.abc123def456...
GITHUB_OAUTH_CLIENT_SECRET=abc123def456...
GITHUB_OAUTH_CALLBACK_URL=http://localhost:3000/api/integrations/github/oauth/callback
APP_PUBLIC_URL=http://localhost:5173
```

## OAuth Flow Diagram

```
User clicks "Connect" on /dashboard/integrations
         ↓
Frontend redirects to backend: /api/integrations/github/oauth/start
         ↓
Backend generates CSRF state token (stored in httpOnly cookie)
         ↓
Backend redirects to GitHub: https://github.com/login/oauth/authorize
         ↓
User authorizes on GitHub
         ↓
GitHub redirects back: /api/integrations/github/oauth/callback?code=...&state=...
         ↓
Backend validates state, exchanges code for access token
         ↓
Backend fetches GitHub user info, stores token + login in DB
         ↓
Backend redirects to frontend: /dashboard/integrations?github=connected
         ↓
Frontend shows success notification: "GitHub connected successfully!"
```

## Required Scopes

The OAuth app requests the following GitHub scopes:
- **`read:user`** - Read user profile information
- **`user:email`** - Read user email addresses
- **`repo`** - Full access to repositories (for Scribe to read code and create PRs)

## Security Features

1. **CSRF Protection**: State token stored in httpOnly cookie, validated on callback
2. **Session Required**: OAuth start requires valid AKIS session (akis_sid cookie)
3. **Secure Token Storage**: Access tokens stored in DB (TODO: encryption at rest)
4. **Callback URL Validation**: GitHub validates callback URL matches registered app

## Production Deployment

For production:

1. Create a separate GitHub OAuth App with production URLs:
   - **Homepage URL**: `https://yourdomain.com`
   - **Callback URL**: `https://yourdomain.com/api/integrations/github/oauth/callback`

2. Update environment variables:
   ```bash
   GITHUB_OAUTH_CLIENT_ID=<production_client_id>
   GITHUB_OAUTH_CLIENT_SECRET=<production_client_secret>
   GITHUB_OAUTH_CALLBACK_URL=https://yourdomain.com/api/integrations/github/oauth/callback
   APP_PUBLIC_URL=https://yourdomain.com
   BACKEND_URL=https://yourdomain.com
   FRONTEND_URL=https://yourdomain.com
   ```

3. Ensure cookies are secure:
   ```bash
   AUTH_COOKIE_SECURE=true
   AUTH_COOKIE_SAMESITE=strict
   ```

## Troubleshooting

### "state_mismatch" error
- The CSRF state cookie expired (10 min TTL) or was not sent
- Clear cookies and try again

### "token_exchange_failed" error
- GitHub OAuth credentials are incorrect
- Verify `GITHUB_OAUTH_CLIENT_ID` and `GITHUB_OAUTH_CLIENT_SECRET`

### "user_fetch_failed" error
- The access token is invalid or expired
- GitHub API might be down

### 501 "GITHUB_OAUTH_NOT_CONFIGURED"
- OAuth environment variables are missing
- Check `GITHUB_OAUTH_CLIENT_ID`, `GITHUB_OAUTH_CLIENT_SECRET`, and `GITHUB_OAUTH_CALLBACK_URL`

## Testing Locally

1. Start backend: `cd backend && pnpm dev`
2. Start frontend: `cd frontend && pnpm dev`
3. Open browser: `http://localhost:5173`
4. Login to AKIS
5. Go to **Integrations** page
6. Click **Connect** on GitHub card
7. Authorize on GitHub
8. Verify you're redirected back with "GitHub connected successfully!" message
9. Go to **Scribe** page
10. Verify owners/repos/branches load successfully

