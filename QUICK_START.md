# 🚀 DevAgents - Hızlı Başlangıç

## ✅ Proje Durumu
- ✅ Next.js kuruldu ve çalışıyor
- ✅ OpenRouter API key yapılandırıldı
- ✅ 3 ücretsiz model eklendi
- ✅ Document Agent hazır
- ✅ Auth sistemi çalışıyor
- ✅ GitHub OAuth yapılandırıldı

## 🎯 Şu Anda Ne Yapabilirsiniz?

### 1. Document Agent Test
```
1. http://localhost:3000 → Giriş Yap
2. demo@devagents.com / demo123
3. Dashboard → Model seçin (LLAMA_3_3_70B önerilen)
4. "Örnek README" yükleyin
5. "Analiz Et" → "Agent'ı Çalıştır"
✅ AI analiz sonucunu görün!
```

### 2. GitHub Entegrasyonu
```
1. Profil sayfasına gidin
2. "GitHub'ı Bağla" butonuna basın
3. GitHub'da yetkilendirin
4. ✅ "GitHub hesabınız başarıyla bağlandı!" mesajını görün
5. Bağlı durumda göreceksiniz
```

## ⚠️ Bilinen Sorunlar

### Gemini 2.0 Flash Rate Limit
- **Sorun:** Google/Gemini 2.0 Flash modeli geçici olarak rate limit'te
- **Çözüm:** Dashboard'da model dropdown'ından **LLAMA_3_3_70B** veya **MISTRAL_7B** seçin
- **Ne zaman düzelir:** Birkaç dakika içinde

### GitHub Bağlantısı Görünmüyor
- **Düzeltildi!** ✅
- Artık GitHub'ı bağladığınızda yeşil success mesajı görüyorsunuz
- Profil sayfasında "✓ Bağlı" durumunu görüyorsunuz

## 📊 Test Checklist

- [ ] Login yaptım (demo hesap)
- [ ] Dashboard'a girdim
- [ ] Model selector'dan LLAMA_3_3_70B seçtim
- [ ] Örnek döküman yükledim
- [ ] Agent'ı çalıştırdım
- [ ] Sonucu gördüm ✨
- [ ] Profil sayfasına gittim
- [ ] GitHub'ı bağladım
- [ ] Success mesajını gördüm 🎉
- [ ] Bağlı durumu gördüm ✓

## 🎓 Sonraki Adımlar

1. **Farklı modelleri deneyin**
   - LLAMA_3_3_70B (en güçlü)
   - MISTRAL_7B (hızlı)
   - GEMINI_2_FLASH (rate limit düzeldiğinde)

2. **3 modu test edin**
   - Özetle
   - Analiz Et
   - Soru Sor

3. **Kendi dökümanlarınızı test edin**
   - README.md
   - Kod dosyaları
   - Teknik dökümanlar

## 💡 İpuçları

- **Agent çalışmıyorsa:** Model değiştirin (LLAMA_3_3_70B)
- **GitHub bağlanamazsa:** OAuth App'i oluşturdunuz mu?
- **Sonuç yavaşsa:** Normal, AI işliyor (3-10 saniye)

## 🆘 Sorun mu var?

1. **Terminal'i kontrol edin** (hata logları)
2. **Browser console'u açın** (F12)
3. **Server'ı restart edin** (Ctrl+C → npm run dev)

---

**Proje Çalışıyor! 🎉 Test Etmeye Başlayın!**
