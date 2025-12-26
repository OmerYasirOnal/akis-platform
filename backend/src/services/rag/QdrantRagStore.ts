/**
 * QdrantRagStore - Qdrant-backed vector store implementation
 * 
 * Phase 2 MVP: Basic upsert/query operations
 * Uses Qdrant REST API (no SDK dependency for minimal footprint)
 * 
 * Qdrant docs: https://qdrant.tech/documentation/
 */

import type {
  RagStore,
  RagDocument,
  RagSearchResult,
  RagNamespace,
} from './interfaces.js';
import { RagStoreError } from './interfaces.js';

interface QdrantPoint {
  id: string;
  vector: number[];
  payload: Record<string, unknown>;
}

interface QdrantSearchResult {
  id: string;
  score: number;
  payload: Record<string, unknown>;
}

/**
 * Qdrant configuration
 */
export interface QdrantConfig {
  /** Qdrant base URL (e.g., "http://localhost:6333") */
  baseUrl: string;
  /** Request timeout in ms */
  timeout?: number;
  /** API key (optional, not required for local dev) */
  apiKey?: string;
}

/**
 * QdrantRagStore implementation
 */
export class QdrantRagStore implements RagStore {
  private config: QdrantConfig;
  private timeout: number;

  constructor(config: QdrantConfig) {
    this.config = config;
    this.timeout = config.timeout || 30000; // 30s default
  }

  /**
   * Make HTTP request to Qdrant API
   */
  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.config.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new RagStoreError(
          'QDRANT_HTTP_ERROR',
          `Qdrant API error (${response.status}): ${errorText}`,
          { status: response.status, url, method }
        );
      }

      return await response.json() as T;
    } catch (error) {
      if (error instanceof RagStoreError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new RagStoreError(
          'QDRANT_TIMEOUT',
          `Qdrant request timeout after ${this.timeout}ms`,
          { url, method }
        );
      }

      throw new RagStoreError(
        'QDRANT_NETWORK_ERROR',
        `Qdrant network error: ${error instanceof Error ? error.message : 'Unknown'}`,
        { url, method }
      );
    }
  }

  async upsert(namespace: RagNamespace, documents: RagDocument[]): Promise<void> {
    if (documents.length === 0) return;

    // Convert documents to Qdrant points
    const points: QdrantPoint[] = documents.map((doc) => ({
      id: doc.id,
      vector: doc.embedding,
      payload: {
        content: doc.content,
        ...doc.metadata,
      },
    }));

    await this.request('PUT', `/collections/${namespace}/points`, {
      points,
    });
  }

  async query(
    namespace: RagNamespace,
    queryEmbedding: number[],
    topK: number
  ): Promise<RagSearchResult[]> {
    const response = await this.request<{ result: QdrantSearchResult[] }>(
      'POST',
      `/collections/${namespace}/points/search`,
      {
        vector: queryEmbedding,
        limit: topK,
        with_payload: true,
      }
    );

    return response.result.map((hit) => ({
      id: String(hit.id),
      content: String(hit.payload.content || ''),
      score: hit.score,
      metadata: hit.payload,
    }));
  }

  async delete(namespace: RagNamespace, ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    await this.request('POST', `/collections/${namespace}/points/delete`, {
      points: ids,
    });
  }

  async namespaceExists(namespace: RagNamespace): Promise<boolean> {
    try {
      await this.request('GET', `/collections/${namespace}`);
      return true;
    } catch (error) {
      if (error instanceof RagStoreError && error.code === 'QDRANT_HTTP_ERROR') {
        // 404 means collection doesn't exist
        return false;
      }
      throw error;
    }
  }

  async createNamespace(namespace: RagNamespace, dimension: number): Promise<void> {
    await this.request('PUT', `/collections/${namespace}`, {
      vectors: {
        size: dimension,
        distance: 'Cosine', // Cosine similarity (most common for text embeddings)
      },
    });
  }

  async healthCheck(): Promise<{ healthy: boolean; message?: string }> {
    try {
      await this.request('GET', '/healthz');
      return { healthy: true };
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Factory function to create QdrantRagStore from environment
 */
export function createQdrantRagStore(config?: QdrantConfig): QdrantRagStore {
  const resolvedConfig: QdrantConfig = config || {
    baseUrl: process.env.RAG_QDRANT_URL || 'http://localhost:6333',
    timeout: parseInt(process.env.RAG_QDRANT_TIMEOUT_MS || '30000', 10),
    apiKey: process.env.RAG_QDRANT_API_KEY,
  };

  return new QdrantRagStore(resolvedConfig);
}

