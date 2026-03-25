# AKIS — CANLI PIPELINE TEST & BUG FIX

.env dosyalarına ASLA dokunma. Servisleri kendin başlat.

---

## AMAÇ

Yeni bir pipeline çalıştır, baştan sona her özelliği test et, kırık olan her şeyi düzelt.

---

## FAZ 0 — TEMİZ BAŞLANGIÇ

```bash
# Tüm servisleri temizle ve başlat
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null
sleep 1

docker ps | grep postgres || docker compose -f docker-compose.dev.yml up -d 2>/dev/null
sleep 3

cd backend && DATABASE_URL=postgresql://postgres:postgres@localhost:5433/akis_v2 DEV_MODE=true nohup npx tsx watch src/server.ts > /tmp/akis-backend.log 2>&1 &
sleep 5
curl -sf http://localhost:3000/health && echo "✓ Backend OK" || { echo "✗ Backend FAIL"; tail -30 /tmp/akis-backend.log; exit 1; }

cd ../frontend && nohup npm run dev > /tmp/akis-frontend.log 2>&1 &
sleep 3
curl -sf http://localhost:5173 > /dev/null && echo "✓ Frontend OK" || echo "✗ Frontend FAIL"
```

---

## FAZ 1 — PIPELINE BAŞLAT VE TAKİP ET

```bash
# Yeni pipeline oluştur
echo "=== PIPELINE OLUŞTURULUYOR ==="
RESP=$(curl -s -X POST http://localhost:3000/api/pipelines \
  -H "Content-Type: application/json" \
  -d '{"idea": "Kişisel finans takip uygulaması. Gelir ve gider girişi yapılabilmeli, kategorilere ayırabilmeli, aylık özet grafik gösterebilmeli. Web tarayıcısında çalışmalı."}')

PID=$(echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('pipeline',d).get('id','FAIL'))" 2>/dev/null)
echo "Pipeline ID: $PID"

if [ "$PID" = "FAIL" ] || [ -z "$PID" ]; then
  echo "✗ Pipeline oluşturulamadı!"
  echo "$RESP"
  exit 1
fi
echo "✓ Pipeline oluşturuldu"
```

### Her adımı takip et

```bash
PHASE="init"
CLARIFY_SENT=false
APPROVE_SENT=false

for i in $(seq 1 120); do
  DATA=$(curl -s "http://localhost:3000/api/pipelines/$PID")
  STATUS=$(echo "$DATA" | python3 -c "import sys,json; print(json.load(sys.stdin).get('pipeline',{}).get('status','?'))" 2>/dev/null)
  
  # Sadece phase değişince logla
  if [ "$STATUS" != "$PHASE" ]; then
    echo ""
    echo "=== [$i] STATUS: $STATUS ==="
    PHASE="$STATUS"
    
    case "$STATUS" in
      scribe_generating)
        echo "✓ Scribe analiz ediyor..."
        ;;
      
      scribe_clarifying)
        if [ "$CLARIFY_SENT" = false ]; then
          echo "→ Clarification geldi, cevap gönderiliyor..."
          
          # Soruları göster
          echo "$DATA" | python3 -c "
import sys, json
d = json.load(sys.stdin).get('pipeline',{})
conv = d.get('scribeConversation', [])
for e in conv:
    if e.get('type') == 'clarification':
        qs = e.get('content',{}).get('questions', [])
        for i,q in enumerate(qs):
            qtext = q.get('question', q) if isinstance(q, dict) else q
            print(f'  Soru {i+1}: {qtext[:80]}')
" 2>/dev/null

          sleep 2
          curl -s -X POST "http://localhost:3000/api/pipelines/$PID/message" \
            -H "Content-Type: application/json" \
            -d '{"message": "1. Basit: gelir/gider girişi + kategoriler + aylık özet\n2. Web tarayıcısı\n3. Giriş gerekmez, localStorage kullan\n4. React + Chart.js grafik için"}' > /dev/null
          CLARIFY_SENT=true
          echo "✓ Cevap gönderildi"
        fi
        ;;
      
      awaiting_approval)
        if [ "$APPROVE_SENT" = false ]; then
          echo "→ Spec hazır, kontrol ediliyor..."
          
          # Spec detaylarını göster
          echo "$DATA" | python3 -c "
import sys, json
d = json.load(sys.stdin).get('pipeline',{})
conv = d.get('scribeConversation', [])
for e in conv:
    if e.get('type') == 'spec_draft':
        c = e.get('content', {})
        spec = c.get('spec', c)
        conf = c.get('confidence', spec.get('confidence', '?'))
        stories = spec.get('userStories', [])
        criteria = spec.get('acceptanceCriteria', [])
        review = spec.get('reviewNotes', 'YOK')
        assumptions = spec.get('assumptions', 'YOK')
        print(f'  Confidence: {conf}')
        print(f'  User Stories: {len(stories)}')
        print(f'  Acceptance Criteria: {len(criteria)}')
        print(f'  Review Notes: {str(review)[:150]}')
        print(f'  Assumptions: {str(assumptions)[:150]}')
" 2>/dev/null

          sleep 2
          REPO=$(echo "$DATA" | python3 -c "
import sys,json,re
p=json.load(sys.stdin).get('pipeline',{})
t=p.get('title',p.get('idea','app'))
print(re.sub(r'[^a-z0-9-]','','-'.join(t.lower().split()[:4]))[:40])
" 2>/dev/null)
          
          curl -s -X POST "http://localhost:3000/api/pipelines/$PID/approve" \
            -H "Content-Type: application/json" \
            -d "{\"repoName\": \"$REPO\", \"repoVisibility\": \"private\"}" > /dev/null
          APPROVE_SENT=true
          echo "✓ Onaylandı: $REPO"
        fi
        ;;
      
      proto_building)
        echo "✓ Proto scaffold oluşturuyor..."
        ;;
      
      trace_testing)
        echo "✓ Trace test yazıyor..."
        ;;
      
      completed)
        echo ""
        echo "========================================="
        echo "✓ PIPELINE TAMAMLANDI"
        echo "========================================="
        
        # Detaylı sonuç
        echo "$DATA" | python3 -c "
import sys, json
d = json.load(sys.stdin).get('pipeline',{})
conv = d.get('scribeConversation', [])

print('\n--- SCRIBE ---')
for e in conv:
    if e.get('type') == 'spec_draft':
        c = e.get('content', {})
        spec = c.get('spec', c)
        print(f'  Confidence: {c.get(\"confidence\", spec.get(\"confidence\", \"?\"))}')
        print(f'  Stories: {len(spec.get(\"userStories\", []))}')
        print(f'  Criteria: {len(spec.get(\"acceptanceCriteria\", []))}')
        rn = spec.get('reviewNotes', None)
        if rn:
            print(f'  Self-Review: {json.dumps(rn)[:200]}')
        ass = spec.get('assumptions', None)
        if ass:
            print(f'  Assumptions: {json.dumps(ass)[:200]}')

print('\n--- PROTO ---')
for e in conv:
    t = e.get('type','')
    if 'proto' in t.lower() and 'complete' in t.lower():
        c = e.get('content', {})
        files = c.get('files', [])
        print(f'  Files: {len(files)}')
        total_lines = sum(f.get('lines', 0) if isinstance(f, dict) else 0 for f in files)
        print(f'  Total lines: {total_lines}')
        print(f'  Branch: {c.get(\"branch\", \"?\")}')
        print(f'  Repo: {c.get(\"repo\", c.get(\"repoUrl\", \"?\"))}')
        vr = c.get('verificationReport', None)
        if vr:
            print(f'  Verification: {json.dumps(vr)[:200]}')

print('\n--- TRACE ---')
for e in conv:
    t = e.get('type','')
    if 'trace' in t.lower() and ('complete' in t.lower() or 'result' in t.lower()):
        c = e.get('content', {})
        tf = c.get('testFiles', c.get('tests', []))
        print(f'  Test files: {len(tf) if isinstance(tf, list) else tf}')
        cm = c.get('coverageMatrix', None)
        if cm:
            print(f'  Coverage: {json.dumps(cm)[:200]}')
        tr = c.get('traceability', None)
        if tr:
            print(f'  Traceability: {json.dumps(tr)[:200]}')
" 2>/dev/null
        break
        ;;
      
      failed|completed_partial)
        echo ""
        echo "========================================="
        echo "✗ PIPELINE BAŞARISIZ: $STATUS"
        echo "========================================="
        
        # Hata detayı
        echo "$DATA" | python3 -c "
import sys, json
d = json.load(sys.stdin).get('pipeline',{})
for name, stage in d.get('stages', {}).items():
    if isinstance(stage, dict) and stage.get('error'):
        print(f'  {name}: {stage[\"error\"][:200]}')
" 2>/dev/null
        
        # Backend loglarında hata ara
        echo ""
        echo "--- Backend log (son 30 satır) ---"
        tail -30 /tmp/akis-backend.log | grep -i "error\|fail\|exception" | tail -10
        break
        ;;
    esac
  fi
  
  sleep 3
done
```

---

## FAZ 2 — SSE ACTIVITY STREAM TEST

```bash
echo ""
echo "=== SSE ACTIVITY STREAM TEST ==="

# SSE endpoint'i çalışıyor mu?
SSE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -N \
  -H "Accept: text/event-stream" \
  "http://localhost:3000/api/pipelines/$PID/stream" &
SSE_PID=$!
sleep 2
kill $SSE_PID 2>/dev/null
echo "$SSE_STATUS")

if [ "$SSE_STATUS" = "200" ]; then
  echo "✓ SSE endpoint çalışıyor (200)"
else
  echo "✗ SSE endpoint sorunlu (status: $SSE_STATUS)"
fi
```

---

## FAZ 3 — FRONTEND KONTROL

### 3.1 Console hataları

```bash
echo ""
echo "=== FRONTEND KONTROL ==="

# Sayfalar yükleniyor mu?
for page in "dashboard" "dashboard/workflows" "dashboard/agents" "dashboard/settings"; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5173/$page")
  if [ "$STATUS" = "200" ]; then
    echo "✓ /$page → 200"
  else
    echo "✗ /$page → $STATUS"
  fi
done

# Workflow detail yükleniyor mu?
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5173/dashboard/workflows/$PID")
echo "✓ /workflows/$PID → $STATUS"
```

### 3.2 API istekleri kontrol

```bash
echo ""
echo "=== API İSTEKLERİ ==="

# Pipeline detay
DETAIL=$(curl -s "http://localhost:3000/api/pipelines/$PID")
echo "Pipeline status: $(echo "$DETAIL" | python3 -c "import sys,json; print(json.load(sys.stdin).get('pipeline',{}).get('status','?'))" 2>/dev/null)"

# files-all endpoint
FILES_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/pipelines/$PID/files-all")
echo "files-all endpoint: $FILES_STATUS"

if [ "$FILES_STATUS" = "200" ]; then
  curl -s "http://localhost:3000/api/pipelines/$PID/files-all" | python3 -c "
import sys, json
data = json.load(sys.stdin)
files = data.get('files', {})
print(f'  Toplam dosya: {len(files)}')
for name in list(files.keys())[:5]:
    print(f'    {name}: {len(files[name])} karakter')
" 2>/dev/null
fi

# Usage endpoint
USAGE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/usage/current-month")
echo "usage endpoint: $USAGE_STATUS"
```

---

## FAZ 4 — BULUNAN SORUNLARI DÜZELT

Yukarıdaki testlerde bulunan TÜM sorunları listele ve sırayla düzelt.

**Düzeltme önceliği:**
1. Pipeline çalışmayı engelleyen hatalar (kritik)
2. Yanlış veri gösteren UI (confidence %, test sayısı, dosya sayısı)
3. Çalışmayan butonlar (Klonla, PR Oluştur, Devam Et)
4. Console hataları
5. Türkçe eksikler
6. Görsel sorunlar

Her düzeltme sonrası:
```bash
cd frontend && npx tsc --noEmit && echo "✓ typecheck" || echo "✗ typecheck"
```

---

## FAZ 5 — İKİNCİ PIPELINE (Farklı proje tipi)

İlk pipeline tamamlanıp sorunlar düzeltildikten sonra, farklı bir proje tipi ile test et:

```bash
echo ""
echo "=== İKİNCİ PIPELINE (farklı proje) ==="

RESP2=$(curl -s -X POST http://localhost:3000/api/pipelines \
  -H "Content-Type: application/json" \
  -d '{"idea": "Hava durumu uygulaması. Şehir arama yapılabilmeli, 5 günlük tahmin gösterebilmeli, sıcaklık ve nem bilgisi olmalı. Basit ve sade tasarım."}')

PID2=$(echo "$RESP2" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('pipeline',d).get('id','FAIL'))" 2>/dev/null)
echo "Pipeline 2 ID: $PID2"

# Aynı akışla takip et...
for i in $(seq 1 90); do
  STATUS2=$(curl -s "http://localhost:3000/api/pipelines/$PID2" | python3 -c "import sys,json; print(json.load(sys.stdin).get('pipeline',{}).get('status','?'))" 2>/dev/null)
  
  if [ "$STATUS2" = "scribe_clarifying" ]; then
    curl -s -X POST "http://localhost:3000/api/pipelines/$PID2/message" \
      -H "Content-Type: application/json" \
      -d '{"message": "1. Basit hava durumu gösterimi\n2. Web tarayıcısı\n3. OpenWeatherMap API kullanılabilir\n4. Giriş gerekmez"}' > /dev/null
    echo "[$i] Clarification cevabı gönderildi"
  fi
  
  if [ "$STATUS2" = "awaiting_approval" ]; then
    curl -s -X POST "http://localhost:3000/api/pipelines/$PID2/approve" \
      -H "Content-Type: application/json" \
      -d '{"repoName": "hava-durumu-app", "repoVisibility": "private"}' > /dev/null
    echo "[$i] Onaylandı"
  fi
  
  if [ "$STATUS2" = "completed" ] || [ "$STATUS2" = "failed" ] || [ "$STATUS2" = "completed_partial" ]; then
    echo "Pipeline 2 sonuç: $STATUS2"
    break
  fi
  
  [ $((i % 10)) -eq 0 ] && echo "[$i] $STATUS2"
  sleep 3
done
```

---

## FAZ 6 — DASHBOARD VERİFİKASYON

İki pipeline tamamlandıktan sonra dashboard'un durumunu kontrol et:

```bash
echo ""
echo "=== DASHBOARD VERİFİKASYON ==="

curl -s http://localhost:3000/api/pipelines | python3 -c "
import sys, json
data = json.load(sys.stdin)
plist = data.get('pipelines', data) if isinstance(data, dict) else data
plist = plist if isinstance(plist, list) else []

total = len(plist)
completed = sum(1 for p in plist if p.get('status') == 'completed')
failed = sum(1 for p in plist if p.get('status') in ['failed', 'completed_partial'])

print(f'Toplam pipeline: {total}')
print(f'Tamamlanan: {completed}')
print(f'Başarısız: {failed}')
print(f'Başarı oranı: {completed/total*100:.0f}%' if total > 0 else 'N/A')

for p in plist:
    print(f'  {p.get(\"id\",\"?\")[:8]}... | {p.get(\"status\")} | {p.get(\"title\",p.get(\"idea\",\"?\"))[:40]}')
" 2>/dev/null
```

---

## FAZ 7 — FİNAL BUILD

```bash
echo ""
echo "=== FINAL BUILD ==="
cd frontend && npx tsc --noEmit && echo "✓ FE typecheck" || echo "✗ FE typecheck"
cd frontend && npx eslint src/ --quiet 2>/dev/null && echo "✓ FE lint" || echo "✗ FE lint"
cd frontend && npm run build && echo "✓ FE build" || echo "✗ FE build"
cd ../backend && npx tsc --noEmit && echo "✓ BE typecheck" || echo "✗ BE typecheck"
```

---

## FAZ 8 — KAPSAMLı RAPOR

```
## AKIS Canlı Pipeline Test Raporu

### Pipeline 1: Kişisel Finans Takip
| Adım | Durum | Detay |
|------|-------|-------|
| Oluşturma | ✓/✗ | |
| Scribe clarification | ✓/✗ | ___ soru |
| Cevap gönderme | ✓/✗ | |
| Spec üretimi | ✓/✗ | ___% confidence, ___ story, ___ criteria |
| Self-review notes | ✓/✗ | var/yok |
| Assumptions | ✓/✗ | var/yok |
| Approve | ✓/✗ | repo: ___ |
| Proto scaffold | ✓/✗ | ___ dosya, ___ satır |
| Proto verification | ✓/✗ | var/yok |
| GitHub push | ✓/✗ | branch: ___ |
| Trace testler | ✓/✗ | ___ test |
| Trace traceability | ✓/✗ | var/yok |
| Pipeline final | ✓/✗ | status: ___ |

### Pipeline 2: Hava Durumu
| Adım | Durum | Detay |
|------|-------|-------|
| (aynı format) | | |

### SSE Activity Stream
| Kontrol | Durum |
|---------|-------|
| SSE endpoint (200) | ✓/✗ |
| Floating toast görünüyor mu | ✓/✗ (manual check needed) |

### API Endpoints
| Endpoint | Status |
|----------|--------|
| GET /api/pipelines | ✓/✗ |
| GET /api/pipelines/:id | ✓/✗ |
| POST /api/pipelines | ✓/✗ |
| POST /api/pipelines/:id/message | ✓/✗ |
| POST /api/pipelines/:id/approve | ✓/✗ |
| GET /api/pipelines/:id/files-all | ✓/✗ |
| GET /api/pipelines/:id/stream | ✓/✗ |

### Düzeltilen Sorunlar
1. ...

### Kalan Sorunlar
1. ...

### Build
- Frontend typecheck: ✓/✗
- Frontend lint: ✓/✗
- Frontend build: ✓/✗
- Backend typecheck: ✓/✗
```
