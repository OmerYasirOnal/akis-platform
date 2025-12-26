#!/usr/bin/env bash
# llm-contract-smoke.sh
# Verify local LLM endpoint conforms to OpenAI-compatible HTTP contract
#
# Usage:
#   ./scripts/llm-contract-smoke.sh
#
# Prerequisites:
#   - docker compose -f docker-compose.llm.local.yml up -d
#   - LocalAI running on http://localhost:8080
#
# Exit codes:
#   0 = PASS
#   1 = FAIL

set -euo pipefail

# Configuration
LOCAL_LLM_BASE_URL="${LOCAL_LLM_BASE_URL:-http://localhost:8080/v1}"
TIMEOUT=10

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

# Test 1: GET /v1/models
test_models_endpoint() {
  log_info "Test 1: GET ${LOCAL_LLM_BASE_URL}/models"
  
  local response
  if ! response=$(curl -s -f --max-time "${TIMEOUT}" "${LOCAL_LLM_BASE_URL}/models" 2>&1); then
    log_error "Failed to reach /models endpoint"
    log_error "Response: ${response}"
    log_error "Is LocalAI running? Run: docker compose -f docker-compose.llm.local.yml up -d"
    return 1
  fi
  
  # Verify JSON structure
  if ! echo "${response}" | jq -e '.data' > /dev/null 2>&1; then
    log_error "Response does not contain 'data' field"
    log_error "Response: ${response}"
    return 1
  fi
  
  local model_count
  model_count=$(echo "${response}" | jq '.data | length')
  log_info "✅ /models endpoint reachable (${model_count} models available)"
  
  # Show available models
  log_info "Available models:"
  echo "${response}" | jq -r '.data[].id' | sed 's/^/  - /'
  
  return 0
}

# Test 2: POST /v1/chat/completions
test_chat_completions() {
  log_info "Test 2: POST ${LOCAL_LLM_BASE_URL}/chat/completions"
  
  # Get first available model
  local models_response
  models_response=$(curl -s -f --max-time "${TIMEOUT}" "${LOCAL_LLM_BASE_URL}/models" 2>&1)
  
  local model
  model=$(echo "${models_response}" | jq -r '.data[0].id // empty')
  
  if [ -z "${model}" ]; then
    log_error "No models available in LocalAI"
    log_error "Download a model first - see docs/QA_EVIDENCE_LOCAL_LLM_CONTRACT.md"
    return 1
  fi
  
  log_info "Using model: ${model}"
  
  # Minimal test payload
  local payload
  payload=$(cat <<EOF
{
  "model": "${model}",
  "messages": [
    {"role": "user", "content": "Say 'test passed' and nothing else."}
  ],
  "max_tokens": 20,
  "temperature": 0.1
}
EOF
)
  
  local response
  if ! response=$(curl -s -f --max-time 60 \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer dummy-key" \
    -d "${payload}" \
    "${LOCAL_LLM_BASE_URL}/chat/completions" 2>&1); then
    log_error "Failed to call /chat/completions"
    log_error "Response: ${response}"
    return 1
  fi
  
  # Verify response shape
  if ! echo "${response}" | jq -e '.choices[0].message.content' > /dev/null 2>&1; then
    log_error "Response does not contain 'choices[0].message.content'"
    log_error "Response: ${response}"
    return 1
  fi
  
  local content
  content=$(echo "${response}" | jq -r '.choices[0].message.content')
  log_info "✅ /chat/completions endpoint functional"
  log_info "Model response: ${content}"
  
  return 0
}

# Test 3: Verify degraded mode (endpoint unreachable)
test_degraded_mode() {
  log_info "Test 3: Degraded mode (simulated - manual verification)"
  log_warn "To test degraded mode manually:"
  log_warn "  1. Stop LocalAI: docker compose -f docker-compose.llm.local.yml down"
  log_warn "  2. Start backend without AI_API_KEY: unset AI_API_KEY && pnpm -C backend dev"
  log_warn "  3. Backend should fall back to MockAIService and log: '[AIService] Using mock provider'"
  log_warn "  4. No cascading failures should occur"
  
  return 0
}

# Main
main() {
  log_info "=== AKIS Local LLM Contract Smoke Test ==="
  log_info "Target: ${LOCAL_LLM_BASE_URL}"
  echo ""
  
  local failed=0
  
  if ! test_models_endpoint; then
    failed=$((failed + 1))
  fi
  echo ""
  
  if ! test_chat_completions; then
    failed=$((failed + 1))
  fi
  echo ""
  
  test_degraded_mode
  echo ""
  
  if [ "${failed}" -eq 0 ]; then
    log_info "=== ✅ ALL TESTS PASSED ==="
    exit 0
  else
    log_error "=== ❌ ${failed} TEST(S) FAILED ==="
    exit 1
  fi
}

main "$@"

