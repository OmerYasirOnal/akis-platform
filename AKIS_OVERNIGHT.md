# AKIS — GECE VARDİYASI: KAPSAMLI POLİSH & İYİLEŞTİRME

.env dosyalarına ASLA dokunma. Sabah 05:00'e kadar dur, her şeyi düzelt, araştır, iyileştir.

**ÇALIŞMA MODU:** Her fazı tamamla → build kontrol → sorun varsa düzelt → sonraki faza geç. Takılırsan web'den araştır. Hiç durma.

---

## MASTER PLAN (8 FAZ)

| Faz | İş | Tahmini Süre |
|-----|-----|-------------|
| 1 | Light theme ZORLA — dark theme tamamen kaldır | 30dk |
| 2 | Scribe confidence artır — prompt'u güçlendir (%72 → %85+) | 30dk |
| 3 | Claude.ai UI polish — chat, sidebar, input bar rafine | 1.5s |
| 4 | Responsive & mobile uyumluluk | 1s |
| 5 | Tüm sayfalar Türkçe + karakter düzeltmeleri | 30dk |
| 6 | E2E test — 3 farklı pipeline çalıştır, tüm bugları düzelt | 1.5s |
| 7 | Staging deploy hazırlığı — Docker, Caddy, prod config | 1s |
| 8 | Son QA — her sayfa, her buton, her akış | 1s |

---

## FAZ 1 — LIGHT THEME ZORLA (KRİTİK)

Dark theme hâlâ aktif. KÖKTEN çöz.

### 1.1 Tüm dark CSS'i bul ve kaldır

```bash
# Dark theme CSS nerede?
grep -rn "dark\|prefers-color-scheme" frontend/src/styles/ frontend/src/index.css 2>/dev/null | head -20
grep -rn "@media.*dark\|\.dark\s" frontend/src/ | grep -v node_modules | head -20

# Tailwind dark mode
grep -n "darkMode" frontend/tailwind.config.* | head -5

# HTML'de dark class
grep -n "dark" frontend/index.html | head -5

# Koyu arka plan renkleri
grep -rn "rgb(15\|rgb(0\|#0d0d\|#0f0f\|#111\|#1a1a\|#18181b\|rgba(15\|rgba(0,0,0,0\.\(8\|9\)" frontend/src/ | grep -v node_modules | grep -v ".test." | head -30
```

### 1.2 global.css — SADECE light theme

`:root` bloğunda SADECE light renkleri olmalı. `.dark` veya `@media (prefers-color-scheme: dark)` bloğunu TAMAMEN SİL.

```css
:root {
  --ak-bg: #ffffff;
  --ak-bg-sidebar: #f8f9fa;
  --ak-bg-chat: #ffffff;
  --ak-bg-input: #f8f9fa;
  --ak-bg-bubble-user: #f1f3f5;
  --ak-bg-panel: #ffffff;
  --ak-border: #e9ecef;
  --ak-border-light: #f1f3f5;
  --ak-text: #212529;
  --ak-text-muted: #6c757d;
  --ak-text-faint: #adb5bd;
  --ak-surface: #f8f9fa;
  --ak-surface-raised: #f1f3f5;
  --ak-primary: #10b981;
  --ak-scribe: #3b82f6;
  --ak-proto: #f59e0b;
  --ak-trace: #8b5cf6;
  --ak-shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
  --ak-shadow-md: 0 4px 16px rgba(0,0,0,0.08);

  color-scheme: light;
  background-color: #ffffff;
  color: #212529;
}

/* DARK THEME YOK — SİLİNDİ */
```

### 1.3 Tailwind config

```javascript
// tailwind.config.js
module.exports = {
  // darkMode OLMAMALI veya:
  darkMode: 'class', // class kullanıyoruz ama HTML'de dark class YOK
  // ...
}
```

### 1.4 index.html

```html
<!DOCTYPE html>
<html lang="tr">
<!-- dark class YOK -->
```

### 1.5 Tüm bileşenlerdeki hardcoded dark renkleri değiştir

```bash
# Sistematik ara-değiştir
grep -rn "bg-\[#0\|bg-\[#1\|bg-gray-9\|bg-slate-9\|bg-zinc-9\|bg-neutral-9" frontend/src/components/ frontend/src/pages/ | grep -v node_modules | head -30
```

Her birini light karşılığıyla değiştir. Tam liste:
- `bg-gray-900` → `bg-white` veya `bg-gray-50`
- `bg-[#0d0d0d]` → `bg-white`
- `bg-[#111827]` → `bg-white`
- `text-white` (koyu arka plan üstündeki) → `text-gray-900`
- `text-gray-300` → `text-gray-600`
- `text-gray-400` → `text-gray-500`
- `border-gray-700` → `border-gray-200`
- `border-gray-800` → `border-gray-200`

### 1.6 FloatingActivityToast — light theme

```bash
grep -n "rgba(15\|rgba(0,0,0,0.7\|#0f0f" frontend/src/components/pipeline/FloatingActivityToast.tsx | head -5
```

Toast glassmorphism'i light theme'e uyarla:
```css
background: rgba(255, 255, 255, 0.85);
backdrop-filter: blur(12px);
border: 1px solid rgba(0, 0, 0, 0.08);
color: #212529;
```

### 1.7 Build + kontrol

```bash
cd frontend && npx tsc --noEmit && npm run build && echo "✓ FAZ 1 tamamlandı"
```

---

## FAZ 2 — SCRIBE CONFIDENCE ARTIR

### 2.1 Neden %72?

Scribe'ın confidence'ı düşük çünkü prompt'taki ambiguity scoring sıkı. Kullanıcı kısa cevaplar verdiğinde confidence düşüyor.

### 2.2 Prompt iyileştirmesi

```bash
# Scribe system prompt'unu bul
find backend/src -path "*scribe*" -name "*.ts" | xargs grep -l "system\|prompt\|You are" | head -5
```

Scribe prompt'unda şu değişiklikleri yap:

1. **Ambiguity scoring eşiğini düşür:** `< 3.5` → `< 2.5` (daha toleranslı)
2. **Confidence hesaplamasında kullanıcı yanıtlarını daha ağır tut:** Kullanıcı cevap verdiyse minimum %80 olmalı
3. **Self-review daha az cezalandırsın:** Küçük eksikler confidence'ı %10'dan fazla düşürmesin

Prompt'a ekle:
```
CONFIDENCE CALCULATION RULES:
- If the user answered ALL clarification questions: minimum confidence = 0.80
- If the spec has all 5 sections (Problem, Stories, AC, Constraints, Out of Scope): +0.10
- If every AC is in Given/When/Then format: +0.05
- Maximum deduction for minor style issues: -0.05
- Target range: 0.80-0.95 for typical well-defined projects
```

### 2.3 Build

```bash
cd backend && npx tsc --noEmit && echo "✓ FAZ 2 tamamlandı"
```

---

## FAZ 3 — CLAUDE.AI UI POLISH

### 3.1 Sidebar — Claude.ai tam uyum

```bash
cat frontend/src/components/layout/DashboardSidebar.tsx
```

**Araştırma yap:** Claude.ai'ın sidebar'ını web'den araştır — renk, spacing, font boyutları.

Değişiklikler:
- Sidebar arka plan: beyaz veya çok açık gri (#fafafa)
- Nav item'lar: `py-2 px-3`, rounded-lg, hover:bg-gray-100
- Aktif item: bg-gray-100 + font-semibold (sol border DEĞİL)
- "Yeni İş Akışı" butonu: outline style, border-dashed, hover:bg-gray-50
- Son iş akışları: küçük font (13px), text-gray-500, truncate
- Kullanıcı bilgisi altta: avatar (initials) + isim + plan
- Bölüm başlıkları: çok küçük (11px), uppercase, tracking-wider, text-gray-400

### 3.2 Chat mesajları — rafine

```bash
cat frontend/src/components/workflow/WorkflowChatView.tsx | head -100
```

**Kullanıcı mesajı:**
- Sağ hizalı, rounded-2xl bubble
- Light theme'de: bg-gray-100, text-gray-900
- Max-width: %80
- Padding: 12px 18px
- Font: 15px, line-height 1.65

**Agent mesajı:**
- Sol hizalı, bubble YOK
- Agent header: 28px rounded avatar (agent rengi opak arka plan) + isim + timestamp
- Mesaj metni: padding-left 40px (avatar hizası), font 15px, line-height 1.7
- Spec/result kartları: border + rounded-xl, artifact-style

### 3.3 Input bar — tam Claude.ai

- Container: bg-gray-50, border border-gray-200, rounded-2xl
- Textarea: transparent bg, auto-resize, placeholder gray-400
- Alt satır: sol → git context (mono font, küçük), sağ → model seçici + gönder butonu
- Gönder butonu: 36px yuvarlak, bg-primary, white arrow
- Model seçici: küçük text, dropdown arrow, no border

### 3.4 Spec kartı — artifact style

Claude.ai'ın artifact kartına benzemeli:
- Üst header: bg-gray-50, border-bottom, sol'da başlık, sağ'da butonlar
- Collapse/expand: smooth animasyon
- İçerik: padding 16px, temiz tipografi
- Confidence badge: yeşil tonlarda, pill shape

### 3.5 Thinking steps / Activity log — temiz

SSE activity log güzel çalışıyor. Polish:
- Timestamp: mono font, gray-400, küçük
- Check mark: green-500
- Active step: primary renk pulse
- Container: subtle border, rounded-xl, bg-gray-50

### 3.6 Pipeline progress dots (header)

Header'daki pipeline progress mini-dots:
- Completed stage: filled dot (agent rengi)
- Running stage: pulse animasyonlu dot
- Pending stage: empty dot (gray-300 border)
- Aralarında ince çizgi

### 3.7 Wizard stepper — temiz

- Progress bar: ince (3px), agent rengi
- Soru: büyük font (16px), koyu
- Açıklama: küçük font (13px), gray-500
- Seçenekler: radio style, hover:bg-gray-50, rounded-lg, padding
- "Kendi cevabımı yazayım": farklı stil, text input göster
- İleri/Geri: sağ/sol hizalı, primary renk

### 3.8 Build

```bash
cd frontend && npx tsc --noEmit && npm run build && echo "✓ FAZ 3 tamamlandı"
```

---

## FAZ 4 — RESPONSIVE & MOBİL

### 4.1 Breakpoint'ler

```
< 768px (mobile): sidebar gizli, hamburger menu, chat full-width, sağ panel overlay
768-1024px (tablet): sidebar collapsed (60px), chat daraltılmış
> 1024px (desktop): sidebar expanded/collapsed toggle, chat + sağ panel
```

### 4.2 Mobile sidebar

```typescript
// < 768px: sidebar absolute overlay, backdrop
// >= 768px: sidebar normal flex
const isMobile = window.innerWidth < 768;
```

### 4.3 Sağ panel mobile

Mobile'da sağ panel full-screen overlay olmalı, bottom sheet gibi.

### 4.4 Input bar mobile

Mobile'da input bar sticky bottom, git context gizli (sadece model + gönder).

### 4.5 Build

```bash
cd frontend && npx tsc --noEmit && npm run build && echo "✓ FAZ 4 tamamlandı"
```

---

## FAZ 5 — TÜRKÇE TAM KONTROL

```bash
# İngilizce metin ara
grep -rn "'[A-Z][a-z].*[a-z]'" frontend/src/components/ frontend/src/pages/ | grep -v "node_modules\|.test.\|console\|import\|export\|const\|let\|var\|type\|interface\|className\|style\|href\|src\|key\|id\|ref\|onClick\|onChange\|=>\|function\|return\|if\|else\|switch" | grep -v "Claude\|Sonnet\|Haiku\|Proto\|Trace\|Scribe\|GitHub\|StackBlitz\|Playwright\|Fastify\|React\|Vite\|AKIS\|API\|SSE\|PR\|URL\|OK\|N/A" | head -40
```

Bulunan her İngilizce string'i Türkçeye çevir. Türkçe karakter kontrolü:

```bash
grep -rn "Iyi\|Islem\|Olustur\|Onizle\|Tumun\|calisma\|guven\|Basari\|Akisi\|icerik" frontend/src/ | grep -v node_modules | head -20
```

---

## FAZ 6 — E2E TEST (3 FARKLI PİPELINE)

### Pipeline 1: Hesap makinesi (basit)

```bash
RESP=$(curl -s -X POST http://localhost:3000/api/pipelines \
  -H "Content-Type: application/json" \
  -d '{"idea": "Basit bir hesap makinesi. 4 temel işlem. Web tarayıcısında çalışsın."}')
P1=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('pipeline',{}).get('id','FAIL'))" 2>/dev/null)
echo "P1: $P1"
```

### Pipeline 2: Not defteri (orta karmaşıklık)

```bash
RESP=$(curl -s -X POST http://localhost:3000/api/pipelines \
  -H "Content-Type: application/json" \
  -d '{"idea": "Markdown destekli not alma uygulaması. Notlar kaydedilsin, düzenlensin, silinsin. Kategorilere ayrılabilsin."}')
P2=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('pipeline',{}).get('id','FAIL'))" 2>/dev/null)
echo "P2: $P2"
```

### Pipeline 3: Pomodoro timer (farklı tür)

```bash
RESP=$(curl -s -X POST http://localhost:3000/api/pipelines \
  -H "Content-Type: application/json" \
  -d '{"idea": "Pomodoro zamanlayıcı uygulaması. 25dk çalışma, 5dk mola döngüsü. Ses bildirimi olsun."}')
P3=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('pipeline',{}).get('id','FAIL'))" 2>/dev/null)
echo "P3: $P3"
```

Her pipeline'ı takip et, clarification'a cevap ver, approve et, sonucu kontrol et.

**Her pipeline sonrası kontrol listesi:**
- [ ] Scribe confidence %80+ mı?
- [ ] Proto dosya oluşturdu mu?
- [ ] GitHub'a push etti mi?
- [ ] Trace test yazdı mı?
- [ ] Preview çalışıyor mu?
- [ ] Files paneli düzgün mü?
- [ ] Summary kart düzgün mü?
- [ ] Klonla/GitHub/PR butonları çalışıyor mu?

Bulunan HER sorunu düzelt.

---

## FAZ 7 — STAGING DEPLOY HAZIRLIK

### 7.1 Frontend prod build

```bash
cd frontend && npm run build
ls -la dist/ | head -10
du -sh dist/
```

### 7.2 Docker build test

```bash
# Backend Docker build
cd backend && docker build -t akis-backend:test . 2>&1 | tail -10

# Compose config validation
docker compose -f docker-compose.prod.yml config > /dev/null 2>&1 && echo "✓ Compose valid" || docker compose -f deploy/oci/staging/docker-compose.yml config > /dev/null 2>&1 && echo "✓ Staging compose valid"
```

### 7.3 Environment kontrol

```bash
# .env.example güncel mi?
cat backend/.env.example

# Caddy config doğru mu?
cat Caddyfile 2>/dev/null || find . -name "Caddyfile" | head -3
```

---

## FAZ 8 — SON QA

Her sayfayı kontrol et, her butonu test et:

```
KONTROL LİSTESİ:

Dashboard:
□ Light theme (beyaz arka plan)
□ Full-width (boş alan yok)
□ Stat kartları veri gösteriyor
□ Agent health gerçek veri
□ Son iş akışları listesi
□ Quick actions butonları çalışıyor

Sidebar:
□ Light arka plan
□ Collapse/expand smooth
□ Son iş akışları status dot'larıyla
□ Kullanıcı bilgisi altta
□ Nav linkleri çalışıyor

Workflow Chat:
□ Kullanıcı mesajı sağda bubble (light bg)
□ Agent mesajı solda düz metin
□ Spec kartı collapse/expand
□ Confidence doğru (formatConfidence)
□ Wizard stepper çalışıyor
□ SSE activity stream canlı
□ Toast görünüyor
□ Input bar rounded + model seçici
□ Git context input bar'da

Files Panel:
□ Dosya ağacı yükleniyor
□ Dosyaya tıklayınca kod görünüyor
□ Satır sayıları doğru
□ GitHub ikonları

Preview:
□ StackBlitz yükleniyor
□ Tab'lar arası geçişte cache (tekrar yüklemiyor)
□ Uygulama çalışıyor

Stages:
□ Pipeline progress gösterimi
□ SSE activity log
□ Repository git flow diyagramı

Agents:
□ 3 agent kartı
□ Confidence % doğru
□ Workflow diyagramları
□ Performans metrikleri

Settings:
□ Profil/GitHub/Şifre tab'ları
□ GitHub bağlantı durumu

TÜRKÇE:
□ Tüm sayfalar Türkçe
□ Türkçe karakterler doğru (İ,ı,Ö,ö,Ü,ü,Ş,ş,Ç,ç,Ğ,ğ)
□ Status badge'ler Türkçe
```

---

## FİNAL BUILD

```bash
echo "=== FİNAL BUILD ==="
cd frontend && npx tsc --noEmit && echo "✓ FE typecheck"
cd frontend && npx eslint src/ --quiet 2>/dev/null && echo "✓ FE lint"
cd frontend && npm run build && echo "✓ FE build"
cd frontend && npx vitest run 2>&1 | tail -3
cd ../backend && npx tsc --noEmit && echo "✓ BE typecheck"
cd backend && npx vitest run 2>&1 | tail -3
echo "=== TAMAMLANDI ==="
```

## FİNAL RAPOR

```
## Gece Vardiyası Raporu

### Faz 1: Light Theme
- Dark CSS kaldırıldı: ✓/✗
- Tüm sayfalar beyaz arka plan: ✓/✗

### Faz 2: Confidence İyileştirme
- Eski ortalama: %72
- Yeni ortalama: ___%

### Faz 3: UI Polish
- Sidebar Claude.ai tarzı: ✓/✗
- Chat mesajlar rafine: ✓/✗
- Input bar Claude.ai tarzı: ✓/✗
- Spec kartı artifact style: ✓/✗

### Faz 4: Responsive
- Mobile sidebar: ✓/✗
- Mobile chat: ✓/✗
- Mobile panel: ✓/✗

### Faz 5: Türkçe
- Kalan İngilizce: 0 / ___

### Faz 6: E2E (3 pipeline)
| Pipeline | Scribe | Proto | Trace | Preview | Status |
|----------|--------|-------|-------|---------|--------|
| Hesap Makinesi | ✓/✗ __% | ✓/✗ | ✓/✗ | ✓/✗ | |
| Not Defteri | ✓/✗ __% | ✓/✗ | ✓/✗ | ✓/✗ | |
| Pomodoro | ✓/✗ __% | ✓/✗ | ✓/✗ | ✓/✗ | |

### Faz 7: Deploy Hazırlık
- Frontend build: ✓/✗
- Docker build: ✓/✗

### Faz 8: Son QA
- Bulunan sorun: ___
- Düzeltilen: ___
- Kalan: ___

### Build
- Frontend: typecheck ✓/✗, lint ✓/✗, build ✓/✗, tests ___/275
- Backend: typecheck ✓/✗, tests ___/1329
```

---

## GENEL KURALLAR

- .env dosyalarına ASLA dokunma
- Her faz sonunda BUILD KONTROL
- Sorun bulursan HEMEN düzelt, sonraki faza taşıma
- Web'den araştır: CSS best practices, Claude.ai design patterns, StackBlitz issues
- Pipeline testlerinde API çağrısı yapılacak — kredi yüklü
- DURMA — sabah 05:00'e kadar çalış
- Clean code: unused import temizle, console.log kaldır
