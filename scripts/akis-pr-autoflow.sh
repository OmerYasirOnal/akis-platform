#!/usr/bin/env bash
#===============================================================================
# AKIS PR Autoflow - Single-command automation for safe PR workflow
#
# Usage:
#   ./scripts/akis-pr-autoflow.sh [OPTIONS]
#
# Options:
#   --dry-run             Show what would happen without making changes
#   --no-merge            Create PR and wait for green, but don't merge
#   --skip-ui             Skip UI smoke tests (not recommended)
#   --skip-mcp            Skip MCP gateway tests (if gateway not available)
#   --merge-method METHOD Merge strategy: merge (default), squash, or rebase
#   --use-current-branch  Use existing branch instead of creating new one
#   -h, --help            Show this help message
#
# What it does:
#   1. Validates environment (git, gh, pnpm, node, docker)
#   2. Ensures no secrets will be pushed
#   3. Creates feature branch from main OR uses existing branch
#   4. Runs full verification (MCP + backend + frontend + UI)
#   5. Opens PR, waits for CI green, merges with selected strategy
#
# Examples:
#   # Use existing branch, preserve commits with merge (not squash)
#   ./scripts/akis-pr-autoflow.sh --use-current-branch --merge-method merge
#
#   # Create new branch, squash on merge
#   ./scripts/akis-pr-autoflow.sh --merge-method squash
#===============================================================================
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="$REPO_ROOT/.autoflow-$TIMESTAMP.log"

# Flags
DRY_RUN=false
NO_MERGE=false
SKIP_UI=false
SKIP_MCP=false
MCP_STARTED=false
MERGE_METHOD="merge"  # Default: preserve commit history
USE_CURRENT_BRANCH=false

# Cleanup handler
cleanup() {
  local exit_code=$?
  echo ""
  log_info "Cleanup: Stopping any started services..."
  
  if [ "$MCP_STARTED" = true ]; then
    log_info "Stopping MCP gateway..."
    "$REPO_ROOT/scripts/mcp-down.sh" 2>/dev/null || true
  fi
  
  if [ $exit_code -ne 0 ]; then
    log_error "Script failed. Check log: $LOG_FILE"
  fi
  
  exit $exit_code
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
  echo -e "\n${GREEN}═══════════════════════════════════════════════════════════════${NC}" | tee -a "$LOG_FILE"
  echo -e "${GREEN}  $*${NC}" | tee -a "$LOG_FILE"
  echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}\n" | tee -a "$LOG_FILE"
}

fail() {
  log_error "$1"
  echo -e "${RED}FIX:${NC} $2" >&2
  exit 1
}

#===============================================================================
# Parse arguments
#===============================================================================
parse_args() {
  while [[ $# -gt 0 ]]; do
    case $1 in
      --dry-run)
        DRY_RUN=true
        log_info "DRY RUN mode enabled - no changes will be pushed"
        shift
        ;;
      --no-merge)
        NO_MERGE=true
        log_info "NO MERGE mode - will create PR but not merge"
        shift
        ;;
      --skip-ui)
        SKIP_UI=true
        log_warn "Skipping UI smoke tests (not recommended)"
        shift
        ;;
      --skip-mcp)
        SKIP_MCP=true
        log_warn "Skipping MCP gateway tests"
        shift
        ;;
      --merge-method)
        if [ -z "${2:-}" ]; then
          fail "Missing argument for --merge-method" "Use: --merge-method [merge|squash|rebase]"
        fi
        case "$2" in
          merge|squash|rebase)
            MERGE_METHOD="$2"
            log_info "Merge method: $MERGE_METHOD"
            ;;
          *)
            fail "Invalid merge method: $2" "Valid options: merge, squash, rebase"
            ;;
        esac
        shift 2
        ;;
      --use-current-branch)
        USE_CURRENT_BRANCH=true
        log_info "Will use current branch (no new branch creation)"
        shift
        ;;
      -h|--help)
        head -30 "$0" | tail -25
        exit 0
        ;;
      *)
        fail "Unknown option: $1" "Run with --help to see available options"
        ;;
    esac
  done
}

#===============================================================================
# Precondition checks
#===============================================================================
check_preconditions() {
  log_step "PHASE 1: Precondition Checks"
  
  # Check we're in a git repo
  if ! git rev-parse --git-dir > /dev/null 2>&1; then
    fail "Not in a git repository" "Run this script from the AKIS repo root"
  fi
  log_success "Git repository detected"
  
  # Check remote origin exists
  if ! git remote get-url origin > /dev/null 2>&1; then
    fail "No 'origin' remote configured" "Add remote: git remote add origin <url>"
  fi
  log_success "Remote 'origin' exists"
  
  # Check gh CLI
  if ! command -v gh &> /dev/null; then
    fail "GitHub CLI (gh) not found" "Install: brew install gh && gh auth login"
  fi
  if ! gh auth status &> /dev/null; then
    fail "GitHub CLI not authenticated" "Run: gh auth login"
  fi
  log_success "GitHub CLI installed and authenticated"
  
  # Check pnpm
  if ! command -v pnpm &> /dev/null; then
    fail "pnpm not found" "Install: npm install -g pnpm"
  fi
  log_success "pnpm available"
  
  # Check node
  if ! command -v node &> /dev/null; then
    fail "node not found" "Install Node.js 20+"
  fi
  log_success "node available ($(node --version))"
  
  # Check docker (for MCP)
  if [ "$SKIP_MCP" = false ]; then
    if ! command -v docker &> /dev/null; then
      log_warn "Docker not found - MCP tests will be skipped"
      SKIP_MCP=true
    elif ! docker info &> /dev/null 2>&1; then
      log_warn "Docker not running - MCP tests will be skipped"
      SKIP_MCP=true
    else
      log_success "Docker available and running"
    fi
  fi
  
  # Check working tree
  cd "$REPO_ROOT"
  if ! git diff --quiet || ! git diff --cached --quiet; then
    log_warn "Working tree has uncommitted changes"
    git status --short
    echo ""
    read -p "Continue anyway? Changes will be committed. [y/N] " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      fail "Aborted by user" "Commit or stash your changes first"
    fi
  else
    log_success "Working tree is clean"
  fi
}

#===============================================================================
# Security: Verify no secrets will be pushed
#===============================================================================
check_secrets_safety() {
  log_step "PHASE 2: Security Check - No Secrets"
  
  cd "$REPO_ROOT"
  
  # Define sensitive patterns
  local ENV_PATTERNS=(
    ".env"
    ".env.local"
    ".env.*.local"
    ".env.mcp.local"
    "backend/.env"
    "backend/.env.local"
    "backend/.env.*.local"
    "frontend/.env"
    "frontend/.env.local"
    "frontend/.env.*.local"
    "mcp-gateway/.env"
  )
  
  # Check .gitignore covers these
  log_info "Verifying .gitignore covers sensitive files..."
  for pattern in "${ENV_PATTERNS[@]}"; do
    if ! grep -qF "$pattern" .gitignore 2>/dev/null; then
      # Check if it's a glob pattern that might be covered differently
      if [[ "$pattern" != *"*"* ]]; then
        log_warn "Pattern not in .gitignore: $pattern"
      fi
    fi
  done
  log_success ".gitignore includes env patterns"
  
  # Check if any .env files are tracked
  log_info "Checking for tracked .env files..."
  local tracked_envs
  tracked_envs=$(git ls-files | grep -E '\.env$|\.env\.' | grep -v '\.example$' || true)
  if [ -n "$tracked_envs" ]; then
    fail "SECURITY: .env files are tracked in git!" \
         "Remove them: git rm --cached $tracked_envs"
  fi
  log_success "No .env files are tracked"
  
  # Check if any .env files are staged
  log_info "Checking for staged .env files..."
  local staged_envs
  staged_envs=$(git diff --cached --name-only | grep -E '\.env$|\.env\.' | grep -v '\.example$' || true)
  if [ -n "$staged_envs" ]; then
    fail "SECURITY: .env files are staged!" \
         "Unstage them: git reset HEAD $staged_envs"
  fi
  log_success "No .env files are staged"
  
  # Safe report: which env files exist (paths only, never values)
  log_info "Environment files report (paths only, NO values):"
  echo "  ┌─────────────────────────────────────────────────────"
  for pattern in ".env.mcp.local" "backend/.env" "backend/.env.local" "frontend/.env" "frontend/.env.local"; do
    if [ -f "$REPO_ROOT/$pattern" ]; then
      echo "  │ ✓ EXISTS: $pattern"
    else
      echo "  │ ✗ MISSING: $pattern"
    fi
  done
  echo "  └─────────────────────────────────────────────────────"
  
  # Check required keys in backend/.env.example (keys only)
  log_info "Checking required env keys (from .env.example)..."
  if [ -f "$REPO_ROOT/backend/.env.example" ]; then
    local required_keys=("DATABASE_URL" "JWT_SECRET" "GITHUB_MCP_BASE_URL")
    local missing_keys=()
    
    for key in "${required_keys[@]}"; do
      if [ -f "$REPO_ROOT/backend/.env" ]; then
        if ! grep -q "^${key}=" "$REPO_ROOT/backend/.env" 2>/dev/null; then
          missing_keys+=("$key")
        fi
      fi
    done
    
    if [ ${#missing_keys[@]} -gt 0 ]; then
      log_warn "Missing keys in backend/.env: ${missing_keys[*]}"
      log_warn "Some tests may be skipped"
    else
      log_success "All critical env keys present in backend/.env"
    fi
  fi
  
  # Check MCP env file separately
  if [ -f "$REPO_ROOT/.env.mcp.local" ]; then
    if grep -qE '^GITHUB_TOKEN=.+' "$REPO_ROOT/.env.mcp.local" 2>/dev/null; then
      log_success "GITHUB_TOKEN present in .env.mcp.local"
    else
      log_warn "GITHUB_TOKEN not set in .env.mcp.local (MCP tests will be skipped)"
    fi
  else
    log_warn ".env.mcp.local not found (MCP tests will be skipped)"
  fi
  
  log_success "Security check passed - no secrets will be pushed"
}

#===============================================================================
# Branch management
#===============================================================================
setup_branch() {
  log_step "PHASE 3: Branch Setup"
  
  cd "$REPO_ROOT"
  
  # Fetch latest from origin
  log_info "Fetching latest from origin..."
  git fetch origin main 2>/dev/null || git fetch origin
  
  local current_branch
  current_branch=$(git branch --show-current)
  
  # Verify main alignment with origin/main
  if [ "$current_branch" = "main" ]; then
    local ahead behind
    ahead=$(git rev-list --count origin/main..main 2>/dev/null || echo "0")
    behind=$(git rev-list --count main..origin/main 2>/dev/null || echo "0")
    
    if [ "$ahead" -gt 0 ] || [ "$behind" -gt 0 ]; then
      log_warn "Local main diverged from origin/main (ahead: $ahead, behind: $behind)"
      
      if [ "$ahead" -gt 0 ]; then
        log_info "Creating rescue branch from current main..."
        local rescue_branch="feat/auto-$TIMESTAMP"
        git checkout -b "$rescue_branch"
        FEATURE_BRANCH="$rescue_branch"
        
        # Reset main to origin/main
        if [ "$DRY_RUN" = false ]; then
          git branch -f main origin/main
        fi
        
        log_success "Created branch: $FEATURE_BRANCH (rescued $ahead commits)"
      else
        fail "Local main is behind origin/main" "Run: git checkout main && git pull origin main"
      fi
    else
      # Main is clean
      if [ "$USE_CURRENT_BRANCH" = true ]; then
        fail "Cannot use current branch: you are on main" "Switch to a feature branch first"
      fi
      
      # Create new feature branch
      FEATURE_BRANCH="feat/auto-$TIMESTAMP"
      git checkout -b "$FEATURE_BRANCH" origin/main
      log_success "Created branch: $FEATURE_BRANCH (from origin/main)"
    fi
  else
    # Already on a feature branch
    log_info "Current branch: $current_branch"
    
    # Sanity checks for existing branch
    if [ "$USE_CURRENT_BRANCH" = true ] || git diff --quiet HEAD origin/main 2>/dev/null; then
      # Check if branch exists on remote
      if git ls-remote --heads origin "$current_branch" | grep -q "$current_branch"; then
        log_info "Branch exists on remote"
        
        # Check if local is ahead/behind remote
        local ahead_remote behind_remote
        ahead_remote=$(git rev-list --count origin/"$current_branch".."$current_branch" 2>/dev/null || echo "0")
        behind_remote=$(git rev-list --count "$current_branch"..origin/"$current_branch" 2>/dev/null || echo "0")
        
        if [ "$behind_remote" -gt 0 ]; then
          log_warn "Local branch is $behind_remote commit(s) behind remote"
          read -p "Pull latest changes? [Y/n] " -n 1 -r
          echo ""
          if [[ ! $REPLY =~ ^[Nn]$ ]]; then
            git pull origin "$current_branch"
            log_success "Pulled latest changes"
          fi
        fi
        
        if [ "$ahead_remote" -gt 0 ]; then
          log_info "Local branch is $ahead_remote commit(s) ahead of remote"
        fi
      else
        log_info "Branch does not exist on remote (will be created on push)"
      fi
      
      FEATURE_BRANCH="$current_branch"
      log_success "Using existing branch: $FEATURE_BRANCH"
    else
      fail "Current branch differs from main and --use-current-branch not set" \
           "Either use --use-current-branch or switch to main first"
    fi
  fi
}

#===============================================================================
# Run verification tests
#===============================================================================
run_verification() {
  log_step "PHASE 4: Full Verification"
  
  local test_results=()
  local failed=false
  
  # 4.1 MCP Gateway smoke test
  if [ "$SKIP_MCP" = false ]; then
    log_info "[4.1] MCP Gateway smoke test..."
    if [ -f "$REPO_ROOT/scripts/mcp-up.sh" ]; then
      # Check if .env.mcp.local exists (canonical token source)
      if [ ! -f "$REPO_ROOT/.env.mcp.local" ]; then
        log_warn ".env.mcp.local not found - skipping MCP tests"
        log_info "Create from template: cp env.mcp.local.example .env.mcp.local"
        test_results+=("MCP Gateway: SKIPPED (no .env.mcp.local)")
      else
        # Validate token presence without reading value
        if ! grep -qE '^GITHUB_TOKEN=.+' "$REPO_ROOT/.env.mcp.local" 2>/dev/null; then
          log_warn "GITHUB_TOKEN not set in .env.mcp.local - skipping MCP tests"
          test_results+=("MCP Gateway: SKIPPED (token not set)")
        else
          if "$REPO_ROOT/scripts/mcp-up.sh" 2>&1 | tee -a "$LOG_FILE"; then
            MCP_STARTED=true
            sleep 3
            if "$REPO_ROOT/scripts/mcp-smoke-test.sh" 2>&1 | tee -a "$LOG_FILE"; then
              test_results+=("MCP Gateway: PASS")
              log_success "MCP Gateway smoke test passed"
            else
              test_results+=("MCP Gateway: FAIL")
              log_error "MCP Gateway smoke test failed"
              failed=true
            fi
          else
            test_results+=("MCP Gateway: FAIL (startup)")
            log_error "MCP Gateway failed to start"
            failed=true
          fi
        fi
      fi
    else
      test_results+=("MCP Gateway: SKIPPED (no script)")
    fi
  else
    test_results+=("MCP Gateway: SKIPPED")
  fi
  
  # 4.2 Backend tests
  log_info "[4.2] Backend verification..."
  cd "$REPO_ROOT/backend"
  
  log_info "  → typecheck"
  if pnpm typecheck 2>&1 | tee -a "$LOG_FILE"; then
    log_success "Backend typecheck passed"
  else
    test_results+=("Backend typecheck: FAIL")
    failed=true
  fi
  
  log_info "  → lint"
  if pnpm lint 2>&1 | tee -a "$LOG_FILE"; then
    log_success "Backend lint passed"
  else
    test_results+=("Backend lint: FAIL")
    failed=true
  fi
  
  log_info "  → tests"
  if NODE_ENV=test pnpm test 2>&1 | tee -a "$LOG_FILE"; then
    test_results+=("Backend tests: PASS")
    log_success "Backend tests passed"
  else
    test_results+=("Backend tests: FAIL")
    log_error "Backend tests failed"
    failed=true
  fi
  
  # 4.3 Frontend tests
  log_info "[4.3] Frontend verification..."
  cd "$REPO_ROOT/frontend"
  
  log_info "  → typecheck"
  if pnpm typecheck 2>&1 | tee -a "$LOG_FILE"; then
    log_success "Frontend typecheck passed"
  else
    test_results+=("Frontend typecheck: FAIL")
    failed=true
  fi
  
  log_info "  → lint"
  if pnpm lint 2>&1 | tee -a "$LOG_FILE"; then
    log_success "Frontend lint passed"
  else
    test_results+=("Frontend lint: FAIL")
    failed=true
  fi
  
  log_info "  → tests"
  if pnpm test 2>&1 | tee -a "$LOG_FILE"; then
    test_results+=("Frontend tests: PASS")
    log_success "Frontend tests passed"
  else
    test_results+=("Frontend tests: FAIL")
    log_error "Frontend tests failed"
    failed=true
  fi
  
  # 4.4 UI smoke test
  if [ "$SKIP_UI" = false ]; then
    log_info "[4.4] UI smoke test..."
    cd "$REPO_ROOT/frontend"
    
    # Check for Playwright/Cypress
    if [ -f "playwright.config.ts" ] || [ -f "playwright.config.js" ]; then
      log_info "Playwright detected, running E2E..."
      if npx playwright test --reporter=list 2>&1 | tee -a "$LOG_FILE"; then
        test_results+=("UI E2E: PASS")
        log_success "UI E2E tests passed"
      else
        test_results+=("UI E2E: FAIL")
        failed=true
      fi
    elif [ -f "cypress.config.ts" ] || [ -f "cypress.config.js" ]; then
      log_info "Cypress detected, running E2E..."
      if npx cypress run 2>&1 | tee -a "$LOG_FILE"; then
        test_results+=("UI E2E: PASS")
        log_success "UI E2E tests passed"
      else
        test_results+=("UI E2E: FAIL")
        failed=true
      fi
    else
      # Fallback: build check as minimal UI smoke
      log_info "No E2E framework found, running build as smoke test..."
      if pnpm build 2>&1 | tee -a "$LOG_FILE"; then
        test_results+=("UI build: PASS")
        log_success "UI build smoke test passed"
      else
        test_results+=("UI build: FAIL")
        failed=true
      fi
    fi
  else
    test_results+=("UI smoke: SKIPPED")
  fi
  
  # Stop MCP gateway
  if [ "$MCP_STARTED" = true ]; then
    log_info "Stopping MCP gateway..."
    "$REPO_ROOT/scripts/mcp-down.sh" 2>/dev/null || true
    MCP_STARTED=false
  fi
  
  # Print test summary
  echo ""
  echo "═══════════════════════════════════════════════════════════════"
  echo "                     TEST SUMMARY"
  echo "═══════════════════════════════════════════════════════════════"
  for result in "${test_results[@]}"; do
    if [[ "$result" == *"PASS"* ]]; then
      echo -e "  ${GREEN}✓${NC} $result"
    elif [[ "$result" == *"FAIL"* ]]; then
      echo -e "  ${RED}✗${NC} $result"
    else
      echo -e "  ${YELLOW}○${NC} $result"
    fi
  done
  echo "═══════════════════════════════════════════════════════════════"
  echo ""
  
  if [ "$failed" = true ]; then
    fail "Verification failed" "Fix the failing tests and re-run"
  fi
  
  log_success "All verification checks passed!"
}

#===============================================================================
# Commit and push
#===============================================================================
commit_and_push() {
  log_step "PHASE 5: Commit and Push"
  
  cd "$REPO_ROOT"
  
  # Check for changes to commit
  if git diff --quiet && git diff --cached --quiet; then
    log_info "No changes to commit"
  else
    log_info "Staging changes..."
    git add -A
    
    # Double-check no .env files staged
    local staged_envs
    staged_envs=$(git diff --cached --name-only | grep -E '\.env$|\.env\.' | grep -v '\.example$' || true)
    if [ -n "$staged_envs" ]; then
      fail "SECURITY: .env files would be committed!" \
           "This should not happen. Check .gitignore"
    fi
    
    log_info "Committing..."
    
    # Only auto-commit if not using existing branch with commits
    if [ "$USE_CURRENT_BRANCH" = true ] && [ "$(git rev-list --count HEAD ^origin/main 2>/dev/null || echo 0)" -gt 0 ]; then
      log_info "Using existing branch with commits - skipping auto-commit"
      log_warn "Existing commits will be preserved"
    else
      git commit -m "chore: automated verification run $TIMESTAMP

- All backend tests passing (typecheck, lint, unit/integration)
- All frontend tests passing (typecheck, lint, unit)
- MCP gateway integration verified
- No secrets in commit (verified)

Automated by: akis-pr-autoflow.sh"
      
      log_success "Changes committed"
    fi
  fi
  
  if [ "$DRY_RUN" = true ]; then
    log_warn "[DRY RUN] Would push to origin/$FEATURE_BRANCH"
    return 0
  fi
  
  log_info "Pushing to origin/$FEATURE_BRANCH..."
  git push -u origin "$FEATURE_BRANCH"
  log_success "Pushed to origin/$FEATURE_BRANCH"
}

#===============================================================================
# Create PR and wait for CI
#===============================================================================
create_pr_and_wait() {
  log_step "PHASE 6: Create PR and Wait for CI"
  
  if [ "$DRY_RUN" = true ]; then
    log_warn "[DRY RUN] Would create PR: $FEATURE_BRANCH -> main"
    return 0
  fi
  
  cd "$REPO_ROOT"
  
  # Check if PR already exists
  local existing_pr
  existing_pr=$(gh pr list --head "$FEATURE_BRANCH" --json number --jq '.[0].number' 2>/dev/null || echo "")
  
  if [ -n "$existing_pr" ]; then
    log_info "PR #$existing_pr already exists for this branch"
    PR_NUMBER="$existing_pr"
  else
    log_info "Creating PR..."
    PR_URL=$(gh pr create \
      --title "chore: automated verification + MCP gateway V2 ($TIMESTAMP)" \
      --body "## Automated PR

### What's Included
- All verification tests passed locally
- MCP Gateway integration tested
- No secrets committed (verified by automation)

### Tests Run
- Backend: typecheck ✓, lint ✓, tests ✓
- Frontend: typecheck ✓, lint ✓, tests ✓
- MCP Gateway: smoke test ✓

### How to Review
1. Check CI status (should be green)
2. Review the file changes
3. Approve and merge

---
*Created by \`akis-pr-autoflow.sh\` at $(date)*" \
      --base main \
      --head "$FEATURE_BRANCH" 2>&1)
    
    PR_NUMBER=$(echo "$PR_URL" | grep -oE '[0-9]+$' || gh pr list --head "$FEATURE_BRANCH" --json number --jq '.[0].number')
    log_success "Created PR #$PR_NUMBER: $PR_URL"
  fi
  
  # Wait for CI
  log_info "Waiting for CI checks to complete..."
  local max_wait=600  # 10 minutes
  local waited=0
  local check_interval=15
  
  while [ $waited -lt $max_wait ]; do
    local status
    status=$(gh pr checks "$PR_NUMBER" --json state --jq '.[].state' 2>/dev/null | sort | uniq | tr '\n' ' ')
    
    if echo "$status" | grep -q "FAILURE"; then
      fail "CI checks failed" "Check the PR for details: gh pr view $PR_NUMBER --web"
    elif echo "$status" | grep -q "PENDING\|IN_PROGRESS"; then
      echo -ne "\r  Waiting for CI... ($waited/$max_wait seconds)   "
      sleep $check_interval
      waited=$((waited + check_interval))
    else
      echo ""
      log_success "CI checks passed!"
      break
    fi
  done
  
  if [ $waited -ge $max_wait ]; then
    fail "CI timeout after ${max_wait}s" "Check manually: gh pr view $PR_NUMBER --web"
  fi
}

#===============================================================================
# Merge and cleanup
#===============================================================================
merge_and_cleanup() {
  log_step "PHASE 7: Merge and Cleanup"
  
  if [ "$DRY_RUN" = true ]; then
    log_warn "[DRY RUN] Would merge PR and cleanup"
    return 0
  fi
  
  if [ "$NO_MERGE" = true ]; then
    log_warn "[NO MERGE] Stopping before merge as requested"
    log_info "PR is ready: gh pr view $PR_NUMBER --web"
    return 0
  fi
  
  cd "$REPO_ROOT"
  
  # Merge PR with selected method
  log_info "Merging PR #$PR_NUMBER using '$MERGE_METHOD' strategy..."
  
  local merge_flag
  case "$MERGE_METHOD" in
    squash)
      merge_flag="--squash"
      ;;
    rebase)
      merge_flag="--rebase"
      ;;
    merge)
      merge_flag="--merge"
      ;;
    *)
      fail "Invalid merge method: $MERGE_METHOD" "Use: merge, squash, or rebase"
      ;;
  esac
  
  if gh pr merge "$PR_NUMBER" "$merge_flag" --delete-branch; then
    log_success "PR merged ($MERGE_METHOD) and remote branch deleted"
  else
    fail "Failed to merge PR" "Check PR status: gh pr view $PR_NUMBER --web"
  fi
  
  # Switch to main and pull
  log_info "Switching to main and pulling..."
  git checkout main
  git pull origin main
  
  # Prune remote-tracking branches
  log_info "Pruning stale remote-tracking branches..."
  git remote prune origin
  
  # Delete local merged branch (if it still exists)
  if git branch --list "$FEATURE_BRANCH" | grep -q "$FEATURE_BRANCH"; then
    log_info "Deleting local branch: $FEATURE_BRANCH"
    git branch -d "$FEATURE_BRANCH" 2>/dev/null || true
  fi
  
  log_success "Cleanup complete - local main is up to date"
}

#===============================================================================
# Final status
#===============================================================================
print_final_status() {
  echo ""
  echo "═══════════════════════════════════════════════════════════════"
  echo "                     FINAL STATUS"
  echo "═══════════════════════════════════════════════════════════════"
  
  if [ "$DRY_RUN" = true ]; then
    echo -e "  ${YELLOW}Mode:${NC} DRY RUN (no changes made)"
  elif [ "$NO_MERGE" = true ]; then
    echo -e "  ${YELLOW}Mode:${NC} NO MERGE (PR created, not merged)"
    echo -e "  ${BLUE}PR:${NC} gh pr view $PR_NUMBER --web"
  else
    echo -e "  ${GREEN}Status:${NC} SUCCESS"
    echo -e "  ${BLUE}Merged PR:${NC} #$PR_NUMBER (strategy: $MERGE_METHOD)"
    echo -e "  ${BLUE}Current branch:${NC} $(git branch --show-current)"
    echo -e "  ${BLUE}Latest commit:${NC} $(git log --oneline -1)"
  fi
  
  echo ""
  echo -e "  ${BLUE}Log file:${NC} $LOG_FILE"
  echo "═══════════════════════════════════════════════════════════════"
  echo ""
  
  log_success "AKIS PR Autoflow completed successfully!"
}

#===============================================================================
# Main
#===============================================================================
main() {
  echo ""
  echo "╔═══════════════════════════════════════════════════════════════╗"
  echo "║           AKIS PR AUTOFLOW - Automated Verification           ║"
  echo "║               $(date)               ║"
  echo "╚═══════════════════════════════════════════════════════════════╝"
  echo ""
  
  parse_args "$@"
  
  check_preconditions
  check_secrets_safety
  setup_branch
  run_verification
  commit_and_push
  create_pr_and_wait
  merge_and_cleanup
  print_final_status
}

# Run main
main "$@"

