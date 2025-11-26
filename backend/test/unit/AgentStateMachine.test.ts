/**
 * AgentStateMachine Unit Tests
 * Tests the finite state machine transitions for agent jobs
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { AgentStateMachine } from '../../src/core/state/AgentStateMachine.js';

describe('AgentStateMachine', () => {
  test('should initialize with pending state', () => {
    const fsm = new AgentStateMachine('pending');
    assert.strictEqual(fsm.getState(), 'pending');
  });

  test('should initialize with any valid state', () => {
    const states = ['pending', 'running', 'completed', 'failed'] as const;
    for (const state of states) {
      const fsm = new AgentStateMachine(state);
      assert.strictEqual(fsm.getState(), state);
    }
  });

  describe('start() transition', () => {
    test('should transition from pending to running', () => {
      const fsm = new AgentStateMachine('pending');
      fsm.start();
      assert.strictEqual(fsm.getState(), 'running');
    });

    test('should throw when starting from running', () => {
      const fsm = new AgentStateMachine('running');
      assert.throws(() => fsm.start(), /Cannot start/);
    });

    test('should throw when starting from completed', () => {
      const fsm = new AgentStateMachine('completed');
      assert.throws(() => fsm.start(), /Cannot start/);
    });

    test('should throw when starting from failed', () => {
      const fsm = new AgentStateMachine('failed');
      assert.throws(() => fsm.start(), /Cannot start/);
    });
  });

  describe('complete() transition', () => {
    test('should transition from running to completed', () => {
      const fsm = new AgentStateMachine('running');
      fsm.complete();
      assert.strictEqual(fsm.getState(), 'completed');
    });

    test('should throw when completing from pending', () => {
      const fsm = new AgentStateMachine('pending');
      assert.throws(() => fsm.complete(), /Cannot complete/);
    });

    test('should throw when completing from completed', () => {
      const fsm = new AgentStateMachine('completed');
      assert.throws(() => fsm.complete(), /Cannot complete/);
    });

    test('should throw when completing from failed', () => {
      const fsm = new AgentStateMachine('failed');
      assert.throws(() => fsm.complete(), /Cannot complete/);
    });
  });

  describe('fail() transition', () => {
    test('should transition from pending to failed', () => {
      const fsm = new AgentStateMachine('pending');
      fsm.fail();
      assert.strictEqual(fsm.getState(), 'failed');
    });

    test('should transition from running to failed', () => {
      const fsm = new AgentStateMachine('running');
      fsm.fail();
      assert.strictEqual(fsm.getState(), 'failed');
    });

    test('should throw when failing from completed', () => {
      const fsm = new AgentStateMachine('completed');
      assert.throws(() => fsm.fail(), /Cannot fail/);
    });

    test('should throw when failing from failed', () => {
      const fsm = new AgentStateMachine('failed');
      assert.throws(() => fsm.fail(), /Cannot fail/);
    });
  });

  describe('isTerminal()', () => {
    test('should return false for pending', () => {
      const fsm = new AgentStateMachine('pending');
      assert.strictEqual(fsm.isTerminal(), false);
    });

    test('should return false for running', () => {
      const fsm = new AgentStateMachine('running');
      assert.strictEqual(fsm.isTerminal(), false);
    });

    test('should return true for completed', () => {
      const fsm = new AgentStateMachine('completed');
      assert.strictEqual(fsm.isTerminal(), true);
    });

    test('should return true for failed', () => {
      const fsm = new AgentStateMachine('failed');
      assert.strictEqual(fsm.isTerminal(), true);
    });
  });

  describe('full lifecycle', () => {
    test('pending → running → completed', () => {
      const fsm = new AgentStateMachine('pending');
      
      assert.strictEqual(fsm.getState(), 'pending');
      assert.strictEqual(fsm.isTerminal(), false);
      
      fsm.start();
      assert.strictEqual(fsm.getState(), 'running');
      assert.strictEqual(fsm.isTerminal(), false);
      
      fsm.complete();
      assert.strictEqual(fsm.getState(), 'completed');
      assert.strictEqual(fsm.isTerminal(), true);
    });

    test('pending → running → failed', () => {
      const fsm = new AgentStateMachine('pending');
      
      fsm.start();
      assert.strictEqual(fsm.getState(), 'running');
      
      fsm.fail();
      assert.strictEqual(fsm.getState(), 'failed');
      assert.strictEqual(fsm.isTerminal(), true);
    });

    test('pending → failed (early failure)', () => {
      const fsm = new AgentStateMachine('pending');
      
      fsm.fail();
      assert.strictEqual(fsm.getState(), 'failed');
      assert.strictEqual(fsm.isTerminal(), true);
    });
  });
});

