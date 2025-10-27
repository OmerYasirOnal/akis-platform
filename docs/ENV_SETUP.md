# Environment Variables Setup

## Required Environment Variables

Create a `.env.local` file in the `devagents/` directory with the following content:

```bash
# ========================================
# GitHub App Authentication (REQUIRED)
# ========================================
# Create a GitHub App at: https://github.com/settings/apps/new
# 
# Required permissions:
# - Repository permissions:
#   - Contents: Read & Write
#   - Pull requests: Read & Write
#   - Issues: Read & Write (optional)
# 
# After creating the app:
# 1. Note the App ID
# 2. Install the app to your account/org
# 3. Note the Installation ID (from the installation URL)
# 4. Generate a private key (.pem file)
# 5. Copy the private key content below (keep the -----BEGIN/END----- lines)

GITHUB_APP_ID=123456
GITHUB_APP_INSTALLATION_ID=7890123
GITHUB_APP_PRIVATE_KEY_PEM="-----BEGIN RSA PRIVATE KEY-----
...your private key here...
-----END RSA PRIVATE KEY-----"

# ========================================
# GitHub OAuth (Legacy - for user login)
# ========================================
# Optional: Only needed if you want OAuth-based user login
# Create OAuth App at: https://github.com/settings/developers

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
NEXT_PUBLIC_GITHUB_CLIENT_ID=

# ========================================
# AI/LLM Configuration
# ========================================
# OpenRouter API for LLM calls
# Get your API key at: https://openrouter.ai/

OPENROUTER_API_KEY=

# ========================================
# Agent Configuration
# ========================================
# Allow PR creation even with low DAS score (<50%)
# Use this for testing or when you want to bypass quality gates
ALLOW_LOW_DAS=false

# Maximum number of files to scan in a repository
MAX_FILES_TO_SCAN=200

# Maximum agent run time (seconds)
MAX_RUN_TIME=180

# ========================================
# Development
# ========================================
NODE_ENV=development

# Enable debug logging
DEBUG=false
```

## GitHub App Setup Guide

### Step 1: Create GitHub App

1. Go to https://github.com/settings/apps/new
2. Fill in the details:
   - **Name**: `AKIS Scribe` (or any unique name)
   - **Homepage URL**: Your app URL or repository
   - **Callback URL**: Leave blank (not needed for GitHub App)
   - **Webhook**: Optional (can enable `push`, `pull_request` events)

### Step 2: Set Permissions

Under "Repository permissions":
- **Contents**: Read & Write
- **Pull requests**: Read & Write
- **Issues**: Read & Write (optional)

### Step 3: Generate Private Key

1. Scroll down to "Private keys"
2. Click "Generate a private key"
3. Save the `.pem` file securely
4. Copy the entire content (including `-----BEGIN...-----` and `-----END...-----`)

### Step 4: Install the App

1. Go to "Install App" tab
2. Select your account/organization
3. Choose repositories:
   - **Only select repositories** (recommended for security)
   - Or "All repositories" (if you trust the app)
4. Click "Install"

### Step 5: Get Installation ID

After installation, you'll see a URL like:
```
https://github.com/settings/installations/12345678
```

The number `12345678` is your **Installation ID**.

### Step 6: Add to .env.local

```bash
GITHUB_APP_ID=123456              # From the App settings page
GITHUB_APP_INSTALLATION_ID=12345678  # From installation URL
GITHUB_APP_PRIVATE_KEY_PEM="-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
...
-----END RSA PRIVATE KEY-----"
```

## Why GitHub App Instead of PAT?

| Feature | Personal Access Token (PAT) | GitHub App |
|---------|----------------------------|------------|
| **Token Lifetime** | No expiration (manual revoke) | ~1 hour (auto-refresh) |
| **Security** | Shared secret, broad scope | Short-lived, scoped permissions |
| **Revocation** | Manual token deletion | Uninstall app → all tokens invalid |
| **Audit Trail** | User actions | App actions (clear attribution) |
| **Rate Limits** | 5,000/hour (user) | Higher limits (app-based) |
| **Enterprise Ready** | Not recommended | Best practice |

## Testing the Setup

Run this script to verify your GitHub App credentials:

```bash
cd devagents
npm run test:github-app
```

Or manually test:

```bash
node -e "
const { getGitHubAppToken } = require('./src/lib/auth/github-app');
getGitHubAppToken().then(token => {
  console.log(token ? '✅ Token acquired!' : '❌ Failed');
});
"
```

## Troubleshooting

### Error: "Missing credentials in environment"

- Check that all three variables are set in `.env.local`
- Restart your dev server after adding variables

### Error: "Token exchange failed: 401"

- Verify your App ID is correct
- Check that the private key is valid (copy/paste carefully)
- Ensure the private key includes the BEGIN/END lines

### Error: "Installation not found"

- Verify the Installation ID
- Make sure you've installed the app to your account/org
- Check if the app is still installed (not uninstalled)

### Error: "Permission denied"

- Review the app's permissions (Contents: Read & Write, etc.)
- Reinstall the app with correct permissions

