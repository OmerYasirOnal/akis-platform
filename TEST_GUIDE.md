# 🧪 DevAgents Test Rehberi

## ✅ Kurulum Tamamlandı!

OpenRouter API key'iniz eklendi ve ücretsiz modeller yapılandırıldı.

---

## 🚀 Test Etme Adımları

### 1. **Tarayıcınızı Açın**
```
http://localhost:3000
```

### 2. **Login Olun**

Ana sayfada "Giriş Yap" butonuna tıklayın.

**Demo Hesap:**
```
Email: demo@devagents.com
Password: demo123
```

Veya "Kayıt Ol" ile yeni hesap oluşturun!

### 3. **Dashboard'a Gidin**

Login olduktan sonra otomatik olarak Dashboard'a yönlendirileceksiniz.

---

## 🤖 Document Agent Test

Dashboard'da sağ tarafta **"Document Agent"** bölümünü göreceksiniz.

### Test Senaryoları:

#### 📝 Senaryo 1: Özetleme
1. **Model seçin** (dropdown'dan):
   - `GEMINI_2_FLASH` (Önerilen - En hızlı)
   - `LLAMA_3_3_70B` (En güçlü)
   - `MISTRAL_7B` (Dengeli)

2. **"Örnek README"** butonuna tıklayın

3. **"Özetle"** modunu seçin

4. **"Agent'ı Çalıştır"** butonuna tıklayın

5. ✨ **Sonuç:** AI dökümanı özetleyecek

#### 🔍 Senaryo 2: Analiz
1. **"Örnek README"** butonuna tıklayın

2. **"Analiz Et"** modunu seçin

3. **"Agent'ı Çalıştır"**

4. ✨ **Sonuç:** Detaylı analiz göreceksiniz:
   - Ana konular
   - Önemli noktalar
   - Eksikler
   - Öneriler

#### 💬 Senaryo 3: Soru-Cevap
1. **"Örnek README"** butonuna tıklayın

2. **"Soru Sor"** modunu seçin

3. **Soru girin:**
   ```
   Bu projenin özellikleri nelerdir?
   ```

4. **"Agent'ı Çalıştır"**

5. ✨ **Sonuç:** Döküman içeriğine göre yanıt

#### 🧪 Senaryo 4: Kendi Dökümanınız
1. Herhangi bir metin yapıştırın:
   - README.md
   - Kod parçası
   - Teknik döküman
   - Blog yazısı

2. İstediğiniz modu seçin

3. Agent'ı çalıştırın

---

## 🔗 GitHub Entegrasyonu Test

### Profil Sayfasına Gidin

Dashboard'da sağ üstte **"👤 Profil"** butonuna tıklayın.

### Entegrasyonlar Bölümü

**GitHub** kartını göreceksiniz.

#### ⚠️ Not: GitHub OAuth Setup Gerekli

GitHub entegrasyonunu test etmek için önce OAuth App oluşturmalısınız:

1. **GitHub Developer Settings:**
   https://github.com/settings/developers

2. **"New OAuth App" oluştur:**
   - Application name: `DevAgents Local`
   - Homepage URL: `http://localhost:3000`
   - Callback URL: `http://localhost:3000/api/integrations/github/callback`

3. **Client ID ve Secret'ı alın**

4. **`.env.local` dosyasını güncelleyin:**
   ```bash
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   ```

5. **Server'ı yeniden başlatın:**
   ```bash
   # Terminal'de Ctrl+C ile durdurun
   npm run dev
   ```

6. **Profil sayfasından "Bağlan" butonuna tıklayın**

---

## 📊 Agent Playbook Bilgileri

Dashboard'da en üstte **Agent Playbook Viewer** var.

Buradan görebilirsiniz:
- ⚡ Agent'ın **5 yeteneği**
- 📋 **6 kuralı**
- 🎯 Davranış özellikleri

Bu, agent'ın nasıl çalıştığını anlamanıza yardımcı olur.

---

## 🎯 Yapılandırılmış Modeller

### 1. Google Gemini 2.0 Flash (Önerilen)
- **Model ID:** `google/gemini-2.0-flash-exp:free`
- **Özellikleri:**
  - ⚡ Çok hızlı
  - 🌍 Türkçe desteği mükemmel
  - 💪 Güçlü analiz
  - 🆓 Ücretsiz

### 2. Meta Llama 3.3 70B
- **Model ID:** `meta-llama/llama-3.3-70b-instruct:free`
- **Özellikleri:**
  - 🧠 70 milyar parametre (en güçlü)
  - 📚 Detaylı analiz
  - 🔍 Derin anlama
  - 🆓 Ücretsiz

### 3. Mistral 7B
- **Model ID:** `mistralai/mistral-7b-instruct:free`
- **Özellikleri:**
  - ⚖️ Dengeli performans
  - 💨 Hızlı
  - 🎯 Güvenilir
  - 🆓 Ücretsiz

---

## 🔍 Beklenen Sonuçlar

### ✅ Başarılı Test
- Agent hızlıca yanıt veriyor
- Türkçe yanıtlar geliyor
- Sonuçlar yapılandırılmış (başlıklar, listeler)
- Döküman kurallarına uygun

### ❌ Olası Hatalar

#### "API Key yapılandırılmamış"
**Çözüm:** `.env.local` dosyasını kontrol edin, server'ı restart edin.

#### "Agent işlemi başarısız"
**Çözüm:** 
- Model seçimini kontrol edin
- OpenRouter dashboard'unu kontrol edin: https://openrouter.ai/
- API key'in aktif olduğundan emin olun

#### "Geçersiz email veya şifre"
**Çözüm:** Demo credentials kullanın:
```
Email: demo@devagents.com
Password: demo123
```

---

## 📈 Test Checklist

- [ ] Ana sayfayı açtım (`http://localhost:3000`)
- [ ] Login yaptım (demo hesap veya yeni kayıt)
- [ ] Dashboard'a girdim
- [ ] Agent Playbook Viewer'ı gördüm
- [ ] Model selector'dan model seçtim
- [ ] Örnek döküman ile test ettim
- [ ] "Özetle" modunu denedim
- [ ] "Analiz Et" modunu denedim
- [ ] "Soru Sor" modunu denedim
- [ ] Kendi dökümanımı test ettim
- [ ] Profil sayfasını görüntüledim
- [ ] Çıkış yapma özelliğini test ettim

---

## 💡 İpuçları

### Model Seçimi
- **Hızlı test için:** `GEMINI_2_FLASH`
- **Detaylı analiz için:** `LLAMA_3_3_70B`
- **Genel kullanım:** `GEMINI_2_FLASH` (varsayılan)

### Döküman Boyutu
- Maksimum ~50KB döküman destekleniyor
- Çok uzun dökümanlar için bölümlere ayırın

### Soru-Cevap Modu
- Spesifik sorular sorun
- Döküman içeriğine dayalı sorular en iyi sonucu verir

---

## 🎓 Sonraki Adımlar

Test ettikten sonra:

1. ✅ **GitHub Entegrasyonu Ekle**
   - OAuth setup yapın
   - Repository'leri listeleyin

2. ✅ **Yeni Agent Ekle**
   - QA Agent (test oluşturma)
   - Code Review Agent (kod analizi)

3. ✅ **Workflow Builder**
   - Multi-agent orchestration
   - Otomatik iş akışları

4. ✅ **Database Entegrasyonu**
   - Supabase/Prisma ekleyin
   - User data persist edin

---

## 📞 Yardım

Sorun yaşarsanız:
1. Terminal'deki error loglarını kontrol edin
2. Browser console'u açın (F12)
3. `.env.local` dosyasını kontrol edin
4. Server'ı restart edin

---

## ✨ Başarılı Test Örneği

```
1. http://localhost:3000 açıldı ✓
2. "Giriş Yap" tıklandı ✓
3. Demo credentials ile login olundu ✓
4. Dashboard göründü ✓
5. "GEMINI_2_FLASH" modeli seçildi ✓
6. "Örnek README" yüklendi ✓
7. "Analiz Et" seçildi ✓
8. "Agent'ı Çalıştır" tıklandı ✓
9. 3 saniye içinde yanıt geldi ✓
10. Sonuç yapılandırılmış ve Türkçe ✓

✅ TEST BAŞARILI!
```

---

**Hadi test edelim! 🚀**

Herhangi bir sorun olursa söyleyin, hemen düzeltelim! 💪

