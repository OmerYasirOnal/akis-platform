# AKIS — TEZ DEMO HAZIRLIĞI

.env dosyalarına ASLA dokunma.

---

## AMAÇ

Tez jürisine gösterilecek 3 demo senaryosu hazırla. Her senaryo farklı bir AKIS özelliğini vurgular. Demo verileri temiz olmalı, her senaryo tekrarlanabilir olmalı.

---

## 3 DEMO SENARYOSU

### Senaryo 1: "Fikir → Çalışan Uygulama" (Ana Demo — 5dk)
**Vurgulanan:** Tam E2E pipeline, Scribe clarification, wizard, spec onayı, Proto scaffold, Trace testler, preview
**Proje:** Kişisel bütçe takip uygulaması
**Gösterilecek özellikler:**
- Fikir girişi + model seçimi
- Scribe clarification soruları + wizard stepper
- SSE canlı activity stream + floating toast
- Spec inceleme (%88+ confidence, self-review, assumptions)
- Onayla ve Proto'ya geç
- Dosya paneli real-time dolması
- StackBlitz preview — çalışan uygulama
- Pipeline completed kartı + git bar (Klonla, PR, GitHub)
- Dashboard'da 4 pipeline, %100 başarı

### Senaryo 2: "Agent Doğrulama Zinciri" (Tez Teması — 3dk)
**Vurgulanan:** Knowledge Integrity — her agent kendi çıktısını doğruluyor
**Proje:** Mevcut completed pipeline üzerinden gösterim
**Gösterilecek özellikler:**
- Scribe: Self-review ✓ badge + assumptions listesi
- Spec: Collapsible AC (Given/When/Then format)
- Proto: verificationReport (spec coverage 7/7)
- Trace: traceability matrix (AC → test eşleştirmesi)
- Agents sayfası: Güven skoru hesaplama formülü
- Stages view: Pipeline ilerleme + SSE activity log

### Senaryo 3: "Geliştirici Deneyimi" (UX Demo — 2dk)
**Vurgulanan:** Claude.ai tarzı UI, profesyonel geliştirme aracı hissi
**Gösterilecek özellikler:**
- Sidebar: son iş akışları, collapse/expand
- Code viewer: syntax highlighted dosya inceleme
- Git context bar: branch, Klonla (clipboard), PR Oluştur (GitHub)
- Mobile responsive (tarayıcı daralt)
- Agents sayfası: 3 agent kartı, workflow diyagramları, performans metrikleri
- Settings: GitHub OAuth bağlantısı
- "Geliştirmeye Devam Et" butonu — iterasyon konsepti

---

## ADIM 0 — SERVİSLERİ BAŞLAT

```bash
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null
sleep 1

docker ps | grep postgres || docker compose -f docker-compose.dev.yml up -d 2>/dev/null
sleep 3

cd backend && DATABASE_URL=postgresql://postgres:postgres@localhost:5433/akis_v2 DEV_MODE=true nohup npx tsx watch src/server.ts > /tmp/akis-backend.log 2>&1 &
sleep 5 && curl -sf http://localhost:3000/health && echo "✓ Backend"

cd ../frontend && nohup npm run dev > /tmp/akis-frontend.log 2>&1 &
sleep 3 && echo "✓ Frontend"
```

---

## ADIM 1 — DEMO VERİSİ HAZIRLA

### 1.1 Mevcut pipeline'ları kontrol et

```bash
curl -s http://localhost:3000/api/pipelines | python3 -c "
import sys, json
data = json.load(sys.stdin)
plist = data.get('pipelines', data) if isinstance(data, dict) else data
plist = plist if isinstance(plist, list) else []
print(f'Toplam: {len(plist)}')
for p in plist:
    print(f'  {p.get(\"status\")} — {p.get(\"title\", p.get(\"idea\",\"?\"))[:50]}')
" 2>/dev/null
```

### 1.2 Demo için ideal pipeline çalıştır

Eğer güzel bir "kişisel bütçe" pipeline'ı yoksa oluştur:

```bash
RESP=$(curl -s -X POST http://localhost:3000/api/pipelines \
  -H "Content-Type: application/json" \
  -d '{"idea": "Kişisel bütçe takip uygulaması. Gelir ve gider girişi yapabilmeli, kategorilere ayırabilmeli (market, ulaşım, eğlence vb.), aylık özet grafik gösterebilmeli. Sade ve kullanışlı tasarım, web tarayıcısında çalışmalı."}')
DEMO_ID=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('pipeline',{}).get('id','FAIL'))" 2>/dev/null)
echo "Demo pipeline: $DEMO_ID"

# Clarification'a detaylı cevap ver
for i in $(seq 1 60); do
  STATUS=$(curl -s "http://localhost:3000/api/pipelines/$DEMO_ID" | python3 -c "import sys,json; print(json.load(sys.stdin).get('pipeline',{}).get('status','?'))" 2>/dev/null)
  
  if [ "$STATUS" = "scribe_clarifying" ]; then
    curl -s -X POST "http://localhost:3000/api/pipelines/$DEMO_ID/message" \
      -H "Content-Type: application/json" \
      -d '{"message": "1. Temel özellikler: gelir/gider girişi, kategoriler, aylık grafik, toplam bakiye\n2. Web tarayıcısı (masaüstü ve mobil uyumlu)\n3. Giriş gerekmez, veriler tarayıcıda (localStorage) saklanır\n4. React + Chart.js grafik kütüphanesi kullanılsın\n5. Sade ve minimalist tasarım, koyu/açık tema desteği"}' > /dev/null
    echo "✓ Cevap gönderildi"
  fi
  
  if [ "$STATUS" = "awaiting_approval" ]; then
    curl -s -X POST "http://localhost:3000/api/pipelines/$DEMO_ID/approve" \
      -H "Content-Type: application/json" \
      -d '{"repoName": "kisisel-butce-takip", "repoVisibility": "private"}' > /dev/null
    echo "✓ Onaylandı"
  fi
  
  if [ "$STATUS" = "completed" ] || [ "$STATUS" = "failed" ] || [ "$STATUS" = "completed_partial" ]; then
    echo "Pipeline: $STATUS"
    break
  fi
  
  [ $((i % 10)) -eq 0 ] && echo "[$i] $STATUS"
  sleep 3
done
```

---

## ADIM 2 — DEMO SUNUM DOKÜMANI

`docs/DEMO_SCRIPT.md` oluştur:

```markdown
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
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS
- Backend: Fastify + TypeScript + Drizzle ORM + PostgreSQL
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
- 3+ başarılı E2E pipeline
- Ortalama pipeline süresi: ~5 dakika
- Ortalama Scribe güven skoru: %91
- Ortalama Proto dosya sayısı: 12
- Ortalama Trace test sayısı: 55+
```

---

## ADIM 3 — DEMO İÇİN FRONTEND İYİLEŞTİRMELERİ

### 3.1 Sayfa başlığını güncelle

```bash
grep -n "<title>" frontend/index.html
```

Başlık: `AKIS — AI Kod Üretim Platformu`

### 3.2 Favicon kontrol

```bash
ls frontend/public/favicon* frontend/public/*.ico frontend/public/*.svg 2>/dev/null
```

AKIS logosu (yeşil A) favicon olarak ayarlanmış mı? Yoksa basit bir SVG favicon oluştur.

### 3.3 Login sayfası temiz mi?

Demo'da login bypass (DEV_MODE) kullanılıyor ama jüri sorarsa login sayfası da gösterilecek.

```bash
grep -rn "DEV_MODE\|devMode\|bypass" frontend/src/ | grep -v node_modules | head -10
```

### 3.4 Empty state düzgün mü?

İlk kez açan birisi için dashboard düzgün görünmeli:
- "Henüz iş akışı yok" mesajı
- "İş Akışı Oluştur →" butonu

---

## ADIM 4 — DEMO VERİSİ TEMİZLİĞİ

### 4.1 Eski/test pipeline'ları temizle (opsiyonel)

Demo'da sadece iyi görünen pipeline'lar olsun. Eğer "asd", "asdasd" gibi test pipeline'lar varsa, bunları gizle veya sil:

```bash
# Test/gereksiz pipeline'ları listele
curl -s http://localhost:3000/api/pipelines | python3 -c "
import sys, json
data = json.load(sys.stdin)
plist = data.get('pipelines', data) if isinstance(data, dict) else data
for p in (plist if isinstance(plist, list) else []):
    title = p.get('title', p.get('idea', ''))
    if any(t in title.lower() for t in ['asd', 'test', 'deneme']):
        print(f'  TEMIZLE: {p[\"id\"][:8]} — {title[:40]}')
    else:
        print(f'  KORU:    {p[\"id\"][:8]} — {title[:40]}')
" 2>/dev/null
```

**DİKKAT:** Pipeline silme endpoint'i yoksa, veritabanından doğrudan silme. Sadece NOT AL, Yasir'a bildir.

### 4.2 Dashboard istatistikleri kontrol

Demo'da dashboard'un güzel görünmesi için en az 3-4 completed pipeline olmalı.

---

## ADIM 5 — EKRAN KAYDI REHBERİ

`docs/RECORDING_GUIDE.md` oluştur:

```markdown
# AKIS Demo Ekran Kaydı Rehberi

## Hazırlık
1. Ekran çözünürlüğü: 1920x1080 (Full HD)
2. Tarayıcı: Chrome, bookmarks bar gizli
3. Zoom: %100
4. DevTools: KAPALI
5. Diğer tab'lar: KAPALI
6. Bildirimler: KAPALI
7. URL bar'da sadece localhost görünsün

## Kayıt Araçları
- macOS: QuickTime Player (Dosya → Yeni Ekran Kaydı)
- Alternatif: OBS Studio (ücretsiz, cross-platform)
- Çözünürlük: 1920x1080, 30fps, H.264

## Demo 1 Kaydı (5dk)
1. Dashboard'da başla — 3sn bekle
2. "+ Yeni İş Akışı" tıkla
3. Fikri YAVAŞ yaz (izleyici okuyabilsin)
4. Model seçimini göster
5. "İş Akışını Başlat" tıkla
6. Toast'ı göster — 2sn bekle
7. Wizard gelince yavaş ilerle
8. Spec'i aç, göster — 3sn bekle
9. Onayla
10. Proto/Trace çalışırken dosya panelini aç
11. Preview tab'ına geç — uygulamayı göster
12. Pipeline kartını göster
13. "Klonla" tıkla
14. Dashboard'a dön — istatistikleri göster

## Demo 2 Kaydı (3dk)
1. Completed pipeline'a tıkla
2. Spec kartını aç → self-review + assumptions göster
3. Scroll down → Proto result
4. Scroll down → Trace result
5. Agents sayfasına git → kartları göster
6. "Güven Skoru" collapsible'ı aç

## Demo 3 Kaydı (2dk)
1. Sidebar collapse/expand göster
2. Dashboard genel tur
3. Dosya paneli + code viewer
4. Git bar butonları
5. Mobile görünüm (tarayıcı daralt)
```

---

## ADIM 6 — BUILD KONTROL

```bash
cd frontend && npx tsc --noEmit && npm run build && echo "✓ FE"
cd ../backend && npx tsc --noEmit && echo "✓ BE"
```

---

## ADIM 7 — RAPOR

```
## Demo Hazırlık Raporu

### Demo Verileri
- Toplam pipeline: ___
- Completed: ___
- Demo pipeline (bütçe takip): ✓/✗

### Dokümanlar
- docs/DEMO_SCRIPT.md: ✓/✗
- docs/RECORDING_GUIDE.md: ✓/✗

### Frontend
- Sayfa başlığı güncellendi: ✓/✗
- Favicon: ✓/✗
- Empty state düzgün: ✓/✗

### Build
- Frontend: ✓/✗
- Backend: ✓/✗
```
