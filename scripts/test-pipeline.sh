#!/bin/bash
# Pipeline E2E Test Script
# Tests: Create pipeline → Poll Scribe → Approve → Poll Proto → Check result

set -e
API="http://localhost:3000/api/pipelines"

echo "=== STEP 1: Create Pipeline ==="
RESPONSE=$(curl -s -X POST "$API" \
  -H "Content-Type: application/json" \
  -d '{"idea": "React ile basit bir sayac uygulamasi. Bir buton ile artirma, bir buton ile azaltma, ortada sayaci gosteren bir metin."}')

echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"

PIPELINE_ID=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['pipeline']['id'])" 2>/dev/null)

if [ -z "$PIPELINE_ID" ]; then
  echo "ERROR: Could not extract pipeline ID"
  exit 1
fi

echo ""
echo "Pipeline ID: $PIPELINE_ID"
echo ""

echo "=== STEP 2: Poll until Scribe completes ==="
for i in $(seq 1 30); do
  sleep 3
  STATUS=$(curl -s "$API/$PIPELINE_ID")
  STAGE=$(echo "$STATUS" | python3 -c "import sys,json; print(json.load(sys.stdin)['pipeline']['stage'])" 2>/dev/null)
  echo "  Poll $i: stage=$STAGE"

  if [ "$STAGE" = "awaiting_approval" ]; then
    echo ""
    echo "=== Scribe completed! Spec generated ==="
    echo "$STATUS" | python3 -c "
import sys, json
p = json.load(sys.stdin)['pipeline']
spec = p.get('scribeOutput', {}).get('spec', {})
print(f\"  Title: {spec.get('title', 'N/A')}\")
print(f\"  Confidence: {p.get('scribeOutput', {}).get('confidence', 'N/A')}\")
print(f\"  User Stories: {len(spec.get('userStories', []))}\")
print(f\"  Acceptance Criteria: {len(spec.get('acceptanceCriteria', []))}\")
" 2>/dev/null
    break
  fi

  if [ "$STAGE" = "failed" ]; then
    echo "ERROR: Pipeline failed during Scribe"
    echo "$STATUS" | python3 -c "import sys,json; print(json.dumps(json.load(sys.stdin)['pipeline'].get('error',{}), indent=2))" 2>/dev/null
    exit 1
  fi

  if [ "$STAGE" = "scribe_clarifying" ]; then
    # Check if there are clarification questions
    HAS_QUESTIONS=$(echo "$STATUS" | python3 -c "
import sys, json
p = json.load(sys.stdin)['pipeline']
conv = p.get('scribeConversation', [])
clarifications = [m for m in conv if m['type'] == 'clarification']
if clarifications:
    last = clarifications[-1]
    qs = last['content']['questions']
    for q in qs:
        print(f\"  Q: {q['question']}\")
    print('HAS_QUESTIONS')
" 2>/dev/null)

    if echo "$HAS_QUESTIONS" | grep -q "HAS_QUESTIONS"; then
      echo ""
      echo "  Scribe asking questions. Sending answer..."
      curl -s -X POST "$API/$PIPELINE_ID/message" \
        -H "Content-Type: application/json" \
        -d '{"message": "React + TypeScript + Vite. Basit bir SPA, backend yok. Sadece local state ile sayac. Tailwind CSS ile stil."}'
      echo "  Answer sent."
    fi
  fi
done

echo ""
echo "=== STEP 3: Approve Spec ==="
APPROVE_RESPONSE=$(curl -s -X POST "$API/$PIPELINE_ID/approve" \
  -H "Content-Type: application/json" \
  -d '{"repoName": "akis-test-counter", "repoVisibility": "private"}')

APPROVE_STAGE=$(echo "$APPROVE_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['pipeline']['stage'])" 2>/dev/null)
echo "  Stage after approve: $APPROVE_STAGE"

echo ""
echo "=== STEP 4: Poll until Proto+Trace complete ==="
for i in $(seq 1 60); do
  sleep 3
  STATUS=$(curl -s "$API/$PIPELINE_ID")
  STAGE=$(echo "$STATUS" | python3 -c "import sys,json; print(json.load(sys.stdin)['pipeline']['stage'])" 2>/dev/null)
  echo "  Poll $i: stage=$STAGE"

  if [ "$STAGE" = "completed" ] || [ "$STAGE" = "completed_partial" ] || [ "$STAGE" = "failed" ]; then
    echo ""
    echo "=== FINAL RESULT ==="
    echo "$STATUS" | python3 -c "
import sys, json
p = json.load(sys.stdin)['pipeline']
print(f\"  Stage: {p['stage']}\")

proto = p.get('protoOutput')
if proto:
    print(f\"  Proto: OK={proto.get('ok')}\")
    print(f\"  Branch: {proto.get('branch')}\")
    print(f\"  Repo: {proto.get('repo')}\")
    print(f\"  RepoURL: {proto.get('repoUrl')}\")
    print(f\"  Files: {len(proto.get('files', []))}\")
    total_loc = sum(f.get('linesOfCode', 0) for f in proto.get('files', []))
    print(f\"  Total LOC: {total_loc}\")
else:
    print('  Proto: NOT COMPLETED')

trace = p.get('traceOutput')
if trace:
    print(f\"  Trace: OK={trace.get('ok')}\")
    print(f\"  Test files: {len(trace.get('testFiles', []))}\")
    summary = trace.get('testSummary', {})
    print(f\"  Total tests: {summary.get('totalTests', 0)}\")
    print(f\"  Coverage: {summary.get('coveragePercentage', 0)}%\")
else:
    print('  Trace: NOT COMPLETED')

err = p.get('error')
if err:
    print(f\"  Error: {err.get('code')} — {err.get('message')}\")

metrics = p.get('metrics', {})
if metrics.get('totalDurationMs'):
    print(f\"  Duration: {metrics['totalDurationMs'] / 1000:.1f}s\")
" 2>/dev/null
    break
  fi
done

echo ""
echo "=== TEST COMPLETE ==="
