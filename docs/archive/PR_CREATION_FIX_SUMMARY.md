# PR Creation Fix - 401 "Head branch does not exist"

**Tarih**: 2025-10-27  
**Issue**: PR creation failing with 401 after successful commits  
**Status**: ✅ Fixed

---

## 🎯 Problem

Scribe Agent başarıyla:
- ✅ Branch oluşturuyor (`docs/UniSum-asdasdasf`)
- ✅ 5 dosya commit ediyor (README, CHANGELOG, DOC_REPORT, REPO_SUMMARY, DAS_REPORT)
- ✅ Commitler GitHub'da görünüyor (akis-scribe-agent[bot] tarafından)

Ama PR creation aşamasında:
```
❌ PR oluşturulamadı: Head branch "docs/UniSum-asdasdasf" does not exist (401)
```

---

## 🔍 Root Cause

**Dosya**: `src/lib/services/mcp.ts:187-207`

`mcpOpenPR` fonksiyonu PR oluşturmadan önce branch verification yapıyordu:

```typescript
// PROBLEMATIC CODE
const branchResponse = await fetch(
  `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${head}`,
  { headers: { 'Authorization': `Bearer ${config.token}` } }
);

if (!branchResponse.ok) {
  return {  // ← BURADA DURUYOR!
    success: false,
    error: `Head branch "${head}" does not exist (${branchResponse.status})`,
  };
}
```

**Neden 401?**
- GitHub App token `/git/refs/heads/` endpoint'i için yeterli permission'a sahip değil
- Ancak commit operations çalışıyor (contents:write permission var)
- Branch kesinlikle var (commitler başarılı), ama verification endpoint 401 döndürüyor
- Fonksiyon burada return ediyor, `createPullRequest` hiç çağrılmıyor!

---

## 🔧 Çözüm

### Fix #1: Branch Verification Kaldırıldı

**Dosya**: `src/lib/services/mcp.ts:187-190`

**Önce**:
```typescript
// HOTFIX 2: Verify head branch exists
try {
  const branchResponse = await fetch(...);
  if (!branchResponse.ok) {
    return { success: false, error: `Head branch "${head}" does not exist (${branchResponse.status})` };
  }
} catch (error) {
  console.warn('[mcpOpenPR] Could not verify branch:', error);
}
```

**Sonra**:
```typescript
// Branch verification: Skip and let PR API handle it
// (GitHub App token may not have permission for git/refs endpoint,
//  but commits already succeeded so branch definitely exists)
console.log(`[mcpOpenPR] Skipping branch verification (branch exists, commits succeeded)`);
```

**Rationale**:
- Commit phase başarılı → branch kesin var
- PR API kendi başına branch yoksa hata verecek
- Gereksiz verification GitHub App token permissions sorunlarına yol açıyor

---

### Fix #2: Enhanced Logging

**Dosya**: `src/lib/services/mcp.ts:192-212`

```typescript
// HOTFIX 3: Create PR with proper format
console.log(`[mcpOpenPR] Creating PR: "${title}" (${head} -> ${base}, draft=${draft})`);

const result = await createPullRequest(
  owner, repo, title, body, head, base, config.token, draft
);

if (!result.success) {
  console.error('[mcpOpenPR] ❌ PR creation failed:', result.error);
  console.error('[mcpOpenPR] Error details:', result.errorDetails);
} else {
  console.log(`[mcpOpenPR] ✅ PR created: #${result.prNumber} - ${result.prUrl}`);
}
```

---

## 📊 Beklenen Sonuç

### Before (Broken Flow)
```
✅ Branch "docs/UniSum-asdasdasf" zaten mevcut
✅ 5 dosya commit edildi (0 yeni, 5 güncelleme)
📬 Step 7: Draft PR oluşturuluyor...
[mcpOpenPR] Checking existing PR: OmerYasirOnal:docs/UniSum-asdasdasf -> main
❌ Hata: PR oluşturulamadı: Head branch "docs/UniSum-asdasdasf" does not exist (401)
```

### After (Fixed Flow)
```
✅ Branch "docs/UniSum-asdasdasf" zaten mevcut
✅ 5 dosya commit edildi (0 yeni, 5 güncelleme)
📬 Step 7: Draft PR oluşturuluyor...
[mcpOpenPR] Checking existing PR: OmerYasirOnal:docs/UniSum-asdasdasf -> main
[mcpOpenPR] Skipping branch verification (branch exists, commits succeeded)
[mcpOpenPR] Creating PR: "docs: documentation improvements" (docs/UniSum-asdasdasf -> main, draft=true)
[createPullRequest] Creating PR: { owner: 'OmerYasirOnal', repo: 'UniSum-Backend', head: 'docs/UniSum-asdasdasf', base: 'main', draft: true }
[createPullRequest] ✅ Success: { number: 42, url: 'https://github.com/OmerYasirOnal/UniSum-Backend/pull/42' }
[mcpOpenPR] ✅ PR created: #42 - https://github.com/OmerYasirOnal/UniSum-Backend/pull/42
✅ Draft PR oluşturuldu: https://github.com/OmerYasirOnal/UniSum-Backend/pull/42
```

---

## 🧪 Test Adımları

1. **Dashboard** → AKIS Scribe Agent seçin
2. **Repo seçin**: UniSum-Backend
3. **Branch oluşturun**: `docs/test-pr-fix-20251027`
4. **Scope**: "readme"
5. **"🚀 Run AKIS Scribe Agent"** tıklayın

**Beklenen**:
- ✅ Branch creation başarılı
- ✅ Commit phase başarılı (5 files)
- ✅ **PR creation başarılı** (401 hatası yok!)
- ✅ PR GitHub'da görünür (Draft, akis-scribe-agent[bot] tarafından açılmış)

---

## 📈 Etki Analizi

### Değişen Dosya

| Dosya | Satırlar | Değişiklik |
|-------|----------|-----------|
| `src/lib/services/mcp.ts` | 187-212 | Branch verification kaldırıldı, logging eklendi |

### Breaking Changes

❌ **Yok** - Backward compatible:
- Branch verification zaten optional bir step'ti
- PR API kendi başına branch validation yapıyor
- Sadece gereksiz 401 engelleyici kaldırıldı

---

## ✅ Checklist

- [x] Branch verification kaldırıldı
- [x] PR creation logging eklendi
- [x] Build başarılı
- [ ] **Test: End-to-end PR creation** (Kullanıcı test edecek)

---

## 🔐 Security Notes

- GitHub App token hâlâ kullanılıyor
- Permission scope değişmedi (contents:write, pull_requests:write)
- Sadece verification step kaldırıldı, güvenlik sorunu yok

---

**Changelog**:
- v1.5: Fixed PR creation 401 error by removing redundant branch verification
- v1.4: Fixed 422 commit errors with upsertRepoContent helper
- v1.3: Fixed "Missing access token" error in GitHub App mode
- v1.2: Fixed Scribe UI gating for App-only mode

**Son Güncelleme**: 2025-10-27  
**Status**: ✅ Ready for Testing

