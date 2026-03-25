# AKIS — TRACE TIMEOUT BUG FIX

.env dosyalarına ASLA dokunma.

---

## SORUN

"Kişisel Bütçe Takip" pipeline'ı `completed_partial` oldu çünkü Trace timeout'a düştü. Diğer 3 pipeline'da (Pomodoro, Markdown, Hesap Makinesi) Trace sorunsuz çalıştı. Fark ne?

---

## ADIM 0 — ROOT CAUSE ANALİZİ

### 0.1 Timeout'lu pipeline'ın detaylarını çek

```bash
# completed_partial pipeline'ı bul
curl -s http://localhost:3000/api/pipelines | python3 -c "
import sys, json
data = json.load(sys.stdin)
plist = data.get('pipelines', data) if isinstance(data, dict) else data
for p in (plist if isinstance(plist, list) else []):
    if p.get('status') == 'completed_partial':
        print(f'ID: {p[\"id\"]}')
        print(f'Title: {p.get(\"title\", \"?\")}')
        
        # Stages detayı
        stages = p.get('stages', {})
        for name, stage in stages.items():
            if isinstance(stage, dict):
                print(f'  {name}: status={stage.get(\"status\")}, error={stage.get(\"error\",\"none\")[:200] if stage.get(\"error\") else \"none\"}')
        
        # Scribe conversation'dan trace bilgisi
        conv = p.get('scribeConversation', [])
        for e in conv:
            t = e.get('type', '')
            if 'trace' in t.lower() or 'error' in t.lower() or 'fail' in t.lower():
                print(f'  conv: type={t}, content={str(e.get(\"content\",\"\"))[:200]}')
        
        # Proto output — kaç dosya?
        for e in conv:
            t = e.get('type', '')
            if 'proto' in t.lower() and 'complete' in t.lower():
                c = e.get('content', {})
                files = c.get('files', [])
                print(f'  Proto files: {len(files)}')
                for f in files[:20]:
                    if isinstance(f, dict):
                        print(f'    {f.get(\"path\", f.get(\"name\", \"?\"))}: {f.get(\"lines\", \"?\")}L')
        break
" 2>/dev/null
```

### 0.2 Başarılı pipeline ile karşılaştır

```bash
# Başarılı bir pipeline'ın proto file sayısını karşılaştır
curl -s http://localhost:3000/api/pipelines | python3 -c "
import sys, json
data = json.load(sys.stdin)
plist = data.get('pipelines', data) if isinstance(data, dict) else data
for p in (plist if isinstance(plist, list) else []):
    if p.get('status') == 'completed':
        conv = p.get('scribeConversation', [])
        for e in conv:
            t = e.get('type', '')
            if 'proto' in t.lower() and 'complete' in t.lower():
                c = e.get('content', {})
                files = c.get('files', [])
                total_lines = sum(f.get('lines', 0) if isinstance(f, dict) else 0 for f in files)
                print(f'{p.get(\"title\",\"?\")[:30]}: {len(files)} files, {total_lines} lines')
        break
" 2>/dev/null
```

### 0.3 Backend loglarını kontrol et

```bash
# Trace timeout hatası
grep -i "trace\|timeout\|ETIMEDOUT\|deadline\|exceeded\|abort" /tmp/akis-backend.log | tail -30

# withTimeout fonksiyonunu bul
grep -rn "withTimeout\|stageTimeoutMs\|timeout" backend/src/pipeline/core/orchestrator/ | head -10
```

### 0.4 Timeout süresini kontrol et

```bash
# Mevcut timeout değeri
grep -rn "timeout\|5.*60\|300000\|5 \* 60\|stageTimeout" backend/src/pipeline/ | grep -v node_modules | head -10
```

---

## ADIM 1 — MUHTEMEL NEDENLER VE FIX'LER

### Neden A: Dosya sayısı çok fazla → Trace AI çağrısı uzun sürüyor

Bütçe takip 14 dosya, 649 satır. Diğerleri 11-13 dosya. Dosya sayısı fazla olduğunda:
- Trace tüm dosyaları GitHub'dan okuyor
- Tüm dosya içeriklerini Claude API'ye gönderiyor
- Claude daha fazla test yazıyor → daha uzun süre → timeout

**Fix A: Timeout'u artır**

```bash
# Mevcut timeout değerini bul
grep -rn "300000\|5.*60.*1000\|stageTimeout\|withTimeout" backend/src/pipeline/ | head -10
```

Trace için timeout'u 5dk → 10dk'ya çıkar:

```typescript
// withTimeout çağrısında veya config'de:
const TRACE_TIMEOUT_MS = 10 * 60 * 1000; // 10 dakika (eskisi 5dk)
```

Veya agent-bazlı timeout ayarla:

```typescript
const STAGE_TIMEOUTS = {
  scribe: 5 * 60 * 1000,   // 5 dakika
  proto: 5 * 60 * 1000,    // 5 dakika
  trace: 10 * 60 * 1000,   // 10 dakika — daha fazla dosya okuma + test yazma
};
```

### Neden B: Trace prompt'u çok büyük → token limiti aşılıyor

Trace tüm dosya içeriklerini prompt'a koyuyor. 14 dosya × ortalama 50 satır = 700 satır kod → çok büyük prompt.

**Fix B: Trace prompt'unda dosya içeriklerini kısalt**

```bash
# Trace agent'ın dosyaları nasıl okuduğunu bul
grep -rn "getContent\|readFile\|fetchFile" backend/src/agents/trace/ | head -10
grep -rn "content\|fileContent\|sourceCode" backend/src/agents/trace/ | head -10
```

Trace'e gönderilen dosya içeriklerini sınırla:
- Her dosya max 100 satır (geri kalan truncate)
- Test dosyaları ve config dosyaları ATLA (sadece src/ dosyaları gönder)
- Veya dosya listesi + yapı bilgisi gönder, tüm içerik yerine

### Neden C: GitHub API rate limit

Trace GitHub'dan dosya okurken rate limit'e takılmış olabilir.

```bash
# GitHub API rate limit kontrolü
grep -i "rate\|limit\|403\|429" /tmp/akis-backend.log | tail -10
```

**Fix C:** Dosyaları Proto output'undan al, GitHub'dan tekrar çekme.

### Neden D: Trace agent retry olmadan direk fail oluyor

```bash
# Retry mekanizması var mı?
grep -rn "retry\|attempt\|maxAttempt" backend/src/pipeline/ | head -10
```

**Fix D:** Trace'e 1 retry ekle (timeout olursa daha kısa prompt ile tekrar dene).

---

## ADIM 2 — FIX UYGULA

Root cause'a göre en uygun fix'i uygula. Muhtemelen birden fazla fix gerekecek:

1. **Timeout artır** (kesin yap — 5dk → 10dk)
2. **Trace prompt boyutunu optimize et** (büyük dosyaları truncate)
3. **Retry ekle** (1 deneme daha)

---

## ADIM 3 — TEST

### 3.1 Bütçe takip pipeline'ını tekrar çalıştır

```bash
RESP=$(curl -s -X POST http://localhost:3000/api/pipelines \
  -H "Content-Type: application/json" \
  -d '{"idea": "Kişisel bütçe takip uygulaması. Gelir ve gider girişi, kategoriler, aylık grafik."}')
PID=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('pipeline',{}).get('id','FAIL'))" 2>/dev/null)
echo "Test pipeline: $PID"

for i in $(seq 1 120); do
  STATUS=$(curl -s "http://localhost:3000/api/pipelines/$PID" | python3 -c "import sys,json; print(json.load(sys.stdin).get('pipeline',{}).get('status','?'))" 2>/dev/null)
  
  if [ "$STATUS" = "scribe_clarifying" ]; then
    curl -s -X POST "http://localhost:3000/api/pipelines/$PID/message" \
      -H "Content-Type: application/json" \
      -d '{"message": "1. Basit: gelir/gider + kategoriler + grafik\n2. Web\n3. localStorage\n4. React + Chart.js"}' > /dev/null
    echo "[$i] Cevap gönderildi"
  fi
  
  if [ "$STATUS" = "awaiting_approval" ]; then
    curl -s -X POST "http://localhost:3000/api/pipelines/$PID/approve" \
      -H "Content-Type: application/json" \
      -d '{"repoName": "butce-takip-v2", "repoVisibility": "private"}' > /dev/null
    echo "[$i] Onaylandı"
  fi
  
  if [ "$STATUS" = "completed" ]; then
    echo "✓ BAŞARILI — Trace timeout düzeldi!"
    
    # Trace detaylarını göster
    curl -s "http://localhost:3000/api/pipelines/$PID" | python3 -c "
import sys, json
d = json.load(sys.stdin).get('pipeline',{})
conv = d.get('scribeConversation', [])
for e in conv:
    t = e.get('type','')
    if 'trace' in t.lower():
        c = e.get('content', {})
        print(f'Trace: {len(c.get(\"testFiles\", c.get(\"tests\", [])))} test files')
        print(f'Coverage: {c.get(\"coverageMatrix\", {}).get(\"coveragePercent\", \"?\")}%')
" 2>/dev/null
    break
  fi
  
  if [ "$STATUS" = "completed_partial" ] || [ "$STATUS" = "failed" ]; then
    echo "✗ HÂLÂ SORUNLU: $STATUS"
    # Hata detayı
    curl -s "http://localhost:3000/api/pipelines/$PID" | python3 -c "
import sys, json
d = json.load(sys.stdin).get('pipeline',{})
for name, stage in d.get('stages', {}).items():
    if isinstance(stage, dict) and stage.get('error'):
        print(f'  {name}: {stage[\"error\"][:300]}')
" 2>/dev/null
    grep -i "trace\|timeout\|error" /tmp/akis-backend.log | tail -10
    break
  fi
  
  [ $((i % 15)) -eq 0 ] && echo "[$i] $STATUS"
  sleep 3
done
```

### 3.2 Önceki 3 başarılı pipeline hâlâ çalışıyor mu kontrol et

```bash
curl -s http://localhost:3000/api/pipelines | python3 -c "
import sys, json
data = json.load(sys.stdin)
plist = data.get('pipelines', data) if isinstance(data, dict) else data
completed = sum(1 for p in (plist if isinstance(plist, list) else []) if p.get('status') == 'completed')
partial = sum(1 for p in (plist if isinstance(plist, list) else []) if p.get('status') == 'completed_partial')
print(f'Completed: {completed}, Partial: {partial}')
" 2>/dev/null
```

---

## ADIM 4 — BUILD

```bash
cd frontend && npx tsc --noEmit && echo "✓ FE"
cd ../backend && npx tsc --noEmit && echo "✓ BE"
```

```
## Trace Timeout Fix Raporu

### Root Cause
- Neden: ___

### Fix
- Timeout artırıldı: ✓/✗ (yeni değer: ___dk)
- Prompt optimize edildi: ✓/✗
- Retry eklendi: ✓/✗

### Test
- Bütçe takip pipeline: completed / completed_partial / failed
- Trace test sayısı: ___
- Trace coverage: ___%
- Mevcut 3 pipeline bozulmadı: ✓/✗

### Build
- Frontend: ✓/✗
- Backend: ✓/✗
```
