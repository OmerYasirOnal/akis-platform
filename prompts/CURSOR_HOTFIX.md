# Task: Apply Hotfixes to Make PR Creation and Docs Generation Succeed Reliably

## Goals

1. Ensure Swift/iOS repos (with `.xcodeproj` or `.swift` or `Info.plist`) are recognized as **Swift/iOS** even if `Package.swift` is missing.
2. Guarantee PR is created OR an existing one is surfaced as success.
3. Allow bypassing the DAS gate with an **explicit override flag**.

---

## Required Changes

### A. Tech Detection (Swift/iOS)

**Location:** `src/lib/agents/utils/github-utils.ts` → `detectTechStack()`

**Change:**
- If repo contains any of: `*.xcodeproj`, `*.swift`, `Info.plist` ⇒ set `tech=swift-ios`.
- Do **NOT** rely on `Package.swift` availability.
- Stop probing `package.json`, `pom.xml`, etc. unless they actually exist (avoid noisy 404s).

**Code:**
```typescript
// PRIORITY: Swift/iOS detection (check first)
const hasXcodeProj = files.some(f => f.path.endsWith('.xcodeproj') || f.path.includes('.xcodeproj/'));
const hasSwiftFiles = files.some(f => f.path.endsWith('.swift'));
const hasInfoPlist = files.some(f => f.path.endsWith('Info.plist'));

if (hasXcodeProj || hasSwiftFiles || hasInfoPlist) {
  stack.language = 'Swift';
  stack.framework = 'iOS';
  stack.runtime = 'Xcode';
  return stack; // Early return
}
```

---

### B. PR Creation Reliability

**Location:** `src/lib/services/mcp.ts` → `mcpOpenPR()`

**Changes:**

1. **Check existing PR before creating:**
```typescript
const existingPRResponse = await fetch(
  `https://api.github.com/repos/${owner}/${repo}/pulls?state=open&head=${owner}:${head}&base=${base}`,
  { headers: { 'Authorization': `Bearer ${token}`, ... } }
);

if (existingPRResponse.ok) {
  const existingPRs = await existingPRResponse.json();
  if (Array.isArray(existingPRs) && existingPRs.length > 0) {
    return { success: true, prUrl: existingPRs[0].html_url, isExisting: true };
  }
}
```

2. **Verify branch exists:**
```typescript
const branchResponse = await fetch(
  `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${head}`,
  { headers: { 'Authorization': `Bearer ${token}`, ... } }
);

if (!branchResponse.ok) {
  return { success: false, error: `Head branch "${head}" does not exist` };
}
```

3. **Add `maintainer_can_modify` flag:**
```typescript
const requestBody = {
  title,
  body,
  head,
  base,
  draft,
  maintainer_can_modify: true, // ✅ Added
};
```

4. **Log full error response:**
```typescript
if (!response.ok) {
  const error = await response.json();
  console.error('[createPullRequest] ❌ Failed:', {
    status: response.status,
    error: error,
    requestBody: { ...requestBody, token: '***' },
  });
  
  let errorMessage = error.message || 'Failed to create pull request';
  if (error.errors) {
    errorMessage += ': ' + error.errors.map(e => e.message).join(', ');
  }
  
  return { success: false, error: errorMessage, errorDetails: error };
}
```

---

### C. Zero-Diff Handling

**Location:** `src/lib/agents/scribe/runner.ts` → `run()`

**Change:** Always add a timestamp to `docs/DOC_REPORT.md` to ensure at least one commit difference.

```typescript
if (workflowResult.artifacts.DOC_REPORT) {
  let reportContent = workflowResult.artifacts.DOC_REPORT;
  reportContent += `\n\n---\n> Report generated at: ${new Date().toISOString()}\n`;
  
  filesToCommit.push({
    path: 'docs/DOC_REPORT.md',
    content: reportContent,
  });
}
```

**Optional:** If `forceCommit=true` and no files to commit:
```typescript
if (input.options?.forceCommit && filesToCommit.length === 0) {
  filesToCommit.push({
    path: 'docs/.scribe-run',
    content: `Last run: ${new Date().toISOString()}\n`,
  });
}
```

---

### D. DAS Gate Override

**Location:** `src/lib/agents/scribe/runner.ts` → `ScribeRunnerInput`

**Changes:**

1. **Add flag to interface:**
```typescript
export interface ScribeRunnerInput {
  // ...existing fields
  options?: {
    skipValidation?: boolean;
    autoMergeDAS?: number;
    allowLowDAS?: boolean; // ✅ New flag
    forceCommit?: boolean;  // ✅ New flag
  };
}
```

2. **Update DAS gate logic:**
```typescript
// DAS Validation
const das = workflowResult.validation?.das || 0;

if (das < 50 && !input.options?.allowLowDAS) {
  errors.push(`DAS skoru çok düşük (${das}%). Manuel inceleme gerekli.`);
  this.log(`⚠️ DAS gate: Score too low. Use allowLowDAS=true to override.`);
} else if (das < 50 && input.options?.allowLowDAS) {
  this.log(`⚠️ DAS gate bypassed with allowLowDAS=true (DAS=${das}%)`);
}
```

3. **Add warning to PR body:**
```typescript
let prDescription = workflowResult.artifacts.PR_DESCRIPTION || this.generatePRDescription(workflowResult);

if (das < 50 && input.options?.allowLowDAS) {
  prDescription = `⚠️ **DAS Score Warning**: This PR has a low DAS score (${das}%). Manual review is required.\n\n` + prDescription;
}
```

---

### E. Server Logging

**Location:** All GitHub REST calls

**Change:** Mirror all REST calls to backend logs via `/api/logs`.

Already implemented via:
- `src/app/api/logs/route.ts` (POST endpoint)
- `src/lib/utils/logger.ts` (client utility)
- `src/lib/agents/scribe/runner.ts` (integration)

---

## Definition of Done

Running against **Falbak** (Swift/iOS repo) yields:

- [x] Docs generated (≥ README and at least one `docs/*.md`)
- [x] 4xx-free commits (no 422 errors)
- [x] Draft PR either **created** or **existing PR URL returned**
- [x] Logs show all REST calls and scopes
- [x] Tech detection: **Swift/iOS** (not "Unknown")
- [x] No false `package.json` 404 probes

---

## Testing

### Test 1: Run with `allowLowDAS=true`
```typescript
await scribeRunner.run({
  repoOwner: 'username',
  repoName: 'Falbak',
  baseBranch: 'main',
  scope: 'all',
  accessToken: 'ghp_...',
  options: {
    allowLowDAS: true, // ✅ Bypass DAS gate
    forceCommit: true, // ✅ Ensure diff
  },
});
```

**Expected:**
- PR created successfully even with DAS < 50%
- Warning added to PR body

### Test 2: Existing PR scenario
```bash
# 1. Run once → PR created
# 2. Run again → should return existing PR URL (not fail)
```

**Expected:**
- Second run: `✅ Draft PR bulundu (var olan): https://github.com/...`
- No "Validation Failed" error

### Test 3: Swift/iOS detection
```bash
# Run on Falbak repo
```

**Expected Log:**
```
[ScribeRunner] 📊 Step 1: Repository analizi...
[ScribeRunner] ✅ Tech stack: Swift/iOS detected
[ScribeRunner] Skipping package.json probe (Swift/iOS project)
```

---

## Rollback

If hotfixes cause issues:

1. **PR reliability:** Remove existing PR check, revert to simple create-only
2. **DAS gate:** Remove `allowLowDAS` flag, enforce strict threshold
3. **Zero-diff:** Remove timestamp injection, allow natural diff
4. **Tech detection:** Revert Swift/iOS priority check

---

**Implement all hotfixes now. Return changelist and test results.**

