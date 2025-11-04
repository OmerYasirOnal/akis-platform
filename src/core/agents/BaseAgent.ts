import { IAgent } from './IAgent.js';
import { AgentInput, AgentResult, AgentState, AgentInfo, AgentContract } from '../contracts/AgentContract.js';
import { AgentPlaybook } from '../contracts/AgentPlaybook.js';
import { canTransition } from '../state/AgentStateMachine.js';

export abstract class BaseAgent implements IAgent {
  protected state: AgentState = 'pending';
  constructor(protected contract: AgentContract, protected playbook: AgentPlaybook) {}

  protected transition(next: AgentState) {
    if (!canTransition(this.state, next)) throw new Error(`Invalid transition ${this.state} -> ${next}`);
    this.state = next;
  }

  getState(): AgentState { return this.state; }
  getInfo(): AgentInfo {
    return { id: this.contract.id, name: this.contract.name, version: this.contract.version, state: this.state, mission: this.playbook?.mission };
  }

  abstract execute(input: AgentInput): Promise<AgentResult>;
}


