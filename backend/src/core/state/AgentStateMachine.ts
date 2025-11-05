/**
 * AgentStateMachine - FSM for agent lifecycle management
 * States: pending → running → completed | failed
 */

export type AgentState = 'pending' | 'running' | 'completed' | 'failed';

export class AgentStateMachine {
  private state: AgentState;

  constructor(initialState: AgentState = 'pending') {
    this.state = initialState;
  }

  /**
   * Get current state
   */
  getState(): AgentState {
    return this.state;
  }

  /**
   * Transition to running state
   * Only valid from pending
   */
  start(): void {
    if (this.state !== 'pending') {
      throw new Error(`Cannot start: agent is in ${this.state} state`);
    }
    this.state = 'running';
  }

  /**
   * Transition to completed state
   * Only valid from running
   */
  complete(): void {
    if (this.state !== 'running') {
      throw new Error(`Cannot complete: agent is in ${this.state} state`);
    }
    this.state = 'completed';
  }

  /**
   * Transition to failed state
   * Valid from pending or running
   */
  fail(): void {
    if (this.state !== 'pending' && this.state !== 'running') {
      throw new Error(`Cannot fail: agent is in ${this.state} state`);
    }
    this.state = 'failed';
  }

  /**
   * Check if agent is in terminal state
   */
  isTerminal(): boolean {
    return this.state === 'completed' || this.state === 'failed';
  }
}

