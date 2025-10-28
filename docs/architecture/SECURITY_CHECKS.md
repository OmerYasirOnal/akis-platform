# AKIS Security Checklist

**Version:** 1.0  
**Last Updated:** 2025-10-27

## 🔒 Pre-Production Security Checklist

### Authentication & Authorization

- [ ] **GitHub App private key stored securely**
  - ✅ Not in version control (.gitignore includes `.env*`)
  - ✅ Stored in Secret Manager (AWS/GCP/Azure)
  - ✅ Key rotation policy in place (quarterly recommended)

- [ ] **No tokens exposed to client-side**
  - ✅ `getGitHubToken()` has `typeof window !== 'undefined'` guard
  - ✅ `GitHubClient` has server-side guard
  - ✅ No GitHub/OpenRouter API keys in browser bundle

- [ ] **Session management**
  - ✅ Secure session cookies (`httpOnly`, `secure`, `sameSite`)
  - ✅ Session timeout configured (default: 24 hours)
  - ✅ CSRF protection enabled

- [ ] **OAuth fallback (if enabled)**
  - ✅ `GITHUB_CLIENT_SECRET` not exposed
  - ✅ Callback URL whitelist configured
  - ✅ State parameter validation

### Token Management

- [ ] **Short-lived tokens**
  - ✅ GitHub App tokens expire in ~1 hour
  - ✅ Auto-refresh when < 5 minutes remaining
  - ✅ No long-lived PATs in use

- [ ] **Token storage**
  - ✅ Never stored in localStorage/sessionStorage
  - ✅ Never passed in URL query parameters
  - ✅ Only in server-side memory cache

- [ ] **Token transmission**
  - ✅ Always via `Authorization: Bearer` header
  - ✅ HTTPS only in production
  - ✅ No tokens in logs (redacted)

### Code Security

- [ ] **Input validation**
  - ✅ Repository URL parsing validates format
  - ✅ Branch names sanitized
  - ✅ File paths checked for traversal attempts

- [ ] **Rate limiting**
  - ✅ GitHub API rate limit handling (exponential backoff)
  - ✅ Endpoint-level rate limiting (if applicable)
  - ✅ Monitoring alerts for rate limit exhaustion

- [ ] **Error handling**
  - ✅ No sensitive data in error messages
  - ✅ Generic errors to client, detailed to logs
  - ✅ Stack traces not exposed to client

### Dependency Security

- [ ] **Audit dependencies**
  ```bash
  npm audit
  npm audit fix
  ```

- [ ] **Update packages**
  ```bash
  npm outdated
  npm update
  ```

- [ ] **Lock file committed**
  - ✅ `package-lock.json` in version control
  - ✅ Reproducible builds

### Network Security

- [ ] **HTTPS enforcement**
  - ✅ Redirect HTTP → HTTPS in production
  - ✅ HSTS header enabled
  - ✅ Certificate valid and auto-renewing

- [ ] **CORS configuration**
  - ✅ Whitelist specific origins (no `*` in production)
  - ✅ Credentials allowed only for trusted domains

- [ ] **Webhook validation** (if enabled)
  - ✅ Signature verification (`x-hub-signature-256`)
  - ✅ IP whitelist (GitHub webhook IPs)

### Logging & Monitoring

- [ ] **Secret redaction**
  - ✅ GitHub tokens redacted in logs
  - ✅ API keys redacted
  - ✅ PII (if any) redacted

- [ ] **Audit logging**
  - ✅ PR creation logged
  - ✅ File modifications logged
  - ✅ Auth failures logged

- [ ] **Alerting**
  - ✅ Failed auth attempts > threshold
  - ✅ Unexpected API errors
  - ✅ Token acquisition failures

### Data Protection

- [ ] **No PII collection** (default)
  - ✅ Only GitHub usernames/repos (public data)
  - ✅ No email/phone/address collected

- [ ] **Data retention**
  - ✅ Logs rotated (default: 30 days)
  - ✅ Old PRs not auto-deleted
  - ✅ User data deletion policy defined

### Permissions

- [ ] **GitHub App permissions (minimal)**
  - ✅ Contents: Read & Write (required)
  - ✅ Pull Requests: Read & Write (required)
  - ✅ No Issues, Actions, Secrets access (unless needed)

- [ ] **Repository access**
  - ✅ Only user-owned repos (or explicitly granted)
  - ✅ No access to private repos without consent

## 🧪 Security Tests

### Test 1: Token Exposure

**Check client bundle for tokens:**

```bash
npm run build
grep -r "ghp_\|gho_\|sk-" .next/static/
# Should return: (nothing)
```

**Expected:** No tokens in static files.

### Test 2: Server-Side Guard

**Try calling server function from browser console:**

```javascript
// In browser DevTools console
import { getGitHubToken } from '@/lib/github/token-provider';
await getGitHubToken();
// Should throw: "SECURITY: getGitHubToken must only be called server-side"
```

**Expected:** Error thrown.

### Test 3: Token Redaction

**Check logs for exposed tokens:**

```bash
docker logs akis-app | grep -E "ghp_[a-zA-Z0-9]{36}"
# Should return: (nothing)

docker logs akis-app | grep "REDACTED"
# Should return: (multiple matches)
```

**Expected:** No raw tokens, only redacted.

### Test 4: Uninstall Revocation

**Uninstall GitHub App and test API:**

```bash
curl -X POST https://your-akis-instance.com/api/agent/documentation/analyze \
  -H "Content-Type: application/json" \
  -d '{"repoUrl": "https://github.com/owner/repo"}'
```

**Expected Response:**
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

### Test 5: HTTPS Enforcement

```bash
curl -I http://your-akis-instance.com
# Should return: 301 Moved Permanently
# Location: https://your-akis-instance.com
```

### Test 6: CORS

```bash
curl -X POST https://your-akis-instance.com/api/agent/documentation/analyze \
  -H "Origin: https://evil.com" \
  -H "Content-Type: application/json"
# Should return: CORS error or 403
```

## 🚨 Incident Response

### If GitHub App Private Key Compromised

1. **Immediate Actions:**
   - [ ] Go to GitHub App settings
   - [ ] Revoke compromised private key
   - [ ] Generate new private key
   - [ ] Update `GITHUB_APP_PRIVATE_KEY_PEM` in Secret Manager
   - [ ] Restart application

2. **Investigation:**
   - [ ] Check access logs for suspicious activity
   - [ ] Review PRs created in last 24 hours
   - [ ] Notify affected repositories

3. **Post-Mortem:**
   - [ ] Document how key was exposed
   - [ ] Update security procedures
   - [ ] Retrain team on secrets management

### If OAuth Token Leaked

1. **Revoke token:**
   ```bash
   # User revokes from GitHub Settings > Applications
   ```

2. **Force re-authentication:**
   - [ ] Clear user session
   - [ ] Require OAuth reconnect

## 🔍 Security Audit Checklist

**Run before each major release:**

```bash
# 1. Dependency audit
npm audit

# 2. Check for hardcoded secrets
git grep -E "ghp_|gho_|sk-" src/

# 3. Check for console.log with secrets
git grep -E "console\.log.*token|console\.log.*key" src/

# 4. Verify .gitignore
cat .gitignore | grep ".env"

# 5. Check HTTPS enforcement
curl -I https://your-akis-instance.com

# 6. Test token redaction
docker logs akis-app | grep -E "ghp_[a-zA-Z0-9]{36}"
```

## 📋 Compliance

### GDPR (if applicable)

- [ ] **Data processing agreement** with GitHub
- [ ] **User consent** for data access
- [ ] **Data deletion** on user request
- [ ] **Privacy policy** published

### SOC 2 (if applicable)

- [ ] **Access controls** (RBAC)
- [ ] **Audit logs** retained
- [ ] **Encryption** at rest & in transit
- [ ] **Incident response** plan documented

## 🛡️ Best Practices

### Development

- ✅ Use separate GitHub Apps for dev/staging/prod
- ✅ Never commit `.env.local`
- ✅ Rotate keys quarterly
- ✅ Review PR diffs before merging

### Production

- ✅ Use Secret Manager (not env files)
- ✅ Enable monitoring & alerting
- ✅ Regular security audits (quarterly)
- ✅ Keep dependencies updated

### Team

- ✅ Security training (annual)
- ✅ Access review (quarterly)
- ✅ Principle of least privilege
- ✅ 2FA required for all accounts

## 📚 Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)

---

**Maintained by:** AKIS Security Team  
**Next Review:** 2025-11-27

