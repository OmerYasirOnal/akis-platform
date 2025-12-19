#!/usr/bin/env bash
#===============================================================================
# AKIS MCP Doctor - Automated setup + smoke test for local MCP Gateway
#
# Usage:
#   ./scripts/mcp-doctor.sh [--help]
#
# What it does:
#   1. Ensures .env.mcp.local exists (creates from template if missing)
#   2. Verifies .env.mcp.local is gitignored (fails if tracked/staged)
#   3. Verifies GITHUB_TOKEN key is present (never prints value)
#   4. Runs: mcp-up → mcp-smoke-test → mcp-down
#   5. Writes redacted logs to .mcp-doctor.log (gitignored)
#   6. Provides actionable next steps for UI verification
#
# Exit codes:
#   0 = Success (all checks passed)
#   1 = Setup incomplete (user action required)
#   2 = Smoke test failed (MCP Gateway issue)
#   3 = Security violation (env file not ignored)
#===============================================================================
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="$REPO_ROOT/.mcp-doctor-$TIMESTAMP.log"
ENV_FILE="$REPO_ROOT/.env.mcp.local"
TEMPLATE_FILE="$REPO_ROOT/env.mcp.local.example"

# Cleanup handler
cleanup() {
  local exit_code=$?
  if [ $exit_code -ne 0 ]; then
    log_error "MCP Doctor failed. Check log: $LOG_FILE"
  fi
}
trap cleanup EXIT

#===============================================================================
# Logging functions
#===============================================================================
log_info() {
  echo -e "${BLUE}[INFO]${NC} $*" | tee -a "$LOG_FILE"
}

log_success() {
  echo -e "${GREEN}[✓]${NC} $*" | tee -a "$LOG_FILE"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $*" | tee -a "$LOG_FILE"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $*" | tee -a "$LOG_FILE" >&2
}

log_step() {
  echo -e "\n${CYAN}═══════════════════════════════════════════════════════════════${NC}" | tee -a "$LOG_FILE"
  echo -e "${CYAN}  $*${NC}" | tee -a "$LOG_FILE"
  echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}\n" | tee -a "$LOG_FILE"
}

fail() {
  log_error "$1"
  if [ -n "${2:-}" ]; then
    echo -e "${YELLOW}FIX:${NC} $2" | tee -a "$LOG_FILE" >&2
  fi
  exit "${3:-1}"
}

#===============================================================================
# Help
#===============================================================================
if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  head -24 "$0" | tail -20
  exit 0
fi

#===============================================================================
# Header
#===============================================================================
log_step "AKIS MCP Doctor - Automated Setup + Smoke Test"
log_info "Timestamp: $(date)"
log_info "Log file: $LOG_FILE"
log_info "Working directory: $REPO_ROOT"
echo ""

#===============================================================================
# PHASE 1: Ensure .env.mcp.local exists
#===============================================================================
log_step "PHASE 1: Ensure .env.mcp.local Exists"

if [ -f "$ENV_FILE" ]; then
  log_success ".env.mcp.local exists"
else
  log_warn ".env.mcp.local not found"
  
  if [ -f "$TEMPLATE_FILE" ]; then
    log_info "Creating .env.mcp.local from template..."
    cp "$TEMPLATE_FILE" "$ENV_FILE"
    log_success "Created .env.mcp.local from env.mcp.local.example"
  else
    log_warn "Template not found, creating minimal .env.mcp.local..."
    cat > "$ENV_FILE" <<'EOF'
# GitHub Personal Access Token for MCP Gateway
# Get token from: https://github.com/settings/tokens
# Required scopes: repo, read:org
GITHUB_TOKEN=

# Log level (optional)
LOG_LEVEL=info
EOF
    log_success "Created minimal .env.mcp.local"
  fi
  
  echo ""
  log_error "SETUP INCOMPLETE: You must add your GitHub token!"
  echo ""
  echo -e "${YELLOW}Next steps:${NC}"
  echo "  1. Get a GitHub Personal Access Token:"
  echo "     https://github.com/settings/tokens"
  echo ""
  echo "  2. Edit .env.mcp.local and replace the empty GITHUB_TOKEN line:"
  echo "     ${CYAN}GITHUB_TOKEN=ghp_your_actual_token_here${NC}"
  echo ""
  echo "  3. Run this script again:"
  echo "     ${CYAN}./scripts/mcp-doctor.sh${NC}"
  echo ""
  fail "Missing GitHub token" "" 1
fi

#===============================================================================
# PHASE 2: Verify .env.mcp.local is gitignored
#===============================================================================
log_step "PHASE 2: Verify .env.mcp.local is Gitignored"

cd "$REPO_ROOT"

# Check if file is tracked
if git ls-files --error-unmatch "$ENV_FILE" &>/dev/null; then
  fail "SECURITY: .env.mcp.local is TRACKED in git!" \
       "Remove it: git rm --cached .env.mcp.local && git commit -m 'chore: untrack secret env file'" \
       3
fi

# Check if file is staged
if git diff --cached --name-only | grep -q "^\.env\.mcp\.local$"; then
  fail "SECURITY: .env.mcp.local is STAGED!" \
       "Unstage it: git reset HEAD .env.mcp.local" \
       3
fi

# Check if file is ignored
if ! git check-ignore -q "$ENV_FILE"; then
  log_error "SECURITY: .env.mcp.local is NOT ignored by git!"
  echo ""
  echo "Add to .gitignore:"
  echo "  .env.mcp.local"
  echo ""
  fail "Security check failed" "Update .gitignore and try again" 3
fi

log_success ".env.mcp.local is properly gitignored"

#===============================================================================
# PHASE 3: Verify GITHUB_TOKEN key is present
#===============================================================================
log_step "PHASE 3: Verify GITHUB_TOKEN Key is Present"

# SECURITY: Check for non-empty GITHUB_TOKEN without reading the value
if ! grep -qE '^GITHUB_TOKEN=.+' "$ENV_FILE"; then
  echo ""
  log_error "GITHUB_TOKEN is missing or empty in .env.mcp.local"
  echo ""
  echo -e "${YELLOW}Next steps:${NC}"
  echo "  1. Get a GitHub Personal Access Token:"
  echo "     https://github.com/settings/tokens"
  echo ""
  echo "  2. Edit .env.mcp.local and set GITHUB_TOKEN:"
  echo "     ${CYAN}GITHUB_TOKEN=ghp_your_actual_token_here${NC}"
  echo ""
  echo "  3. Run this script again:"
  echo "     ${CYAN}./scripts/mcp-doctor.sh${NC}"
  echo ""
  fail "Missing GitHub token" "" 1
fi

log_success "GITHUB_TOKEN is configured (value not shown)"

#===============================================================================
# PHASE 4: Run MCP Pipeline (up → smoke → down)
#===============================================================================
log_step "PHASE 4: Run MCP Pipeline"

# Ensure cleanup happens even on failure
MCP_UP_DONE=false
cleanup_mcp() {
  if [ "$MCP_UP_DONE" = true ]; then
    log_info "Cleaning up MCP Gateway..."
    "$SCRIPT_DIR/mcp-down.sh" >> "$LOG_FILE" 2>&1 || true
  fi
}
trap cleanup_mcp EXIT

# Start MCP Gateway
log_info "Starting MCP Gateway..."
if "$SCRIPT_DIR/mcp-up.sh" >> "$LOG_FILE" 2>&1; then
  MCP_UP_DONE=true
  log_success "MCP Gateway started"
else
  fail "Failed to start MCP Gateway" \
       "Check logs: $LOG_FILE or run: docker compose -f docker-compose.mcp.yml logs" \
       2
fi

# Wait a moment for gateway to stabilize
sleep 2

# Run smoke test
log_info "Running MCP smoke test..."
if "$SCRIPT_DIR/mcp-smoke-test.sh" >> "$LOG_FILE" 2>&1; then
  log_success "MCP smoke test PASSED"
else
  log_error "MCP smoke test FAILED"
  echo ""
  echo "Check detailed logs: $LOG_FILE"
  echo ""
  fail "Smoke test failed" \
       "Run manually: ./scripts/mcp-smoke-test.sh (gateway is still running)" \
       2
fi

# Stop MCP Gateway
log_info "Stopping MCP Gateway..."
if "$SCRIPT_DIR/mcp-down.sh" >> "$LOG_FILE" 2>&1; then
  MCP_UP_DONE=false
  log_success "MCP Gateway stopped"
else
  log_warn "Failed to stop MCP Gateway cleanly (non-critical)"
fi

#===============================================================================
# PHASE 5: Success + Next Steps
#===============================================================================
log_step "SUCCESS: MCP Local Setup Complete"

echo -e "${GREEN}✅ All checks passed!${NC}"
echo ""
echo "Your local MCP Gateway is ready for development."
echo ""
echo -e "${CYAN}Next steps for UI verification:${NC}"
echo "  1. Start backend and frontend:"
echo "     ${BLUE}cd backend && pnpm dev${NC}"
echo "     ${BLUE}cd frontend && pnpm dev${NC}"
echo ""
echo "  2. Open Scribe agent in browser:"
echo "     ${BLUE}http://localhost:5173/dashboard/agents/scribe${NC}"
echo ""
echo "  3. Run a test job (dry run):"
echo "     - Fill in GitHub owner, repo, base branch"
echo "     - Click 'Run Test Job'"
echo "     - Wait for job to complete"
echo ""
echo "  4. Verify in Job Details:"
echo "     - ✅ No -32601 errors"
echo "     - ✅ Correlation ID is visible"
echo "     - ✅ Copy button works for correlation ID"
echo "     - ✅ User-friendly error hints (if any errors)"
echo ""
echo -e "${CYAN}For full integration testing:${NC}"
echo "  - Run: ${BLUE}./scripts/akis-pr-autoflow.sh${NC}"
echo "  - This will run backend+frontend tests and create a PR"
echo ""
echo -e "${CYAN}Logs:${NC}"
echo "  - Doctor log: ${BLUE}$LOG_FILE${NC}"
echo "  - This file is gitignored (safe to keep locally)"
echo ""
log_info "MCP Doctor completed successfully"
exit 0

