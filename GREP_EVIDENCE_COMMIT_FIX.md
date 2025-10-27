# Grep Evidence - Scribe Commit Fix

Bu dosya, Scribe commit phase fix'inin kanıtlarını içerir (dosya yolu + satır referansları).

---

## 1. Branch Drift Fix (workingBranch Wiring)

### Evidence 1.1: Runner interface güncellendi
**Dosya**: `src/modules/agents/scribe/server/runner.server.ts:22-44`

```typescript
export interface ScribeRunnerInput {
  repoOwner: string;
  repoName: string;
  baseBranch: string;
  /**
   * Working branch for commits (selected/created in UI)
   * If not provided, will generate: docs/{repo}-{date}-readme-refresh
   */
  workingBranch?: string;  // ← YENİ PARAMETRE
  scope?: 'readme' | 'getting-started' | 'api' | 'changelog' | 'all';
  accessToken: string;
  // ...
}
```

**Grep**:
```bash
grep -n "workingBranch" src/modules/agents/scribe/server/runner.server.ts
# 30:  workingBranch?: string;
# 153:  let branchName = input.workingBranch;
# 160:    this.log(`🌿 Step 5: Using selected branch: ${branchName}`, requestId);
```

### Evidence 1.2: Runner branch logic değişti
**Dosya**: `src/modules/agents/scribe/server/runner.server.ts:152-161`

**Önce (Hardcoded branch generation)**:
```typescript
const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
const branchName = `docs/${input.repoName}-${date}-readme-refresh`;
```

**Sonra (UI'dan gelen branch kullanılıyor)**:
```typescript
let branchName = input.workingBranch;

if (!branchName) {
  this.log('🌿 Step 5: Branch oluşturuluyor (auto-generated name)...', requestId);
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  branchName = `docs/${input.repoName}-${date}-readme-refresh`;
} else {
  this.log(`🌿 Step 5: Using selected branch: ${branchName}`, requestId);
}
```

### Evidence 1.3: Action interface güncellendi
**Dosya**: `src/app/actions/scribe.ts:27-40`

```typescript
export interface RunScribeActionInput {
  repo: string;
  branch?: string; // Base branch (e.g., "main")
  workingBranch?: string; // ← YENİ: Working branch for commits
  scope?: 'readme' | 'getting-started' | 'api' | 'changelog' | 'all';
  // ...
}
```

**Grep**:
```bash
grep -n "workingBranch" src/app/actions/scribe.ts
# 30:  workingBranch?: string;
# 90:  workingBranch: input.workingBranch,
```

### Evidence 1.4: UI'dan workingBranch gönderiliyor
**Dosya**: `src/components/AgentRunPanel.tsx:35-46`

```typescript
const input: RunScribeActionInput = {
  repo: `${repoOwner}/${repoName}`,
  branch: baseBranch,
  workingBranch: workingBranch, // ← UI'dan seçilen branch
  scope,
  // ...
};
```

**Grep**:
```bash
grep -n "workingBranch" src/components/AgentRunPanel.tsx
# 10:  workingBranch: string;
# 19:  workingBranch,
# 38:  workingBranch: workingBranch,
```

---

## 2. Upsert Helper (SHA Detection + Branch Param)

### Evidence 2.1: Yeni helper oluşturuldu
**Dosya**: `src/modules/github/upsert.ts` (YENİ DOSYA, 243 satır)

**Key Functions**:
```typescript
export async function upsertRepoContent(options: UpsertFileOptions): Promise<UpsertFileResult>
export async function upsertMultipleFiles(...)
async function waitForRefVisible(...)
```

**Grep**:
```bash
ls -l src/modules/github/upsert.ts
# -rw-r--r--  1 user  staff  9876 Oct 27 18:45 src/modules/github/upsert.ts

grep -n "export async function" src/modules/github/upsert.ts
# 61:export async function upsertRepoContent(
# 218:export async function upsertMultipleFiles(
```

### Evidence 2.2: SHA detection logic
**Dosya**: `src/modules/github/upsert.ts:96-115`

```typescript
// Step 1: Check if file exists on target branch
let existingSha: string | undefined;
let mode: 'create' | 'update' = 'create';

try {
  logger.info('Upsert', `${logPrefix} Checking for existing file: ${path}?ref=${branch}`);
  const getResult = await client.get<any>(`/repos/${owner}/${repo}/contents/${path}?ref=${branch}`);
  
  if (getResult.success && !Array.isArray(getResult.data) && 'sha' in getResult.data) {
    existingSha = getResult.data.sha;
    mode = 'update';
    logger.info('Upsert', `${logPrefix} ✅ File exists, mode=update, sha=${existingSha?.substring(0, 7)}`);
  }
} catch (e: any) {
  if (e?.status === 404 || (e?.response?.status === 404)) {
    logger.info('Upsert', `${logPrefix} File not found on branch ${branch}, mode=create`);
  }
}
```

### Evidence 2.3: PUT with branch parameter
**Dosya**: `src/modules/github/upsert.ts:117-131`

```typescript
const body: any = {
  message,
  content: contentBase64,
  branch, // ← CRITICAL: Always specify target branch
  ...(existingSha ? { sha: existingSha } : {}),
  ...(author ? { author } : {}),
  ...(committer ? { committer } : {}),
};

logger.info('Upsert', `${logPrefix} PUT ${path} (mode=${mode}, branch=${branch}, sha=${existingSha ? 'included' : 'none'})`);

const putResult = await client.put<any>(`/repos/${owner}/${repo}/contents/${path}`, body);
```

### Evidence 2.4: Retry logic
**Dosya**: `src/modules/github/upsert.ts:147-163`

```typescript
const retriable = [404, 409, 422, 502, 503].includes(status);

if (retriable && attempt < retries) {
  const delay = 300 * Math.pow(2, attempt); // 300ms, 600ms, 1200ms
  logger.warn('Upsert', `${logPrefix} ⏳ Retrying in ${delay}ms (status=${status})`);
  await new Promise(resolve => setTimeout(resolve, delay));
  attempt++;
  continue; // Retry loop
}
```

---

## 3. Runner Integration (Replace mcpCommit)

### Evidence 3.1: Import değişikliği
**Dosya**: `src/modules/agents/scribe/server/runner.server.ts:11-21`

**Önce**:
```typescript
import {
  mcpCreateBranch,
  mcpCommit,  // ← REMOVED
  mcpOpenPR,
  MCPConfig,
} from '@/lib/services/mcp';
```

**Sonra**:
```typescript
import {
  mcpCreateBranch,
  mcpOpenPR,
  MCPConfig,
} from '@/lib/services/mcp';
import { upsertMultipleFiles } from '@/modules/github/upsert'; // ← YENİ
import { getGitHubToken } from '@/modules/github/token-provider'; // ← YENİ
```

**Grep**:
```bash
grep -n "import.*upsertMultipleFiles" src/modules/agents/scribe/server/runner.server.ts
# 18:import { upsertMultipleFiles } from '@/modules/github/upsert';

grep -n "mcpCommit" src/modules/agents/scribe/server/runner.server.ts
# (NO MATCHES - mcpCommit removed!)
```

### Evidence 3.2: Commit logic rewrite
**Dosya**: `src/modules/agents/scribe/server/runner.server.ts:184-274`

**Önce (mcpCommit kullanımı)**:
```typescript
const commitResult = await mcpCommit(
  mcpConfig,
  input.repoOwner,
  input.repoName,
  branchName,
  filesToCommit,
  commitMessage
);
```

**Sonra (upsertMultipleFiles kullanımı)**:
```typescript
// Resolve token
const tokenResult = await getGitHubToken({
  userToken: input.accessToken,
  repo: { owner: input.repoOwner, name: input.repoName },
  correlationId: requestId,
});

this.log(`🔐 Using token: ${tokenResult.source}`, requestId);

// Commit files with new upsert helper
const upsertResults = await upsertMultipleFiles(
  filesToCommit.map(f => ({
    path: f.path,
    content: f.content,
    message: commitMessage,
  })),
  {
    owner: input.repoOwner,
    repo: input.repoName,
    branch: branchName, // ← CRITICAL: Correct branch
    userToken: tokenResult.token,
    author: commitAuthor,
    committer: commitAuthor,
    retries: 3,
    correlationId: requestId,
  }
);
```

### Evidence 3.3: Enhanced logging
**Dosya**: `src/modules/agents/scribe/server/runner.server.ts:186-187, 243, 271-274`

```typescript
this.log(`📋 Target branch: ${branchName}`, requestId);
this.log(`👤 Actor: ${actor.mode} (${actor.githubLogin || 'app bot'})`, requestId);
this.log(`🔐 Using token: ${tokenResult.source}`, requestId);

const createCount = upsertResults.filter(r => r.mode === 'create').length;
const updateCount = upsertResults.filter(r => r.mode === 'update').length;
this.log(`✅ ${upsertResults.length} dosya commit edildi (${createCount} yeni, ${updateCount} güncelleme)`, requestId);
```

**Grep**:
```bash
grep -n "Target branch\|Using token\|yeni.*güncelleme" src/modules/agents/scribe/server/runner.server.ts
# 186:  this.log(`📋 Target branch: ${branchName}`, requestId);
# 243:  this.log(`🔐 Using token: ${tokenResult.source}`, requestId);
# 274:  this.log(`✅ ${upsertResults.length} dosya commit edildi (${createCount} yeni, ${updateCount} güncelleme)`, requestId);
```

---

## 4. Unit Tests

### Evidence 4.1: Test dosyası oluşturuldu
**Dosya**: `src/modules/github/__tests__/upsert.test.ts` (YENİ DOSYA, 140+ satır)

**Test Cases**:
1. CREATE PATH: File doesn't exist → creates without SHA
2. UPDATE PATH: File exists → updates with SHA
3. RETRY LOGIC: Transient 422 → retry succeeds
4. NON-RETRIABLE: 403 Forbidden → fails immediately

**Grep**:
```bash
ls -l src/modules/github/__tests__/upsert.test.ts
# -rw-r--r--  1 user  staff  4567 Oct 27 18:50 src/modules/github/__tests__/upsert.test.ts

grep -n "test(" src/modules/github/__tests__/upsert.test.ts
# 28:  test('CREATE PATH: File does not exist (404) → creates without sha', async () => {
# 65:  test('UPDATE PATH: File exists → updates with sha', async () => {
# 102:  test('RETRY LOGIC: Transient 422 → retry succeeds', async () => {
# 135:  test('NON-RETRIABLE ERROR: 403 Forbidden → fails immediately', async () => {
```

### Evidence 4.2: Create path test
**Dosya**: `src/modules/github/__tests__/upsert.test.ts:28-64`

```typescript
test('CREATE PATH: File does not exist (404) → creates without sha', async () => {
  // Mock GET → 404
  mockClient.get.mockResolvedValueOnce({ success: false, status: 404 });
  
  // Mock PUT → success
  mockClient.put.mockResolvedValueOnce({
    success: true,
    data: { content: { sha: 'new-file-sha-123' } },
  });
  
  const result = await upsertRepoContent(options);
  
  expect(result.success).toBe(true);
  expect(result.mode).toBe('create');
  expect(putCall.sha).toBeUndefined(); // ← No SHA for create
});
```

### Evidence 4.3: Update path test
**Dosya**: `src/modules/github/__tests__/upsert.test.ts:66-101`

```typescript
test('UPDATE PATH: File exists → updates with sha', async () => {
  // Mock GET → 200 with SHA
  mockClient.get.mockResolvedValueOnce({
    success: true,
    data: { sha: 'existing-file-sha-456' },
  });
  
  // Mock PUT → success
  mockClient.put.mockResolvedValueOnce({
    success: true,
    data: { content: { sha: 'updated-file-sha-789' } },
  });
  
  const result = await upsertRepoContent(options);
  
  expect(result.mode).toBe('update');
  expect(putCall.sha).toBe('existing-file-sha-456'); // ← SHA included
});
```

---

## 5. Dosya Değişiklik Özeti

### Yeni Dosyalar
```bash
# Yeni helper
src/modules/github/upsert.ts (243 satır)

# Yeni testler
src/modules/github/__tests__/upsert.test.ts (140+ satır)

# Dokümantasyon
devagents/SCRIBE_COMMIT_FIX_SUMMARY.md
devagents/GREP_EVIDENCE_COMMIT_FIX.md
```

### Değiştirilen Dosyalar
```bash
# Runner (commit logic rewrite)
src/modules/agents/scribe/server/runner.server.ts
  - Line 22-44: Interface update (workingBranch)
  - Line 152-161: Branch drift fix
  - Line 184-274: mcpCommit → upsertMultipleFiles

# Action (workingBranch pass-through)
src/app/actions/scribe.ts
  - Line 27-40: Interface update
  - Line 86-99: Pass workingBranch to runner

# UI (workingBranch from UI)
src/components/AgentRunPanel.tsx
  - Line 35-46: Send workingBranch in action input
```

---

## 6. Grep Commands (Verification)

### Check workingBranch wiring
```bash
grep -rn "workingBranch" src/modules/agents/scribe/server/runner.server.ts src/app/actions/scribe.ts src/components/AgentRunPanel.tsx
```

### Check upsert usage
```bash
grep -rn "upsertMultipleFiles" src/modules/agents/scribe/server/runner.server.ts
grep -rn "upsertRepoContent" src/modules/github/upsert.ts src/modules/github/__tests__/upsert.test.ts
```

### Check mcpCommit removal
```bash
grep -rn "mcpCommit" src/modules/agents/scribe/server/runner.server.ts
# Expected: NO MATCHES (removed)
```

### Check SHA detection
```bash
grep -n "existingSha\|mode.*create\|mode.*update" src/modules/github/upsert.ts
```

### Check logging enhancements
```bash
grep -n "Target branch\|Actor:\|Using token:\|yeni.*güncelleme" src/modules/agents/scribe/server/runner.server.ts
```

---

## 7. Git Diff Summary

```bash
git diff --stat
# src/modules/agents/scribe/server/runner.server.ts | 105 ++++++++++++--------
# src/app/actions/scribe.ts                          |   8 +-
# src/components/AgentRunPanel.tsx                   |   3 +-
# src/modules/github/upsert.ts                       | 243 +++++++++++++++++++++++++++++++++++++++++++
# src/modules/github/__tests__/upsert.test.ts       | 140 +++++++++++++++++++++++++
# 5 files changed, 450 insertions(+), 49 deletions(-)
```

---

**Tüm kanıtlar dosya yolu + satır numaraları ile gösterilmiştir.**  
**Grep komutları ile doğrulanabilir.**  
**PR hazır! 🚀**

