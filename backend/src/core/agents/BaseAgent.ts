import type { IAgent } from './IAgent.js';
import { AgentPlaybook } from '../contracts/AgentPlaybook.js';
import type { Plan, Critique, ReflectionInput } from '../../services/ai/AIService.js';
import type { MCPTools } from '../../services/mcp/adapters/index.js';

/**
 * BaseAgent - Abstract base class for all agents
 * Phase 5.C: Extended with playbook support
 * Provides common functionality and enforces IAgent contract
 */
export abstract class BaseAgent implements IAgent {
  abstract readonly type: string;
  protected playbook: AgentPlaybook = new AgentPlaybook();

  /**
   * Get agent's playbook (defines planning/reflection requirements)
   */
  getPlaybook(): AgentPlaybook {
    return this.playbook;
  }

  /**
   * Execute the agent's primary task
   * Must be implemented by concrete agents
   */
  abstract execute(context: unknown): Promise<unknown>;

  /**
   * Optional planning phase for complex agents
   * Override in subclasses if planning is needed
   */
  async plan?(
    planner: { plan(input: { agent: string; goal: string; context?: unknown }): Promise<Plan> },
    context: unknown
  ): Promise<Plan> {
    // Default: no planning
    throw new Error('Planning not implemented for this agent');
  }

  /**
   * Optional reflection phase for complex agents
   * Override in subclasses if reflection is needed
   * @param reflector - Reflector instance with critique method
   * @param artifact - The artifact to reflect on
   * @param checkResults - Optional static check results for tool-augmented reflection
   */
  async reflect?(
    reflector: { critique(input: { artifact: unknown; context?: unknown; checkResults?: ReflectionInput['checkResults'] }): Promise<Critique> },
    artifact: unknown,
    checkResults?: ReflectionInput['checkResults']
  ): Promise<Critique> {
    // Default: no reflection
    throw new Error('Reflection not implemented for this agent');
  }

  /**
   * Execute with tools (MCP adapters) and optional plan
   * Default implementation falls back to execute()
   */
  async executeWithTools?(tools: MCPTools, plan?: Plan, context?: unknown): Promise<unknown> {
    return this.execute(context || {});
  }
}

