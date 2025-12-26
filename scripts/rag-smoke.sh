#!/usr/bin/env bash
# rag-smoke.sh
# Verify Qdrant + RAG stack is functional (insert/query operations)
#
# Usage:
#   ./scripts/rag-smoke.sh
#
# Prerequisites:
#   - docker compose -f docker-compose.llm.local.yml up -d
#   - Qdrant running on http://localhost:6333
#
# Exit codes:
#   0 = PASS
#   1 = FAIL

set -euo pipefail

# Configuration
RAG_QDRANT_URL="${RAG_QDRANT_URL:-http://localhost:6333}"
TEST_COLLECTION="rag_smoke_test"
TIMEOUT=5

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

# Cleanup test collection on exit
cleanup() {
  if [ -n "${TEST_COLLECTION}" ]; then
    log_info "Cleaning up test collection: ${TEST_COLLECTION}"
    curl -s -X DELETE "${RAG_QDRANT_URL}/collections/${TEST_COLLECTION}" > /dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

# Test 1: Qdrant health
test_qdrant_health() {
  log_info "Test 1: Qdrant health check"
  
  local response
  if ! response=$(curl -s -f --max-time "${TIMEOUT}" "${RAG_QDRANT_URL}/healthz" 2>&1); then
    log_error "Qdrant health check failed"
    log_error "Response: ${response}"
    log_error "Is Qdrant running? Run: docker compose -f docker-compose.llm.local.yml up -d"
    return 1
  fi
  
  log_info "✅ Qdrant is healthy"
  return 0
}

# Test 2: Create collection
test_create_collection() {
  log_info "Test 2: Create test collection (${TEST_COLLECTION})"
  
  local payload
  payload=$(cat <<EOF
{
  "vectors": {
    "size": 384,
    "distance": "Cosine"
  }
}
EOF
)
  
  local response
  if ! response=$(curl -s -f --max-time "${TIMEOUT}" \
    -X PUT \
    -H "Content-Type: application/json" \
    -d "${payload}" \
    "${RAG_QDRANT_URL}/collections/${TEST_COLLECTION}" 2>&1); then
    log_error "Failed to create collection"
    log_error "Response: ${response}"
    return 1
  fi
  
  # Check if collection was created
  if ! curl -s -f --max-time "${TIMEOUT}" "${RAG_QDRANT_URL}/collections/${TEST_COLLECTION}" > /dev/null 2>&1; then
    log_error "Collection not found after creation"
    return 1
  fi
  
  log_info "✅ Test collection created"
  return 0
}

# Test 3: Upsert documents
test_upsert_documents() {
  log_info "Test 3: Upsert test documents"
  
  # Generate simple mock embeddings (384-dim)
  local embedding1=$(printf '[%s]' "$(seq -s, 1 384 | sed 's/[0-9]\+/0.1/g')")
  local embedding2=$(printf '[%s]' "$(seq -s, 1 384 | sed 's/[0-9]\+/0.2/g')")
  local embedding3=$(printf '[%s]' "$(seq -s, 1 384 | sed 's/[0-9]\+/0.15/g')")
  
  local payload
  payload=$(cat <<EOF
{
  "points": [
    {
      "id": "doc1",
      "vector": ${embedding1},
      "payload": {
        "content": "AKIS is a platform for autonomous agents",
        "source": "smoke_test"
      }
    },
    {
      "id": "doc2",
      "vector": ${embedding2},
      "payload": {
        "content": "RAG helps retrieve relevant context for LLMs",
        "source": "smoke_test"
      }
    },
    {
      "id": "doc3",
      "vector": ${embedding3},
      "payload": {
        "content": "Qdrant is a vector database for similarity search",
        "source": "smoke_test"
      }
    }
  ]
}
EOF
)
  
  local response
  if ! response=$(curl -s -f --max-time "${TIMEOUT}" \
    -X PUT \
    -H "Content-Type: application/json" \
    -d "${payload}" \
    "${RAG_QDRANT_URL}/collections/${TEST_COLLECTION}/points" 2>&1); then
    log_error "Failed to upsert documents"
    log_error "Response: ${response}"
    return 1
  fi
  
  log_info "✅ Documents upserted (3 points)"
  return 0
}

# Test 4: Query collection
test_query_collection() {
  log_info "Test 4: Query test collection"
  
  # Use query embedding similar to doc1
  local query_embedding=$(printf '[%s]' "$(seq -s, 1 384 | sed 's/[0-9]\+/0.11/g')")
  
  local payload
  payload=$(cat <<EOF
{
  "vector": ${query_embedding},
  "limit": 2,
  "with_payload": true
}
EOF
)
  
  local response
  if ! response=$(curl -s -f --max-time "${TIMEOUT}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d "${payload}" \
    "${RAG_QDRANT_URL}/collections/${TEST_COLLECTION}/points/search" 2>&1); then
    log_error "Failed to query collection"
    log_error "Response: ${response}"
    return 1
  fi
  
  # Verify response contains results
  local result_count
  result_count=$(echo "${response}" | jq '.result | length' 2>/dev/null || echo "0")
  
  if [ "${result_count}" -eq 0 ]; then
    log_error "Query returned no results"
    log_error "Response: ${response}"
    return 1
  fi
  
  log_info "✅ Query returned ${result_count} results"
  
  # Show top result
  local top_content
  top_content=$(echo "${response}" | jq -r '.result[0].payload.content' 2>/dev/null || echo "unknown")
  log_info "Top result: ${top_content}"
  
  return 0
}

# Main
main() {
  log_info "=== AKIS RAG Stack Smoke Test ==="
  log_info "Target: ${RAG_QDRANT_URL}"
  echo ""
  
  local failed=0
  
  if ! test_qdrant_health; then
    failed=$((failed + 1))
  fi
  echo ""
  
  if ! test_create_collection; then
    failed=$((failed + 1))
  fi
  echo ""
  
  if ! test_upsert_documents; then
    failed=$((failed + 1))
  fi
  echo ""
  
  if ! test_query_collection; then
    failed=$((failed + 1))
  fi
  echo ""
  
  if [ "${failed}" -eq 0 ]; then
    log_info "=== ✅ ALL TESTS PASSED ==="
    log_info "RAG stack is operational (Qdrant insert/query working)"
    exit 0
  else
    log_error "=== ❌ ${failed} TEST(S) FAILED ==="
    exit 1
  fi
}

main "$@"

