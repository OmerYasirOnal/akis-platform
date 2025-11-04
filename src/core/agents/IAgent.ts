import type { AgentInput, AgentResult, AgentState, AgentInfo } from '../contracts/AgentContract.js';
export interface IAgent {
  execute(input: AgentInput): Promise<AgentResult>;
  getState(): AgentState;
  getInfo(): AgentInfo;
}


