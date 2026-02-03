export interface RetrievalFilter {
  workspaceId?: string;
  agentType?: string;
  docType?: 'repo_doc' | 'job_artifact' | 'manual';
  status?: 'proposed' | 'approved' | 'deprecated';
}

export interface RetrievalResult {
  documentId: string;
  chunkId: string;
  content: string;
  score: number;
  provenance: {
    title: string;
    sourcePath?: string;
    commitSha?: string;
    docType: string;
  };
}

export interface RetrievalOptions {
  maxResults?: number;
  maxTokens?: number;
  filters?: RetrievalFilter;
  includeProposed?: boolean;
}

export interface ContextBudget {
  maxTokens: number;
  maxChunks: number;
}
