# AKIS — DEV MODE PUSH TEST PLANI

.env dosyalarına ASLA dokunma. Servisleri kendin başlat, kendin test et.

---

## AMAÇ

Dev Mode'un Push to GitHub özelliğini tam end-to-end test et. Kullanıcı chat'te mesaj yazıyor → DevAgent dosya değişikliği öneriyor → kullanıcı onaylıyor → GitHub'a commit push ediliyor. Bu akışın her adımını doğrula.

---

## YASAK KURALLAR

- .env dosyalarına DOKUNMA
- Mevcut pipeline endpoint'lerini DEĞİŞTİRME
- Mevcut çalışan kodu BOZMA
- Test amacıyla main branch'e push YAPMA
- Yeni npm paketi EKLEME

---

## ADIM 0 — SERVİSLERİ BAŞLAT

```bash
# Portları temizle
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null
sleep 1

# DB çalışıyor mu?
docker ps | grep postgres || docker compose -f docker-compose.dev.yml up -d 2>/dev/null
sleep 3

# DB bağlantısı test
docker exec $(docker ps -q --filter ancestor=postgres:16-alpine 2>/dev/null || docker ps -q --filter name=postgres) pg_isready -U postgres 2>/dev/null && echo "✓ DB ready" || echo "✗ DB not ready"

# Backend başlat
cd backend
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/akis_v2 DEV_MODE=true nohup npx tsx watch src/server.ts > /tmp/akis-backend.log 2>&1 &
sleep 5

# Backend health check
curl -sf http://localhost:3000/health && echo "✓ Backend running" || { echo "✗ Backend failed"; cat /tmp/akis-backend.log | tail -20; exit 1; }

# Frontend başlat
cd ../frontend
nohup npm run dev > /tmp/akis-frontend.log 2>&1 &
sleep 3
echo "✓ Frontend running"
```

---

## ADIM 1 — TAMAMLANMIŞ PİPELINE OLUŞTUR

Dev Mode sadece completed pipeline'larda çalışır. Yeni bir pipeline oluştur ve tamamlanmasını bekle.

```bash
# Yeni pipeline oluştur
RESPONSE=$(curl -s -X POST http://localhost:3000/api/pipeline \
  -H "Content-Type: application/json" \
  -d '{"idea": "Basit bir sayac uygulamasi. Artir ve azalt butonlari olsun, sayi ekranda gosterilsin.", "targetRepo": "OmerYasirOnal/akis-platform-devolopment"}')

echo "$RESPONSE" | python3 -m json.tool

# Pipeline ID'yi çıkar
PIPELINE_ID=$(echo "$RESPONSE" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('pipelineId', d.get('id', '')))")
echo "Pipeline ID: $PIPELINE_ID"
```

Scribe'ın tamamlanmasını bekle:

```bash
# Polling — Scribe bitene kadar bekle (max 2 dakika)
for i in $(seq 1 60); do
  STATUS=$(curl -s http://localhost:3000/api/pipeline/$PIPELINE_ID | python3 -c "
import sys, json
d = json.load(sys.stdin)
p = d.get('pipeline', d)
scribe = p.get('stages', {}).get('scribe', {})
print(scribe.get('status', 'unknown'))
" 2>/dev/null)
  echo "[$i] Scribe status: $STATUS"
  if [ "$STATUS" = "completed" ]; then
    echo "✓ Scribe completed"
    break
  fi
  sleep 2
done
```

Onay ver ve Proto + Trace'in bitmesini bekle:

```bash
# Approve
curl -s -X POST http://localhost:3000/api/pipeline/$PIPELINE_ID/approve | python3 -m json.tool

# Pipeline tamamlanana kadar bekle (max 5 dakika)
for i in $(seq 1 150); do
  RESULT=$(curl -s http://localhost:3000/api/pipeline/$PIPELINE_ID | python3 -c "
import sys, json
d = json.load(sys.stdin)
p = d.get('pipeline', d)
status = p.get('status', 'unknown')
proto = p.get('stages', {}).get('proto', {})
branch = proto.get('output', {}).get('branch', '') if isinstance(proto.get('output'), dict) else ''
repo = proto.get('output', {}).get('repo', '') if isinstance(proto.get('output'), dict) else ''
print(f'{status}|{branch}|{repo}')
" 2>/dev/null)
  
  STATUS=$(echo "$RESULT" | cut -d'|' -f1)
  BRANCH=$(echo "$RESULT" | cut -d'|' -f2)
  REPO=$(echo "$RESULT" | cut -d'|' -f3)
  
  echo "[$i] Pipeline: $STATUS | Branch: $BRANCH"
  
  if [ "$STATUS" = "completed" ] || [ "$STATUS" = "completed_partial" ]; then
    echo "✓ Pipeline completed"
    echo "Branch: $BRANCH"
    echo "Repo: $REPO"
    break
  fi
  sleep 2
done
```

**KAYDET:** PIPELINE_ID, BRANCH, REPO değerlerini not al. Sonraki adımlarda kullanılacak.

**DOĞRULA:** Branch'in GitHub'da var olduğunu kontrol et:

```bash
# GitHub'dan branch'i doğrula (GitHub token mevcut .env'den okunuyor — token'a DOKUNMA)
# Backend loglarından branch adını oku
BRANCH_NAME=$(curl -s http://localhost:3000/api/pipeline/$PIPELINE_ID | python3 -c "
import sys, json
d = json.load(sys.stdin)
p = d.get('pipeline', d)
proto = p.get('stages', {}).get('proto', {})
output = proto.get('output', {}) if isinstance(proto.get('output'), dict) else {}
print(output.get('branch', 'UNKNOWN'))
")
echo "Proto branch: $BRANCH_NAME"
```

---

## ADIM 2 — DEV SESSION BAŞLAT

```bash
# Dev session başlat
SESSION_RESPONSE=$(curl -s -X POST http://localhost:3000/api/pipeline/$PIPELINE_ID/dev/start)
echo "$SESSION_RESPONSE" | python3 -m json.tool | head -30

# Session ID'yi çıkar
SESSION_ID=$(echo "$SESSION_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('sessionId', ''))")
echo "Session ID: $SESSION_ID"

# Dosya ağacı geldi mi?
FILE_COUNT=$(echo "$SESSION_RESPONSE" | python3 -c "
import sys, json
d = json.load(sys.stdin)
tree = d.get('fileTree', [])
def count_files(nodes):
    c = 0
    for n in nodes:
        if n.get('type') == 'file': c += 1
        if n.get('children'): c += count_files(n['children'])
    return c
print(count_files(tree))
")
echo "Files in tree: $FILE_COUNT"
```

**DOĞRULA:**
- `SESSION_ID` boş değil
- `FILE_COUNT` > 0 (dosya ağacı GitHub'dan çekildi)

---

## ADIM 3 — CHAT İLE DOSYA DEĞİŞİKLİĞİ İSTE

DevAgent'a bir dosya değişikliği mesajı gönder. SSE stream'i oku:

```bash
# Chat mesajı gönder — SSE response gelecek
echo "--- SSE Stream başlıyor ---"
curl -N -s -X POST http://localhost:3000/api/pipeline/$PIPELINE_ID/dev/chat \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\": \"$SESSION_ID\", \"message\": \"Sayaca bir Reset butonu ekle. Butona basilinca sayac sifira donecek.\"}" \
  --max-time 120 > /tmp/akis-dev-chat-response.txt 2>&1

echo "--- SSE Stream bitti ---"
cat /tmp/akis-dev-chat-response.txt
```

SSE response'u parse et:

```bash
# Response'u analiz et
python3 << 'PYEOF'
import json

with open('/tmp/akis-dev-chat-response.txt', 'r') as f:
    content = f.read()

print("=== RAW RESPONSE (ilk 500 char) ===")
print(content[:500])
print("...")
print()

# SSE data satırlarını parse et
lines = content.split('\n')
for line in lines:
    if line.startswith('data: '):
        try:
            data = json.loads(line[6:])
            msg_type = data.get('type', '?')
            
            if msg_type == 'text':
                print(f"✓ TEXT yanıt: {data['content'][:150]}...")
            elif msg_type == 'file_changes':
                changes = data.get('changes', [])
                print(f"✓ FILE CHANGES: {len(changes)} dosya")
                for c in changes:
                    print(f"  {c['action']:8s} {c['path']}")
                    if c.get('content'):
                        print(f"           ({len(c['content'])} karakter)")
            elif msg_type == 'done':
                print("✓ DONE — Stream tamamlandı")
            elif msg_type == 'error':
                print(f"✗ ERROR: {data.get('content', '?')}")
        except json.JSONDecodeError:
            pass
PYEOF
```

**DOĞRULA:**
- `TEXT` yanıt geldi (agent açıklama yazdı)
- `FILE_CHANGES` en az 1 dosya değişikliği içeriyor
- `DONE` sinyali geldi
- ERROR yok

---

## ADIM 4 — DOSYA DEĞİŞİKLİĞİ PENDING DURUMUNDA MI?

Session'ı kontrol et ve pending mesajı bul:

```bash
# Session bilgisini çek
SESSION_DATA=$(curl -s http://localhost:3000/api/pipeline/$PIPELINE_ID/dev/session)

# Pending file changes olan mesajı bul
python3 << PYEOF
import json

data = json.loads('''$SESSION_DATA''')
messages = data.get('messages', [])

print(f"Toplam mesaj: {len(messages)}")
print()

pending_msg_id = None
for msg in messages:
    role = msg.get('role', '?')
    status = msg.get('changeStatus', '-')
    changes = msg.get('fileChanges', [])
    
    print(f"  [{role:10s}] status={status:10s} changes={len(changes) if changes else 0}")
    
    if role == 'assistant' and changes and status == 'pending':
        pending_msg_id = msg['id']
        print(f"  → PENDING MESSAGE ID: {pending_msg_id}")
        for c in changes:
            print(f"    {c['action']:8s} {c['path']}")

if pending_msg_id:
    print(f"\n✓ Pending mesaj bulundu: {pending_msg_id}")
else:
    print("\n✗ Pending mesaj bulunamadı!")
PYEOF
```

**KAYDET:** `PENDING_MSG_ID` — push için kullanılacak.

```bash
# Pending message ID'yi shell değişkenine al
PENDING_MSG_ID=$(echo "$SESSION_DATA" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for msg in data.get('messages', []):
    if msg.get('role') == 'assistant' and msg.get('changeStatus') == 'pending' and msg.get('fileChanges'):
        print(msg['id'])
        break
")
echo "Pending Message ID: $PENDING_MSG_ID"
```

---

## ADIM 5 — PUSH TO GITHUB

Bu kritik adım — dosya değişikliklerini GitHub'a push et:

```bash
# GitHub'a push
echo "=== PUSHING TO GITHUB ==="
PUSH_RESPONSE=$(curl -s -X POST http://localhost:3000/api/pipeline/$PIPELINE_ID/dev/push \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\": \"$SESSION_ID\", \"messageId\": \"$PENDING_MSG_ID\"}")

echo "$PUSH_RESPONSE" | python3 -m json.tool

# Commit SHA ve URL'yi çıkar
COMMIT_SHA=$(echo "$PUSH_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('commitSha', 'FAILED'))" 2>/dev/null)
COMMIT_URL=$(echo "$PUSH_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('commitUrl', 'FAILED'))" 2>/dev/null)

echo ""
echo "Commit SHA: $COMMIT_SHA"
echo "Commit URL: $COMMIT_URL"

if [ "$COMMIT_SHA" != "FAILED" ] && [ -n "$COMMIT_SHA" ]; then
  echo "✓ PUSH BAŞARILI!"
else
  echo "✗ PUSH BAŞARISIZ!"
  echo "Response: $PUSH_RESPONSE"
  # Hata loglarını kontrol et
  echo ""
  echo "=== Backend logs (son 30 satır) ==="
  tail -30 /tmp/akis-backend.log
fi
```

---

## ADIM 6 — PUSH SONRASI DOĞRULAMA

### 6.1 Message Durumu Güncellendi mi?

```bash
# Session'ı tekrar çek
POST_PUSH_SESSION=$(curl -s http://localhost:3000/api/pipeline/$PIPELINE_ID/dev/session)

python3 << PYEOF
import json

data = json.loads('''$POST_PUSH_SESSION''')
session = data.get('session', {})
messages = data.get('messages', [])

print(f"Session total commits: {session.get('totalCommits', 0)}")
print()

for msg in messages:
    if msg.get('role') == 'assistant' and msg.get('fileChanges'):
        status = msg.get('changeStatus', '?')
        sha = msg.get('commitSha', '-')
        print(f"  Message status: {status}")
        print(f"  Commit SHA: {sha}")
        
        if status == 'pushed':
            print("  ✓ Mesaj durumu 'pushed' olarak güncellendi")
        else:
            print(f"  ✗ Mesaj durumu hala '{status}' — 'pushed' olmalıydı")
        
        if sha and sha != '-':
            print("  ✓ Commit SHA kaydedildi")
        else:
            print("  ✗ Commit SHA kaydedilmedi")
PYEOF
```

### 6.2 GitHub'da Commit Var mı?

```bash
# GitHub API ile commit'i doğrula
# Not: Bu GitHub token gerektirir — backend'in kullandığı token ile çalışır
# Token'a DOKUNMA — sadece backend üzerinden dolaylı doğrulama yap

# Branch bilgisini al
BRANCH_NAME=$(curl -s http://localhost:3000/api/pipeline/$PIPELINE_ID | python3 -c "
import sys, json
d = json.load(sys.stdin)
p = d.get('pipeline', d)
proto = p.get('stages', {}).get('proto', {})
output = proto.get('output', {}) if isinstance(proto.get('output'), dict) else {}
print(output.get('branch', 'UNKNOWN'))
")

echo "Branch: $BRANCH_NAME"
echo "Commit SHA: $COMMIT_SHA"
echo ""
echo "GitHub'da doğrulamak için:"
echo "  https://github.com/OmerYasirOnal/akis-platform-devolopment/commits/$BRANCH_NAME"
echo "  https://github.com/OmerYasirOnal/akis-platform-devolopment/commit/$COMMIT_SHA"
```

### 6.3 İkinci Mesaj — Context Korunuyor mu?

Push başarılıysa, ikinci bir mesaj gönder. Agent'ın önceki değişikliği bilmesini doğrula:

```bash
echo "=== İKİNCİ MESAJ — Context Testi ==="

curl -N -s -X POST http://localhost:3000/api/pipeline/$PIPELINE_ID/dev/chat \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\": \"$SESSION_ID\", \"message\": \"Az once ekledigim Reset butonunun rengini kirmizi yap\"}" \
  --max-time 120 > /tmp/akis-dev-chat-response-2.txt 2>&1

python3 << 'PYEOF'
import json

with open('/tmp/akis-dev-chat-response-2.txt', 'r') as f:
    content = f.read()

lines = content.split('\n')
has_text = False
has_changes = False
mentions_reset = False

for line in lines:
    if line.startswith('data: '):
        try:
            data = json.loads(line[6:])
            
            if data.get('type') == 'text':
                has_text = True
                text = data['content'].lower()
                if 'reset' in text or 'sıfırla' in text or 'buton' in text:
                    mentions_reset = True
                print(f"TEXT (ilk 200): {data['content'][:200]}...")
                
            elif data.get('type') == 'file_changes':
                has_changes = True
                for c in data.get('changes', []):
                    print(f"CHANGE: {c['action']} {c['path']}")
                    
            elif data.get('type') == 'error':
                print(f"ERROR: {data.get('content')}")
        except:
            pass

print()
print(f"Text yanıt: {'✓' if has_text else '✗'}")
print(f"Dosya değişikliği: {'✓' if has_changes else '✗'}")
print(f"Önceki Reset butonundan bahsediyor: {'✓' if mentions_reset else '✗ (context kaybolmuş olabilir)'}")
PYEOF
```

---

## ADIM 7 — İKİNCİ PUSH VE COMMIT SAYACI

İkinci mesajı da push et ve commit sayacının artığını doğrula:

```bash
# İkinci pending mesajı bul
SESSION_DATA_2=$(curl -s http://localhost:3000/api/pipeline/$PIPELINE_ID/dev/session)

PENDING_MSG_ID_2=$(echo "$SESSION_DATA_2" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for msg in reversed(data.get('messages', [])):
    if msg.get('role') == 'assistant' and msg.get('changeStatus') == 'pending' and msg.get('fileChanges'):
        print(msg['id'])
        break
")

if [ -n "$PENDING_MSG_ID_2" ]; then
  echo "İkinci pending mesaj: $PENDING_MSG_ID_2"
  
  # Push
  PUSH_RESPONSE_2=$(curl -s -X POST http://localhost:3000/api/pipeline/$PIPELINE_ID/dev/push \
    -H "Content-Type: application/json" \
    -d "{\"sessionId\": \"$SESSION_ID\", \"messageId\": \"$PENDING_MSG_ID_2\"}")
  
  echo "$PUSH_RESPONSE_2" | python3 -m json.tool
  
  COMMIT_SHA_2=$(echo "$PUSH_RESPONSE_2" | python3 -c "import sys, json; print(json.load(sys.stdin).get('commitSha', 'FAILED'))" 2>/dev/null)
  echo "İkinci commit SHA: $COMMIT_SHA_2"
  
  # Session commit sayısı
  FINAL_SESSION=$(curl -s http://localhost:3000/api/pipeline/$PIPELINE_ID/dev/session)
  COMMIT_COUNT=$(echo "$FINAL_SESSION" | python3 -c "import sys, json; print(json.load(sys.stdin).get('session', {}).get('totalCommits', 0))")
  echo "Total commits: $COMMIT_COUNT"
  
  if [ "$COMMIT_COUNT" = "2" ]; then
    echo "✓ Commit sayacı doğru (2)"
  else
    echo "✗ Commit sayacı yanlış: $COMMIT_COUNT (2 olmalıydı)"
  fi
else
  echo "⚠ İkinci pending mesaj bulunamadı — DevAgent dosya değişikliği önermemiş olabilir"
fi
```

---

## ADIM 8 — REJECT TESTİ

Yeni bir mesaj gönder ve bu sefer REJECT et:

```bash
echo "=== REJECT TESTİ ==="

# Üçüncü mesaj
curl -N -s -X POST http://localhost:3000/api/pipeline/$PIPELINE_ID/dev/chat \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\": \"$SESSION_ID\", \"message\": \"Sayaca bir dark mode toggle ekle\"}" \
  --max-time 120 > /tmp/akis-dev-chat-response-3.txt 2>&1

# Pending mesajı bul
sleep 2
SESSION_DATA_3=$(curl -s http://localhost:3000/api/pipeline/$PIPELINE_ID/dev/session)

PENDING_MSG_ID_3=$(echo "$SESSION_DATA_3" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for msg in reversed(data.get('messages', [])):
    if msg.get('role') == 'assistant' and msg.get('changeStatus') == 'pending' and msg.get('fileChanges'):
        print(msg['id'])
        break
")

if [ -n "$PENDING_MSG_ID_3" ]; then
  echo "Reject edilecek mesaj: $PENDING_MSG_ID_3"
  
  # Reject
  REJECT_RESPONSE=$(curl -s -X POST http://localhost:3000/api/pipeline/$PIPELINE_ID/dev/reject \
    -H "Content-Type: application/json" \
    -d "{\"sessionId\": \"$SESSION_ID\", \"messageId\": \"$PENDING_MSG_ID_3\"}")
  
  echo "$REJECT_RESPONSE" | python3 -m json.tool
  
  # Durum kontrol
  SESSION_AFTER_REJECT=$(curl -s http://localhost:3000/api/pipeline/$PIPELINE_ID/dev/session)
  REJECT_STATUS=$(echo "$SESSION_AFTER_REJECT" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for msg in reversed(data.get('messages', [])):
    if msg.get('id') == '$PENDING_MSG_ID_3':
        print(msg.get('changeStatus', '?'))
        break
")
  
  FINAL_COMMITS=$(echo "$SESSION_AFTER_REJECT" | python3 -c "import sys, json; print(json.load(sys.stdin).get('session', {}).get('totalCommits', 0))")
  
  echo "Reject sonrası status: $REJECT_STATUS"
  echo "Total commits (değişmemeli): $FINAL_COMMITS"
  
  if [ "$REJECT_STATUS" = "rejected" ]; then
    echo "✓ Reject başarılı — mesaj durumu 'rejected'"
  else
    echo "✗ Reject başarısız — mesaj durumu: $REJECT_STATUS"
  fi
  
  if [ "$FINAL_COMMITS" = "2" ]; then
    echo "✓ Commit sayacı değişmedi (2) — reject push yapmadı"
  else
    echo "✗ Commit sayacı değişmiş: $FINAL_COMMITS"
  fi
else
  echo "⚠ Pending mesaj bulunamadı"
fi
```

---

## ADIM 9 — DUPLICATE PUSH KORUMASI

Zaten pushed olan mesajı tekrar push etmeye çalış:

```bash
echo "=== DUPLICATE PUSH TESTİ ==="

# İlk pushed mesajın ID'sini al
PUSHED_MSG_ID=$(echo "$SESSION_AFTER_REJECT" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for msg in data.get('messages', []):
    if msg.get('changeStatus') == 'pushed':
        print(msg['id'])
        break
" 2>/dev/null || echo "$SESSION_DATA" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for msg in data.get('messages', []):
    if msg.get('changeStatus') == 'pushed':
        print(msg['id'])
        break
")

if [ -n "$PUSHED_MSG_ID" ]; then
  echo "Zaten pushed mesaj: $PUSHED_MSG_ID"
  
  DUP_RESPONSE=$(curl -s -X POST http://localhost:3000/api/pipeline/$PIPELINE_ID/dev/push \
    -H "Content-Type: application/json" \
    -d "{\"sessionId\": \"$SESSION_ID\", \"messageId\": \"$PUSHED_MSG_ID\"}")
  
  echo "$DUP_RESPONSE" | python3 -m json.tool
  
  DUP_ERROR=$(echo "$DUP_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('error', ''))" 2>/dev/null)
  
  if [ -n "$DUP_ERROR" ]; then
    echo "✓ Duplicate push engellendi: $DUP_ERROR"
  else
    echo "✗ Duplicate push engellenmedi — çift commit riski!"
  fi
else
  echo "⚠ Pushed mesaj bulunamadı"
fi
```

---

## ADIM 10 — ÖZET RAPOR

```bash
echo ""
echo "═══════════════════════════════════════════"
echo "  AKIS DEV MODE PUSH — TEST SONUÇLARI"
echo "═══════════════════════════════════════════"
echo ""
echo "Pipeline ID:     $PIPELINE_ID"
echo "Session ID:      $SESSION_ID"
echo "Branch:          $BRANCH_NAME"
echo ""
echo "Test 1 — Dev Session Başlatma:    $([ -n "$SESSION_ID" ] && echo '✓' || echo '✗')"
echo "Test 2 — Chat + AI Yanıt:         $([ -f /tmp/akis-dev-chat-response.txt ] && grep -q 'file_changes' /tmp/akis-dev-chat-response.txt && echo '✓' || echo '✗')"
echo "Test 3 — İlk Push:                $([ "$COMMIT_SHA" != "FAILED" ] && [ -n "$COMMIT_SHA" ] && echo '✓' || echo '✗')"
echo "Test 4 — Mesaj Durumu (pushed):    $([ -n "$COMMIT_SHA" ] && echo '✓' || echo '✗')"  
echo "Test 5 — Context Korunması:        $(grep -q 'file_changes' /tmp/akis-dev-chat-response-2.txt 2>/dev/null && echo '✓' || echo '⚠ kontrol et')"
echo "Test 6 — İkinci Push:             $([ -n "$COMMIT_SHA_2" ] && [ "$COMMIT_SHA_2" != "FAILED" ] && echo '✓' || echo '⚠')"
echo "Test 7 — Commit Sayacı:           $([ "$COMMIT_COUNT" = "2" ] 2>/dev/null && echo '✓' || echo '⚠')"
echo "Test 8 — Reject:                  $([ "$REJECT_STATUS" = "rejected" ] 2>/dev/null && echo '✓' || echo '⚠')"
echo "Test 9 — Duplicate Push Koruması: $([ -n "$DUP_ERROR" ] 2>/dev/null && echo '✓' || echo '⚠')"
echo ""
echo "GitHub Commits:"
echo "  1. $COMMIT_SHA"
echo "  2. ${COMMIT_SHA_2:-N/A}"
echo ""
echo "Doğrulama URL'leri:"
echo "  Branch:  https://github.com/OmerYasirOnal/akis-platform-devolopment/tree/$BRANCH_NAME"
echo "  Commit1: https://github.com/OmerYasirOnal/akis-platform-devolopment/commit/$COMMIT_SHA"
[ -n "$COMMIT_SHA_2" ] && [ "$COMMIT_SHA_2" != "FAILED" ] && echo "  Commit2: https://github.com/OmerYasirOnal/akis-platform-devolopment/commit/$COMMIT_SHA_2"
echo ""
echo "═══════════════════════════════════════════"
```

---

## HATA DURUMUNDA

Eğer herhangi bir adımda hata çıkarsa:

1. **500 Internal Server Error** → Backend loglarını kontrol et: `tail -50 /tmp/akis-backend.log`
2. **GitHub push 401/403** → GitHub token sorunu. Token'a DOKUNMA ama backend loglarında hata mesajını oku.
3. **DevAgent boş yanıt** → AI service loglara bak. Claude API rate limit olabilir.
4. **SSE stream boş** → Backend'de devChat endpoint'ine console.log ekle ve hata noktasını bul.
5. **Session bulunamadı** → Pipeline'ın status'unun `completed` veya `completed_partial` olduğunu doğrula.

Hata bulursan DÜZELT, sonraki adıma geç. Düzeltmeyi yaptıktan sonra ilgili adımı TEKRAR çalıştır.

---

## GENEL KURALLAR

- .env dosyalarına ASLA dokunma
- Her adımda çıktıyı logla
- Hata çıkarsa düzelt, devam et
- Shell değişkenlerini kaybet — her adımda tekrar çekebilirsin
- Backend logları: `tail -f /tmp/akis-backend.log`
- Servisleri kendin başlat, kendin test et
