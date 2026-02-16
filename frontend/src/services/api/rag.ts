import { HttpClient } from './HttpClient';
import { getApiBaseUrl } from './config';

const httpClient = new HttpClient(getApiBaseUrl());

export interface RAGStatus {
  configured: boolean;
  healthy: boolean;
  version?: string;
  rag_ready?: boolean;
  model?: string;
  backend?: string;
  rag_status?: string;
  error?: string;
}

export interface RAGQueryRequest {
  question: string;
  top_k?: number;
  max_new_tokens?: number;
  temperature?: number;
}

export interface RAGQueryResponse {
  question: string;
  answer: string;
  sources: Array<{ content: string; source: string; score: number }>;
  model: string;
  backend: string;
}

export interface RAGSearchRequest {
  query: string;
  top_k?: number;
}

export interface RAGSearchResponse {
  query: string;
  results: Array<{ content: string; source: string; score: number }>;
}

export interface RAGHybridSearchRequest {
  query: string;
  topK?: number;
  maxTokens?: number;
  includeProposed?: boolean;
  keywordWeight?: number;
  semanticWeight?: number;
}

export interface RAGHybridSearchResult {
  documentId: string;
  chunkId: string;
  content: string;
  score: number;
  keywordScore?: number;
  semanticScore?: number;
  retrievalMethod?: 'keyword' | 'semantic' | 'hybrid';
  provenance: {
    title: string;
    sourcePath?: string;
    commitSha?: string;
    docType: string;
  };
}

export interface RAGHybridSearchResponse {
  query: string;
  count: number;
  results: RAGHybridSearchResult[];
}

export interface RAGWebSearchRequest {
  query: string;
  max_results?: number;
  auto_learn?: boolean;
  top_k?: number;
}

export interface RAGWebSearchResponse {
  query: string;
  web_results: Array<{ title: string; url: string; snippet: string; source: string }>;
  learned: boolean;
  chunks_added: number;
  total_chunks: number;
  answer: string;
  sources: Array<{ content: string; source: string; score: number }>;
  source_name: string;
}

export interface RAGLearnRequest {
  text: string;
  source_name?: string;
  chunk_size?: number;
}

export interface RAGLearnResponse {
  message: string;
  chunks_added: number;
  total_chunks: number;
  source: string;
  char_count: number;
}

export interface RAGStats {
  engine?: string;
  status: string;
  total_chunks?: number;
  model?: string;
  backend?: string;
  [key: string]: unknown;
}

export interface KnowledgeDocumentItem {
  id: string;
  title: string;
  docType: 'repo_doc' | 'job_artifact' | 'manual' | string;
  status: 'proposed' | 'approved' | 'deprecated';
  sourcePath?: string | null;
  agentType?: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeDocumentsResponse {
  items: KnowledgeDocumentItem[];
  total: number;
}

export interface KnowledgeSignalSyncSummary {
  syncedAt: string;
  source: 'github_advisories' | 'manual';
  totalSignals: number;
  inserted: number;
  updated: number;
  deduped: number;
}

export interface ManualCveAdvisoryInput {
  cveId: string;
  ghsaId?: string;
  summary: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'unknown';
  affectedPackage?: string;
  sourceUrl: string;
  publishedAt?: string;
  updatedAt?: string;
}

export interface RAGEvaluationRequest {
  queries: string[];
  topK?: number;
  maxTokens?: number;
  includeProposed?: boolean;
  keywordWeight?: number;
  semanticWeight?: number;
  minResultsThreshold?: number;
}

export interface RAGEvaluationQueryDetail {
  query: string;
  resultCount: number;
  topScore: number;
  thresholdMet: boolean;
  stabilityOverlap: number;
  retrievalMix: {
    keyword: number;
    semantic: number;
    hybrid: number;
  };
}

export interface RAGEvaluationResponse {
  runId: string;
  executedAt: string;
  config: {
    queryCount: number;
    topK: number;
    maxTokens: number;
    includeProposed: boolean;
    keywordWeight: number;
    semanticWeight: number;
    minResultsThreshold: number;
  };
  metrics: {
    relevance: number;
    coverage: number;
    freshness: number;
    provenance: number;
    stability: number;
  };
  queries: RAGEvaluationQueryDetail[];
}

export interface KnowledgeDocumentUploadRequest {
  title: string;
  content: string;
  sourcePath?: string;
  workspaceId?: string;
  agentType?: string;
  status?: 'proposed' | 'approved';
  metadata?: Record<string, unknown>;
}

export interface KnowledgeDocumentUploadResponse {
  ok: true;
  result: {
    documentId: string;
    title: string;
    chunksCreated: number;
    isNew: boolean;
  };
  document: KnowledgeDocumentItem | null;
}

export const ragApi = {
  async getStatus(): Promise<RAGStatus> {
    return httpClient.get<RAGStatus>('/api/rag/status');
  },

  async query(data: RAGQueryRequest): Promise<RAGQueryResponse> {
    return httpClient.post<RAGQueryResponse>('/api/rag/query', data);
  },

  async search(data: RAGSearchRequest): Promise<RAGSearchResponse> {
    return httpClient.post<RAGSearchResponse>('/api/rag/search', data);
  },

  async hybridSearch(data: RAGHybridSearchRequest): Promise<RAGHybridSearchResponse> {
    return httpClient.post<RAGHybridSearchResponse>('/api/knowledge/retrieval/hybrid', data);
  },

  async webSearch(data: RAGWebSearchRequest): Promise<RAGWebSearchResponse> {
    return httpClient.post<RAGWebSearchResponse>('/api/rag/web-search', data);
  },

  async learn(data: RAGLearnRequest): Promise<RAGLearnResponse> {
    return httpClient.post<RAGLearnResponse>('/api/rag/learn', data);
  },

  async getStats(): Promise<RAGStats> {
    return httpClient.get<RAGStats>('/api/rag/stats');
  },

  async listKnowledgeDocuments(params?: {
    status?: 'proposed' | 'approved' | 'deprecated';
    limit?: number;
    offset?: number;
  }): Promise<KnowledgeDocumentsResponse> {
    const search = new URLSearchParams();
    if (params?.status) search.set('status', params.status);
    if (typeof params?.limit === 'number') search.set('limit', String(params.limit));
    if (typeof params?.offset === 'number') search.set('offset', String(params.offset));
    const qs = search.toString();
    const url = qs ? `/api/knowledge/documents?${qs}` : '/api/knowledge/documents';
    return httpClient.get<KnowledgeDocumentsResponse>(url);
  },

  async approveKnowledgeDocument(documentId: string): Promise<{ ok: true; document: KnowledgeDocumentItem | null }> {
    return httpClient.post(`/api/knowledge/documents/${documentId}/approve`, {});
  },

  async deprecateKnowledgeDocument(documentId: string): Promise<{ ok: true; document: KnowledgeDocumentItem | null }> {
    return httpClient.post(`/api/knowledge/documents/${documentId}/deprecate`, {});
  },

  async uploadKnowledgeDocument(
    data: KnowledgeDocumentUploadRequest
  ): Promise<KnowledgeDocumentUploadResponse> {
    return httpClient.post('/api/knowledge/documents/upload', data);
  },

  async syncReleaseSignal(data: {
    sourceId?: string;
    owner?: string;
    repo?: string;
  }): Promise<{ ok: true; owner: string; repo: string; persisted: boolean; result: unknown }> {
    return httpClient.post('/api/knowledge/signals/releases/sync', data);
  },

  async syncCveSignals(data: {
    owner?: string;
    repo?: string;
    advisories?: ManualCveAdvisoryInput[];
  }): Promise<{ ok: true; summary: KnowledgeSignalSyncSummary }> {
    return httpClient.post('/api/knowledge/signals/cve/sync', data);
  },

  async runEvaluation(data: RAGEvaluationRequest): Promise<RAGEvaluationResponse> {
    return httpClient.post('/api/rag/evaluation/run', data);
  },
};
