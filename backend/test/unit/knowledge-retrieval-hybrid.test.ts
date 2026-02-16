import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { KnowledgeRetrievalService } from '../../src/services/knowledge/retrieval/KnowledgeRetrievalService.js';
import type { RetrievalOptions, RetrievalResult } from '../../src/services/knowledge/retrieval/types.js';

class StubKnowledgeRetrievalService extends KnowledgeRetrievalService {
  constructor(
    private readonly keywordResults: RetrievalResult[],
    private readonly semanticResults: RetrievalResult[]
  ) {
    super();
  }

  protected override async searchKeyword(
    _query: string,
    _options: RetrievalOptions = {}
  ): Promise<RetrievalResult[]> {
    return this.keywordResults;
  }

  protected override async searchSemantic(
    _query: string,
    _maxResults: number
  ): Promise<RetrievalResult[]> {
    return this.semanticResults;
  }
}

describe('KnowledgeRetrievalService.searchHybrid', () => {
  it('fuses keyword + semantic signals and keeps deterministic ranking', async () => {
    const sharedContent = 'Use deterministic gates for reliability rollout.';
    const service = new StubKnowledgeRetrievalService(
      [
        {
          documentId: 'doc-keyword-1',
          chunkId: 'chunk-keyword-1',
          content: sharedContent,
          score: 0.8,
          keywordScore: 0.8,
          semanticScore: 0,
          retrievalMethod: 'keyword',
          provenance: { title: 'Keyword Source', docType: 'repo_doc' },
        },
      ],
      [
        {
          documentId: 'doc-semantic-1',
          chunkId: 'chunk-semantic-1',
          content: sharedContent,
          score: 0.5,
          keywordScore: 0,
          semanticScore: 0.5,
          retrievalMethod: 'semantic',
          provenance: { title: 'Semantic Source', docType: 'semantic_external' },
        },
        {
          documentId: 'doc-semantic-2',
          chunkId: 'chunk-semantic-2',
          content: 'Independent semantic-only evidence',
          score: 0.9,
          keywordScore: 0,
          semanticScore: 0.9,
          retrievalMethod: 'semantic',
          provenance: { title: 'Semantic Top', docType: 'semantic_external' },
        },
      ]
    );

    const results = await service.searchHybrid('deterministic gates', {
      maxResults: 5,
      maxTokens: 4000,
      keywordWeight: 0.6,
      semanticWeight: 0.4,
    });

    assert.equal(results.length, 2);
    assert.equal(results[0].content, 'Independent semantic-only evidence');
    assert.equal(results[0].score, 0.9);
    assert.equal(results[1].retrievalMethod, 'hybrid');
    assert.equal(results[1].score, 0.68);
    assert.equal(results[1].keywordScore, 0.8);
    assert.equal(results[1].semanticScore, 0.5);
  });
});
