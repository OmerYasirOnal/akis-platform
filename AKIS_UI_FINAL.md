# AKIS — UI/UX FİNAL DÜZELTMELERİ (API GEREKMİYOR)

.env dosyalarına ASLA dokunma. API çağrısı YAPMA. Mevcut DB'deki completed pipeline verileriyle çalış.

---

## AMAÇ

Mevcut completed pipeline'lar üzerinden UI/UX sorunlarını düzelt. Yeni pipeline BAŞLATMA — API kredisi yok.

---

## ADIM 0 — SERVİSLERİ BAŞLAT VE MEVCUT VERİYİ KONTROL ET

```bash
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null
sleep 1

docker ps | grep postgres || docker compose -f docker-compose.dev.yml up -d 2>/dev/null
sleep 3

cd backend && DATABASE_URL=postgresql://postgres:postgres@localhost:5433/akis_v2 DEV_MODE=true nohup npx tsx watch src/server.ts > /tmp/akis-backend.log 2>&1 &
sleep 5
curl -sf http://localhost:3000/health && echo "✓ Backend OK"

cd ../frontend && nohup npm run dev > /tmp/akis-frontend.log 2>&1 &
sleep 3

# Mevcut pipeline'ları listele
echo "=== MEVCUT PİPELINE'LAR ==="
curl -s http://localhost:3000/api/pipelines | python3 -c "
import sys, json
data = json.load(sys.stdin)
plist = data.get('pipelines', data) if isinstance(data, dict) else data
plist = plist if isinstance(plist, list) else []
print(f'Toplam: {len(plist)}')
for p in plist:
    print(f'  {p.get(\"id\",\"?\")[:12]}  {p.get(\"status\",\"?\")} — {p.get(\"title\",p.get(\"idea\",\"?\"))[:50]}')
" 2>/dev/null
```

Eğer hiç completed pipeline yoksa: UI'ı boş durum (empty state) ile test et. Eğer varsa: o pipeline'ın detay sayfasını kontrol et.

---

## ADIM 1 — DASHBOARD FULL-WIDTH FİX

Dashboard'da sağ tarafta boş alan kalıyor mu kontrol et:

```bash
grep -rn "max-w\|maxWidth\|max-width\|1080\|980\|1200" frontend/src/pages/dashboard/OverviewPage.tsx frontend/src/components/layout/DashboardLayout.tsx | head -10
```

**Eğer hâlâ max-width kısıtlaması varsa:**
- DashboardLayout main content'ten max-width KALDIR
- OverviewPage'deki tüm section'lar full-width olsun
- İçerik `max-width: 1280px` ile ortalansın (sağ-sol padding ile), ama scroll bar'ın sağında BOŞ ALAN KALMAMALI

```typescript
// Doğru yaklaşım — OverviewPage wrapper:
<div className="w-full px-6">
  <div className="mx-auto" style={{ maxWidth: 1280 }}>
    {/* tüm içerik */}
  </div>
</div>
```

Bu sayede geniş ekranda içerik ortalanır ama arka plan full-width olur, boş beyaz alan kalmaz.

---

## ADIM 2 — TÜRKÇE KARAKTER DÜZELTMELERİ

Türkçe metinlerde karakter sorunları var mı kontrol et:

```bash
# ASCII Türkçe karakter sorunları
grep -rn "Iyi\|Basari\|Orani\|Akisi\|Islem\|Onizle\|Olustur\|Dosyalar\|Tumun\|calisma\|guven\|genelin" frontend/src/ | grep -v node_modules | grep -v ".test." | head -30
```

Düzelt:
- "Iyi gunler" → "İyi günler"
- "Basari Orani" → "Başarı Oranı"
- "Toplam Is Akisi" → "Toplam İş Akışı"
- "Olusturulan Test" → "Oluşturulan Test"
- "Ort. Sure" → "Ort. Süre"
- "bu hafta" → "bu hafta" (doğru)
- "tamamlandi" → "tamamlandı"
- "is akisi genelinde" → "iş akışı genelinde"
- "Hizli Islemler" → "Hızlı İşlemler"
- "Tumunu gor" → "Tümünü gör"
- "Henuz is akisi yok" → "Henüz iş akışı yok"
- "Ilk is akisinizi baslatin" → "İlk iş akışınızı başlatın"
- "Is Akisi Olustur" → "İş Akışı Oluştur"
- "Son calisma" → "Son çalışma"
- "Ort. guven" → "Ort. güven"
- "Ajan durumu ve metrikleri" → kontrol et
- "Onizleme" → "Önizleme"
- "Dosyalari Gor" → "Dosyaları Gör"

`tr.ts` dosyasındaki TÜM string'leri kontrol et ve Türkçe karakterleri düzelt:

```bash
cat frontend/src/constants/tr.ts 2>/dev/null || find frontend/src -name "tr.*" | head -5
```

---

## ADIM 3 — CHAT VIEW TEMİZLİĞİ

Mevcut completed pipeline'ın chat view'ını kontrol et:

```bash
# Completed pipeline ID bul
CPID=$(curl -s http://localhost:3000/api/pipelines | python3 -c "
import sys, json
data = json.load(sys.stdin)
plist = data.get('pipelines', data) if isinstance(data, dict) else data
for p in (plist if isinstance(plist, list) else []):
    if p.get('status') in ['completed', 'completed_partial']:
        print(p['id']); break
" 2>/dev/null)
echo "Completed pipeline: $CPID"
```

Chat view'da şunları kontrol et (tarayıcıda manuel kontrol gerekirse notla):

**3.1 — Spec bloğu varsayılan KAPALI mı?**
```bash
grep -rn "defaultExpanded\|defaultOpen\|isExpanded\|useState.*true.*spec\|collapsed" frontend/src/components/workflow/WorkflowChatView.tsx | head -10
```

Spec çok uzun. Varsayılan KAPALI olmalı, sadece başlık + confidence + özet görünmeli:
```
YAPILANDIRILMIŞ SPESİFİKASYON  92%  [Önizleme] [Markdown] 📋 ⬇
▸ 5 Kullanıcı Hikayesi · 8 Kabul Kriteri · 3 Teknik Kısıtlama
```

**3.2 — Suggestion chip'leri eski mesajlarda gizli mi?**
Wizard ile cevaplanan clarification mesajlarında chip'ler gösterilmemeli.

**3.3 — Pipeline completed kartı düzgün mü?**
```bash
grep -rn "PipelineSummaryCard\|Pipeline Tamamland\|Gelistirmeye\|Klonla\|PR Olustur" frontend/src/components/workflow/WorkflowChatView.tsx | head -10
```

---

## ADIM 4 — SIDEBAR EKSİKLER

```bash
cat frontend/src/components/layout/DashboardSidebar.tsx | head -100
```

- "Sign Out" → "Çıkış Yap"
- "Collapse" → "Daralt"
- "Expand" → "Genişlet"
- Sidebar bottom'da "AKIS v0.1.0" ve renkli dot'lar → Türkçe gerek yok ama görünüyor mu?

---

## ADIM 5 — STATUS BADGE'LER

Tüm status badge'lerin Türkçe olduğunu kontrol et:

```bash
grep -rn "COMPLETED\|RUNNING\|FAILED\|PARTIAL\|AWAITING" frontend/src/ | grep -v node_modules | grep -v ".test." | grep -v "type\|status.*===\|interface\|enum" | head -20
```

Kullanıcıya GÖRÜNEN badge metinleri:
- "COMPLETED" → "TAMAMLANDI"
- "RUNNING" → "ÇALIŞIYOR"
- "FAILED" → "BAŞARISIZ"
- "PARTIAL" → "KISMİ"
- "AWAITING APPROVAL" → "ONAY BEKLİYOR"

**DİKKAT:** Backend'den gelen `status` değerleri (İngilizce) DEĞİŞMEMELİ — sadece frontend'de GÖSTERİM Türkçe olmalı.

```typescript
const STATUS_TR: Record<string, string> = {
  completed: 'TAMAMLANDI',
  running: 'ÇALIŞIYOR',
  failed: 'BAŞARISIZ',
  completed_partial: 'KISMİ',
  awaiting_approval: 'ONAY BEKLİYOR',
  scribe_clarifying: 'ÇALIŞIYOR',
  scribe_generating: 'ÇALIŞIYOR',
  proto_building: 'ÇALIŞIYOR',
  trace_testing: 'ÇALIŞIYOR',
  pending: 'BEKLEMEDE',
};
```

---

## ADIM 6 — AGENTS SAYFASI

```bash
cat frontend/src/pages/dashboard/AgentsPage.tsx | head -50
```

- Confidence % doğru gösteriliyor mu? (formatConfidence fonksiyonu kullanılıyor mu?)
- Workflow diyagramları Türkçe mi?
- "How Confidence is Calculated" → "Güven Skoru Nasıl Hesaplanır"
- Performans metrikleri: "Last run", "Avg confidence" → Türkçe

---

## ADIM 7 — SETTINGS SAYFASI

```bash
cat frontend/src/pages/dashboard/SettingsPage.tsx | head -80
```

Tüm metinler Türkçe mi? Profile, GitHub, Password tab'ları.

---

## ADIM 8 — BUILD

```bash
cd frontend && npx tsc --noEmit && echo "✓ typecheck" || echo "✗ typecheck"
cd frontend && npx eslint src/ --quiet 2>/dev/null && echo "✓ lint" || echo "✗ lint"
cd frontend && npm run build && echo "✓ build" || echo "✗ build"
cd ../backend && npx tsc --noEmit && echo "✓ BE typecheck" || echo "✗ BE typecheck"
```

```
## UI/UX Düzeltme Raporu

### Dashboard
- Full-width (boş alan yok): ✓/✗
- İçerik ortalanmış: ✓/✗

### Türkçe Karakterler
- Düzeltilen string sayısı: ___
- Kalan İngilizce: ✓ yok / ✗ var (liste)

### Chat View
- Spec varsayılan kapalı: ✓/✗
- Wizard düzgün: ✓/✗
- Summary kart düzgün: ✓/✗

### Status Badge'ler
- Tümü Türkçe: ✓/✗

### Agents Sayfası
- Confidence doğru: ✓/✗
- Türkçe tam: ✓/✗

### Build
- Frontend: ✓/✗
- Backend: ✓/✗
```
