/**
 * AIService - Planner + Reflector tool (LLM-backed)
 * Interfaces: plan(), reflect()
 */

export interface AIService {
  /**
   * Plan a sequence of actions to achieve a goal
   * @param goal - Description of the goal
   * @param context - Current context
   */
  plan(goal: string, context: unknown): Promise<unknown>;

  /**
   * Reflect on execution results and critique plan/output
   * @param output - Execution output
   * @param plan - Original plan
   * @param context - Execution context
   */
  reflect(output: unknown, plan: unknown, context: unknown): Promise<unknown>;
}

/**
 * AIService implementation placeholder
 * TODO: Implement with OpenRouter or equivalent LLM provider
 */
export class OpenRouterAIService implements AIService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async plan(goal: string, context: unknown): Promise<unknown> {
    // TODO: Implement LLM-based planning
    throw new Error('Not implemented');
  }

  async reflect(output: unknown, plan: unknown, context: unknown): Promise<unknown> {
    // TODO: Implement LLM-based reflection
    throw new Error('Not implemented');
  }
}

