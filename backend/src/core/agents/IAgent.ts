import { AgentContract, AgentExecutionContext, AgentResult, AgentType } from '../contracts/AgentContract';

export interface IAgent<TContext extends AgentExecutionContext = AgentExecutionContext> extends AgentContract<TContext> {
  readonly type: AgentType;
  execute(context: TContext): Promise<AgentResult>;
}


