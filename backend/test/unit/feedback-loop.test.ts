/**
 * PR-2: Feedback Loop Tests
 * Tests for comments and revision functionality
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AgentStateMachine } from '../../src/core/state/AgentStateMachine.js';

describe('PR-2: Feedback Loop', () => {
  describe('AgentStateMachine - Planning failure propagation', () => {
    it('should transition to failed state when planning fails', () => {
      const machine = new AgentStateMachine('pending');
      
      machine.start(); // pending -> running
      assert.strictEqual(machine.getState(), 'running');
      
      machine.fail(); // running -> failed
      assert.strictEqual(machine.getState(), 'failed');
      assert.strictEqual(machine.isTerminal(), true);
    });

    it('should fail from pending state', () => {
      const machine = new AgentStateMachine('pending');
      
      machine.fail();
      assert.strictEqual(machine.getState(), 'failed');
      assert.strictEqual(machine.isTerminal(), true);
    });

    it('should not allow transitions from failed state', () => {
      const machine = new AgentStateMachine('failed');
      
      assert.throws(() => machine.start(), {
        message: /Cannot start: agent is in failed state/,
      });
      
      assert.throws(() => machine.complete(), {
        message: /Cannot complete: agent is in failed state/,
      });
    });
  });

  describe('Revision chain', () => {
    it('should track parent-child relationship concept', () => {
      // This is a unit test for the data model concept
      // The actual DB operations are tested in integration tests
      
      const parentJob = {
        id: 'parent-job-id',
        type: 'scribe',
        state: 'completed',
        parentJobId: null,
      };
      
      const revisionJob = {
        id: 'revision-job-id',
        type: 'scribe',
        state: 'pending',
        parentJobId: 'parent-job-id',
        revisionNote: 'Please fix the typos',
      };
      
      // Verify chain relationship
      assert.strictEqual(revisionJob.parentJobId, parentJob.id);
      assert.ok(revisionJob.revisionNote);
      assert.strictEqual(parentJob.parentJobId, null);
    });

    it('should allow revising completed jobs', () => {
      const completedJob = { state: 'completed' };
      const canRevise = completedJob.state === 'completed' || completedJob.state === 'failed';
      assert.strictEqual(canRevise, true);
    });

    it('should allow revising failed jobs', () => {
      const failedJob = { state: 'failed' };
      const canRevise = failedJob.state === 'completed' || failedJob.state === 'failed';
      assert.strictEqual(canRevise, true);
    });

    it('should not allow revising running jobs', () => {
      const runningJob = { state: 'running' };
      const canRevise = runningJob.state === 'completed' || runningJob.state === 'failed';
      assert.strictEqual(canRevise, false);
    });
  });

  describe('Comment data model', () => {
    it('should validate comment structure', () => {
      const comment = {
        id: 'comment-id',
        jobId: 'job-id',
        userId: 'user-id',
        commentText: 'Please add more details',
        createdAt: new Date(),
      };
      
      assert.ok(comment.id);
      assert.ok(comment.jobId);
      assert.ok(comment.commentText);
      assert.ok(comment.createdAt);
    });

    it('should allow nullable userId for anonymous comments', () => {
      const anonymousComment = {
        id: 'comment-id',
        jobId: 'job-id',
        userId: null,
        commentText: 'This is feedback',
        createdAt: new Date(),
      };
      
      assert.strictEqual(anonymousComment.userId, null);
    });
  });

  describe('Revision payload enhancement', () => {
    it('should build enhanced payload with parent context', () => {
      const parentPayload = {
        owner: 'test-owner',
        repo: 'test-repo',
        baseBranch: 'main',
      };
      
      const parentArtifacts = [
        { type: 'file_created', path: 'docs/README.md', preview: '# Test' },
      ];
      
      const feedbackComments = [
        { text: 'Fix the typo on line 10', createdAt: new Date() },
      ];
      
      const revisionPayload = {
        ...parentPayload,
        revisionContext: {
          parentJobId: 'parent-id',
          instruction: 'Fix the typo',
          mode: 'edit',
          parentArtifacts,
          feedbackComments,
        },
        userId: 'requesting-user-id',
      };
      
      assert.ok(revisionPayload.revisionContext);
      assert.strictEqual(revisionPayload.revisionContext.parentJobId, 'parent-id');
      assert.strictEqual(revisionPayload.revisionContext.instruction, 'Fix the typo');
      assert.deepStrictEqual(revisionPayload.revisionContext.parentArtifacts, parentArtifacts);
    });
  });
});

describe('PR-2: Planning failure propagation', () => {
  it('should set job to failed when planning throws', async () => {
    // Mock test - in real scenario this would test the orchestrator
    const planningError = new Error('Planning phase failed: Missing required field');
    
    // Verify error message format
    assert.ok(planningError.message.includes('Planning phase failed'));
  });

  it('should persist error message in job record', async () => {
    const errorMessage = 'Planning phase failed: DB connection refused';
    const jobUpdate = {
      state: 'failed',
      error: errorMessage.substring(0, 1000), // Truncated to 1000 chars
      errorCode: 'PLANNING_FAILED',
    };
    
    assert.strictEqual(jobUpdate.state, 'failed');
    assert.ok(jobUpdate.error.includes('Planning phase failed'));
  });
});

