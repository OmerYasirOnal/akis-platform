# DevAgents - Setup Rehberi

## 1. Environment Variables (.env.local)

Proje kök dizininde `.env.local` dosyası oluşturun:

```bash
# OpenRouter API Key (Ücretsiz: https://openrouter.ai/)
OPENROUTER_API_KEY=your_openrouter_api_key_here

# GitHub OAuth (https://github.com/settings/developers)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Public GitHub Client ID (frontend için)
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id

# Next Auth
NEXTAUTH_SECRET=your_random_secret_key
NEXTAUTH_URL=http://localhost:3000
```

## 2. OpenRouter API Key Alma

1. [OpenRouter](https://openrouter.ai/) sitesine gidin
2. Hesap oluşturun (ücretsiz)
3. Settings > API Keys'den yeni key oluşturun
4. Key'i `.env.local` dosyasına ekleyin

**Ücretsiz Modeller:**
- `google/gemini-flash-1.5` (Önerilen)
- `meta-llama/llama-3.1-8b-instruct:free`
- `mistralai/mistral-7b-instruct:free`

## 3. GitHub OAuth App Oluşturma

1. [GitHub Developer Settings](https://github.com/settings/developers) sayfasına gidin
2. "New OAuth App" butonuna tıklayın
3. Aşağıdaki bilgileri girin:
   - **Application name:** DevAgents Local
   - **Homepage URL:** `http://localhost:3000`
   - **Authorization callback URL:** `http://localhost:3000/api/github/connect`
4. "Register application" butonuna tıklayın
5. Client ID ve Client Secret'ı kopyalayın
6. `.env.local` dosyasına ekleyin

## 4. Projeyi Çalıştırma

```bash
# Dependencies kurulumu (zaten yapıldı)
npm install

# Development server
npm run dev

# Tarayıcıda aç
# http://localhost:3000
```

## 5. Test Etme

### Document Agent Test:
1. `http://localhost:3000/dashboard` sayfasına gidin
2. Sağ tarafta "Document Agent" bölümünü görün
3. Örnek döküman butonlarından birine tıklayın
4. "Özetle", "Analiz Et" veya "Soru Sor" seçin
5. "Agent'ı Çalıştır" butonuna tıklayın

### GitHub Bağlantısı Test:
1. Sol tarafta "GitHub Entegrasyonu" bölümünü görün
2. "GitHub ile Bağlan" butonuna tıklayın
3. GitHub OAuth ekranında yetkilendirin
4. Dashboard'a yönlendirileceksiniz
5. Bağlı kullanıcı bilgileri görünecek

## Sorun Giderme

### "Client ID yapılandırılmamış" Hatası:
- `.env.local` dosyasında `NEXT_PUBLIC_GITHUB_CLIENT_ID` değişkenini kontrol edin
- Dev server'ı yeniden başlatın (`npm run dev`)

### OpenRouter API Hatası:
- `OPENROUTER_API_KEY` değerini kontrol edin
- [OpenRouter Dashboard](https://openrouter.ai/keys) üzerinden key'in aktif olduğundan emin olun
- Ücretsiz modelleri kullandığınızdan emin olun

### Port 3000 Kullanımda:
```bash
# Farklı port kullan
PORT=3001 npm run dev
```

## Özellikler

✅ **Document Agent:**
- Döküman özetleme
- Döküman analizi
- Soru-cevap

✅ **GitHub Integration:**
- OAuth 2.0 ile güvenli bağlantı
- Kullanıcı bilgilerini görüntüleme
- Repository erişimi (gelecek özellik)

✅ **Modern UI:**
- Next.js 15 App Router
- Tailwind CSS
- Responsive tasarım
- Dark mode (varsayılan)

## Sonraki Adımlar

1. **GitHub Repository Listesi:** Bağlı hesabın repo'larını listele
2. **Issue Oluşturma:** AI ile otomatik issue oluştur
3. **README Analizi:** Repo README'lerini analiz et
4. **Workflow Builder:** Multi-agent workflow'lar oluştur
5. **Jira & Confluence:** Yeni entegrasyonlar ekle

