export interface AgentStep<Input = unknown, Output = unknown> {
  name: string;
  execute(input: Input): Promise<Output>;
}

export interface AgentPlaybook {
  name: string;
  steps: AgentStep[];
}


