export type AgentType = 'scribe' | 'trace' | 'proto';

export interface AgentExecutionContext {
  jobId?: number;
  repositoryUrl?: string;
  parameters?: Record<string, unknown>;
}

export interface AgentResult {
  success: boolean;
  summary?: string;
  artifacts?: Record<string, unknown>;
  error?: string;
}

export interface AgentContract<TContext extends AgentExecutionContext = AgentExecutionContext> {
  readonly type: AgentType;
  validate(context: TContext): void;
}


