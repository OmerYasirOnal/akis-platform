# Scribe Agent - Commit Phase Fix (422 "sha wasn't supplied")

**Tarih**: 2025-10-27  
**Versiyon**: 1.4 (Commit Phase Fix)  
**Durum**: ✅ Tamamlandı

---

## 🎯 Problem

### Root Cause Analysis

Scribe Agent workflow'unda branch creation başarılı oluyor ama commit aşamasında **422 "sha wasn't supplied"** hatası alınıyordu.

**3 Ana Sorun:**

1. **Branch Name Drift**: 
   - UI'da oluşturulan branch: `docs/UniSum-Backend-20251027-readme-refreshasdasd`
   - Runner'ın kullandığı branch: `docs/UniSum-Backend-20251027-readme-refresh` (farklı!)
   - `runner.server.ts:151` yeni bir branch adı generate ediyordu

2. **Missing SHA in PUT Requests**:
   - README.md gibi dosyalar `main` branch'te zaten var
   - Yeni branch'te henüz yok (create gerekiyor)
   - Ama mevcut `mcpCommit` SHA kontrolü yaparken yanlış branch'i check ediyordu
   - Veya hiç check etmeden SHA olmadan update atmaya çalışıyordu

3. **No Branch Parameter in PUT**:
   - GitHub API'ye PUT yaparken `branch` parametresi eksik olabiliyordu
   - Bu da yanlış branch'e commit çalışmasına sebep oluyordu

---

## 🔧 Çözüm

### Fix #1: Wire `workingBranch` End-to-End

**Dosya**: `src/modules/agents/scribe/server/runner.server.ts`

#### Değişiklik 1: ScribeRunnerInput interface güncellendi
**Satır 22-44** (Önce):
```typescript
export interface ScribeRunnerInput {
  repoOwner: string;
  repoName: string;
  baseBranch: string;
  scope?: 'readme' | 'getting-started' | 'api' | 'changelog' | 'all';
  accessToken: string;
  // ...
}
```

**Sonra**:
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

#### Değişiklik 2: Branch drift fix
**Satır 147-151** (Önce):
```typescript
// Step 5: Create branch
this.log('🌿 Step 5: Branch oluşturuluyor...', requestId);

const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
const branchName = `docs/${input.repoName}-${date}-readme-refresh`;
```

**Sonra**:
```typescript
// Step 5: Use existing branch or create new one
let branchName = input.workingBranch;  // ← UI'dan gelen branch kullan

if (!branchName) {
  this.log('🌿 Step 5: Branch oluşturuluyor (auto-generated name)...', requestId);
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  branchName = `docs/${input.repoName}-${date}-readme-refresh`;
} else {
  this.log(`🌿 Step 5: Using selected branch: ${branchName}`, requestId);
}
```

**Dosya**: `src/app/actions/scribe.ts`

#### Değişiklik 3: Action interface güncellendi
**Satır 27-40**:
```typescript
export interface RunScribeActionInput {
  repo: string;
  branch?: string; // Base branch (e.g., "main")
  workingBranch?: string; // Working branch for commits (e.g., "docs/my-branch") ← YENİ
  scope?: 'readme' | 'getting-started' | 'api' | 'changelog' | 'all';
  accessToken?: string;
  // ...
}
```

#### Değişiklik 4: Action'da workingBranch pass-through
**Satır 86-99**:
```typescript
const runnerInput: ScribeRunnerInput = {
  repoOwner: owner,
  repoName: repo,
  baseBranch: input.branch || 'main',
  workingBranch: input.workingBranch, // ← Pass through
  scope: input.scope || 'readme',
  accessToken: input.accessToken || '',
  actor,
  options: { ... },
};
```

**Dosya**: `src/components/AgentRunPanel.tsx`

#### Değişiklik 5: UI'dan workingBranch gönderimi
**Satır 35-46**:
```typescript
const input: RunScribeActionInput = {
  repo: `${repoOwner}/${repoName}`,
  branch: baseBranch,
  workingBranch: workingBranch, // ← UI'dan seçilen branch
  scope,
  ...(accessToken && { accessToken }),
  dryRun: false,
  options: { skipValidation: false, autoMergeDAS: 80 },
};
```

---

### Fix #2: Create Robust `upsertRepoContent` Helper

**Dosya**: `src/modules/github/upsert.ts` (**YENİ DOSYA**)

Bu helper:
- ✅ Target branch'te dosya var mı check eder (`GET /repos/{owner}/{repo}/contents/{path}?ref={branch}`)
- ✅ Varsa SHA'sını alır → `mode=update` ile PUT atar
- ✅ Yoksa SHA olmadan → `mode=create` ile PUT atar
- ✅ PUT isteğinde **mutlaka `branch` parametresi** gönderir
- ✅ 422, 404, 409, 502, 503 hatalarında retry yapar (exponential backoff)
- ✅ Detaylı logging: actor, branch, path, mode, sha

**Satır 61-196** (Özet):
```typescript
export async function upsertRepoContent(options: UpsertFileOptions): Promise<UpsertFileResult> {
  // 1. Wait for ref visibility (GitHub eventual consistency)
  await waitForRefVisible(client, owner, repo, branch);
  
  // 2. Check if file exists on target branch
  let existingSha: string | undefined;
  let mode: 'create' | 'update' = 'create';
  
  try {
    const getResult = await client.get(`/repos/${owner}/${repo}/contents/${path}?ref=${branch}`);
    if (getResult.success && 'sha' in getResult.data) {
      existingSha = getResult.data.sha;
      mode = 'update';
    }
  } catch (e) { /* 404 → create */ }
  
  // 3. PUT with explicit branch and conditional sha
  const body = {
    message,
    content: contentBase64,
    branch, // ← CRITICAL: Always specify
    ...(existingSha ? { sha: existingSha } : {}),
  };
  
  const putResult = await client.put(`/repos/${owner}/${repo}/contents/${path}`, body);
  
  return { success: true, mode, sha: newSha, path, branch };
}
```

**Retry Logic**:
```typescript
// Retriable errors: 404, 409, 422, 502, 503
if (retriable && attempt < retries) {
  const delay = 300 * Math.pow(2, attempt); // 300ms, 600ms, 1200ms
  await sleep(delay);
  continue; // Retry
}
```

---

### Fix #3: Replace `mcpCommit` with New Upsert Helper

**Dosya**: `src/modules/agents/scribe/server/runner.server.ts`

#### Değişiklik 1: Import upsert helper
**Satır 11-21**:
```typescript
import {
  mcpCreateBranch,
  mcpOpenPR,
  MCPConfig,
} from '@/lib/services/mcp';
import { upsertMultipleFiles } from '@/modules/github/upsert'; // ← YENİ
import { getGitHubToken } from '@/modules/github/token-provider'; // ← YENİ
```

#### Değişiklik 2: Commit phase rewrite
**Satır 184-274** (Önce):
```typescript
// Step 6: Commit artifacts
const commitResult = await mcpCommit(
  mcpConfig,
  input.repoOwner,
  input.repoName,
  branchName, // ← Yanlış branch olabilir
  filesToCommit,
  commitMessage
);
```

**Sonra**:
```typescript
// Step 6: Commit artifacts with robust upsert
this.log('💾 Step 6: Artifacts commit ediliyor...', requestId);
this.log(`📋 Target branch: ${branchName}`, requestId); // ← Branch logging
this.log(`👤 Actor: ${actor.mode} (${actor.githubLogin || 'app bot'})`, requestId); // ← Actor logging

// Resolve token
const tokenResult = await getGitHubToken({
  userToken: input.accessToken,
  repo: { owner: input.repoOwner, name: input.repoName },
  correlationId: requestId,
});

this.log(`🔐 Using token: ${tokenResult.source}`, requestId); // ← Token source logging

// Commit with new upsert helper
const upsertResults = await upsertMultipleFiles(
  filesToCommit.map(f => ({
    path: f.path,
    content: f.content,
    message: commitMessage,
  })),
  {
    owner: input.repoOwner,
    repo: input.repoName,
    branch: branchName, // ← CRITICAL: Doğru branch
    userToken: tokenResult.token,
    author: commitAuthor,
    committer: commitAuthor,
    retries: 3,
    correlationId: requestId,
  }
);

// Summary log
const createCount = upsertResults.filter(r => r.mode === 'create').length;
const updateCount = upsertResults.filter(r => r.mode === 'update').length;
this.log(`✅ ${upsertResults.length} dosya commit edildi (${createCount} yeni, ${updateCount} güncelleme)`, requestId);
```

---

### Fix #4: Unit Tests

**Dosya**: `src/modules/github/__tests__/upsert.test.ts` (**YENİ DOSYA**)

**4 Test Scenario:**

1. **CREATE PATH**: File doesn't exist (404) → creates without SHA ✅
2. **UPDATE PATH**: File exists → updates with SHA ✅
3. **RETRY LOGIC**: Transient 422 → retry succeeds ✅
4. **NON-RETRIABLE**: 403 Forbidden → fails immediately ✅

**Satır 20-140**:
```typescript
test('CREATE PATH: File does not exist (404) → creates without sha', async () => {
  mockClient.get.mockResolvedValueOnce({ success: false, status: 404 });
  mockClient.put.mockResolvedValueOnce({
    success: true,
    data: { content: { sha: 'new-file-sha-123' } },
  });
  
  const result = await upsertRepoContent(options);
  
  expect(result.success).toBe(true);
  expect(result.mode).toBe('create');
  expect(putCall.sha).toBeUndefined(); // No SHA for create
});

test('UPDATE PATH: File exists → updates with sha', async () => {
  mockClient.get.mockResolvedValueOnce({
    success: true,
    data: { sha: 'existing-file-sha-456' },
  });
  
  const result = await upsertRepoContent(options);
  
  expect(result.mode).toBe('update');
  expect(putCall.sha).toBe('existing-file-sha-456'); // SHA included
});
```

---

## 📊 Kanıt (Evidence)

### Before (Hatanın Logları)

```
ℹ️ [2025-10-27T18:38:21.025Z] [BranchAPI] Creating/checking branch "asgasgasgasgg" for OmerYasirOnal/UniSum-Backend
ℹ️ [2025-10-27T18:38:22.294Z] [BranchAPI] ✅ Branch created successfully: asgasgasgasgg
ℹ️ [2025-10-27T18:38:24.597Z] [ScribeAction] Starting Scribe workflow for OmerYasirOnal/UniSum-Backend
❌ [mcpCommit] Could not check file README.md: ...
[mcpCommit] File README.md does not exist, creating new file  ← MİSLEADING!
❌ 422: Invalid request. "sha" wasn't supplied.  ← HATA BURADA!
```

**Problem**: README.md `main` branch'te var, yeni branch'te yok. mcpCommit yanlış branch'te check ediyor veya hiç check etmiyor.

### After (Beklenen Sonuç)

```
ℹ️ [ScribeRunner] 🌿 Step 5: Using selected branch: docs/UniSum-Backend-20251027-readme-refreshasdasd
ℹ️ [ScribeRunner] 💾 Step 6: Artifacts commit ediliyor...
ℹ️ [ScribeRunner] 📋 Target branch: docs/UniSum-Backend-20251027-readme-refreshasdasd
ℹ️ [ScribeRunner] 👤 Actor: app_bot (akis-scribe-agent[bot])
ℹ️ [ScribeRunner] 🔐 Using token: github_app
ℹ️ [Upsert] [correlation-id] Starting upsert: OmerYasirOnal/UniSum-Backend/README.md on docs/UniSum-Backend-20251027-readme-refreshasdasd
ℹ️ [Upsert] [correlation-id] Checking for existing file: README.md?ref=docs/UniSum-Backend-20251027-readme-refreshasdasd
ℹ️ [Upsert] [correlation-id] File not found on branch docs/UniSum-Backend-20251027-readme-refreshasdasd, mode=create
ℹ️ [Upsert] [correlation-id] PUT README.md (mode=create, branch=docs/UniSum-Backend-20251027-readme-refreshasdasd, sha=none)
ℹ️ [Upsert] [correlation-id] ✅ CREATE successful: README.md (sha=abc1234)
ℹ️ [Upsert] [correlation-id] Starting upsert: OmerYasirOnal/UniSum-Backend/CHANGELOG.md on docs/UniSum-Backend-20251027-readme-refreshasdasd
ℹ️ [Upsert] [correlation-id] ✅ CREATE successful: CHANGELOG.md (sha=def5678)
ℹ️ [ScribeRunner] ✅ 5 dosya commit edildi (5 yeni, 0 güncelleme)
```

---

## 🧪 Test Senaryoları

### Test 1: Yeni Branch'te İlk Commit (Create Mode)

**Koşul**: Branch yeni oluşturuldu, README.md main'de var ama bu branch'te yok

**Adımlar**:
1. UI'dan branch oluştur: `docs/test-27oct-readme`
2. Scribe workflow başlat
3. README.md commit et

**Beklenen**:
- ✅ Upsert helper: `mode=create` (SHA yok)
- ✅ PUT başarılı (422 yok)
- ✅ Log: `✅ CREATE successful: README.md`

---

### Test 2: Aynı Branch'e İkinci Commit (Update Mode)

**Koşul**: Branch'te README.md zaten var, güncelleme yapılacak

**Adımlar**:
1. Aynı branch'e tekrar Scribe çalıştır
2. README.md tekrar commit et

**Beklenen**:
- ✅ Upsert helper: `mode=update` (SHA dahil edilir)
- ✅ PUT başarılı
- ✅ Log: `✅ UPDATE successful: README.md (sha=xyz1234)`

---

### Test 3: Retry Logic

**Koşul**: GitHub API geçici 422 hatası döndürüyor

**Beklenen**:
- ✅ İlk deneme başarısız (422)
- ✅ 300ms bekle, retry
- ✅ İkinci deneme başarılı
- ✅ Log: `⏳ Retrying in 300ms (status=422)`

---

## 📈 Etki Analizi

### Etkilenen Dosyalar

| Dosya | Satırlar | Değişiklik Türü |
|-------|----------|------------------|
| `src/modules/agents/scribe/server/runner.server.ts` | 22-44, 147-274 | workingBranch wire, upsert integration |
| `src/app/actions/scribe.ts` | 27-40, 86-99 | workingBranch pass-through |
| `src/components/AgentRunPanel.tsx` | 35-46 | workingBranch UI integration |
| **`src/modules/github/upsert.ts`** | 1-243 | **YENİ HELPER** |
| **`src/modules/github/__tests__/upsert.test.ts`** | 1-140 | **YENİ TESTLER** |

### Etkilenmeyen Bileşenler

- ✅ `mcpCreateBranch` (branch creation hâlâ aynı)
- ✅ `mcpOpenPR` (PR logic değişmedi)
- ✅ `TokenProvider` (token resolution aynı)
- ✅ `Actor` system (kimlik doğrulama aynı)

### Breaking Changes

❌ **Yok** - Backward compatible:
- `workingBranch` optional (yoksa auto-generate)
- Mevcut API calls değişmedi
- mcpCommit hâlâ mevcut (deprecated ama çalışır)

---

## ✅ Checklist (Definition of Done)

- [x] `workingBranch` UI → action → runner wired
- [x] `upsertRepoContent` helper created with SHA detection
- [x] `mcpCommit` replaced with `upsertMultipleFiles`
- [x] `waitForRefVisible` implemented (ref visibility wait)
- [x] Detailed logging: actor, branch, path, mode, sha
- [x] Unit tests: create/update/retry paths
- [x] Linter errors: none
- [ ] **Manual test**: End-to-end workflow (Kullanıcı test edecek)

---

## 🚀 Sonraki Adımlar

### 1. Test Workflow

```bash
# Terminal'de dev server çalıştır
cd devagents
npm run dev
```

**UI'da:**
1. Dashboard → AKIS Scribe Agent
2. Repo seç (örn: UniSum-Backend)
3. Branch oluştur: `docs/test-$(date +%Y%m%d)-readme`
4. Scope: "readme"
5. "🚀 Run AKIS Scribe Agent" tıkla

**Terminal Log'larında beklenen:**
```
ℹ️ [ScribeRunner] Using selected branch: docs/test-20251027-readme
ℹ️ [Upsert] File not found on branch ..., mode=create
ℹ️ [Upsert] ✅ CREATE successful: README.md
ℹ️ [ScribeRunner] ✅ 5 dosya commit edildi (5 yeni, 0 güncelleme)
```

### 2. GitHub'da Verify

1. Repo'ya git: https://github.com/OmerYasirOnal/UniSum-Backend
2. Branches → `docs/test-20251027-readme`
3. Commits: "docs(readme): refresh quickstart & env matrix"
4. Author: `akis-scribe-agent[bot]` (App Mode) veya kendi kullanıcın (OAuth Mode)

### 3. Commit & PR

```bash
git add .
git commit -m "fix(scribe): fix commit 422 error, wire workingBranch, add upsert helper"
git push origin <your-branch>
```

**PR Body Template**:
- Problem: 422 "sha wasn't supplied" + branch drift
- Root Cause: 3 issues (branch mismatch, missing SHA, no branch param)
- Solution: workingBranch wiring + upsertRepoContent helper
- Evidence: Before/after logs, grep proofs
- Tests: 4 unit tests (create/update/retry/non-retriable)

---

**Changelog**:
- v1.4: Fixed 422 commit errors, wired workingBranch end-to-end, added upsertRepoContent helper
- v1.3: Fixed "Missing access token" error in GitHub App mode
- v1.2: Fixed Scribe UI gating for App-only mode
- v1.1: Added ActorContext system

**Son Güncelleme**: 2025-10-27  
**Reviewer**: @OmerYasirOnal  
**Status**: ✅ Ready for Testing

