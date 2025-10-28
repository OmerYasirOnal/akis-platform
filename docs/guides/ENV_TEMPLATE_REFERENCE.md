# Environment Configuration Template

Since `.env.local.template` cannot be committed due to gitignore, use this reference to create your own `.env.local` file.

## Instructions

1. Create a file named `.env.local` in the `devagents/` directory
2. Copy the contents below
3. Fill in your actual credentials
4. Never commit `.env.local` to version control!

## Template Contents

```env
# ═══════════════════════════════════════════════════════════════════════════
# AKIS Platform - Environment Configuration Template
# ═══════════════════════════════════════════════════════════════════════════

# ─────────────────────────────────────────────────────────────────────────────
# 🤖 AI/LLM Configuration (REQUIRED)
# ─────────────────────────────────────────────────────────────────────────────
OPENROUTER_API_KEY=your_openrouter_api_key_here

# ─────────────────────────────────────────────────────────────────────────────
# 🔐 GitHub App Configuration (RECOMMENDED - Secure)
# ─────────────────────────────────────────────────────────────────────────────
GITHUB_APP_ID=123456
GITHUB_APP_INSTALLATION_ID=789012
GITHUB_APP_PRIVATE_KEY_PEM="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
-----END PRIVATE KEY-----"

# ─────────────────────────────────────────────────────────────────────────────
# 🔓 GitHub OAuth Configuration (DEV FALLBACK)
# ─────────────────────────────────────────────────────────────────────────────
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_oauth_client_id

# ─────────────────────────────────────────────────────────────────────────────
# 🛡️ OAuth Fallback Policy (SAFE-BY-DEFAULT)
# ─────────────────────────────────────────────────────────────────────────────
ALLOW_OAUTH_FALLBACK=false
```

## Setup Guides

- **GitHub App Setup**: See `docs/ENV_SETUP_GITHUB_APP.md`
- **OAuth Setup**: See `GITHUB_PAT_SETUP.md`
- **Security Guide**: See `docs/SECURITY_CHECKS.md`

## Troubleshooting

### Private Key Issues
Ensure newlines are preserved - keep the quotes around the entire private key including BEGIN/END markers.

### "Missing credentials" Error
Check that all three GITHUB_APP_* values are set correctly.

### OAuth Fallback Not Working
Set `ALLOW_OAUTH_FALLBACK=true` (dev mode only).

