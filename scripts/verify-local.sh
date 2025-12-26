#!/usr/bin/env bash
#
# verify-local.sh
# End-to-end local verification matching CI gates
# Compatible with bash 3.2+ (macOS default)
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

EVIDENCE_FILE="$REPO_ROOT/docs/QA_EVIDENCE.md"
TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M:%S UTC" 2>/dev/null || date +"%Y-%m-%d %H:%M:%S")
GIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")

echo "🔬 Starting end-to-end local verification..."
echo ""
echo "📋 Environment:"
echo "  Timestamp: $TIMESTAMP"
echo "  Branch: $GIT_BRANCH"
echo "  Commit: $GIT_SHA"
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PREFLIGHT CHECKS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo "🔍 Preflight checks..."

# Check Docker is running (required for db-up)
if ! docker info >/dev/null 2>&1; then
  echo ""
  echo "❌ PREFLIGHT FAILED: Docker Desktop is not running."
  echo ""
  echo "   Please start Docker Desktop and re-run this script."
  echo "   On macOS: open -a Docker"
  echo ""
  exit 1
fi
echo "   ✅ Docker is running"

# Ensure we're in repo root
if [[ ! -f "$REPO_ROOT/pnpm-lock.yaml" ]] && [[ ! -d "$REPO_ROOT/backend" ]]; then
  echo ""
  echo "❌ PREFLIGHT FAILED: Not in repo root."
  echo "   Current directory: $(pwd)"
  echo "   Expected: devagents repo root"
  echo ""
  exit 1
fi
echo "   ✅ In repo root"

echo ""

# Results tracking (bash 3.2 compatible - no associative arrays)
RESULTS=""
FAILED=0

record_result() {
  local name="$1"
  local status="$2"
  RESULTS="${RESULTS}${name}:${status}|"
}

get_result() {
  local name="$1"
  echo "$RESULTS" | tr '|' '\n' | grep "^${name}:" | cut -d: -f2 || echo "⚠️ SKIP"
}

run_gate() {
  local name="$1"
  local command="$2"
  echo "▶️  Running: $name"
  if eval "$command" > /tmp/verify-${name}.log 2>&1; then
    record_result "$name" "✅ PASS"
    echo "   ✅ PASS"
  else
    record_result "$name" "❌ FAIL"
    FAILED=$((FAILED + 1))
    echo "   ❌ FAIL (see /tmp/verify-${name}.log)"
  fi
  echo ""
}

# Phase 1: Dependencies (ensure dev dependencies are installed)
echo "▶️  Ensuring development dependencies are installed..."
unset NODE_ENV 2>/dev/null || true
export NODE_ENV=development
export npm_config_production=false

# Install backend and frontend dependencies separately (no root package.json)
install_deps() {
  (cd backend && pnpm install --frozen-lockfile) && \
  (cd frontend && pnpm install --frozen-lockfile)
}
run_gate "install" "install_deps"

# Phase 2: Database
echo "▶️  Starting PostgreSQL..."
if ./scripts/db-up.sh > /tmp/verify-db-up.log 2>&1; then
  record_result "db-up" "✅ PASS"
  echo "   ✅ PASS"
else
  record_result "db-up" "❌ FAIL"
  FAILED=$((FAILED + 1))
  echo "   ❌ FAIL starting DB (see /tmp/verify-db-up.log)"
fi
echo ""

# Wait for DB and run migrations
export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/akis_v2"
echo "▶️  Running migrations..."
if (cd backend && pnpm db:migrate) > /tmp/verify-migrate.log 2>&1; then
  record_result "migrations" "✅ PASS"
  echo "   ✅ PASS"
else
  record_result "migrations" "❌ FAIL"
  FAILED=$((FAILED + 1))
  echo "   ❌ FAIL (see /tmp/verify-migrate.log)"
fi
echo ""

# Phase 3: Backend gates
run_gate "backend-typecheck" "(cd backend && pnpm typecheck)"
run_gate "backend-lint" "(cd backend && pnpm lint)"
run_gate "backend-test" "(cd backend && pnpm run test:ci)"

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
  status=$(get_result "$gate")
  echo "| ${gate} | ${status} |" >> "$EVIDENCE_FILE"
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
cd backend && pnpm typecheck && pnpm lint
cd backend && pnpm test           # Unit tests (FAST, no DB)
cd backend && pnpm run test:ci    # Full suite (requires DB)
cd frontend && pnpm typecheck && pnpm lint && pnpm test && pnpm build
\`\`\`

## Known Limitations

- MCP Gateway verification is optional (not blocking for core development)
- Integration tests require PostgreSQL running on port 5433
  - Set \`SKIP_DB_TESTS=true\` to skip DB-dependent integration tests if DB is unavailable.
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
  status=$(get_result "$gate")
  echo "${status}  $gate"
done
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [[ $FAILED -gt 0 ]]; then
  echo "❌ $FAILED gate(s) failed"
  exit 1
else
  echo "✅ All gates passed"
  exit 0
fi
