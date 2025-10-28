# 🐛 GitHub Bağlantı Debug Rehberi

## Sorun: "0 integration found, GitHub connected: false"

Bu, localStorage'a integration kaydedilmemiş demek!

## 🔍 Hemen Kontrol Edin

### 1. Browser Console'u Açın (F12)

Şu logları arıyoruz:
```
Profile useEffect: { githubConnected: 'success', user: {...} }
GitHub connection success detected!
Integration data: {...}
Integration added successfully!
```

**Eğer bu logları GÖRMÜYorsanız:**
- Profile'dan Dashboard'a hızlıca geçtiniz
- useEffect çalışmadan sayfa değişti

### 2. localStorage Kontrol

Console'da çalıştırın:
```javascript
// User bilgisi var mı?
JSON.parse(localStorage.getItem('devagents_user'))

// Integrations var mı?
JSON.parse(localStorage.getItem('devagents_integrations_demo-user-1'))
```

**Beklenen:**
```javascript
// User:
{ id: "demo-user-1", email: "demo@devagents.com", ... }

// Integrations:
[{
  userId: "demo-user-1",
  provider: "github",
  connected: true,
  accessToken: "...",
  metadata: { login: "...", avatar_url: "..." }
}]
```

## ✅ Çözüm: Manuel Test

### Adım 1: Profile'da Bekleyin!

```
1. GitHub'da "Authorize" deyin
2. Profile sayfasına döneceksiniz
3. ✅ BURADA 5 SANİYE BEKLEYİN!
4. Console loglarını kontrol edin
5. "Integration added successfully!" görünmeli
6. Sonra Dashboard'a gidin
```

### Adım 2: Console'da Manuel Ekleyin (Test)

```javascript
// Manuel test için:
const testIntegration = {
  userId: "demo-user-1",
  provider: "github",
  connected: true,
  accessToken: "test_token",
  metadata: {
    id: 123,
    login: "testuser",
    name: "Test User",
    avatar_url: "https://github.com/identicons/test.png",
  },
  connectedAt: new Date().toISOString()
};

// localStorage'a kaydet
const integrations = JSON.parse(localStorage.getItem('devagents_integrations_demo-user-1') || '[]');
integrations.push(testIntegration);
localStorage.setItem('devagents_integrations_demo-user-1', JSON.stringify(integrations));

// Sayfayı yenile
location.reload();
```

**Sonra Dashboard'a gidin - Repository'ler görünmeli!**

## 🎯 Gerçek Sorunu Bulalım

Lütfen şunları yapın:

1. **F12 → Console açık tutun**
2. **Profile'a gidin**
3. **"Bağlan" → GitHub Authorize**
4. **Profile'a döndüğünüzde 5 saniye bekleyin**
5. **Console screenshot'u alın**
6. **Paylaşın!**

Bu loglarla sorunu tam tespit edebilirim!
