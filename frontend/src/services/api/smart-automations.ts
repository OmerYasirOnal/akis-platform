/**
 * Smart Automations API Service
 * Frontend API client for smart automations CRUD and execution
 */

import { HttpClient } from './HttpClient';
import { getApiBaseUrl } from './config';

// =============================================================================
// Types
// =============================================================================

export interface AutomationSource {
  url: string;
  type: 'rss' | 'webpage';
}

export interface SmartAutomation {
  id: string;
  userId: string;
  name: string;
  topics: string[];
  sources: AutomationSource[];
  scheduleTime: string;
  timezone: string;
  outputLanguage: 'tr' | 'en';
  style: string;
  deliveryInApp: boolean;
  deliverySlack: boolean;
  slackChannel: string | null;
  enabled: boolean;
  mode: string;
  nextRunAt: string | null;
  lastRunAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SmartAutomationRun {
  id: string;
  automationId: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  output: string | null;
  summary: string | null;
  itemCount: number;
  error: string | null;
  errorCode: string | null;
  startedAt: string | null;
  completedAt: string | null;
  slackMessageTs: string | null;
  slackSent: boolean;
  createdAt: string;
}

export interface SmartAutomationItem {
  id: string;
  runId: string;
  title: string;
  link: string;
  linkHash: string;
  excerpt: string | null;
  publishedAt: string | null;
  source: string | null;
  createdAt: string;
}

export interface AutomationWithLastRun extends SmartAutomation {
  lastRun: {
    id: string;
    status: SmartAutomationRun['status'];
    createdAt: string;
    itemCount: number;
  } | null;
}

export interface CreateAutomationRequest {
  name: string;
  topics: string[];
  sources: AutomationSource[];
  scheduleTime?: string;
  timezone?: string;
  outputLanguage?: 'tr' | 'en';
  style?: 'linkedin';
  deliveryInApp?: boolean;
  deliverySlack?: boolean;
  slackChannel?: string;
  enabled?: boolean;
}

export interface UpdateAutomationRequest {
  name?: string;
  topics?: string[];
  sources?: AutomationSource[];
  scheduleTime?: string;
  timezone?: string;
  outputLanguage?: 'tr' | 'en';
  style?: 'linkedin';
  deliveryInApp?: boolean;
  deliverySlack?: boolean;
  slackChannel?: string | null;
  enabled?: boolean;
}

export interface RunAutomationResponse {
  success: boolean;
  runId: string;
  itemCount: number;
  error?: string;
  errorCode?: string;
}

export interface ResendSlackResponse {
  success: boolean;
  error?: string;
}

// =============================================================================
// API Client
// =============================================================================

const httpClient = new HttpClient(getApiBaseUrl());

export const smartAutomationsApi = {
  /**
   * List all automations for the current user
   */
  list: async (): Promise<AutomationWithLastRun[]> => {
    const response = await httpClient.get<{ automations: AutomationWithLastRun[] }>(
      '/api/smart-automations'
    );
    return response.automations;
  },

  /**
   * Get automation detail with recent runs
   */
  get: async (id: string): Promise<{ automation: SmartAutomation; runs: SmartAutomationRun[] }> => {
    return httpClient.get(`/api/smart-automations/${id}`);
  },

  /**
   * Create a new automation
   */
  create: async (data: CreateAutomationRequest): Promise<SmartAutomation> => {
    return httpClient.post('/api/smart-automations', data);
  },

  /**
   * Update an existing automation
   */
  update: async (id: string, data: UpdateAutomationRequest): Promise<SmartAutomation> => {
    return httpClient.put(`/api/smart-automations/${id}`, data);
  },

  /**
   * Delete an automation
   */
  delete: async (id: string): Promise<void> => {
    await httpClient.delete(`/api/smart-automations/${id}`);
  },

  /**
   * Trigger a manual run
   */
  runNow: async (id: string): Promise<RunAutomationResponse> => {
    return httpClient.post(`/api/smart-automations/${id}/run`);
  },

  /**
   * Get run detail with items
   */
  getRunDetail: async (
    automationId: string,
    runId: string
  ): Promise<{ run: SmartAutomationRun; items: SmartAutomationItem[] }> => {
    return httpClient.get(`/api/smart-automations/${automationId}/runs/${runId}`);
  },

  /**
   * Resend Slack notification for a run
   */
  resendSlack: async (automationId: string, runId: string): Promise<ResendSlackResponse> => {
    return httpClient.post(`/api/smart-automations/${automationId}/runs/${runId}/resend-slack`);
  },
};
