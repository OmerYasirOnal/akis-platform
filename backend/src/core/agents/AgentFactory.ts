import type { IAgent } from './IAgent.js';
import { BaseAgent } from './BaseAgent.js';

/**
 * AgentFactory - Creates agents via factory pattern
 * No direct agent instantiation outside this factory
 */
export class AgentFactory {
  private static registry: Map<string, new () => IAgent> = new Map();

  /**
   * Register an agent type with the factory
   */
  static register(type: string, agentClass: new () => IAgent): void {
    this.registry.set(type, agentClass);
  }

  /**
   * Create an agent instance by type
   * @throws Error if agent type is not registered
   */
  static create(type: string): IAgent {
    const AgentClass = this.registry.get(type);
    if (!AgentClass) {
      throw new Error(`Agent type "${type}" is not registered`);
    }
    return new AgentClass();
  }

  /**
   * List all registered agent types
   */
  static listTypes(): string[] {
    return Array.from(this.registry.keys());
  }
}

