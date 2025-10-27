# GitHub App Setup for AKIS Platform

This guide explains how to configure GitHub App authentication for AKIS Scribe Agent.

## 🎯 Why GitHub App?

**Benefits over OAuth/PAT:**
- ✅ Short-lived tokens (~1 hour, auto-refresh)
- ✅ Least-privilege, repo-scoped permissions
- ✅ Easy revocation (uninstall App → all tokens invalidated)
- ✅ Server-side only (no client-side token exposure)
- ✅ No user interaction required after installation

## 📋 Prerequisites

- GitHub organization or personal account
- Admin access to repositories you want AKIS to manage

## 🚀 Setup Steps

### 1. Create GitHub App

1. Go to [GitHub Settings > Developer Settings > GitHub Apps](https://github.com/settings/apps)
2. Click **"New GitHub App"**
3. Fill in the form:

**Basic Information:**
- **GitHub App name:** `AKIS Scribe Agent` (or your custom name)
- **Homepage URL:** `https://your-akis-instance.com` (or `http://localhost:3000` for dev)
- **Callback URL:** `https://your-akis-instance.com/api/integrations/github/callback`
- **Webhook:** ❌ Uncheck "Active" (optional, enable later if needed)

**Permissions:**

| Permission | Access | Reason |
|---|---|---|
| **Contents** | Read & Write | Create/update documentation files |
| **Pull Requests** | Read & Write | Open draft PRs for doc changes |
| **Metadata** | Read-only | Automatic (required for all apps) |

**Where can this GitHub App be installed?**
- ✅ Select "Only on this account" (or "Any account" if public)

4. Click **"Create GitHub App"**

### 2. Generate Private Key

1. After creating the app, scroll down to **"Private keys"**
2. Click **"Generate a private key"**
3. A `.pem` file will download automatically
4. **Keep this file secure** - it's your authentication credential

### 3. Install the App

1. Go to your GitHub App settings page
2. Click **"Install App"** (left sidebar)
3. Select the organization/account where you want to install
4. Choose:
   - **All repositories** (recommended for AKIS), or
   - **Only select repositories**
5. Click **"Install"**

### 4. Get Installation ID

After installation, you'll be redirected to a URL like:

```
https://github.com/settings/installations/12345678
```

The number `12345678` is your **Installation ID**.

### 5. Configure Environment Variables

Create `.env.local` in your project root:

```bash
# GitHub App ID (from app settings page)
GITHUB_APP_ID=123456

# Installation ID (from installation URL)
GITHUB_APP_INSTALLATION_ID=12345678

# Private Key (PEM format)
# IMPORTANT: Replace actual newlines with \n
GITHUB_APP_PRIVATE_KEY_PEM="-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----"
```

**Converting PEM file:**

```bash
# macOS/Linux
awk 'NF {sub(/\r/, ""); printf "%s\\n",$0;}' downloaded-key.pem

# Or use this one-liner:
cat downloaded-key.pem | tr '\n' '\\n'
```

### 6. Verify Setup

Test your configuration:

```bash
npm run dev
```

Check server logs for:

```
✅ [GitHub App] Installation token acquired, expires: 2025-10-28T10:30:00Z
```

If you see errors, check:
- ✅ `GITHUB_APP_ID` matches app ID from GitHub settings
- ✅ `GITHUB_APP_INSTALLATION_ID` is correct
- ✅ `GITHUB_APP_PRIVATE_KEY_PEM` includes `\n` for newlines
- ✅ App is installed on your account/organization
- ✅ Permissions are correctly set

## 🔒 Security Best Practices

### Production Deployment

**DO:**
- ✅ Store private key in a Secret Manager (AWS Secrets Manager, Google Secret Manager, etc.)
- ✅ Rotate keys periodically (generate new key, update env, delete old)
- ✅ Use environment-specific apps (dev, staging, production)
- ✅ Monitor token usage via GitHub App logs

**DON'T:**
- ❌ Commit `.env.local` or private key to version control
- ❌ Share private key via email/Slack
- ❌ Use same app for dev and production
- ❌ Expose tokens to client-side code

### Revocation

If compromised:

1. Go to GitHub App settings
2. **Revoke** or **Delete** the private key
3. Generate a new key
4. Update environment variables
5. Restart application

## 🧪 Testing

### 1. Token Acquisition Test

```typescript
// devagents/src/lib/github/operations.ts
import { getDefaultBranch } from '@/lib/github/operations';

const result = await getDefaultBranch('owner', 'repo');
console.log(result); // Should succeed with GitHub App token
```

### 2. Uninstall Test

1. Uninstall the app from GitHub settings
2. Try running AKIS Scribe Agent
3. Should receive:
   ```json
   {
     "error": "GitHub App not configured",
     "actionable": {
       "type": "install_app",
       "message": "Install AKIS GitHub App",
       "ctaText": "Install AKIS GitHub App"
     }
   }
   ```

## 📊 Monitoring

### Rate Limits

GitHub App tokens have **higher rate limits** than OAuth:

- **OAuth:** 5,000 requests/hour per user
- **GitHub App:** 5,000 requests/hour per installation + 50 requests/hour for JWT

Check rate limit:

```bash
curl -H "Authorization: Bearer $TOKEN" https://api.github.com/rate_limit
```

### Token Expiry

Tokens expire after **~1 hour**. AKIS auto-refreshes tokens when:
- Token has < 5 minutes remaining
- Token is not cached

## 🔗 References

- [GitHub Apps Documentation](https://docs.github.com/en/apps)
- [Authenticating with GitHub Apps](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/about-authentication-with-a-github-app)
- [Rate Limits](https://docs.github.com/en/rest/overview/rate-limits-for-the-rest-api)

## 🆘 Troubleshooting

### Error: "Bad credentials"

- ✅ Check `GITHUB_APP_ID` matches GitHub settings
- ✅ Verify private key format (includes `\n` for newlines)
- ✅ Ensure app is installed

### Error: "Resource not accessible by integration"

- ✅ Check app permissions (Contents R&W, Pull Requests R&W)
- ✅ Verify app is installed on the target repository

### Error: "Installation token expired"

- ✅ This is normal - token auto-refreshes
- ✅ If persists, check system clock (JWT timestamp)

---

**Need help?** Check [AKIS Documentation](../README.md) or [GitHub Support](https://support.github.com)

