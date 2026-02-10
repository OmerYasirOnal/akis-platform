#!/usr/bin/env bash
set -euo pipefail

# Public portfolio repo export — allowlist-based copy + denylist scan
# Usage: ./scripts/public-repo/export.sh [--output DIR]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
OUTPUT_DIR="${1:-$REPO_ROOT/dist/public-repo}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=== AKIS Public Portfolio Export ==="
echo "Source: $REPO_ROOT"
echo "Output: $OUTPUT_DIR"
echo ""

# Clean previous export
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

# --- ALLOWLIST: Documentation ---
DOCS_ALLOWLIST=(
  "docs/agents/AGENT_CONTRACTS_S0.5.md"
  "docs/agents/CONTEXT_PACKS.md"
  "docs/UI_DESIGN_SYSTEM.md"
  "docs/WEB_INFORMATION_ARCHITECTURE.md"
  "backend/docs/API_SPEC.md"
  "backend/docs/Auth.md"
  "backend/docs/AGENT_WORKFLOWS.md"
)

# --- ALLOWLIST: Source code showcase directories ---
SRC_ALLOWLIST=(
  "backend/src/core/orchestrator"
  "backend/src/core/state"
  "backend/src/core/events"
  "backend/src/core/tracing"
  "backend/src/core/contracts"
  "backend/src/core/planning"
  "backend/src/services/quality"
  "backend/src/core/watchdog"
  "backend/src/agents/scribe"
  "backend/src/agents/trace"
  "backend/src/agents/proto"
  "backend/src/services/mcp/adapters"
  "frontend/src/pages/dashboard"
  "frontend/src/components/agents"
  "frontend/src/components/jobs"
  "frontend/src/components/dashboard"
)

# --- ALLOWLIST: Assets ---
ASSET_ALLOWLIST=(
  "docs/public/assets"
)

echo "--- Phase 1: Copy allowlisted files ---"

copy_file() {
  local src="$REPO_ROOT/$1"
  local dest="$OUTPUT_DIR/$1"
  if [ -f "$src" ]; then
    mkdir -p "$(dirname "$dest")"
    cp "$src" "$dest"
    echo "  + $1"
  else
    echo -e "  ${YELLOW}SKIP (not found): $1${NC}"
  fi
}

copy_dir() {
  local src="$REPO_ROOT/$1"
  local dest="$OUTPUT_DIR/$1"
  if [ -d "$src" ]; then
    mkdir -p "$dest"
    # Copy only source files, skip tests and node_modules
    find "$src" -type f \
      ! -name '*.test.*' \
      ! -path '*/__tests__/*' \
      ! -path '*/node_modules/*' \
      ! -name '.env*' \
      ! -name '*.lock' \
      -exec bash -c '
        rel="${1#'"$REPO_ROOT"'/}"
        dest_file="'"$OUTPUT_DIR"'/$rel"
        mkdir -p "$(dirname "$dest_file")"
        cp "$1" "$dest_file"
      ' _ {} \;
    local count
    count=$(find "$dest" -type f | wc -l | tr -d ' ')
    echo "  + $1/ ($count files)"
  else
    echo -e "  ${YELLOW}SKIP (not found): $1/${NC}"
  fi
}

for f in "${DOCS_ALLOWLIST[@]}"; do copy_file "$f"; done
for d in "${SRC_ALLOWLIST[@]}"; do copy_dir "$d"; done
for d in "${ASSET_ALLOWLIST[@]}"; do
  if [ -d "$REPO_ROOT/$d" ]; then
    mkdir -p "$OUTPUT_DIR/$d"
    find "$REPO_ROOT/$d" -type f ! -name '.gitkeep' -exec cp {} "$OUTPUT_DIR/$d/" \; 2>/dev/null
    echo "  + $d/ (assets)"
  fi
done

echo ""
echo "--- Phase 2: Generate README.md (TR) and README.en.md (EN) ---"

if [ -f "$REPO_ROOT/docs/PUBLIC_PORTFOLIO.md" ]; then
  tail -n +8 "$REPO_ROOT/docs/PUBLIC_PORTFOLIO.md" > "$OUTPUT_DIR/README.md"
  echo "  + README.md (TR, from docs/PUBLIC_PORTFOLIO.md)"
else
  echo -e "  ${RED}ERROR: docs/PUBLIC_PORTFOLIO.md not found${NC}"
  exit 1
fi

if [ -f "$REPO_ROOT/docs/PUBLIC_PORTFOLIO_EN.md" ]; then
  tail -n +7 "$REPO_ROOT/docs/PUBLIC_PORTFOLIO_EN.md" > "$OUTPUT_DIR/README.en.md"
  echo "  + README.en.md (EN, from docs/PUBLIC_PORTFOLIO_EN.md)"
else
  echo -e "  ${YELLOW}SKIP: docs/PUBLIC_PORTFOLIO_EN.md not found — English README omitted${NC}"
fi

echo ""
echo "--- Phase 3: Generate LICENSE ---"

cat > "$OUTPUT_DIR/LICENSE" << 'LICEOF'
MIT License

Copyright (c) 2025-2026 Ömer Yasir Önal

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
LICEOF
echo "  + LICENSE (MIT)"

echo ""
echo "--- Phase 4: Generate SECURITY.md ---"

cat > "$OUTPUT_DIR/SECURITY.md" << 'SECEOF'
# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly:

**Email:** omeryasironal@gmail.com

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact

**Do NOT** open a public GitHub issue for security vulnerabilities.

## Scope

This security policy applies to the AKIS Platform source code in this repository.
The staging environment ([staging.akisflow.com](https://staging.akisflow.com)) is a
demo instance and should not be used for production workloads.

## Security Measures

- User AI keys are encrypted at rest (AES-256-GCM)
- JWT sessions use HTTP-only, Secure, SameSite cookies
- All API endpoints are rate-limited
- Sensitive data is redacted from SSE streams
- OAuth tokens are never exposed to the frontend
SECEOF
echo "  + SECURITY.md"

echo ""
echo "--- Phase 5: Denylist scan ---"

SCAN_FAILED=0

# Pattern file for scanning
PATTERNS=(
  'sk-[a-zA-Z0-9]{20,}'
  'ghp_[a-zA-Z0-9]{36}'
  'gho_[a-zA-Z0-9]{36}'
  'GOCSPX-[a-zA-Z0-9_-]+'
  'xoxb-[a-zA-Z0-9-]+'
  'whsec_[a-zA-Z0-9]+'
  '\b(10|172\.(1[6-9]|2[0-9]|3[01])|192\.168)\.[0-9]{1,3}\.[0-9]{1,3}\b'
  'STAGING_SSH_KEY'
  'STAGING_HOST'
  'STAGING_USER'
  '\.env\.staging'
  'opc@'
  '/opt/akis'
  'BEGIN (RSA |OPENSSH )?PRIVATE KEY'
)

for pattern in "${PATTERNS[@]}"; do
  matches=$(grep -rEn "$pattern" "$OUTPUT_DIR" 2>/dev/null || true)
  if [ -n "$matches" ]; then
    echo -e "${RED}BLOCKED: Pattern '$pattern' found:${NC}"
    echo "$matches" | head -5
    SCAN_FAILED=1
  fi
done

echo ""
if [ "$SCAN_FAILED" -eq 1 ]; then
  echo -e "${RED}=== EXPORT FAILED: Denylist violations detected ===${NC}"
  echo "Fix the flagged files and re-run."
  rm -rf "$OUTPUT_DIR"
  exit 1
fi

echo -e "${GREEN}=== Denylist scan passed ===${NC}"

echo ""
echo "--- Summary ---"
FILE_COUNT=$(find "$OUTPUT_DIR" -type f | wc -l | tr -d ' ')
TOTAL_SIZE=$(du -sh "$OUTPUT_DIR" | cut -f1)
echo "Exported: $FILE_COUNT files ($TOTAL_SIZE)"
echo "Output:   $OUTPUT_DIR"
echo ""
echo "Next steps:"
echo "  1. Review:  ls -la $OUTPUT_DIR"
echo "  2. Publish:  cd $OUTPUT_DIR && git init && git add . && git commit -m 'Initial commit'"
echo "  3. Push:     gh repo create OmerYasirOnal/akis-platform --public --source . --push"
echo ""
echo -e "${GREEN}Done.${NC}"
