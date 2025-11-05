import { AgentFactory } from '../agents/AgentFactory';
import { AgentExecutionContext, AgentResult, AgentType } from '../contracts/AgentContract';
import { AgentStateMachine } from '../state/AgentStateMachine';

export class AgentOrchestrator {
  async runAgent(type: AgentType, context: AgentExecutionContext): Promise<AgentResult> {
    const fsm = new AgentStateMachine();
    const agent = AgentFactory.create(type);
    agent.validate(context);
    fsm.start();
    try {
      const result = await agent.execute(context);
      if (result.success) {
        fsm.complete();
      } else {
        fsm.fail();
      }
      return result;
    } catch (error: any) {
      fsm.fail();
      return { success: false, error: error?.message ?? 'Unknown error' };
    }
  }
}


