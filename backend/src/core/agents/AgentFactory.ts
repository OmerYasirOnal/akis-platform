import type { IAgent } from './IAgent.js';
import type { TraceRecorder } from '../tracing/TraceRecorder.js';

/**
 * AgentFactory - Creates agents via factory pattern
 * No direct agent instantiation outside this factory
 * Supports dependency injection via create(agentKey, deps)
 */
export interface AgentDependencies {
  // MCP adapters and AIService injected by orchestrator
  tools?: {
    githubMCP?: unknown;
    jiraMCP?: unknown;
    confluenceMCP?: unknown;
    aiService?: unknown;
  };
  // S1.1: TraceRecorder for explainability
  traceRecorder?: TraceRecorder;
  [key: string]: unknown;
}

export type AgentConstructor = new (deps?: AgentDependencies) => IAgent;

export class AgentFactory {
  private static registry: Map<string, AgentConstructor> = new Map();

  /**
   * Register an agent type with the factory
   * @param agentKey - Unique agent identifier (e.g., 'scribe', 'trace', 'proto')
   * @param ctor - Agent constructor function
   */
  static register(agentKey: string, ctor: AgentConstructor): void {
    this.registry.set(agentKey, ctor);
  }

  /**
   * Create an agent instance by type with optional dependencies
   * @param agentKey - Agent type identifier
   * @param deps - Optional dependencies (MCP adapters, AIService, etc.)
   * @throws Error if agent type is not registered
   */
  static create(agentKey: string, deps?: AgentDependencies): IAgent {
    const AgentClass = this.registry.get(agentKey);
    if (!AgentClass) {
      const available = this.listTypes();
      throw new Error(
        `Agent type "${agentKey}" is not registered. Available types: ${available.length > 0 ? available.join(', ') : 'none'}`
      );
    }
    return new AgentClass(deps);
  }

  /**
   * List all registered agent types
   */
  static listTypes(): string[] {
    return Array.from(this.registry.keys());
  }
}

