#!/bin/bash
# AKIS Dev Mode Push — E2E Test Script
# Run this OUTSIDE of Claude Code to avoid shared rate limit conflicts.
#
# Prerequisites: Backend + Frontend running (see AKIS_DEV_MODE_PUSH_TEST.md Step 0)
#
# Usage: bash scripts/test-dev-mode-push.sh

set -e
BASE="http://localhost:3000/api/pipelines"

echo "═══════════════════════════════════════════"
echo "  AKIS DEV MODE PUSH — E2E TEST"
echo "═══════════════════════════════════════════"

# === STEP 1: Create Pipeline ===
echo ""
echo "=== STEP 1: Create Pipeline ==="
RESPONSE=$(curl -s -X POST $BASE \
  -H "Content-Type: application/json" \
  -d '{"idea": "Basit bir sayac uygulamasi. Artir ve azalt butonlari olsun, sayi ekranda gosterilsin.", "targetRepo": "OmerYasirOnal/akis-platform-devolopment"}')
PIPELINE_ID=$(echo "$RESPONSE" | python3 -c "import sys,json;print(json.load(sys.stdin)['pipeline']['id'])")
echo "Pipeline ID: $PIPELINE_ID"

# Wait Scribe
echo "Waiting for Scribe..."
for i in $(seq 1 90); do
  STATUS=$(curl -s $BASE/$PIPELINE_ID | python3 -c "import sys,json;print(json.load(sys.stdin).get('pipeline',{}).get('stage','?'))")
  [ $((i % 5)) -eq 0 ] && echo "  [$i] $STATUS"
  [ "$STATUS" = "awaiting_approval" ] && echo "✓ Scribe done" && break
  [ "$STATUS" = "failed" ] && echo "✗ Scribe failed" && exit 1
  sleep 2
done

# Approve
echo "Approving..."
curl -s -X POST $BASE/$PIPELINE_ID/approve \
  -H "Content-Type: application/json" \
  -d '{"repoName":"akis-platform-devolopment","repoVisibility":"public"}' | python3 -c "import sys,json;print('Stage:',json.load(sys.stdin)['pipeline']['stage'])"

# Wait Proto+Trace
echo "Waiting for Proto+Trace..."
for i in $(seq 1 150); do
  RESULT=$(curl -s $BASE/$PIPELINE_ID | python3 -c "
import sys,json
p=json.load(sys.stdin).get('pipeline',{})
s=p.get('stage','?')
b=p.get('protoOutput',{}).get('branch','') if isinstance(p.get('protoOutput'),dict) else ''
print(f'{s}|{b}')
")
  STATUS=$(echo "$RESULT" | cut -d'|' -f1)
  BRANCH=$(echo "$RESULT" | cut -d'|' -f2)
  [ $((i % 10)) -eq 0 ] && echo "  [$i] $STATUS $BRANCH"
  if [ "$STATUS" = "completed" ] || [ "$STATUS" = "completed_partial" ]; then
    echo "✓ Pipeline done. Branch: $BRANCH"
    break
  fi
  [ "$STATUS" = "failed" ] && echo "✗ Pipeline failed" && exit 1
  sleep 2
done

# === STEP 2: Dev Session ===
echo ""
echo "=== STEP 2: Dev Session ==="
SESSION_RESPONSE=$(curl -s -X POST $BASE/$PIPELINE_ID/dev/start)
SESSION_ID=$(echo "$SESSION_RESPONSE" | python3 -c "import sys,json;print(json.load(sys.stdin).get('sessionId',''))")
FILE_COUNT=$(echo "$SESSION_RESPONSE" | python3 -c "
import sys,json
d=json.load(sys.stdin)
def cf(n):
 c=0
 for x in (n or []):
  if x.get('type')=='file':c+=1
  if x.get('children'):c+=cf(x['children'])
 return c
print(cf(d.get('fileTree',[])))
")
echo "Session ID: $SESSION_ID"
echo "Files: $FILE_COUNT"

# === STEP 3: Chat ===
echo ""
echo "=== STEP 3: Chat — Add Reset Button ==="
curl -N -s -X POST $BASE/$PIPELINE_ID/dev/chat \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION_ID\",\"message\":\"Sayaca bir Reset butonu ekle. Butona basilinca sayac sifira donecek.\"}" \
  --max-time 120 > /tmp/akis-chat1.txt 2>&1

python3 << 'PYEOF'
import json
with open('/tmp/akis-chat1.txt') as f: content = f.read()
for line in content.split('\n'):
    if line.startswith('data: '):
        try:
            ev = json.loads(line[6:])
            if ev['type'] == 'text': print(f"✓ TEXT: {ev['content'][:150]}")
            elif ev['type'] == 'file_changes':
                print(f"✓ CHANGES: {len(ev.get('changes',[]))} files")
                for c in ev.get('changes',[]): print(f"  {c['action']} {c['path']}")
            elif ev['type'] == 'done': print("✓ DONE")
            elif ev['type'] == 'error': print(f"✗ ERROR: {ev['content'][:200]}")
        except: pass
PYEOF

# === STEP 4: Pending ===
echo ""
echo "=== STEP 4: Pending Check ==="
SESSION_DATA=$(curl -s $BASE/$PIPELINE_ID/dev/session)
PENDING_MSG_ID=$(echo "$SESSION_DATA" | python3 -c "
import sys,json
d=json.load(sys.stdin)
for m in d.get('messages',[]):
    if m.get('role')=='assistant' and m.get('changeStatus')=='pending' and m.get('fileChanges'):
        print(m['id']); break
")
echo "Pending: $PENDING_MSG_ID"

# === STEP 5: Push ===
echo ""
echo "=== STEP 5: Push to GitHub ==="
PUSH_RESP=$(curl -s -X POST $BASE/$PIPELINE_ID/dev/push \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION_ID\",\"messageId\":\"$PENDING_MSG_ID\"}")
COMMIT_SHA=$(echo "$PUSH_RESP" | python3 -c "import sys,json;print(json.load(sys.stdin).get('commitSha','FAILED'))" 2>/dev/null)
echo "SHA: $COMMIT_SHA"
[ "$COMMIT_SHA" != "FAILED" ] && [ -n "$COMMIT_SHA" ] && echo "✓ PUSH OK" || echo "✗ PUSH FAILED"

# === STEP 6: Verify ===
echo ""
echo "=== STEP 6: Verify ==="
POST_SESSION=$(curl -s $BASE/$PIPELINE_ID/dev/session)
echo "$POST_SESSION" | python3 -c "
import sys,json
d=json.load(sys.stdin)
print('Commits:', d.get('session',{}).get('totalCommits',0))
for m in d.get('messages',[]):
    if m.get('role')=='assistant' and m.get('fileChanges'):
        s=m.get('changeStatus','?')
        print(f'Status: {s} SHA: {m.get(\"commitSha\",\"-\")}')
        print('✓' if s=='pushed' else '✗')
"

# === STEP 7: 2nd Chat + Push ===
echo ""
echo "=== STEP 7: 2nd Chat + Push ==="
curl -N -s -X POST $BASE/$PIPELINE_ID/dev/chat \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION_ID\",\"message\":\"Az once ekledigim Reset butonunun rengini kirmizi yap\"}" \
  --max-time 120 > /tmp/akis-chat2.txt 2>&1

sleep 2
SESSION_DATA2=$(curl -s $BASE/$PIPELINE_ID/dev/session)
PENDING2=$(echo "$SESSION_DATA2" | python3 -c "
import sys,json
d=json.load(sys.stdin)
for m in reversed(d.get('messages',[])):
    if m.get('role')=='assistant' and m.get('changeStatus')=='pending' and m.get('fileChanges'):
        print(m['id']); break
")

if [ -n "$PENDING2" ]; then
  PUSH2=$(curl -s -X POST $BASE/$PIPELINE_ID/dev/push \
    -H "Content-Type: application/json" \
    -d "{\"sessionId\":\"$SESSION_ID\",\"messageId\":\"$PENDING2\"}")
  SHA2=$(echo "$PUSH2" | python3 -c "import sys,json;print(json.load(sys.stdin).get('commitSha','FAILED'))" 2>/dev/null)
  echo "2nd SHA: $SHA2"
  FINAL=$(curl -s $BASE/$PIPELINE_ID/dev/session)
  COMMITS=$(echo "$FINAL" | python3 -c "import sys,json;print(json.load(sys.stdin).get('session',{}).get('totalCommits',0))")
  echo "Total commits: $COMMITS"
  [ "$COMMITS" = "2" ] && echo "✓" || echo "✗"
fi

# === STEP 8: Reject ===
echo ""
echo "=== STEP 8: Reject ==="
curl -N -s -X POST $BASE/$PIPELINE_ID/dev/chat \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SESSION_ID\",\"message\":\"Sayaca dark mode toggle ekle\"}" \
  --max-time 120 > /dev/null 2>&1

sleep 2
SD3=$(curl -s $BASE/$PIPELINE_ID/dev/session)
P3=$(echo "$SD3" | python3 -c "
import sys,json
d=json.load(sys.stdin)
for m in reversed(d.get('messages',[])):
    if m.get('role')=='assistant' and m.get('changeStatus')=='pending' and m.get('fileChanges'):
        print(m['id']); break
")

if [ -n "$P3" ]; then
  curl -s -X POST $BASE/$PIPELINE_ID/dev/reject \
    -H "Content-Type: application/json" \
    -d "{\"sessionId\":\"$SESSION_ID\",\"messageId\":\"$P3\"}" > /dev/null

  SD_AFTER=$(curl -s $BASE/$PIPELINE_ID/dev/session)
  echo "$SD_AFTER" | python3 -c "
import sys,json
d=json.load(sys.stdin)
for m in reversed(d.get('messages',[])):
    if m.get('id')=='$P3':
        print('Status:',m.get('changeStatus','?'))
        print('✓' if m.get('changeStatus')=='rejected' else '✗')
        break
print('Commits:',d.get('session',{}).get('totalCommits',0))
"
fi

# === STEP 9: Dup Push ===
echo ""
echo "=== STEP 9: Dup Push ==="
SD_FINAL=$(curl -s $BASE/$PIPELINE_ID/dev/session)
PUSHED_ID=$(echo "$SD_FINAL" | python3 -c "
import sys,json
d=json.load(sys.stdin)
for m in d.get('messages',[]):
    if m.get('changeStatus')=='pushed': print(m['id']); break
")
if [ -n "$PUSHED_ID" ]; then
  DUP=$(curl -s -X POST $BASE/$PIPELINE_ID/dev/push \
    -H "Content-Type: application/json" \
    -d "{\"sessionId\":\"$SESSION_ID\",\"messageId\":\"$PUSHED_ID\"}")
  DUP_ERR=$(echo "$DUP" | python3 -c "import sys,json;print(json.load(sys.stdin).get('error',''))" 2>/dev/null)
  [ -n "$DUP_ERR" ] && echo "✓ Blocked: $DUP_ERR" || echo "✗ NOT blocked"
fi

# === SUMMARY ===
echo ""
echo "═══════════════════════════════════════════"
echo "  AKIS DEV MODE PUSH — TEST RESULTS"
echo "═══════════════════════════════════════════"
echo "Pipeline: $PIPELINE_ID"
echo "Session:  $SESSION_ID"
echo "Branch:   $BRANCH"
echo "Commit 1: $COMMIT_SHA"
echo "Commit 2: ${SHA2:-N/A}"
echo "═══════════════════════════════════════════"
