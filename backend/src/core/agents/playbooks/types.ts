export interface AgentPhase {
  id: string;
  label: string;
  description: string;
  icon: string;
  estimatedDurationMs?: number;
}

export interface AgentPlaybook {
  agentType: string;
  displayName: string;
  description: string;
  phases: AgentPhase[];
  requiredFields: Array<{
    name: string;
    type: 'string' | 'boolean' | 'select';
    label: string;
    required: boolean;
    placeholder?: string;
    options?: string[];
    defaultValue?: unknown;
  }>;
  capabilities: string[];
  outputArtifacts: string[];
}
