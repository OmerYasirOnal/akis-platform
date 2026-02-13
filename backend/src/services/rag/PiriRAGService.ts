/**
 * PiriRAGService — HTTP proxy to Piri RAG Engine
 *
 * Piri is a standalone Python FastAPI service providing:
 * - Semantic search (FAISS + sentence-transformers)
 * - RAG Q&A (retrieve → rerank → generate)
 * - Web search with auto-learn
 * - Document ingestion (text, file upload)
 * - 5-dimensional quality evaluation
 */
import { HttpClient } from '../http/HttpClient.js';

export interface PiriRAGServiceOptions {
  baseUrl: string;
  httpClient?: HttpClient;
}

export interface PiriHealthResponse {
  status: string;
  engine: string;
  version: string;
  rag_ready: boolean;
}

export interface PiriInfoResponse {
  engine: string;
  version: string;
  by: string;
  model: string;
  backend: string;
  rag_status: string;
}

export interface PiriQueryResponse {
  question: string;
  answer: string;
  sources: Array<{ content: string; source: string; score: number }>;
  model: string;
  backend: string;
}

export interface PiriSearchResponse {
  query: string;
  results: Array<{ content: string; source: string; score: number }>;
}

export interface PiriWebSearchResponse {
  query: string;
  web_results: Array<{ title: string; url: string; snippet: string; source: string }>;
  learned: boolean;
  chunks_added: number;
  total_chunks: number;
  answer: string;
  sources: Array<{ content: string; source: string; score: number }>;
  source_name: string;
}

export interface PiriLearnResponse {
  message: string;
  chunks_added: number;
  total_chunks: number;
  source: string;
  char_count: number;
}

export interface PiriStatsResponse {
  engine?: string;
  status: string;
  total_chunks?: number;
  model?: string;
  backend?: string;
  [key: string]: unknown;
}

export class PiriRAGService {
  private readonly baseUrl: string;
  private readonly httpClient: HttpClient;

  constructor(options: PiriRAGServiceOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.httpClient = options.httpClient ?? new HttpClient({ timeout: 60000, retries: 2 });
  }

  async health(): Promise<PiriHealthResponse> {
    const res = await this.httpClient.get(`${this.baseUrl}/health`);
    if (!res.ok) throw new Error(`Piri health check failed: ${res.status}`);
    return res.json() as Promise<PiriHealthResponse>;
  }

  async info(): Promise<PiriInfoResponse> {
    const res = await this.httpClient.get(`${this.baseUrl}/api/info`);
    if (!res.ok) throw new Error(`Piri info failed: ${res.status}`);
    return res.json() as Promise<PiriInfoResponse>;
  }

  async query(question: string, topK = 3, maxNewTokens = 300, temperature = 0.3): Promise<PiriQueryResponse> {
    const res = await this.httpClient.post(`${this.baseUrl}/rag/query`, {
      question,
      top_k: topK,
      max_new_tokens: maxNewTokens,
      temperature,
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Piri query failed: ${res.status} — ${body}`);
    }
    return res.json() as Promise<PiriQueryResponse>;
  }

  async search(query: string, topK = 5): Promise<PiriSearchResponse> {
    const res = await this.httpClient.post(`${this.baseUrl}/rag/search`, {
      query,
      top_k: topK,
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Piri search failed: ${res.status} — ${body}`);
    }
    return res.json() as Promise<PiriSearchResponse>;
  }

  async webSearch(query: string, maxResults = 5, autoLearn = true, topK = 3): Promise<PiriWebSearchResponse> {
    const res = await this.httpClient.post(`${this.baseUrl}/rag/web-search`, {
      query,
      max_results: maxResults,
      auto_learn: autoLearn,
      top_k: topK,
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Piri web-search failed: ${res.status} — ${body}`);
    }
    return res.json() as Promise<PiriWebSearchResponse>;
  }

  async learn(text: string, sourceName = 'user_document', chunkSize = 512): Promise<PiriLearnResponse> {
    const res = await this.httpClient.post(`${this.baseUrl}/rag/learn`, {
      text,
      source_name: sourceName,
      chunk_size: chunkSize,
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Piri learn failed: ${res.status} — ${body}`);
    }
    return res.json() as Promise<PiriLearnResponse>;
  }

  async stats(): Promise<PiriStatsResponse> {
    const res = await this.httpClient.get(`${this.baseUrl}/rag/stats`);
    if (!res.ok) throw new Error(`Piri stats failed: ${res.status}`);
    return res.json() as Promise<PiriStatsResponse>;
  }

  get configured(): boolean {
    return !!this.baseUrl;
  }
}

let piriRAGService: PiriRAGService | null = null;

export function initPiriRAGService(baseUrl: string): PiriRAGService {
  piriRAGService = new PiriRAGService({ baseUrl });
  return piriRAGService;
}

export function getPiriRAGService(): PiriRAGService | null {
  return piriRAGService;
}
