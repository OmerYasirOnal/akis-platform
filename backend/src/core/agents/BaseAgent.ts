import type { IAgent } from './IAgent.js';

/**
 * BaseAgent - Abstract base class for all agents
 * Provides common functionality and enforces IAgent contract
 */
export abstract class BaseAgent implements IAgent {
  abstract readonly type: string;

  /**
   * Execute the agent's primary task
   * Must be implemented by concrete agents
   */
  abstract execute(context: unknown): Promise<unknown>;

  /**
   * Optional planning phase for complex agents
   * Override in subclasses if planning is needed
   */
  async plan?(context: unknown): Promise<unknown> {
    // Default: no planning
    return context;
  }

  /**
   * Optional reflection phase for complex agents
   * Override in subclasses if reflection is needed
   */
  async reflect?(output: unknown, context: unknown): Promise<unknown> {
    // Default: no reflection
    return output;
  }
}

