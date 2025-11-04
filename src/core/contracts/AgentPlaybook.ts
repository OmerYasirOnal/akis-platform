export interface AgentPlaybook {
  mission: string;
  capabilities: string[];
  rules: string[];
  behavior?: Record<string, any>;
  constraints?: Record<string, any>;
}


