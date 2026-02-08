#!/bin/bash
# =============================================================================
# Localhost Leak Check (S0.5.0-OPS-4)
# =============================================================================
# Scans frontend production build for forbidden localhost API base URLs.
# Documentation pages may legitimately mention localhost as examples — those
# are excluded. This check targets the main bundle (index-*.js) and HTML
# entry point where actual runtime API URLs live.
#
# Usage:
#   ./scripts/check-localhost-leak.sh [--dir PATH]
#
# Exit codes:
#   0 - No leaks found
#   1 - Localhost references detected in build artifacts
# =============================================================================

set -euo pipefail

BUILD_DIR="frontend/dist"

while [[ $# -gt 0 ]]; do
  case $1 in
    --dir) BUILD_DIR="$2"; shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

if [ ! -d "$BUILD_DIR" ]; then
  echo "ERROR: Build directory '$BUILD_DIR' not found."
  echo "Run 'pnpm -C frontend build' first."
  exit 1
fi

# Patterns that must NOT appear in the main bundle or HTML entry point.
# These indicate an actual API base URL leak, not documentation examples.
FORBIDDEN_PATTERNS='(VITE_BACKEND_URL|VITE_API_URL|apiBaseUrl|getApiBaseUrl|fetch\(|axios).{0,80}(localhost|127\.0\.0\.1)'

# Check 1: Verify the main entry JS chunk has no localhost API calls
MAIN_BUNDLE=$(find "$BUILD_DIR" -name 'index-*.js' -maxdepth 2 2>/dev/null | head -1)
if [ -z "$MAIN_BUNDLE" ]; then
  echo "WARNING: No index-*.js found in $BUILD_DIR — skipping main bundle check"
else
  # Check for hard-coded localhost in API config patterns
  LEAK=$(grep -oE "$FORBIDDEN_PATTERNS" "$MAIN_BUNDLE" 2>/dev/null || true)
  if [ -n "$LEAK" ]; then
    echo "❌ LOCALHOST LEAK in main bundle ($MAIN_BUNDLE):"
    echo "$LEAK"
    exit 1
  fi
fi

# Check 2: Verify index.html has no localhost references
INDEX_HTML="$BUILD_DIR/index.html"
if [ -f "$INDEX_HTML" ]; then
  LEAK_HTML=$(grep -E 'localhost|127\.0\.0\.1' "$INDEX_HTML" 2>/dev/null || true)
  if [ -n "$LEAK_HTML" ]; then
    echo "❌ LOCALHOST LEAK in index.html:"
    echo "$LEAK_HTML"
    exit 1
  fi
fi

# Check 3: Quick scan all JS files for hardcoded fetch("http://localhost...")
# This catches accidental hardcoding outside the config module
ALL_LEAKS=$(grep -rlE 'fetch\s*\(\s*["\x27]https?://(localhost|127\.0\.0\.1)' "$BUILD_DIR" --include='*.js' 2>/dev/null || true)
if [ -n "$ALL_LEAKS" ]; then
  # Filter out known documentation pages (contain example URLs for developers)
  REAL_LEAKS=""
  for f in $ALL_LEAKS; do
    BASENAME=$(basename "$f")
    case "$BASENAME" in
      *DocsPage*|*GettingStarted*|*Troubleshooting*|*SelfHosting*|*BestPractices*) continue ;;
      *) REAL_LEAKS="$REAL_LEAKS $f" ;;
    esac
  done

  if [ -n "$REAL_LEAKS" ]; then
    echo "❌ LOCALHOST LEAK: hardcoded fetch() with localhost found in:"
    echo "$REAL_LEAKS"
    exit 1
  fi
fi

echo "✅ No localhost leaks found in $BUILD_DIR"
exit 0
