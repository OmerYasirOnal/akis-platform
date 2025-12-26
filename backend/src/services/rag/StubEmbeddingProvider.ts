/**
 * StubEmbeddingProvider - Placeholder implementation for Phase 2 MVP
 * 
 * Phase 2: Returns mock embeddings (random vectors for testing)
 * Phase 3: Replace with actual CPU-based embedding model (e.g., all-MiniLM-L6-v2)
 * 
 * Future options:
 * - @xenova/transformers (ONNX Runtime in Node.js)
 * - External embedding service (LocalAI, OpenAI, Cohere)
 * - Custom fine-tuned model
 */

import type { EmbeddingProvider } from './interfaces.js';

/**
 * Stub embedding provider configuration
 */
export interface StubEmbeddingConfig {
  /** Embedding dimension (default: 384 for all-MiniLM-L6-v2 compatibility) */
  dimension?: number;
  /** Model name for logging */
  modelName?: string;
}

/**
 * StubEmbeddingProvider - Returns deterministic mock embeddings
 * 
 * WARNING: This is a placeholder for testing infrastructure only.
 * Production RAG requires a real embedding model.
 */
export class StubEmbeddingProvider implements EmbeddingProvider {
  private dimension: number;
  private modelName: string;

  constructor(config: StubEmbeddingConfig = {}) {
    this.dimension = config.dimension || 384;
    this.modelName = config.modelName || 'stub-embedding-v1';
    
    console.warn(
      '[StubEmbeddingProvider] Using mock embeddings - NOT suitable for production RAG'
    );
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    // Generate deterministic embeddings based on text content
    // (Simple hash-based approach for testing - NOT semantic similarity)
    return texts.map((text) => this.generateMockEmbedding(text));
  }

  /**
   * Generate deterministic mock embedding from text
   * Uses simple hash for reproducibility in tests
   */
  private generateMockEmbedding(text: string): number[] {
    const embedding = new Array(this.dimension).fill(0);
    
    // Use text hash to seed embedding values
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Generate deterministic values between -1 and 1
    for (let i = 0; i < this.dimension; i++) {
      const seed = hash + i;
      embedding[i] = (Math.sin(seed) * 10000) % 2 - 1;
    }
    
    // Normalize to unit vector (required for cosine similarity)
    const magnitude = Math.sqrt(
      embedding.reduce((sum, val) => sum + val * val, 0)
    );
    
    return embedding.map((val) => val / magnitude);
  }

  getDimension(): number {
    return this.dimension;
  }

  getModelName(): string {
    return this.modelName;
  }
}

/**
 * Factory function to create StubEmbeddingProvider from environment
 */
export function createStubEmbeddingProvider(
  config?: StubEmbeddingConfig
): StubEmbeddingProvider {
  const resolvedConfig: StubEmbeddingConfig = config || {
    dimension: parseInt(process.env.RAG_EMBEDDING_DIMENSION || '384', 10),
    modelName: process.env.RAG_EMBEDDING_MODEL || 'stub-embedding-v1',
  };

  return new StubEmbeddingProvider(resolvedConfig);
}

