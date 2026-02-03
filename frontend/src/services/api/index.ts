export { api } from './client';
export { HttpClient } from './HttpClient';
export type { ApiError } from './HttpClient';
export * from './types';
export { AuthAPI } from './auth';
export type { AuthUser } from './auth';
export { agentsApi } from './agents';
export type {
  AgentDefinition,
  AgentType,
  JobState,
  JobDetail,
  RunAgentResponse,
} from './agents';
export { aiKeysApi } from './ai-keys';
export type { AiKeyStatus } from './ai-keys';
export { smartAutomationsApi } from './smart-automations';
export type {
  SmartAutomation,
  SmartAutomationRun,
  SmartAutomationItem,
  AutomationWithLastRun,
  AutomationSource,
  CreateAutomationRequest,
  UpdateAutomationRequest,
} from './smart-automations';
