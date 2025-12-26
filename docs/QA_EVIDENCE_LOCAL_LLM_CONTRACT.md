# QA Evidence: Local LLM Contract Test

**Date**: 2025-12-27  
**Goal**: Verify AKIS backend can communicate with an OpenAI-compatible local inference endpoint  
**Risk Reduction**: Prove HTTP contract compatibility before OCI deployment

---

## Symptom / Problem

AKIS needs to run LLM inference locally (dev/OCI) without relying on external APIs. The core risk is:
- **HTTP contract mismatch** between AKIS and local inference server
- **Degraded mode failure** when endpoint is unreachable
- **Model loading issues** in LocalAI

---

## Solution

1. Deploy LocalAI via `docker-compose.llm.local.yml` (OpenAI-compatible)
2. Configure AKIS backend to use `AI_PROVIDER=openai` with `AI_BASE_URL=http://localhost:8080/v1`
3. Verify contract via `scripts/llm-contract-smoke.sh`
4. Confirm degraded mode (mock fallback) when endpoint is down

---

## Prerequisites

### 1. Download a Model for LocalAI

LocalAI requires at least one model file. Recommended for CPU inference:

```bash
# Create models directory
mkdir -p data/localai/models

# Option A: GPT4All-J (small, fast, good for testing)
cd data/localai/models
curl -L "https://gpt4all.io/models/ggml-gpt4all-j.bin" -o ggml-gpt4all-j.bin

# Option B: Use any GGUF/GGML model compatible with llama.cpp
# Place in data/localai/models/ directory
```

**Important**: Model files are **NOT** committed to git. Each developer/VM must download separately.

### 2. Configure Backend Environment

```bash
# Copy example to backend/.env.local
cp env.llm.local.example backend/.env.local

# Edit backend/.env.local - minimum required:
AI_PROVIDER=openai
AI_BASE_URL=http://localhost:8080/v1
AI_API_KEY=local-dummy-key
AI_MODEL_DEFAULT=ggml-gpt4all-j
AI_MODEL_PLANNER=ggml-gpt4all-j
AI_MODEL_VALIDATION=ggml-gpt4all-j
```

---

## Verification Commands

### Test 1: Start LocalAI

```bash
# Start LocalAI + Qdrant
docker compose -f docker-compose.llm.local.yml up -d

# Wait for health check (30-60s first start)
docker compose -f docker-compose.llm.local.yml ps

# Expected: localai and qdrant both "healthy"
```

### Test 2: Run Contract Smoke Test

```bash
# Verify OpenAI-compatible endpoints
./scripts/llm-contract-smoke.sh
```

**Expected Output**:
```
[INFO] === AKIS Local LLM Contract Smoke Test ===
[INFO] Target: http://localhost:8080/v1

[INFO] Test 1: GET http://localhost:8080/v1/models
[INFO] ✅ /models endpoint reachable (1 models available)
[INFO] Available models:
  - ggml-gpt4all-j

[INFO] Test 2: POST http://localhost:8080/v1/chat/completions
[INFO] Using model: ggml-gpt4all-j
[INFO] ✅ /chat/completions endpoint functional
[INFO] Model response: test passed

[INFO] Test 3: Degraded mode (simulated - manual verification)
[WARN] To test degraded mode manually:
  1. Stop LocalAI: docker compose -f docker-compose.llm.local.yml down
  2. Start backend without AI_API_KEY: unset AI_API_KEY && pnpm -C backend dev
  3. Backend should fall back to MockAIService and log: '[AIService] Using mock provider'
  4. No cascading failures should occur

[INFO] === ✅ ALL TESTS PASSED ===
```

### Test 3: Backend Integration (Optional)

```bash
# Start backend with local LLM config
cd backend
pnpm dev

# Backend should log:
# [AIService] Using openai provider
# [AIService] Models: default=ggml-gpt4all-j, ...

# Run backend tests (should skip LLM tests gracefully)
pnpm test
```

### Test 4: Degraded Mode (Manual)

```bash
# Stop LocalAI
docker compose -f docker-compose.llm.local.yml down

# Start backend (should fall back to mock)
cd backend
unset AI_API_KEY
pnpm dev

# Expected log:
# [AIService] No API key found for provider "openai", falling back to mock
# [AIService] Using mock provider (no real AI calls)
```

---

## Expected Outcomes

| Test | Expected Result | Evidence |
|------|----------------|----------|
| LocalAI health | `/v1/models` returns JSON with `data[]` | Smoke script ✅ |
| Chat completions | `/v1/chat/completions` returns `choices[0].message.content` | Smoke script ✅ |
| Degraded mode | Backend falls back to MockAIService without crash | Manual verification |
| Backend tests | No regressions (`pnpm -C backend test` passes) | CI green ✅ |

---

## Failure Modes and Remediation

### Issue: LocalAI Unhealthy

**Symptom**: `docker compose ps` shows `localai` as "unhealthy"

**Remediation**:
1. Check logs: `docker compose -f docker-compose.llm.local.yml logs localai`
2. Common causes:
   - No models in `data/localai/models/` → Download model (see Prerequisites)
   - Insufficient RAM → LocalAI needs ~2GB minimum
   - Port conflict (8080) → Change port in compose file

### Issue: Smoke Test Fails on `/models`

**Symptom**: `[ERROR] Failed to reach /models endpoint`

**Remediation**:
```bash
# Check if LocalAI is running
docker compose -f docker-compose.llm.local.yml ps

# Check LocalAI logs
docker compose -f docker-compose.llm.local.yml logs -f localai

# Verify port binding
curl -v http://localhost:8080/v1/models
```

### Issue: Smoke Test Fails on `/chat/completions`

**Symptom**: `[ERROR] No models available in LocalAI`

**Remediation**:
1. Verify model file exists: `ls -lh data/localai/models/`
2. Check LocalAI logs for model loading errors
3. Ensure model file is compatible (GGUF/GGML format)

### Issue: Backend Doesn't Use Local LLM

**Symptom**: Backend logs `[AIService] Using mock provider` despite config

**Remediation**:
1. Verify `backend/.env.local` exists with correct values
2. Check env precedence: shell exports > `.env.local` > `.env`
3. Restart backend: `cd backend && pnpm dev`
4. Check logs for: `[AIService] Using openai provider`

---

## Security Notes

- LocalAI runs on localhost only (no public exposure)
- API key is dummy value (LocalAI doesn't authenticate)
- Model files are local (no external download during inference)
- Qdrant storage is local (no cloud sync)

---

## Next Steps (Post-Verification)

1. **Phase 2**: Implement RAG interfaces using Qdrant
2. **Phase 3**: Document OCI A1 bootstrap for production deployment
3. **Phase 4**: Load test local LLM on ARM64 (OCI A1 shape)

---

**Last Updated**: 2025-12-27

