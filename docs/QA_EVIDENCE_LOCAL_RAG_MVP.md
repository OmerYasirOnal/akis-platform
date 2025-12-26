# QA Evidence: Local RAG MVP

**Date**: 2025-12-27  
**Goal**: Scaffold minimal RAG infrastructure (vector store + embeddings interface)  
**Scope**: Phase 2 MVP - interfaces + Qdrant + stub embeddings (no production embedding model yet)

---

## Summary

This phase adds:
1. **RAG interfaces**: `RagStore` and `EmbeddingProvider` abstractions
2. **Qdrant implementation**: `QdrantRagStore` using REST API (no SDK)
3. **Stub embeddings**: `StubEmbeddingProvider` (deterministic mock for testing)
4. **Smoke test**: `scripts/rag-smoke.sh` validates insert/query operations

**Not included in Phase 2**:
- Production embedding model (Phase 3)
- Chunking strategies
- Hybrid search
- Reranking

---

## Prerequisites

### 1. Start Qdrant

```bash
# Qdrant is already in docker-compose.llm.local.yml
docker compose -f docker-compose.llm.local.yml up -d qdrant

# Wait for health check
docker compose -f docker-compose.llm.local.yml ps qdrant

# Expected: "healthy" status
```

### 2. Verify Qdrant API

```bash
# Check health
curl http://localhost:6333/healthz

# Expected: empty 200 response
```

---

## Verification Commands

### Test 1: Run RAG Smoke Test

```bash
./scripts/rag-smoke.sh
```

**Expected Output**:
```
[INFO] === AKIS RAG Stack Smoke Test ===
[INFO] Target: http://localhost:6333

[INFO] Test 1: Qdrant health check
[INFO] ✅ Qdrant is healthy

[INFO] Test 2: Create test collection (rag_smoke_test)
[INFO] ✅ Test collection created

[INFO] Test 3: Upsert test documents
[INFO] ✅ Documents upserted (3 points)

[INFO] Test 4: Query test collection
[INFO] ✅ Query returned 2 results
[INFO] Top result: AKIS is a platform for autonomous agents

[INFO] === ✅ ALL TESTS PASSED ===
[INFO] RAG stack is operational (Qdrant insert/query working)
```

### Test 2: Backend Integration (Manual)

```typescript
// backend/test/rag-integration.manual.ts (not automated yet)
import { createQdrantRagStore, createStubEmbeddingProvider } from '../src/services/rag/index.js';

const store = createQdrantRagStore();
const embedder = createStubEmbeddingProvider();

// Create namespace
await store.createNamespace('test_docs', embedder.getDimension());

// Generate embeddings
const texts = ['Hello world', 'RAG is powerful'];
const embeddings = await embedder.embed(texts);

// Upsert documents
await store.upsert('test_docs', [
  {
    id: 'doc1',
    content: texts[0],
    embedding: embeddings[0],
    metadata: { source: 'test' }
  }
]);

// Query
const queryEmbedding = embeddings[0]; // Same as doc1
const results = await store.query('test_docs', queryEmbedding, 1);

console.log('Top result:', results[0].content);
// Expected: "Hello world" (score ~1.0 due to identical embedding)
```

---

## Expected Outcomes

| Test | Expected Result | Evidence |
|------|----------------|----------|
| Qdrant health | `/healthz` returns 200 | Smoke script ✅ |
| Create collection | Collection exists after creation | Smoke script ✅ |
| Upsert documents | 3 points inserted | Smoke script ✅ |
| Query collection | Returns top-K results with scores | Smoke script ✅ |
| Embedding generation | Returns vectors of correct dimension | Manual test |

---

## Architecture Notes

### RagStore Interface

```typescript
interface RagStore {
  upsert(namespace: string, documents: RagDocument[]): Promise<void>;
  query(namespace: string, queryEmbedding: number[], topK: number): Promise<RagSearchResult[]>;
  delete(namespace: string, ids: string[]): Promise<void>;
  namespaceExists(namespace: string): Promise<boolean>;
  createNamespace(namespace: string, dimension: number): Promise<void>;
  healthCheck(): Promise<{ healthy: boolean; message?: string }>;
}
```

**Design choices**:
- Provider-agnostic (Qdrant, Pinecone, Weaviate all implement same interface)
- Namespace-based organization (e.g., "repo_docs", "tickets")
- Pre-computed embeddings (caller is responsible for embedding generation)

### EmbeddingProvider Interface

```typescript
interface EmbeddingProvider {
  embed(texts: string[]): Promise<number[][]>;
  getDimension(): number;
  getModelName(): string;
}
```

**Design choices**:
- Batch API (efficient for multiple texts)
- Dimension metadata (required for Qdrant collection creation)
- Model name for debugging/logging

### StubEmbeddingProvider (Phase 2 MVP)

**WARNING**: Stub embeddings are **NOT** semantic. They use a simple hash-based approach for testing infrastructure only.

**Production replacement** (Phase 3):
- Option 1: `@xenova/transformers` (ONNX Runtime in Node.js)
- Option 2: LocalAI embeddings endpoint
- Option 3: OpenAI/Cohere embeddings API

---

## Failure Modes and Remediation

### Issue: Qdrant Unhealthy

**Symptom**: `[ERROR] Qdrant health check failed`

**Remediation**:
```bash
# Check Qdrant logs
docker compose -f docker-compose.llm.local.yml logs qdrant

# Restart if needed
docker compose -f docker-compose.llm.local.yml restart qdrant

# Verify port binding
netstat -an | grep 6333
```

### Issue: Collection Creation Fails

**Symptom**: `[ERROR] Failed to create collection`

**Remediation**:
1. Check Qdrant storage permissions: `ls -lh data/qdrant/storage/`
2. Ensure Qdrant has write access to volume mount
3. Check Qdrant logs for "permission denied" errors

### Issue: Query Returns No Results

**Symptom**: `[ERROR] Query returned no results`

**Remediation**:
1. Verify documents were upserted: `curl http://localhost:6333/collections/rag_smoke_test`
2. Check embedding dimension matches collection (384)
3. Verify query embedding is non-zero vector

---

## Next Steps

### Phase 3: Production Embedding Model

Replace `StubEmbeddingProvider` with real embedding generation:

```bash
# Option A: Use LocalAI embeddings
# Add to docker-compose.llm.local.yml:
# - LocalAI with all-MiniLM-L6-v2 model
# - Configure RAG_EMBEDDING_URL=http://localhost:8080/v1/embeddings

# Option B: Use @xenova/transformers (ONNX Runtime)
# Install: pnpm add @xenova/transformers
# Implement: OnnxEmbeddingProvider using all-MiniLM-L6-v2
```

### Phase 4: Agent Integration

Integrate RAG into agent workflows:

```typescript
// Example: Scribe agent reads repo docs via RAG
const ragStore = createQdrantRagStore();
const embedder = createProductionEmbeddingProvider();

// Query relevant docs
const queryEmbedding = await embedder.embed(['How to configure AKIS?']);
const relevantDocs = await ragStore.query('repo_docs', queryEmbedding[0], 5);

// Pass to LLM context
const context = relevantDocs.map(d => d.content).join('\n\n');
```

---

## Security Notes

- Qdrant runs on localhost only (no public exposure)
- No authentication required for local dev
- Storage volume is local (no cloud sync)
- In production: use Qdrant API key + firewall rules

---

**Last Updated**: 2025-12-27

