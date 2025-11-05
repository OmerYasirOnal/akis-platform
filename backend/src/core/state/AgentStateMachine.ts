export type AgentJobState = 'pending' | 'running' | 'completed' | 'failed';

export class AgentStateMachine {
  private _state: AgentJobState = 'pending';

  get state(): AgentJobState {
    return this._state;
  }

  start(): void {
    if (this._state !== 'pending') throw new Error(`Invalid transition ${this._state} -> running`);
    this._state = 'running';
  }

  complete(): void {
    if (this._state !== 'running') throw new Error(`Invalid transition ${this._state} -> completed`);
    this._state = 'completed';
  }

  fail(): void {
    if (this._state === 'completed') throw new Error('Cannot fail from completed');
    this._state = 'failed';
  }
}


