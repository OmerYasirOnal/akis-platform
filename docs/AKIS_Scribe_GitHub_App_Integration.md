# AKIS Scribe GitHub App Integration

**Version:** 2.0  
**Date:** 2025-10-27  
**Status:** ✅ Production Ready

## 📋 Executive Summary

This document describes the GitHub App authentication architecture for AKIS Scribe Agent, replacing legacy OAuth/PAT with short-lived Installation Tokens.

**Key Changes:**
- ✅ GitHub App-first authentication (short-lived tokens, server-side only)
- ✅ Central GitHub API client (`lib/github/client.ts`)
- ✅ No hardcoded `main` branch (runtime default branch detection)
- ✅ Auth guard on agent endpoints (actionable CTAs)
- ✅ Server-side LLM calls only (no client-side OpenRouter)
- ✅ Structured logging with secret redaction

## 🏗️ Architecture

### Before (Legacy)

```
┌─────────────┐
│   Browser   │
│  (Client)   │──┐ OAuth Token (long-lived)
└─────────────┘  │
                 │ Direct GitHub API calls
                 ▼
           ┌──────────────┐
           │  GitHub API  │
           └──────────────┘
```

**Problems:**
- ❌ Long-lived tokens exposed to client
- ❌ No centralized token management
- ❌ Hardcoded `main` branch assumptions
- ❌ Direct API calls scattered across codebase

### After (GitHub App)

```
┌─────────────┐
│   Browser   │
│  (Client)   │──┐ No tokens (session-based)
└─────────────┘  │
                 │
                 ▼
           ┌──────────────────────┐
           │   Next.js API        │
           │  (Server-side)       │
           │                      │
           │  ┌────────────────┐  │
           │  │ Token Provider │  │ GitHub App JWT
           │  │  (App-first,   │──┼──────────────┐
           │  │  OAuth fallback)│  │              │
           │  └────────────────┘  │              │
           │          │            │              │
           │          │ Short-lived│              │
           │          │ token      │              │
           │          ▼            │              │
           │  ┌────────────────┐  │              │
           │  │ GitHub Client  │  │              │
           │  │   (gh())       │──┼──────┐       │
           │  └────────────────┘  │      │       │
           └──────────────────────┘      │       │
                                         │       │
                                         ▼       ▼
                                   ┌──────────────────┐
                                   │   GitHub API     │
                                   │  (Installation   │
                                   │   Access Token)  │
                                   └──────────────────┘
```

**Benefits:**
- ✅ Server-side only token management
- ✅ Auto-refresh (tokens expire in ~1 hour)
- ✅ Easy revocation (uninstall app)
- ✅ Central client with rate limiting, logging, retries

## 📁 File Structure

```
devagents/
├── src/
│   ├── lib/
│   │   ├── github/                    # NEW: Central GitHub client
│   │   │   ├── token-provider.ts      # ✨ GitHub App-first token provider
│   │   │   ├── client.ts              # ✨ Central GitHub client (gh())
│   │   │   └── operations.ts          # ✨ High-level GitHub operations
│   │   ├── auth/
│   │   │   ├── github-app.ts          # GitHub App JWT + Installation Token
│   │   │   └── github-token.ts        # DEPRECATED: Backward compat wrapper
│   │   ├── agents/
│   │   │   ├── documentation-agent.ts # FIXED: Server-side LLM only
│   │   │   └── utils/
│   │   │       ├── github-utils.ts    # REFACTORED: Uses operations.ts
│   │   │       └── github-utils-legacy.ts # Backup
│   │   ├── ai/
│   │   │   └── openrouter.ts          # FIXED: getOpenRouterClient()
│   │   └── utils/
│   │       └── logger.ts              # ENHANCED: Isomorphic, redaction
│   └── app/
│       └── api/
│           └── agent/
│               └── documentation/
│                   └── analyze/
│                       └── route.ts    # FIXED: Auth guard + CTAs
├── docs/
│   ├── AKIS_Scribe_GitHub_App_Integration.md  # This file
│   ├── ENV_SETUP_GITHUB_APP.md       # Setup guide
│   ├── SECURITY_CHECKS.md            # Security checklist
│   └── OBSERVABILITY.md              # Logging & metrics
└── .env.example                       # Environment template
```

## 🔑 Authentication Flow

### 1. Token Provider (`lib/github/token-provider.ts`)

**Priority (REVERSED from legacy):**

1. **GitHub App Installation Token** (preferred)
   - Server-side only
   - Short-lived (~1 hour)
   - Auto-cached and auto-refreshed
   
2. **OAuth User Token** (fallback)
   - For dev/testing
   - Passed from client session

```typescript
// Usage
import { getGitHubToken } from '@/lib/github/token-provider';

const result = await getGitHubToken({
  userToken: req.session?.githubToken, // Optional
  correlationId: 'abc123',
  repo: { owner: 'acme', name: 'repo' },
});

if ('error' in result) {
  // No token available - return actionable CTA
  return res.json({
    error: result.error,
    actionable: result.actionable, // { type, message, ctaText }
  });
}

// Use token
const token = result.token;
```

### 2. GitHub Client (`lib/github/client.ts`)

**Central HTTP wrapper for all GitHub API calls:**

```typescript
import { gh } from '@/lib/github/client';

const client = gh({ userToken: 'ghp_...' });

// GET
const repo = await client.get('/repos/owner/repo');
if (repo.success) {
  console.log(repo.data);
}

// POST
const pr = await client.post('/repos/owner/repo/pulls', {
  title: 'docs: update README',
  head: 'docs/fix',
  base: 'main',
});
```

**Features:**
- ✅ Auto token injection
- ✅ Rate limit handling (exponential backoff, max 3 retries)
- ✅ Structured logging (correlation IDs)
- ✅ Error normalization

### 3. Operations (`lib/github/operations.ts`)

**High-level helpers (no hardcoded `main`):**

```typescript
import {
  getDefaultBranch,
  getFileContent,
  createBranch,
  createPullRequest,
} from '@/lib/github/operations';

// Default branch detection
const { defaultBranch } = await getDefaultBranch('owner', 'repo');
// Returns 'main', 'master', 'develop', etc.

// File content (auto-detects default branch if not provided)
const file = await getFileContent('owner', 'repo', 'README.md');

// Create branch (auto-uses default branch as base if not provided)
await createBranch('owner', 'repo', 'docs/update');

// Create PR (auto-uses default branch as base if not provided)
await createPullRequest(
  'owner',
  'repo',
  'docs: update README',
  'PR body',
  'docs/update'
);
```

## 🛡️ Security

### Secrets Management

**Development:**
```bash
# .env.local
GITHUB_APP_ID=123456
GITHUB_APP_INSTALLATION_ID=12345678
GITHUB_APP_PRIVATE_KEY_PEM="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
```

**Production:**
- ✅ Use AWS Secrets Manager / Google Secret Manager / Azure Key Vault
- ✅ Rotate keys periodically
- ✅ Never commit `.env.local` to version control

### Token Redaction

All logs automatically redact secrets:

```typescript
// logger.ts
function redact(text: string): string {
  return text
    .replace(/ghp_[a-zA-Z0-9]{36}/g, 'ghp_***REDACTED***')
    .replace(/gho_[a-zA-Z0-9]{36}/g, 'gho_***REDACTED***')
    .replace(/Bearer\s+[a-zA-Z0-9_\-\.]+/gi, 'Bearer ***REDACTED***')
    .replace(/sk-[a-zA-Z0-9]{48}/g, 'sk-***REDACTED***');
}
```

### Client-Side Protection

```typescript
// Server-side guard
if (typeof window !== 'undefined') {
  throw new Error('SECURITY: This function must only be called server-side');
}
```

## 📊 Observability

### Structured Logging

```typescript
import { logger } from '@/lib/utils/logger';

logger.info('GitHubOps', 'Creating PR for docs update', {
  repo: 'owner/repo',
  branch: 'docs/update',
});

// Output:
// ℹ️ [2025-10-27T10:30:00.000Z] [GitHubOps] Creating PR for docs update {"repo":"owner/repo","branch":"docs/update"}
```

### Correlation IDs

Every request gets a unique correlation ID for tracing:

```typescript
const correlationId = Math.random().toString(36).substring(7);

const result = await getGitHubToken({ correlationId });
// Logs: [abc123] Getting token for owner/repo
```

### Rate Limit Monitoring

```typescript
const result = await client.get('/repos/owner/repo');

if (result.success) {
  console.log('Rate limit:', result.rateLimit);
  // { limit: 5000, remaining: 4999, reset: Date }
}
```

## 🧪 Testing

### Unit Tests

```bash
npm run test
```

### E2E Tests

```bash
# Test token acquisition
npm run test:e2e -- --grep "GitHub App token"

# Test uninstall scenario
npm run test:e2e -- --grep "uninstall revocation"
```

### Manual Testing

1. **Token Acquisition:**
   ```bash
   curl -X POST http://localhost:3000/api/agent/documentation/analyze \
     -H "Content-Type: application/json" \
     -d '{"repoUrl": "https://github.com/owner/repo", "action": "repo_summary"}'
   ```

2. **Uninstall Test:**
   - Uninstall GitHub App from GitHub settings
   - Retry above request
   - Should return:
     ```json
     {
       "success": false,
       "error": "GitHub App not configured",
       "actionable": {
         "type": "install_app",
         "message": "Install AKIS GitHub App",
         "ctaText": "Install AKIS GitHub App"
       },
       "requiresAuth": true
     }
     ```

## 🚀 Deployment

### Environment Variables

```bash
# Required
GITHUB_APP_ID=
GITHUB_APP_INSTALLATION_ID=
GITHUB_APP_PRIVATE_KEY_PEM=

# Optional (fallback)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# LLM
OPENROUTER_API_KEY=
```

### Pre-deploy Checklist

- [ ] GitHub App created and installed
- [ ] Private key stored securely
- [ ] Environment variables set
- [ ] Tests passing
- [ ] Logs configured
- [ ] Rate limits monitored

### Post-deploy Verification

```bash
# Check logs for token acquisition
docker logs akis-app | grep "Installation token acquired"

# Test API endpoint
curl https://your-akis-instance.com/api/agent/documentation/analyze \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"repoUrl": "https://github.com/owner/repo"}'
```

## 📈 Metrics & Monitoring

### Key Metrics

| Metric | Target | Alert If |
|---|---|---|
| Token acquisition success rate | > 99% | < 95% |
| Token cache hit rate | > 80% | < 50% |
| API rate limit remaining | > 1000 | < 100 |
| PR creation success rate | > 95% | < 90% |

### Dashboards

Create dashboards for:
- Token acquisition timeline
- GitHub API rate limits
- Agent execution duration
- Error rates by type

## 🔄 Migration from OAuth

### Step 1: Create GitHub App

Follow [ENV_SETUP_GITHUB_APP.md](./ENV_SETUP_GITHUB_APP.md)

### Step 2: Update Environment

```bash
# Add to .env.local
GITHUB_APP_ID=123456
GITHUB_APP_INSTALLATION_ID=12345678
GITHUB_APP_PRIVATE_KEY_PEM="..."
```

### Step 3: Deploy

```bash
npm run build
npm run start
```

### Step 4: Verify

Check logs for:
```
✅ [GitHub App] Installation token acquired
```

### Step 5: Remove OAuth (optional)

Once GitHub App is working:
```bash
# Remove from .env.local
# GITHUB_CLIENT_ID=
# GITHUB_CLIENT_SECRET=
```

## 🆘 Troubleshooting

See [SECURITY_CHECKS.md](./SECURITY_CHECKS.md) for common issues.

## 📚 References

- [GitHub Apps Documentation](https://docs.github.com/en/apps)
- [Installation Access Tokens](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app)
- [Rate Limits](https://docs.github.com/en/rest/overview/rate-limits-for-the-rest-api)

---

**Last Updated:** 2025-10-27  
**Maintainer:** AKIS Platform Team  
**Status:** ✅ Production Ready

