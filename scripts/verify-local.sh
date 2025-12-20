#!/usr/bin/env bash
#
# verify-local.sh
# End-to-end local verification matching CI gates
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

EVIDENCE_FILE="$REPO_ROOT/docs/QA_EVIDENCE.md"
TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
GIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")

echo "🔬 Starting end-to-end local verification..."
echo ""
echo "📋 Environment:"
echo "  Timestamp: $TIMESTAMP"
echo "  Branch: $GIT_BRANCH"
echo "  Commit: $GIT_SHA"
echo ""

# Results tracking
declare -A RESULTS
FAILED=0

run_gate() {
  local name="$1"
  local command="$2"
  echo "▶️  Running: $name"
  if eval "$command" > /tmp/verify-${name}.log 2>&1; then
    RESULTS["$name"]="✅ PASS"
    echo "   ✅ PASS"
  else
    RESULTS["$name"]="❌ FAIL"
    FAILED=$((FAILED + 1))
    echo "   ❌ FAIL (see /tmp/verify-${name}.log)"
  fi
  echo ""
}

# Phase 1: Dependencies
run_gate "install" "pnpm install --frozen-lockfile"

# Phase 2: Database
echo "▶️  Starting PostgreSQL..."
./scripts/db-up.sh > /tmp/verify-db-up.log 2>&1 || {
  RESULTS["db-up"]="❌ FAIL"
  FAILED=$((FAILED + 1))
  echo "   ❌ FAIL starting DB"
}
RESULTS["db-up"]="✅ PASS"

# Wait for DB and run migrations
export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/akis_v2"
echo "▶️  Running migrations..."
if (cd backend && pnpm db:migrate) > /tmp/verify-migrate.log 2>&1; then
  RESULTS["migrations"]="✅ PASS"
  echo "   ✅ PASS"
else
  RESULTS["migrations"]="❌ FAIL"
  FAILED=$((FAILED + 1))
  echo "   ❌ FAIL (see /tmp/verify-migrate.log)"
fi
echo ""

# Phase 3: Backend gates
run_gate "backend-typecheck" "(cd backend && pnpm typecheck)"
run_gate "backend-lint" "(cd backend && pnpm lint)"
run_gate "backend-test" "(cd backend && DATABASE_URL=$DATABASE_URL pnpm test)"

# Phase 4: Frontend gates
run_gate "frontend-typecheck" "(cd frontend && pnpm typecheck)"
run_gate "frontend-lint" "(cd frontend && pnpm lint)"
run_gate "frontend-test" "(cd frontend && pnpm test)"
run_gate "frontend-build" "(cd frontend && pnpm build)"

# Phase 5: Generate evidence report
cat > "$EVIDENCE_FILE" <<EOF
# QA Evidence Report

**Generated:** $TIMESTAMP  
**Branch:** \`$GIT_BRANCH\`  
**Commit:** \`$GIT_SHA\`

## Summary

| Gate | Status |
|------|--------|
EOF

for gate in install db-up migrations backend-typecheck backend-lint backend-test frontend-typecheck frontend-lint frontend-test frontend-build; do
  echo "| ${gate} | ${RESULTS[$gate]:-⚠️ SKIP} |" >> "$EVIDENCE_FILE"
done

cat >> "$EVIDENCE_FILE" <<EOF

## Commands

\`\`\`bash
# Full verification
./scripts/verify-local.sh

# Individual gates
pnpm install
./scripts/db-up.sh
cd backend && pnpm db:migrate
cd backend && pnpm typecheck && pnpm lint && pnpm test
cd frontend && pnpm typecheck && pnpm lint && pnpm test && pnpm build
\`\`\`

## Known Limitations

- MCP Gateway verification is optional (not blocking for core development)
- Integration tests require PostgreSQL running on port 5433
- Frontend build produces a static artifact in \`frontend/dist/\`

## Notes

All logs available in \`/tmp/verify-*.log\` for this run.

EOF

echo "📝 Evidence report written to: $EVIDENCE_FILE"
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 VERIFICATION SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
for gate in install db-up migrations backend-typecheck backend-lint backend-test frontend-typecheck frontend-lint frontend-test frontend-build; do
  echo "${RESULTS[$gate]:-⚠️ SKIP}  $gate"
done
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [[ $FAILED -gt 0 ]]; then
  echo "❌ $FAILED gate(s) failed"
  exit 1
else
  echo "✅ All gates passed"
  exit 0
fi

