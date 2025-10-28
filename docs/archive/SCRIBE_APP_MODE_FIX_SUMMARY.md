# Scribe Agent - GitHub App Mode Token Fix

**Tarih**: 2025-10-27  
**Versiyon**: 1.3 (App Mode Token Fix)  
**Durum**: ✅ Tamamlandı

---

## 🎯 Problem

Branch creation başarılı oluyor ama Scribe Agent workflow başlatılırken:
```
❌ [ScribeAction] Missing access token
```
hatası alınıyordu.

**Root Cause**: `src/app/actions/scribe.ts` içinde `accessToken` zorunlu kontrol yapılıyordu. GitHub App Mode'da UI tarafından OAuth token gönderilmediği için workflow başlamıyordu.

---

## 🔧 Çözüm

### 1. **scribe.ts** - Token Zorlamasını Kaldırdık

**Dosya**: `src/app/actions/scribe.ts`

#### Değişiklik 1: Zorunlu accessToken kontrolü kaldırıldı
**Satır 65-76** (Önce):
```typescript
if (!input.accessToken) {
  logger.error('ScribeAction', `[${requestId}] Missing access token`);
  return {
    success: false,
    errors: ['Access token is required'],
  };
}
```

**Sonra**: Kontrol tamamen kaldırıldı. `resolveActorOrFallback` zaten GitHub App token'ı sağlayacak.

#### Değişiklik 2: RunScribeActionInput interface güncellendi
**Satır 31** (Önce):
```typescript
accessToken: string;
```

**Sonra**:
```typescript
accessToken?: string; // Optional - GitHub App token will be used if not provided
```

#### Değişiklik 3: Runner input token handling
**Satır 90**:
```typescript
accessToken: input.accessToken || '', // Use OAuth token if provided, otherwise empty
```

---

### 2. **AgentRunPanel.tsx** - UI Props Optional Yapıldı

**Dosya**: `src/components/AgentRunPanel.tsx`

#### Değişiklik 1: Interface güncellendi
**Satır 11** (Önce):
```typescript
accessToken: string;
```

**Sonra**:
```typescript
accessToken?: string; // Optional - GitHub App token will be used if not provided
```

#### Değişiklik 2: Conditional token gönderme
**Satır 39**:
```typescript
const input: RunScribeActionInput = {
  repo: `${repoOwner}/${repoName}`,
  branch: baseBranch,
  scope,
  ...(accessToken && { accessToken }), // Only include if provided (OAuth mode)
  dryRun: false,
  options: {
    skipValidation: false,
    autoMergeDAS: 80,
  },
};
```

---

## 📋 Kanıt (Evidence)

### Before (Hatanın Logları)
```
ℹ️ [2025-10-27T18:38:24.597Z] [ScribeAction] [scribe-1761590304597-wp1xr] Starting Scribe workflow for OmerYasirOnal/UniSum-Backend
❌ [2025-10-27T18:38:24.597Z] [ScribeAction] [scribe-1761590304597-wp1xr] Missing access token
```

### After (Beklenen Sonuç)
```
ℹ️ [ScribeAction] Starting Scribe workflow for OmerYasirOnal/UniSum-Backend
ℹ️ [Actor] Resolving actor...
ℹ️ [Actor] ✅ Using app_bot (AKIS Scribe App, installation: 91847917)
ℹ️ [ScribeRunner] Starting workflow...
✅ [ScribeRunner] Workflow completed successfully
```

---

## 🧪 Test Senaryoları

### Test 1: GitHub App Mode (No OAuth)
**Koşul**: OAuth bağlantısı yok, GitHub App yüklü

**Adımlar**:
1. Dashboard → AKIS Scribe Agent seç
2. Repo seç (RepoPicker App token ile çalışır)
3. Branch oluştur (✅ Zaten çalışıyor)
4. Scope seç (örn: "readme")
5. "🚀 Run AKIS Scribe Agent" butonuna tıkla

**Beklenen**:
- ✅ "Access token is required" hatası alınmaz
- ✅ Workflow başlar, repo analiz edilir
- ✅ Dokümanlar oluşturulur
- ✅ Commit GitHub App bot kimliği ile yapılır
- ✅ PR GitHub App bot tarafından açılır

---

### Test 2: OAuth Mode (User Token)
**Koşul**: OAuth bağlantısı var

**Adımlar**:
1. Profile → GitHub Connect
2. Dashboard → AKIS Scribe Agent seç
3. Repo seç
4. Branch oluştur
5. Workflow başlat

**Beklenen**:
- ✅ Workflow OAuth user token ile çalışır
- ✅ Commitler OAuth user kimliği ile yapılır

---

## 🔐 Güvenlik Kontrolleri

✅ Token hiçbir zaman loglanmıyor  
✅ Actor resolution varolan güvenlik katmanlarını kullanıyor  
✅ GitHub App token cache mekanizması korundu  
✅ Installation ID env var'dan okunuyor  

---

## 📊 Etki Analizi

### Etkilenen Dosyalar
| Dosya | Satır | Değişiklik Türü |
|-------|-------|------------------|
| `src/app/actions/scribe.ts` | 31, 65-76, 90 | Token kontrolü kaldırıldı, optional yapıldı |
| `src/components/AgentRunPanel.tsx` | 11, 39 | Props optional, conditional gönderim |

### Etkilenmeyen Bileşenler
- ✅ `TokenProvider` (zaten App-aware)
- ✅ `GitHubClient` (token resolution değişmedi)
- ✅ `resolveActorOrFallback` (mevcut actor sistemi)
- ✅ Branch creation flow (zaten çalışıyor)
- ✅ Repo listing (zaten App token kullanıyor)

### Breaking Changes
❌ Yok - Backward compatible
- OAuth varsa: OAuth token kullanılır (öncelik değişmedi)
- OAuth yoksa: GitHub App token kullanılır (yeni davranış)

---

## ✅ Checklist (Definition of Done)

- [x] `accessToken` kontrolü kaldırıldı
- [x] `RunScribeActionInput.accessToken` optional yapıldı
- [x] `AgentRunPanel` props optional yapıldı
- [x] Linter hataları yok
- [x] Kanıt/log referansları eklendi
- [ ] **Test: GitHub App Mode'da workflow çalıştırıldı** (Kullanıcı test edecek)

---

## 🚀 Sonraki Adımlar

1. **Kullanıcı Testi**: UI'dan workflow başlatıp log'ları kontrol et
2. **Commit Message**: `fix(scribe): make accessToken optional for GitHub App mode`
3. **PR Description**: Bu dökümanı PR body'e ekle

---

**Changelog**:
- v1.3: Fixed "Missing access token" error in GitHub App mode for Scribe workflow
- v1.2: Fixed Scribe UI gating to allow App-only mode
- v1.1: Added ActorContext system, diagnostics endpoint

**Son Güncelleme**: 2025-10-27  
**Reviewer**: @OmerYasirOnal  
**Status**: ✅ Ready for Testing

