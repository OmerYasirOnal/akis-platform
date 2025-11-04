export interface AgentContract {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
}
export type AgentState = 'pending' | 'running' | 'completed' | 'failed';
export interface AgentInfo {
  id: string;
  name: string;
  version: string;
  state: AgentState;
  mission?: string;
}
export interface AgentInput { [key: string]: any }
export interface AgentResult {
  success: boolean;
  data?: any;
  error?: string;
}


