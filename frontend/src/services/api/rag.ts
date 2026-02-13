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

  async webSearch(data: RAGWebSearchRequest): Promise<RAGWebSearchResponse> {
    return httpClient.post<RAGWebSearchResponse>('/api/rag/web-search', data);
  },

  async learn(data: RAGLearnRequest): Promise<RAGLearnResponse> {
    return httpClient.post<RAGLearnResponse>('/api/rag/learn', data);
  },

  async getStats(): Promise<RAGStats> {
    return httpClient.get<RAGStats>('/api/rag/stats');
  },
};
