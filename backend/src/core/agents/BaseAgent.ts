import { AgentContract, AgentExecutionContext, AgentResult, AgentType } from '../contracts/AgentContract';

export abstract class BaseAgent<TContext extends AgentExecutionContext = AgentExecutionContext>
  implements AgentContract<TContext>
{
  abstract readonly type: AgentType;

  validate(context: TContext): void {
    if (!context) throw new Error('Agent context is required');
  }

  abstract execute(context: TContext): Promise<AgentResult>;
}


