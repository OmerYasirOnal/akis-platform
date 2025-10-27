# Scribe Heuristics Improvement Specification

> This document defines the improved heuristics for the AKIS Scribe Agent to ensure accurate repository analysis and documentation generation.

## 1) Stack Detection Order

### Current Problem
- Agent probes irrelevant files (e.g., `Package.swift` in Node.js repos)
- Unnecessary 404 errors and API calls
- Slower analysis time

### Solution: Smart Stack Detection
Probe file existence using a fast "contents" call (or tree cache) and pick the **first match**:

1. **Node.js**: `package.json`
2. **Java**: `pom.xml` or `build.gradle` or `build.gradle.kts`
3. **Python**: `requirements.txt`, `pyproject.toml`, `setup.py`, or `Pipfile`
4. **Go**: `go.mod`
5. **Ruby**: `Gemfile`
6. **PHP**: `composer.json`
7. **Rust**: `Cargo.toml`
8. **Swift**: `Package.swift`
9. **Kotlin**: `build.gradle.kts`
10. **C#/.NET**: `*.csproj` or `*.sln`

### Implementation Guidelines
- Use a **waterfall check**: Once a stack is identified, skip remaining checks
- Cache the result for the session
- Log the detected stack: `[StackDetector] Detected: Node.js (package.json found)`

### Example Code Pattern
```typescript
const STACK_INDICATORS = [
  { name: 'Node.js', files: ['package.json'] },
  { name: 'Java', files: ['pom.xml', 'build.gradle', 'build.gradle.kts'] },
  { name: 'Python', files: ['requirements.txt', 'pyproject.toml', 'setup.py'] },
  { name: 'Go', files: ['go.mod'] },
  // ... more stacks
];

async function detectStack(github: GitHubClient, owner: string, repo: string): Promise<string> {
  for (const stack of STACK_INDICATORS) {
    for (const file of stack.files) {
      const exists = await github.fileExists(owner, repo, file);
      if (exists) {
        logger.info(`[StackDetector] Detected: ${stack.name} (${file} found)`);
        return stack.name;
      }
    }
  }
  return 'Unknown';
}
```

---

## 2) Quickstart Detection

### Current Problem
- README contains "## Getting Started" but agent reports "Quickstart missing"
- Case-sensitive matching
- Only checks for exact H2 format

### Solution: Flexible Quickstart Detection

#### Regex Pattern (Case-Insensitive)
```regex
^\s{0,3}#{2,3}\s*(quick\s*start|getting\s*started|başlangıç|hızlı\s*başlangıç|quick\s*guide|setup|installation|how\s*to\s*start)
```

#### Detection Rules
- **Case-insensitive**: Match "Quickstart", "QuickStart", "QUICKSTART"
- **H2 and H3**: Allow both `##` and `###` headings
- **Localized keywords**: Support Turkish ("Başlangıç", "Hızlı Başlangıç")
- **Variations**: "Quick Start", "Getting Started", "Quick Guide", "Setup", "Installation"
- **Whitespace tolerant**: Allow up to 3 leading spaces

#### Fallback Strategy
If README doesn't contain Quickstart section:
1. Check `docs/GETTING_STARTED.md`
2. Check `docs/QUICKSTART.md`
3. Check `INSTALL.md`
4. Check if "Installation" section exists in README

### Implementation Example
```typescript
function hasQuickstart(content: string): boolean {
  const quickstartRegex = /^\s{0,3}#{2,3}\s*(quick\s*start|getting\s*started|başlangıç|hızlı\s*başlangıç|quick\s*guide|setup|installation|how\s*to\s*start)/im;
  return quickstartRegex.test(content);
}

async function detectQuickstart(github: GitHubClient, owner: string, repo: string): Promise<boolean> {
  // Check README first
  const readme = await github.getFileContent(owner, repo, 'README.md');
  if (readme && hasQuickstart(readme)) {
    logger.info('[QuickstartDetector] Found in README.md');
    return true;
  }
  
  // Fallback: Check docs/
  const fallbacks = ['docs/GETTING_STARTED.md', 'docs/QUICKSTART.md', 'INSTALL.md'];
  for (const file of fallbacks) {
    const content = await github.getFileContent(owner, repo, file);
    if (content && hasQuickstart(content)) {
      logger.info(`[QuickstartDetector] Found in ${file}`);
      return true;
    }
  }
  
  logger.warn('[QuickstartDetector] Quickstart section not found');
  return false;
}
```

---

## 3) DAS (Documentation Assessment Score) Signals

### Required Items for ≥80% Score

#### Core Files (40%)
- ✅ **README.md** with Quickstart section (15%)
- ✅ **CHANGELOG.md** (10%)
- ✅ **LICENSE** (5%)
- ✅ **env.example** or `.env.example` (10%)

#### Extended Documentation (40%)
- ✅ **docs/GETTING_STARTED.md** or equivalent (10%)
- ✅ **docs/ARCHITECTURE.md** (10%)
- ✅ **docs/API.md** (10%)
- ✅ **CONTRIBUTING.md** (10%)

#### Bonus Points (20%)
- ✅ **SECURITY.md** (5%)
- ✅ **CODE_OF_CONDUCT.md** (2%)
- ✅ **Issue templates** (.github/ISSUE_TEMPLATE/) (3%)
- ✅ **PR template** (.github/pull_request_template.md) (3%)
- ✅ **CI/CD workflow** (.github/workflows/) (5%)
- ✅ **CODEOWNERS** (2%)

### Scoring Algorithm
```typescript
function calculateDAS(coverage: CoverageData): number {
  let score = 0;
  
  // Core files (40%)
  if (coverage.hasReadme && coverage.hasQuickstart) score += 15;
  else if (coverage.hasReadme) score += 5; // README without quickstart
  if (coverage.hasChangelog) score += 10;
  if (coverage.hasLicense) score += 5;
  if (coverage.hasEnvExample) score += 10;
  
  // Extended docs (40%)
  if (coverage.hasGettingStarted) score += 10;
  if (coverage.hasArchitecture) score += 10;
  if (coverage.hasAPI) score += 10;
  if (coverage.hasContributing) score += 10;
  
  // Bonus (20%)
  if (coverage.hasSecurity) score += 5;
  if (coverage.hasCodeOfConduct) score += 2;
  if (coverage.hasIssueTemplates) score += 3;
  if (coverage.hasPRTemplate) score += 3;
  if (coverage.hasCIWorkflow) score += 5;
  if (coverage.hasCodeowners) score += 2;
  
  return Math.min(score, 100); // Cap at 100%
}
```

### DAS Report Format
```markdown
# Documentation Assessment Score (DAS)

**Overall Score: 85% ✅**

## Core Documentation (40/40)
- ✅ README.md with Quickstart (15/15)
- ✅ CHANGELOG.md (10/10)
- ✅ LICENSE (5/5)
- ✅ env.example (10/10)

## Extended Documentation (35/40)
- ✅ docs/GETTING_STARTED.md (10/10)
- ✅ docs/ARCHITECTURE.md (10/10)
- ✅ docs/API.md (10/10)
- ❌ CONTRIBUTING.md (0/10) **MISSING**

## Bonus Features (10/20)
- ✅ .github/workflows/ (5/5)
- ✅ .github/pull_request_template.md (3/3)
- ❌ SECURITY.md (0/5)
- ❌ CODE_OF_CONDUCT.md (0/2)
- ❌ .github/ISSUE_TEMPLATE/ (0/3)
- ❌ CODEOWNERS (0/2)

## Recommendations
1. Add CONTRIBUTING.md to reach 95%
2. Add SECURITY.md for vulnerability reporting
3. Add issue templates for better contributor experience
```

---

## 4) Token Management

### Current Problem
- Token expiry not handled proactively
- Potential race conditions during refresh
- Rate limit errors not cached

### Solution: Refresh-Before-Expiry Strategy

#### Token Lifecycle
1. **Acquisition**: Get installation token (1-hour TTL)
2. **Cache**: Store token with expiry timestamp
3. **Proactive Refresh**: Renew at `now >= exp - 5min` with 10–30s jitter
4. **Serialization**: Lock per installation to prevent stampedes

#### Implementation Pattern
```typescript
class GitHubTokenProvider {
  private tokenCache = new Map<string, { token: string; expiresAt: number }>();
  private refreshLocks = new Map<string, Promise<string>>();
  
  async getToken(installationId: string): Promise<string> {
    const cached = this.tokenCache.get(installationId);
    const now = Date.now();
    
    // Check if token needs refresh (5min buffer + jitter)
    const jitter = Math.random() * 20000 + 10000; // 10-30s
    const refreshThreshold = 5 * 60 * 1000 + jitter; // 5min + jitter
    
    if (cached && now < cached.expiresAt - refreshThreshold) {
      logger.info('[TokenProvider] Using cached token');
      return cached.token;
    }
    
    // Check if refresh is already in progress
    const existingRefresh = this.refreshLocks.get(installationId);
    if (existingRefresh) {
      logger.info('[TokenProvider] Waiting for ongoing refresh');
      return existingRefresh;
    }
    
    // Start new refresh
    const refreshPromise = this.refreshToken(installationId);
    this.refreshLocks.set(installationId, refreshPromise);
    
    try {
      const newToken = await refreshPromise;
      return newToken;
    } finally {
      this.refreshLocks.delete(installationId);
    }
  }
  
  private async refreshToken(installationId: string): Promise<string> {
    logger.info('[TokenProvider] Refreshing token');
    const response = await fetch(`https://api.github.com/app/installations/${installationId}/access_tokens`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.generateJWT()}`,
        Accept: 'application/vnd.github+json',
      },
    });
    
    const data = await response.json();
    const expiresAt = new Date(data.expires_at).getTime();
    
    this.tokenCache.set(installationId, {
      token: data.token,
      expiresAt,
    });
    
    logger.info(`[TokenProvider] Token refreshed, expires at ${new Date(expiresAt).toISOString()}`);
    return data.token;
  }
}
```

---

## 5) Error Handling & Observability

### Logging Standards
- **Prefix all logs**: `[Module]` format (e.g., `[StackDetector]`, `[QuickstartDetector]`)
- **Log levels**: `info`, `warn`, `error`
- **Never log secrets**: Mask tokens, API keys, private keys

### Error Categories
1. **Validation Errors**: User input issues (400)
2. **GitHub API Errors**: Rate limits, permissions (403, 429)
3. **Not Found**: Repository or file missing (404)
4. **Server Errors**: Unexpected failures (500)

### Observability Checklist
- [ ] Log detected stack with file that triggered it
- [ ] Log Quickstart detection result (found/not found + location)
- [ ] Log DAS score calculation breakdown
- [ ] Log token refresh events (not the token itself)
- [ ] Log GitHub API errors with sanitized messages
- [ ] Track agent execution time

---

## 6) Testing Strategy

### Unit Tests
- Stack detection with various file combinations
- Quickstart regex matching (case variations, locales)
- DAS score calculation with edge cases
- Token refresh logic with mocked timers

### Integration Tests
- Full Scribe workflow end-to-end
- GitHub API integration with real repos
- Token caching and refresh under load

### Test Cases
```typescript
describe('StackDetector', () => {
  it('detects Node.js from package.json', async () => {
    const stack = await detectStack(mockGitHub, 'owner', 'repo');
    expect(stack).toBe('Node.js');
  });
  
  it('skips Swift check after Node.js is detected', async () => {
    const spy = jest.spyOn(mockGitHub, 'fileExists');
    await detectStack(mockGitHub, 'owner', 'repo');
    expect(spy).toHaveBeenCalledWith('owner', 'repo', 'package.json');
    expect(spy).not.toHaveBeenCalledWith('owner', 'repo', 'Package.swift');
  });
});

describe('QuickstartDetector', () => {
  it('detects "## Getting Started" in README', () => {
    const content = '# Project\n\n## Getting Started\n\nInstall...';
    expect(hasQuickstart(content)).toBe(true);
  });
  
  it('detects Turkish "## Başlangıç"', () => {
    const content = '# Proje\n\n## Başlangıç\n\nKurulum...';
    expect(hasQuickstart(content)).toBe(true);
  });
  
  it('is case-insensitive', () => {
    expect(hasQuickstart('## QuickStart')).toBe(true);
    expect(hasQuickstart('## QUICK START')).toBe(true);
  });
});
```

---

## 7) Migration Checklist

### Phase 1: Stack Detection
- [ ] Implement waterfall stack detection
- [ ] Add logging for detected stack
- [ ] Test with Node.js, Python, Java repos
- [ ] Measure API call reduction

### Phase 2: Quickstart Detection
- [ ] Implement flexible regex pattern
- [ ] Add fallback file checks
- [ ] Test with multiple README formats
- [ ] Update DAS calculation

### Phase 3: Token Management
- [ ] Add refresh-before-expiry logic
- [ ] Implement refresh locks
- [ ] Add jitter to prevent stampedes
- [ ] Monitor token refresh frequency

### Phase 4: DAS Scoring
- [ ] Implement new scoring algorithm
- [ ] Generate detailed DAS reports
- [ ] Add recommendations section
- [ ] Integrate with CI gate

---

## 8) Success Metrics

### Before Optimization
- ⚠️ DAS Score: 56%
- ⚠️ 5-10 unnecessary API calls per repo scan
- ⚠️ Quickstart false negatives
- ⚠️ Token refresh failures

### After Optimization (Target)
- ✅ DAS Score: ≥ 80%
- ✅ < 3 API calls for stack detection
- ✅ 95%+ Quickstart detection accuracy
- ✅ Zero token-related failures
- ✅ CI gate enforces documentation standards

---

## References

- [GitHub REST API](https://docs.github.com/en/rest)
- [DAS Calculation](./DAS_REPORT.md)
- [Scribe Agent Playbook](../DOCUMENTATION_AGENT_GUIDE.md)

