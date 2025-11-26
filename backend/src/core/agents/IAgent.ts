import type { AgentPlaybook } from '../contracts/AgentPlaybook.js';
import type { Plan, Critique, ReflectionInput } from '../../services/ai/AIService.js';
import type { MCPTools } from '../../services/mcp/adapters/index.js';

/**
 * IAgent - Core interface for all agents
 * Phase 5.C: Extended with playbook, plan, reflect, execute methods
 * Agents never call each other directly; orchestration is handled by AgentOrchestrator
 */
export interface IAgent {
  /**
   * Unique identifier for this agent type
   */
  readonly type: string;

  /**
   * Get agent's playbook (defines planning/reflection requirements)
   */
  getPlaybook(): AgentPlaybook;

  /**
   * Execute the agent's primary task
   * @param context - Task-specific context provided by orchestrator
   */
  execute(context: unknown): Promise<unknown>;

  /**
   * Optional: Plan the execution steps (for complex agents)
   * @param planner - Planner instance injected by orchestrator
   * @param context - Planning context
   * @returns Plan with steps and rationale
   */
  plan?(planner: { plan(input: { agent: string; goal: string; context?: unknown }): Promise<Plan> }, context: unknown): Promise<Plan>;

  /**
   * Optional: Reflect on execution results (for complex agents)
   * @param reflector - Reflector instance injected by orchestrator
   * @param artifact - Execution artifact to critique
   * @param checkResults - Optional static check results for tool-augmented reflection
   * @returns Critique with issues and recommendations
   */
  reflect?(
    reflector: { critique(input: { artifact: unknown; context?: unknown; checkResults?: ReflectionInput['checkResults'] }): Promise<Critique> }, 
    artifact: unknown,
    checkResults?: ReflectionInput['checkResults']
  ): Promise<Critique>;

  /**
   * Execute with tools (MCP adapters) and optional plan
   * @param tools - MCP tools injected by orchestrator
   * @param plan - Optional plan from planning phase
   * @param context - Execution context
   * @returns Agent execution result
   */
  executeWithTools?(tools: MCPTools, plan?: Plan, context?: unknown): Promise<unknown>;
}

