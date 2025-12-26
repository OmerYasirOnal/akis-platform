/**
 * RAG (Retrieval-Augmented Generation) Service Exports
 * 
 * Phase 2 MVP: Interfaces + basic Qdrant + stub embeddings
 * Future: Advanced chunking, hybrid search, reranking
 */

// Core interfaces
export type {
  RagStore,
  EmbeddingProvider,
  RagDocument,
  RagSearchResult,
  RagNamespace,
} from './interfaces.js';

export {
  RagStoreError,
  EmbeddingError,
} from './interfaces.js';

// Qdrant implementation
export {
  QdrantRagStore,
  createQdrantRagStore,
} from './QdrantRagStore.js';

export type {
  QdrantConfig,
} from './QdrantRagStore.js';

// Stub embedding provider (Phase 2 MVP)
export {
  StubEmbeddingProvider,
  createStubEmbeddingProvider,
} from './StubEmbeddingProvider.js';

export type {
  StubEmbeddingConfig,
} from './StubEmbeddingProvider.js';

