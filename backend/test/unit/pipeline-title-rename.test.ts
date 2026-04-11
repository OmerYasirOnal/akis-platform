import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { createPipelineRoutes, type PipelineRoutesDeps } from '../../src/pipeline/api/pipeline.routes.js';

// ─── Mock Orchestrator ────────────────────────────

function createMockOrchestrator(overrides?: {
  updateTitle?: (id: string, userId: string, title: string) => Promise<unknown>;
  getStatus?: (id: string) => Promise<unknown>;
}) {
  return {
    updateTitle: overrides?.updateTitle ?? (async (_id: string, _userId: string, title: string) => ({
      id: 'pipe-1',
      userId: 'user-1',
      title,
      stage: 'awaiting_approval',
    })),
    getStatus: overrides?.getStatus ?? (async () => ({ id: 'pipe-1', stage: 'awaiting_approval' })),
    // Stubs for other methods (not exercised by updateTitle tests)
    startPipeline: async () => ({}),
    listPipelines: async () => [],
    sendMessage: async () => ({}),
    approveSpec: async () => ({}),
    rejectSpec: async () => ({}),
    retryStage: async () => ({}),
    skipTrace: async () => ({}),
    cancelPipeline: async () => ({}),
  };
}

function makeRequest(params: Record<string, string>, body: Record<string, unknown>, userId = 'user-1') {
  return { params, body, _userId: userId };
}

// ─── Tests ────────────────────────────────────────

describe('Pipeline Routes — updateTitle', () => {
  it('returns 200 with updated pipeline on valid rename', async () => {
    let capturedTitle = '';
    const orchestrator = createMockOrchestrator({
      updateTitle: async (_id, _userId, title) => {
        capturedTitle = title;
        return { id: 'pipe-1', userId: 'user-1', title, stage: 'awaiting_approval' };
      },
    });
    const routes = createPipelineRoutes({
      orchestrator: orchestrator as unknown as PipelineRoutesDeps['orchestrator'],
      getUserId: (req) => (req as { _userId: string })._userId,
    });

    const result = await routes.updateTitle(makeRequest({ id: 'pipe-1' }, { title: 'My New Title' }));
    assert.equal((result as { pipeline: { title: string } }).pipeline.title, 'My New Title');
    assert.equal(capturedTitle, 'My New Title');
  });

  it('throws 400 when title is empty string', async () => {
    const orchestrator = createMockOrchestrator();
    const routes = createPipelineRoutes({
      orchestrator: orchestrator as unknown as PipelineRoutesDeps['orchestrator'],
      getUserId: (req) => (req as { _userId: string })._userId,
    });

    await assert.rejects(
      () => routes.updateTitle(makeRequest({ id: 'pipe-1' }, { title: '' })),
      (err: Error & { statusCode?: number }) => {
        assert.equal(err.statusCode, 400);
        assert.ok(err.message.includes('Title is required'));
        return true;
      },
    );
  });

  it('throws 400 when title is whitespace only', async () => {
    const orchestrator = createMockOrchestrator();
    const routes = createPipelineRoutes({
      orchestrator: orchestrator as unknown as PipelineRoutesDeps['orchestrator'],
      getUserId: (req) => (req as { _userId: string })._userId,
    });

    await assert.rejects(
      () => routes.updateTitle(makeRequest({ id: 'pipe-1' }, { title: '   ' })),
      (err: Error & { statusCode?: number }) => {
        assert.equal(err.statusCode, 400);
        return true;
      },
    );
  });

  it('trims title exceeding 200 characters', async () => {
    let capturedTitle = '';
    const orchestrator = createMockOrchestrator({
      updateTitle: async (_id, _userId, title) => {
        capturedTitle = title;
        return { id: 'pipe-1', userId: 'user-1', title, stage: 'awaiting_approval' };
      },
    });
    const routes = createPipelineRoutes({
      orchestrator: orchestrator as unknown as PipelineRoutesDeps['orchestrator'],
      getUserId: (req) => (req as { _userId: string })._userId,
    });

    const longTitle = 'A'.repeat(250);
    await routes.updateTitle(makeRequest({ id: 'pipe-1' }, { title: longTitle }));
    assert.equal(capturedTitle.length, 200);
  });

  it('propagates error when pipeline not found', async () => {
    const orchestrator = createMockOrchestrator({
      updateTitle: async () => {
        throw new Error('Pipeline not found: pipe-999');
      },
    });
    const routes = createPipelineRoutes({
      orchestrator: orchestrator as unknown as PipelineRoutesDeps['orchestrator'],
      getUserId: (req) => (req as { _userId: string })._userId,
    });

    await assert.rejects(
      () => routes.updateTitle(makeRequest({ id: 'pipe-999' }, { title: 'Valid Title' })),
      { message: /Pipeline not found/ },
    );
  });

  it('trims leading/trailing whitespace from title', async () => {
    let capturedTitle = '';
    const orchestrator = createMockOrchestrator({
      updateTitle: async (_id, _userId, title) => {
        capturedTitle = title;
        return { id: 'pipe-1', userId: 'user-1', title, stage: 'awaiting_approval' };
      },
    });
    const routes = createPipelineRoutes({
      orchestrator: orchestrator as unknown as PipelineRoutesDeps['orchestrator'],
      getUserId: (req) => (req as { _userId: string })._userId,
    });

    await routes.updateTitle(makeRequest({ id: 'pipe-1' }, { title: '  Hello World  ' }));
    assert.equal(capturedTitle, 'Hello World');
  });
});
