/**
 * Agent System Type Definitions
 * Agent'ların contract, playbook ve capability tanımları
 */

export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  parameters?: Record<string, {
    type: string;
    required: boolean;
    description: string;
  }>;
}

export interface AgentRule {
  id: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  enforceable: boolean;
}

export interface AgentBehavior {
  responseStyle: 'formal' | 'casual' | 'technical';
  language: string;
  maxTokens: number;
  temperature: number;
  shouldExplain: boolean;
  shouldProvideExamples: boolean;
}

export interface AgentTool {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
  execute: (input: any) => Promise<any>;
}

export interface AgentPlaybook {
  agentId: string;
  agentName: string;
  version: string;
  description: string;
  
  // Agent'ın misyonu
  mission: string;
  
  // Yetenekler
  capabilities: AgentCapability[];
  
  // Kurallar
  rules: AgentRule[];
  
  // Davranış özellikleri
  behavior: AgentBehavior;
  
  // Kullanılabilir araçlar
  tools?: AgentTool[];
  
  // System prompt template
  systemPromptTemplate: string;
  
  // Örnek senaryolar
  examples?: {
    input: string;
    expectedOutput: string;
    explanation: string;
  }[];
  
  // Kısıtlamalar
  constraints?: {
    maxInputLength?: number;
    maxOutputLength?: number;
    allowedActions?: string[];
    forbiddenTopics?: string[];
  };
}

export interface AgentContract {
  // Temel bilgiler
  id: string;
  name: string;
  type: 'document' | 'qa' | 'code' | 'workflow' | 'custom';
  status: 'active' | 'inactive' | 'deprecated';
  
  // Playbook referansı
  playbook: AgentPlaybook;
  
  // Metadata
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    version: string;
    author?: string;
    tags?: string[];
  };
  
  // Performance metrics
  metrics?: {
    totalRuns: number;
    successRate: number;
    averageResponseTime: number;
  };
}

