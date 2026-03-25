# AKIS — AGENT PROMPT İYİLEŞTİRME & DOĞRULAMA KAPILARI

.env dosyalarına ASLA dokunma. Servisleri kendin başlat ve test et.

---

## AMAÇ

Scribe, Proto, Trace agent'larının system prompt'larını iyileştirerek:
1. Scribe'ın spec kalitesini artır (self-interrogation + self-review)
2. Proto'nun scaffold doğruluğunu artır (verification-before-completion)
3. Trace'in test coverage'ını artır (traceability check)
4. Her agent'ın çıktısında doğrulama raporu olsun (knowledge integrity chain)

**Tüm değişiklikler PROMPT ENGINEERING — sıfır backend mimari değişikliği.**

---

## YASAK

- .env dosyalarına DOKUNMA
- Backend API endpoint'leri DEĞİŞTİRME
- Agent'ların TypeScript interface'lerini BOZMA
- Yeni npm package EKLEME

---

## ADIM 0 — MEVCUT PROMPTLARI OKU

```bash
# Scribe prompt
find backend/src -path "*scribe*" -name "*.ts" | xargs grep -l "system\|prompt\|You are\|instruction" | head -5
# İlgili dosyaları oku — system prompt string'ini bul

# Proto prompt
find backend/src -path "*proto*" -name "*.ts" | xargs grep -l "system\|prompt\|You are\|instruction" | head -5

# Trace prompt
find backend/src -path "*trace*" -name "*.ts" | xargs grep -l "system\|prompt\|You are\|instruction" | head -5

# AI Service — prompt nasıl Claude API'ye gönderiliyor?
find backend/src -name "*.ts" | xargs grep -l "messages.create\|anthropic\|claude" | head -5
```

Her agent'ın system prompt'unu tamamen oku. Not al:
- Prompt'un yapısı nasıl?
- JSON output formatı tanımlı mı?
- Mevcut doğrulama adımları var mı?

---

## ADIM 1 — SCRIBE PROMPT İYİLEŞTİRME

### 1.1 Self-Interrogation Preamble

Scribe'ın system prompt'unun BAŞINA ekle:

```
BEFORE generating the StructuredSpec, perform these internal steps silently:

1. SELF-INTERROGATION: Ask yourself 5 clarifying questions about the user's 
   idea. For each, assess: CLEAR (explicitly stated), ASSUMED (inferred), 
   or UNKNOWN (not mentioned).

2. ASSUMPTION LOG: List every assumption. Mark each as 
   [HIGH-CONFIDENCE] or [LOW-CONFIDENCE].

3. AMBIGUITY SCORE: Rate overall clarity 1-5 across:
   - Problem scope (weight: 0.3)
   - Target user definition (weight: 0.2)
   - Success criteria specificity (weight: 0.3)
   - Technical constraints (weight: 0.2)

4. If ambiguity score < 3.5, include a "assumptions" field in your output
   listing all LOW-CONFIDENCE assumptions for human review.
```

### 1.2 Self-Review Pass

Scribe'ın system prompt'unun SONUNA (output format tanımından önce) ekle:

```
AFTER generating the StructuredSpec, perform a SELF-REVIEW:

Checklist:
- Every User Story has at least one Acceptance Criterion
- No Acceptance Criterion uses vague language ("should work well", "fast enough")
- Given/When/Then steps are concrete and testable
- No scope creep beyond the user's stated idea
- Problem Statement is ≤3 sentences
- Technical Constraints are specific (not "use modern framework" but "React 18 + Vite")

If any check fails, revise the spec before returning.

Include a "reviewNotes" field in your JSON output:
{
  "reviewNotes": {
    "selfReviewPassed": true/false,
    "revisionsApplied": ["Made AC-3 more specific", ...],
    "assumptionsMade": ["User wants web app (not mentioned explicitly)", ...]
  }
}
```

### 1.3 Output JSON'a yeni alanlar ekle

Scribe'ın JSON output format tanımında şu alanları ekle (opsiyonel alanlar — yoksa da sorun olmaz):

```json
{
  "spec": { ... },
  "confidence": 0.92,
  "reviewNotes": {
    "selfReviewPassed": true,
    "revisionsApplied": [],
    "assumptionsMade": ["Web tarayıcısı hedef platform olarak varsayıldı"]
  },
  "assumptions": []
}
```

**ÖNEMLİ:** Backend'in JSON parse logic'i (`extractJson`, `sanitizeJsonControlChars`) bu yeni alanları ignore edebilmeli. Mevcut parse logic'in strict olmadığını kontrol et — eğer strict ise, yeni alanları parse etmeden geçir.

```bash
# extractJson fonksiyonunu bul ve oku
grep -rn "extractJson\|parseSpec\|parseOutput" backend/src/ | grep -v node_modules | head -10
```

---

## ADIM 2 — PROTO PROMPT İYİLEŞTİRME

### 2.1 Verification-Before-Completion

Proto'nun system prompt'unun SONUNA ekle:

```
BEFORE returning your output, perform VERIFICATION:

1. SPEC COMPLIANCE CHECK:
   For each User Story in the input spec:
   - At least one generated file addresses this story
   - The file structure supports the Acceptance Criteria
   
   For each Acceptance Criterion:
   - The Given state is represented (data model, component state, or route)
   - The When trigger has a corresponding handler or event
   - The Then outcome has a corresponding UI element or response

2. SCAFFOLD INTEGRITY CHECK:
   - package.json includes ALL imported dependencies
   - No file imports from a path that doesn't exist in the scaffold
   - Entry point file (index.html, main.jsx/tsx) exists and is valid
   - No TODO/FIXME placeholders without implementation

3. Include a "verificationReport" in your output:
{
  "verificationReport": {
    "specCoverage": "7/7 criteria addressed",
    "integrityIssues": [],
    "missingDependencies": [],
    "unresolvedImports": []
  }
}
```

### 2.2 Dosya içeriklerinde kalite artışı

Proto'nun prompt'una ekle:

```
CODE QUALITY REQUIREMENTS:
- Every component must have proper imports
- CSS/styles must be included (inline or separate file)
- README.md must include: project description, setup instructions, tech stack
- package.json must have correct "scripts" (dev, build, start)
- index.html must reference the correct entry point
```

---

## ADIM 3 — TRACE PROMPT İYİLEŞTİRME

### 3.1 Traceability Check

Trace'in system prompt'unun SONUNA ekle:

```
AFTER generating test files, perform TRACEABILITY CHECK:

For each Acceptance Criterion (AC) in the input spec:
- At least one test case covers this AC
- The test's setup matches the "Given" condition
- The test's action matches the "When" trigger
- The test's assertion matches the "Then" outcome

Include a "traceability" array in your output:
[
  { "criterionId": "ac-1", "testFile": "app-load.spec.ts", "testName": "should display initial state", "coverage": "full" },
  { "criterionId": "ac-2", "testFile": "add-todo.spec.ts", "testName": "should add new item", "coverage": "full" },
  ...
]

Also include "coverageMatrix":
{
  "totalCriteria": 7,
  "coveredCriteria": 7,
  "coveragePercent": 100,
  "uncoveredCriteria": []
}
```

### 3.2 Trace'e spec context geçiriliyor mu kontrol et

```bash
# Orchestrator'da Trace'e ne geçiriliyor?
grep -rn "trace.*input\|trace.*spec\|startTrace\|runTrace" backend/src/pipeline/ | head -10
```

Trace'e StructuredSpec geçirilmiyorsa, orchestrator'da düzelt:

```typescript
// Trace input'una spec ekle:
const traceInput = {
  repoOwner,
  repo: repoName,
  branch: protoBranch,
  spec: approvedSpec,  // ← BU EKSİKSE EKLE
};
```

---

## ADIM 4 — FRONTEND'DE DOĞRULAMA RAPORLARINI GÖSTER

### 4.1 Scribe reviewNotes gösterimi

Spec bloğunda, confidence'ın yanına reviewNotes'u ekle:

```
YAPILANDIRILMIŞ SPESİFİKASYON  92%  ✓ Self-review geçti
▸ 2 varsayım yapıldı (tıklayınca göster)
```

Varsayımlar collapsible:
```
⚠ Varsayımlar:
  • Web tarayıcısı hedef platform olarak varsayıldı
  • Kullanıcı girişi gerekmediği varsayıldı
```

### 4.2 Proto verificationReport gösterimi

Proto result bloğunda:
```
Scaffold oluşturuldu — 12 dosya, 657 satır
✓ Spec uyumu: 7/7 kriter karşılandı
✓ Bütünlük: Sorun bulunamadı
```

### 4.3 Trace traceability gösterimi

Trace result bloğunda:
```
Test yazıldı — 95 test, %100 kapsam
İzlenebilirlik Matrisi:
  ac-1 → app-load.spec.ts ✓
  ac-2 → add-todo.spec.ts ✓
  ac-3 → toggle-todo.spec.ts ✓
  ...
```

### 4.4 Parse logic güncelle

Frontend'de conversation parse ederken yeni alanları okuyabilecek şekilde güncelle:

```bash
grep -rn "reviewNotes\|verificationReport\|traceability\|coverageMatrix" frontend/src/ | head -10
```

Yoksa mapConversation fonksiyonunda bu alanları çek ve ilgili bileşenlere geçir.

---

## ADIM 5 — BUILD VE E2E TEST

```bash
cd frontend && npx tsc --noEmit && npm run build
cd ../backend && npx tsc --noEmit
```

### E2E test — Yeni pipeline çalıştır

```bash
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null
sleep 1

cd backend && DATABASE_URL=postgresql://postgres:postgres@localhost:5433/akis_v2 DEV_MODE=true nohup npx tsx watch src/server.ts > /tmp/akis-backend.log 2>&1 &
sleep 5

# Yeni pipeline
RESP=$(curl -s -X POST http://localhost:3000/api/pipelines \
  -H "Content-Type: application/json" \
  -d '{"idea": "Basit bir not alma uygulaması. Notlar eklenebilmeli, düzenlenebilmeli, silinebilmeli. Markdown desteği olmalı."}')
PID=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('pipeline',{}).get('id','FAIL'))" 2>/dev/null)
echo "Pipeline: $PID"

# Takip et
for i in $(seq 1 90); do
  DATA=$(curl -s "http://localhost:3000/api/pipelines/$PID")
  STATUS=$(echo "$DATA" | python3 -c "import sys,json; print(json.load(sys.stdin).get('pipeline',{}).get('status','?'))" 2>/dev/null)
  echo "[$i] $STATUS"
  
  if [ "$STATUS" = "scribe_clarifying" ]; then
    curl -s -X POST "http://localhost:3000/api/pipelines/$PID/message" \
      -H "Content-Type: application/json" \
      -d '{"message": "1. Basit: sadece not ekle, düzenle, sil\n2. Web tarayıcısı\n3. Markdown desteği olsun\n4. Giriş gerekmez, localStorage kullan"}' > /dev/null
    echo "  → Cevap gönderildi"
  fi
  
  if [ "$STATUS" = "awaiting_approval" ]; then
    # Spec'te reviewNotes var mı kontrol et
    echo "$DATA" | python3 -c "
import sys, json
data = json.load(sys.stdin)
conv = data.get('pipeline',{}).get('scribeConversation', [])
for e in conv:
    if e.get('type') == 'spec_draft':
        content = e.get('content', {})
        spec = content.get('spec', content)
        print(f'Confidence: {content.get(\"confidence\", \"?\")}')
        print(f'ReviewNotes: {json.dumps(spec.get(\"reviewNotes\", \"NOT FOUND\"))[:200]}')
        print(f'Assumptions: {json.dumps(spec.get(\"assumptions\", \"NOT FOUND\"))[:200]}')
" 2>/dev/null
    
    REPO=$(echo "$DATA" | python3 -c "
import sys,json,re
p=json.load(sys.stdin).get('pipeline',{})
t=p.get('title',p.get('idea','app'))
print(re.sub(r'[^a-z0-9-]','','-'.join(t.lower().split()[:4]))[:40])
" 2>/dev/null)
    curl -s -X POST "http://localhost:3000/api/pipelines/$PID/approve" \
      -H "Content-Type: application/json" \
      -d "{\"repoName\": \"$REPO\"}" > /dev/null
    echo "  → Onaylandı: $REPO"
  fi
  
  if [ "$STATUS" = "completed" ] || [ "$STATUS" = "failed" ] || [ "$STATUS" = "completed_partial" ]; then
    echo "FINAL: $STATUS"
    
    # Proto verificationReport var mı?
    echo "$DATA" | python3 -c "
import sys, json
data = json.load(sys.stdin)
conv = data.get('pipeline',{}).get('scribeConversation', [])
for e in conv:
    t = e.get('type','')
    if 'proto' in t.lower():
        c = e.get('content', {})
        print(f'Proto verificationReport: {json.dumps(c.get(\"verificationReport\", \"NOT FOUND\"))[:200]}')
    if 'trace' in t.lower():
        c = e.get('content', {})
        print(f'Trace traceability: {json.dumps(c.get(\"traceability\", \"NOT FOUND\"))[:200]}')
        print(f'Trace coverageMatrix: {json.dumps(c.get(\"coverageMatrix\", \"NOT FOUND\"))[:200]}')
" 2>/dev/null
    break
  fi
  sleep 5
done
```

### Status Report

```
## Agent Prompt İyileştirme Raporu

### Scribe
- Self-interrogation preamble: ✓/✗
- Self-review pass: ✓/✗
- reviewNotes in output: ✓/✗
- assumptions in output: ✓/✗
- Frontend assumptions display: ✓/✗

### Proto
- Verification-before-completion: ✓/✗
- verificationReport in output: ✓/✗
- specCoverage doğru mu: ✓/✗
- Frontend report display: ✓/✗

### Trace
- Traceability check: ✓/✗
- traceability array in output: ✓/✗
- coverageMatrix in output: ✓/✗
- Spec context passed to Trace: ✓/✗
- Frontend matrix display: ✓/✗

### E2E
- Pipeline completed: ✓/✗
- Spec quality improved: ✓/✗

### Build
- Frontend: ✓/✗
- Backend: ✓/✗
```

---

## GENEL KURALLAR

- .env dosyalarına ASLA dokunma
- Prompt değişiklikleri string üzerinde — backend logic BOZMA
- Yeni JSON alanları opsiyonel — mevcut parse logic'i kırma
- E2E test çalıştır — prompt değişikliğinin gerçek etkisini gör
- Build temiz olmalı
