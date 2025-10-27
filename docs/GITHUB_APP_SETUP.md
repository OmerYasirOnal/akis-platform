# GitHub App Kurulum Kılavuzu

AKIS Platform için GitHub App kurulumu ve gerekli izinler.

---

## 📋 Genel Bakış

AKIS, GitHub repository'lerinize erişmek ve dokümantasyon güncellemeleri oluşturmak için **GitHub App** kullanır. Bu, Personal Access Token (PAT) alternatifine göre daha güvenli ve yönetilebilir bir yöntemdir.

### Avantajlar

✅ **Güvenlik**: Token'lar server-side'da saklanır, client'a asla expose edilmez  
✅ **Fine-grained Permissions**: Sadece gerekli izinler verilir  
✅ **Otomatik Yenileme**: Installation token'ları otomatik olarak yenilenir  
✅ **Repository-level Control**: App'i sadece istediğiniz repo'lara kurabilirsiniz  
✅ **Audit Trail**: Tüm işlemler GitHub audit log'larında görünür

---

## 🔑 Gerekli İzinler

AKIS GitHub App'inin çalışması için **minimum gerekli izinler** (Least Privilege ilkesi):

| İzin | Seviye | Neden Gerekli | Durum |
|------|--------|---------------|-------|
| **Metadata** | Read | Repository bilgilerini okumak için (isim, branch, dil) | ✅ Zorunlu |
| **Contents** | Read & Write | Dosya içeriğini okumak ve dokümantasyon dosyalarını yazmak için | ✅ Zorunlu |
| **Pull Requests** | Read & Write | Draft PR oluşturmak ve etiketlemek için | ✅ Zorunlu |

### İsteğe Bağlı İzinler

| İzin | Seviye | Neden Yararlı | Durum |
|------|--------|---------------|-------|
| **Issues** | Read & Write | Dokümantasyon görevleri için issue oluşturmak (gelecek özellik) | ⚪ İsteğe Bağlı |
| **Workflows** | Read & Write | CI/CD entegrasyonu için (gelecek özellik) | ⚪ İsteğe Bağlı |

> **💡 İpucu**: AKIS Dashboard → Integrations bölümünden mevcut izinlerinizi kontrol edebilir ve eksik olanları görebilirsiniz. `/api/github/app/diagnostics` endpoint'i ile de izinlerinizi programatik olarak sorgulayabilirsiniz.

---

## 🚀 Kurulum Adımları

### 1. GitHub App Oluşturma

1. GitHub hesabınıza gidin
2. **Settings** → **Developer settings** → **GitHub Apps** → **New GitHub App**

3. **Temel Bilgiler**:
   - **GitHub App name**: `AKIS Scribe Agent` (veya istediğiniz bir isim)
   - **Homepage URL**: `https://your-akis-instance.com` (AKIS deploy URL'iniz)
   - **Webhook**: Disable (şimdilik gerekli değil)

4. **İzinler** (Permissions):
   - Repository permissions:
     - **Metadata**: `Read-only`
     - **Contents**: `Read and write`
     - **Pull requests**: `Read and write`

5. **Where can this GitHub App be installed?**
   - Seçin: `Any account` (veya `Only on this account` sadece kişisel kullanım için)

6. **Create GitHub App** butonuna tıklayın

### 2. Private Key Oluşturma

1. Oluşturduğunuz App sayfasında, aşağı kaydırın
2. **Private keys** bölümünde **Generate a private key** butonuna tıklayın
3. `.pem` dosyası indirilecek — bu dosyayı **güvenli bir yerde saklayın**

### 3. Installation ID Alma

1. App sayfasında sol tarafta **Install App** sekmesine tıklayın
2. Hesabınıza kurulum yapın (**Install**)
3. Hangi repository'lere erişim istediğinizi seçin:
   - **All repositories** (tüm repo'lara erişim)
   - **Only select repositories** (sadece seçtiğiniz repo'lara)
4. **Install** butonuna tıklayın
5. Yönlendirilen URL'e dikkat edin:
   ```
   https://github.com/settings/installations/12345678
   ```
   Buradaki `12345678` sizin **Installation ID**'niz

### 4. Ortam Değişkenlerini Ayarlama

AKIS projenizde `.env.local` dosyasını oluşturun/güncelleyin:

```bash
# GitHub App Configuration
GITHUB_APP_ID=123456                          # App ID (App settings sayfasında)
GITHUB_APP_INSTALLATION_ID=12345678           # Yukarıda aldığınız Installation ID
GITHUB_APP_PRIVATE_KEY_PEM="-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
...your full private key content...
-----END RSA PRIVATE KEY-----"

# İsteğe Bağlı (temiz URL için)
GITHUB_APP_SLUG=akis-scribe-agent             # App slug (App URL'inden: github.com/apps/{slug})
GITHUB_APP_NAME="AKIS Scribe Agent"           # App adı (UI'da gösterilir)
```

#### 🔐 Private Key Formatı

**Önemli**: `.pem` dosyasının içeriğini **tek satıra** çevirmeden, **olduğu gibi** (çok satırlı) `.env.local`'e yapıştırın:

```bash
GITHUB_APP_PRIVATE_KEY_PEM="-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEAy8Dbv8prpJ/0kKhlGeJYozo2t60EG8L0561g13R29LvMR5hy
vGZlGJpmn65+A4xHXInJYiPuKzrKUnApeLZ+vw1HocOAZtWK0z3r26uA8kQYOKX9
...
-----END RSA PRIVATE KEY-----"
```

### 5. Doğrulama

AKIS dashboard'unuza gidin:

1. **Profile** veya **Integrations** bölümünü açın
2. GitHub entegrasyonu **"GitHub App Mode • Active"** badge'i ile gözükmelidir
3. **Required Permissions** accordion'unu açarak izin durumunuzu kontrol edin:
   - ✅ Yeşil tick: İzin doğru şekilde verilmiş
   - ❌ Kırmızı X: İzin eksik veya yetersiz
4. Eksik izin varsa **"Fix Permissions"** CTA butonuna tıklayarak GitHub installation sayfasına gidin
5. **"Manage Installation"** butonu ile ek repository'ler ekleyebilir veya izinleri güncelleyebilirsiniz

#### Diagnostics API
Programatik kontrol için:
```bash
curl http://localhost:3000/api/github/app/diagnostics
```

Yanıt:
```json
{
  "installed": true,
  "appSlug": "akis-scribe",
  "installationId": 12345,
  "account": {
    "type": "User",
    "login": "your-username"
  },
  "htmlUrl": "https://github.com/settings/installations/12345",
  "repositorySelection": "all",
  "tokenPermissions": {
    "metadata": "read",
    "contents": "write",
    "pull_requests": "write"
  },
  "requiredPermissions": {
    "metadata": "read",
    "contents": "write",
    "pull_requests": "write"
  },
  "missing": []
}
```

---

## 🛠️ Sorun Giderme

### ❌ "GitHub App not configured"

**Sebep**: Ortam değişkenleri eksik veya yanlış formatlanmış

**Çözüm**:
1. `.env.local` dosyasının proje root'unda olduğundan emin olun
2. `GITHUB_APP_ID`, `GITHUB_APP_INSTALLATION_ID`, `GITHUB_APP_PRIVATE_KEY_PEM` değişkenlerinin tümünün tanımlı olduğunu kontrol edin
3. Private key'in **çift tırnaklar içinde** ve **çok satırlı** olduğundan emin olun
4. Dev server'ı yeniden başlatın: `npm run dev`

### ❌ "403 Resource not accessible by integration"

**Sebep**: App'in gerekli izinleri yok veya repo'ya kurulmamış

**Çözüm**:
1. GitHub → Settings → Installations → AKIS App → **Configure**
2. **Repository access** bölümünden ilgili repo'yu ekleyin
3. **Permissions** sekmesinden gerekli izinlerin verildiğini kontrol edin:
   - Metadata: `Read`
   - Contents: `Read & write`
   - Pull requests: `Read & write`
4. Değişiklik yaptıysanız **Save** deyin ve kullanıcı onayı verin

### ❌ "Invalid JWT" veya "Bad credentials"

**Sebep**: Private key hatalı veya bozuk

**Çözüm**:
1. GitHub App sayfasında yeni bir private key generate edin
2. Yeni key'i `.env.local`'e kopyalayın
3. Eski key'i GitHub'dan revoke edin (güvenlik için)
4. Server'ı restart edin

### ❌ Repo listesi boş

**Sebep**: App henüz hiçbir repo'ya kurulmamış

**Çözüm**:
1. AKIS UI'da **"GitHub App Kur"** butonuna tıklayın
2. Veya doğrudan: `https://github.com/apps/{your-app-slug}/installations/new`
3. Hangi repo'lara erişim vereceğinizi seçin ve **Install** deyin

---

## 📊 İzin Matrisi

Hangi işlem için hangi izinler gerekir:

| İşlem | Metadata | Contents | Pull Requests |
|-------|----------|----------|---------------|
| Repo listesini görme | ✅ | - | - |
| Dosya okuma (README, package.json) | ✅ | ✅ Read | - |
| Dokümantasyon güncelleme | ✅ | ✅ Write | - |
| Branch oluşturma | ✅ | ✅ Write | - |
| Draft PR oluşturma | ✅ | ✅ Write | ✅ Write |
| PR'ye etiket ekleme | ✅ | - | ✅ Write |

---

## 🤖 ActorContext Sistemi

AKIS Scribe Agent, **ActorContext** sistemi ile hem OAuth user hem de GitHub App bot kimliği altında çalışabilir:

### Actor Modes
1. **oauth_user** (Priority 1): Kullanıcı OAuth ile bağlandıysa
2. **app_bot** (Priority 2): GitHub App kuruluysa ve OAuth user yoksa (fallback)
3. **service_account**: Gelecek özellik (API anahtarları için)

### Headless Operation
Scribe Agent artık **OAuth user olmadan** sadece GitHub App ile çalışabilir:
- ✅ Commit'ler "AKIS Scribe Agent <akis-scribe[bot]@users.noreply.github.com>" imzası ile atılır
- ✅ Log'larda `actor=app_bot installation=12345` görünür
- ✅ UI'da "🤖 Running as AKIS App bot" banner'ı gösterilir
- ✅ Scribe UI OAuth bağlantısı olmadan çalışır (App Mode gating)
- ✅ RepoPicker otomatik olarak App token ile repo listesini çeker
- ✅ Branch oluşturma ve PR açma işlemleri App bot kimliği ile yapılır

### Feature Flag: App-Bot Fallback
```bash
# .env.local
SCRIBE_ALLOW_APP_BOT_FALLBACK=true  # Default: true (enabled)
```

Bu flag'i `false` yaparak eski davranışa (OAuth-only) dönebilirsiniz:
```bash
SCRIBE_ALLOW_APP_BOT_FALLBACK=false
```

---

## 🔄 OAuth Fallback (Development Only)

Geliştirme ortamında GitHub App kurmak istemiyorsanız, **OAuth fallback** kullanabilirsiniz:

```bash
# .env.local
ALLOW_OAUTH_FALLBACK=true
```

**Uyarı**: Bu mod production'da **disabled**'dır. GitHub App kullanımı önerilir.

---

## 🔗 Yararlı Linkler

- [GitHub Apps Dokümantasyonu](https://docs.github.com/en/apps)
- [Creating a GitHub App](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/registering-a-github-app)
- [Authenticating with GitHub Apps](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app)
- [AKIS Platform Repository](https://github.com/your-org/akis)

---

## 🆘 Destek

Sorun mu yaşıyorsunuz?

1. **Logs**: Server console'da detaylı error log'larını kontrol edin
   - `[TokenProvider]` log'larında actor bilgisi görünür: `actor=app_bot installation=12345`
   - `[ScribeRunner]` log'larında actor mode ve banner mesajları görünür
2. **Diagnostics**: `/api/github/app/diagnostics` endpoint'ini çağırarak durumu kontrol edin
   - İzin eksiklikleri `missing` array'inde listelenir
   - `htmlUrl` doğru installation manage sayfasını gösterir
3. **Issues**: [GitHub Issues](https://github.com/your-org/akis/issues) üzerinden bildirim yapın

---

**Son Güncelleme**: 2025-10-27  
**Versiyon**: 1.2 (Scribe UI Gating Fix)  
**Durum**: ✅ Production Ready  
**Changelog**: 
- v1.2: Fixed Scribe UI gating to allow App-only mode (no OAuth required)
- v1.1: Added ActorContext system, diagnostics endpoint, permissions validation

