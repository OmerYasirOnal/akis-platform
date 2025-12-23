/**
 * AgentStateMachine Unit Tests
 * PR-1: Extended with awaiting_approval state tests
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { AgentStateMachine, type AgentState } from '../../src/core/state/AgentStateMachine.js';

describe('AgentStateMachine', () => {
  describe('basic transitions', () => {
    it('should start in pending state', () => {
      const fsm = new AgentStateMachine();
      assert.strictEqual(fsm.getState(), 'pending');
    });

    it('should allow custom initial state', () => {
      const fsm = new AgentStateMachine('running');
      assert.strictEqual(fsm.getState(), 'running');
    });

    it('should transition from pending to running on start', () => {
      const fsm = new AgentStateMachine();
      fsm.start();
      assert.strictEqual(fsm.getState(), 'running');
    });

    it('should transition from running to completed on complete', () => {
      const fsm = new AgentStateMachine('running');
      fsm.complete();
      assert.strictEqual(fsm.getState(), 'completed');
    });

    it('should transition from pending to failed on fail', () => {
      const fsm = new AgentStateMachine();
      fsm.fail();
      assert.strictEqual(fsm.getState(), 'failed');
    });

    it('should transition from running to failed on fail', () => {
      const fsm = new AgentStateMachine('running');
      fsm.fail();
      assert.strictEqual(fsm.getState(), 'failed');
    });
  });

  describe('invalid transitions', () => {
    it('should throw when starting from non-pending state', () => {
      const fsm = new AgentStateMachine('running');
      assert.throws(() => fsm.start(), /Cannot start/);
    });

    it('should throw when completing from non-running state', () => {
      const fsm = new AgentStateMachine('pending');
      assert.throws(() => fsm.complete(), /Cannot complete/);
    });

    it('should throw when failing from completed state', () => {
      const fsm = new AgentStateMachine('completed');
      assert.throws(() => fsm.fail(), /Cannot fail/);
    });

    it('should throw when failing from failed state', () => {
      const fsm = new AgentStateMachine('failed');
      assert.throws(() => fsm.fail(), /Cannot fail/);
    });
  });

  describe('terminal state detection', () => {
    it('should detect completed as terminal', () => {
      const fsm = new AgentStateMachine('completed');
      assert.strictEqual(fsm.isTerminal(), true);
    });

    it('should detect failed as terminal', () => {
      const fsm = new AgentStateMachine('failed');
      assert.strictEqual(fsm.isTerminal(), true);
    });

    it('should not detect pending as terminal', () => {
      const fsm = new AgentStateMachine('pending');
      assert.strictEqual(fsm.isTerminal(), false);
    });

    it('should not detect running as terminal', () => {
      const fsm = new AgentStateMachine('running');
      assert.strictEqual(fsm.isTerminal(), false);
    });
  });

  describe('PR-1: awaiting_approval state', () => {
    it('should transition from running to awaiting_approval', () => {
      const fsm = new AgentStateMachine('running');
      fsm.awaitApproval();
      assert.strictEqual(fsm.getState(), 'awaiting_approval');
    });

    it('should throw when awaiting approval from non-running state', () => {
      const fsm = new AgentStateMachine('pending');
      assert.throws(() => fsm.awaitApproval(), /Cannot await approval/);
    });

    it('should transition from awaiting_approval to running on resume', () => {
      const fsm = new AgentStateMachine('awaiting_approval');
      fsm.resume();
      assert.strictEqual(fsm.getState(), 'running');
    });

    it('should throw when resuming from non-awaiting_approval state', () => {
      const fsm = new AgentStateMachine('running');
      assert.throws(() => fsm.resume(), /Cannot resume/);
    });

    it('should transition from awaiting_approval to failed on fail', () => {
      const fsm = new AgentStateMachine('awaiting_approval');
      fsm.fail();
      assert.strictEqual(fsm.getState(), 'failed');
    });

    it('should detect awaiting_approval as non-terminal', () => {
      const fsm = new AgentStateMachine('awaiting_approval');
      assert.strictEqual(fsm.isTerminal(), false);
    });

    it('should correctly identify awaiting_approval state', () => {
      const fsm = new AgentStateMachine('awaiting_approval');
      assert.strictEqual(fsm.isAwaitingApproval(), true);
    });

    it('should not identify running as awaiting_approval', () => {
      const fsm = new AgentStateMachine('running');
      assert.strictEqual(fsm.isAwaitingApproval(), false);
    });
  });

  describe('PR-1: full approval workflow', () => {
    it('should support pending → running → awaiting_approval → running → completed', () => {
      const fsm = new AgentStateMachine('pending');
      
      // Start job
      fsm.start();
      assert.strictEqual(fsm.getState(), 'running');
      
      // Plan phase complete, await approval
      fsm.awaitApproval();
      assert.strictEqual(fsm.getState(), 'awaiting_approval');
      assert.strictEqual(fsm.isAwaitingApproval(), true);
      
      // Human approves, resume execution
      fsm.resume();
      assert.strictEqual(fsm.getState(), 'running');
      assert.strictEqual(fsm.isAwaitingApproval(), false);
      
      // Execution complete
      fsm.complete();
      assert.strictEqual(fsm.getState(), 'completed');
      assert.strictEqual(fsm.isTerminal(), true);
    });

    it('should support pending → running → awaiting_approval → failed (reject)', () => {
      const fsm = new AgentStateMachine('pending');
      
      // Start job
      fsm.start();
      assert.strictEqual(fsm.getState(), 'running');
      
      // Plan phase complete, await approval
      fsm.awaitApproval();
      assert.strictEqual(fsm.getState(), 'awaiting_approval');
      
      // Human rejects
      fsm.fail();
      assert.strictEqual(fsm.getState(), 'failed');
      assert.strictEqual(fsm.isTerminal(), true);
    });
  });

  describe('all valid states', () => {
    const states: AgentState[] = ['pending', 'running', 'completed', 'failed', 'awaiting_approval'];

    it('should accept all valid states as initial state', () => {
      for (const state of states) {
        const fsm = new AgentStateMachine(state);
        assert.strictEqual(fsm.getState(), state);
      }
    });
  });
});
