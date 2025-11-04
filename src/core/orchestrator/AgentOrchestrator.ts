import type { AgentInput, AgentResult } from '../contracts/AgentContract.js';
import { createAgent } from '../agents/AgentFactory.js';

export class AgentOrchestrator {
  async run(agentType: string, input: AgentInput): Promise<AgentResult> {
    const agent = createAgent(agentType);
    return agent.execute(input);
  }
}
export const Orchestrator = new AgentOrchestrator();


