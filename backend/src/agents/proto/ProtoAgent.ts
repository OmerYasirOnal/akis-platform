import { BaseAgent } from '../../core/agents/BaseAgent.js';
import type { AgentDependencies } from '../../core/agents/AgentFactory.js';
import type { Plan } from '../../services/ai/AIService.js';
import type { Critique } from '../../services/ai/AIService.js';
import type { MCPTools } from '../../services/mcp/adapters/index.js';

/**
 * ProtoAgent - Generates working MVP prototypes from requirements
 * Phase 5.C: Implements plan/reflect/execute with mock outputs
 * Extends BaseAgent; accepts injected tools (MCP adapters, AIService) via constructor
 * Complex agent: uses plan() → reflect() → execute() pattern
 */
export class ProtoAgent extends BaseAgent {
  readonly type = 'proto';
  private deps?: AgentDependencies;

  constructor(deps?: AgentDependencies) {
    super();
    this.deps = deps;
    // Set playbook flags: ProtoAgent requires both planning and reflection
    this.playbook.requiresPlanning = true;
    this.playbook.requiresReflection = true;
  }

  /**
   * Plan execution steps (mock implementation)
   * @param planner - Planner instance injected by orchestrator
   * @param context - Planning context (should contain goal)
   */
  async plan(
    planner: { plan(input: { agent: string; goal: string; context?: unknown }): Promise<Plan> },
    context: unknown
  ): Promise<Plan> {
    // Extract goal from context (assume context has goal field)
    const goal = (context && typeof context === 'object' && 'goal' in context && typeof context.goal === 'string')
      ? context.goal
      : 'scaffold a demo plan';

    // Call planner
    return await planner.plan({
      agent: this.type,
      goal,
      context,
    });
  }

  /**
   * Reflect on execution artifact (mock implementation)
   * @param reflector - Reflector instance injected by orchestrator
   * @param artifact - Execution artifact to critique
   */
  async reflect(
    reflector: { critique(input: { artifact: unknown; context?: unknown }): Promise<Critique> },
    artifact: unknown
  ): Promise<Critique> {
    // Call reflector
    return await reflector.critique({
      artifact,
      context: { agent: this.type },
    });
  }

  /**
   * Execute with tools and optional plan (mock implementation)
   * @param tools - MCP tools injected by orchestrator
   * @param plan - Optional plan from planning phase
   * @param context - Execution context
   */
  async executeWithTools(tools: MCPTools, plan?: Plan, context?: unknown): Promise<unknown> {
    // Mock execution: return deterministic result
    return {
      ok: true,
      agent: 'proto',
      message: 'MVP prototype mock execution completed',
      planUsed: plan ? plan.steps.length : 0,
      result: {
        filesCreated: 3,
        testsPassed: true,
        mvpReady: true,
      },
    };
  }

  /**
   * Default execute (fallback, not used when executeWithTools is available)
   */
  async execute(context: unknown): Promise<unknown> {
    // Fallback implementation
    return {
      ok: true,
      agent: 'proto',
      message: 'MVP prototype stub (use executeWithTools for full flow)',
    };
  }
}

