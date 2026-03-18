# AKIS Platform — Tez Demo Senaryosu

## Proje Bilgileri
- **Proje:** AKIS — Adaptive Knowledge Integrity System
- **Öğrenci:** Ömer Yasir Önal (2221221562)
- **Danışman:** Dr. Öğr. Üyesi Nazlı Doğan
- **Üniversite:** FSMVÜ Bilgisayar Mühendisliği
- **Tema:** LLM Ajanları ile Yapay Zeka Tabanlı Etkileşimli Yazılım Geliştirme Platformu

---

## Demo 1: Fikir → Çalışan Uygulama (5 dakika)

### Açılış (30sn)
"AKIS, kullanıcının doğal dilde anlattığı bir fikri otomatik olarak çalışır
durumda bir yazılım projesine dönüştüren AI tabanlı bir platformdur."

**Göster:** Dashboard — 4 tamamlanmış iş akışı, %100 başarı oranı, Scribe %91 ortalama güven

### Yeni İş Akışı Başlatma (30sn)
1. "+ Yeni İş Akışı" butonuna tıkla
2. Fikri yaz: "Kişisel bütçe takip uygulaması..."
3. Model seçimi: Claude Sonnet 4.6
4. Hedef depo seçimi göster
5. "İş Akışını Başlat" tıkla

### Scribe Clarification (1dk)
1. Floating toast: "● Scribe · Kullanıcı fikrini analiz ediyor..."
2. SSE activity stream: adım adım ilerleme
3. Clarification soruları gelir → Wizard stepper göster
4. "Bu soruları Scribe akıllıca soruyor — MVP kapsamını daraltmak için"
5. Seçenekleri seç, "Gönder"

### Spec İnceleme (1dk)
1. "YAPILANDIRILMIŞ SPESİFİKASYON %88" kartı
2. Self-review ✓ badge göster
3. "⚠ 2 varsayım" göster — "Scribe kendi varsayımlarını da bildiriyor"
4. Spec'i aç: Problem Tanımı, Kullanıcı Hikayeleri, Kabul Kriterleri
5. "Her kabul kriteri Given/When/Then formatında — test edilebilir"
6. "Onayla ve Devam Et"

### Proto + Trace (1dk)
1. Proto çalışıyor: "Scaffold oluşturuluyor..." + SSE activity
2. Dosya paneli: dosyalar birer birer beliriyor
3. Proto tamamlandı: "14 dosya, 649 satır"
4. Trace çalışıyor: "Playwright testleri yazılıyor..."
5. Trace tamamlandı: "57 test, %100 kapsam"

### Sonuç (1dk)
1. Pipeline Tamamlandı kartı — toplam süre, agent metrikleri
2. StackBlitz Preview — çalışan uygulama göster
3. Git bar: "Klonla" tıkla → "git clone komutu kopyalandı"
4. "PR Oluştur" → GitHub compare sayfası
5. "Geliştirmeye Devam Et" butonu — iterasyon konsepti

---

## Demo 2: Agent Doğrulama Zinciri (3 dakika)

### Konsept (30sn)
"AKIS'in temel farkı Knowledge Integrity yaklaşımıdır. Her agent hem kendi
çıktısını doğrular hem de girdisine bağlılığını kanıtlar."

### Scribe Doğrulaması (45sn)
1. Completed pipeline'ın spec'ini aç
2. "Self-review ✓" — "Scribe kendi spec'ini 5 kritere göre kontrol etti"
3. "⚠ Varsayımlar" — "Low-confidence varsayımlar görünür hale getirildi"
4. Confidence %88 — "4 boyutlu ağırlıklı skor"

### Proto Doğrulaması (45sn)
1. Proto result bloğu göster
2. "Spec Coverage: 7/7 kriter karşılandı"
3. "Scaffold Integrity: sorun bulunamadı"
4. Dosya panelinde: her dosya hangi agent tarafından oluşturuldu (PROTO/TRACE badge)

### Trace Doğrulaması (45sn)
1. Trace result bloğu göster
2. "İzlenebilirlik Matrisi: her AC bir teste eşlenmiş"
3. "%100 kapsam — hiçbir kabul kriteri test dışı kalmadı"
4. Test dosyalarını göster: Given/When/Then yapısı

### Agents Sayfası (15sn)
1. 3 agent kartı: iş akışı diyagramları
2. "Güven Skoru Nasıl Hesaplanır" collapsible → formül

---

## Demo 3: Geliştirici Deneyimi (2 dakika)

### UI Turu (1dk)
1. Sidebar: collapse/expand animasyonu
2. Son iş akışları listesi, status dot'lar
3. Dashboard: stat kartları, agent durumu, quick actions
4. Workflow detail: tab'lar (Sohbet, Aşamalar, Önizleme)

### Kod İnceleme (30sn)
1. Dosya paneli aç
2. Dosyaya tıkla → CodeViewer, syntax highlighting
3. PROTO/TRACE badge'ler, satır sayıları, GitHub linkleri

### Git Entegrasyonu (30sn)
1. Git context bar: branch adı
2. "Klonla" → clipboard'a komut
3. "PR Oluştur" → GitHub compare sayfası açılır
4. "GitHub'da Görüntüle" → repo sayfası

---

## Teknik Detaylar (Jüri Soruları İçin)

### Mimari
- Frontend: React 19 + TypeScript + Vite 7 + Tailwind CSS 4
- Backend: Fastify 4 + TypeScript + Drizzle ORM + PostgreSQL
- AI: Anthropic Claude API (Sonnet 4.6 / Haiku 4.5)
- Real-time: Server-Sent Events (SSE)
- Preview: StackBlitz WebContainer SDK
- Test: Playwright (Trace tarafından oluşturulan), Vitest (1329 + 275 birim test)

### Pipeline Akışı
```
Kullanıcı Fikri → Scribe (self-interrogation + self-review)
    → İnsan Kapısı (onay/red)
    → Proto (spec compliance + scaffold integrity check)
    → Trace (AC-test traceability matrix)
    → Completed (çalışır uygulama + testler + preview)
```

### Doğrulama Zinciri
| Agent | Doğrulama Yöntemi |
|-------|-------------------|
| Scribe | Öz-sorgulama + öz-inceleme + varsayım günlüğü |
| İnsan | Spec onayı / reddi |
| Proto | Spec uyumu kontrolü + scaffold bütünlüğü kontrolü |
| Trace | AC-test izlenebilirlik matrisi + kapsam raporu |

### İstatistikler
- 1604 birim test (1329 backend + 275 frontend)
- 4+ başarılı E2E pipeline
- Ortalama pipeline süresi: ~5 dakika
- Ortalama Scribe güven skoru: %91
- Ortalama Proto dosya sayısı: 12
- Ortalama Trace test sayısı: 55+
