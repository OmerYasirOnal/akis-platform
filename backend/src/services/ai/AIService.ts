/**
 * AIService - Planner + Reflector tool (LLM-backed)
 * Phase 5.A: Minimal interfaces for Planner and Reflector
 */

/**
 * Plan result structure
 */
export interface Plan {
  steps: Array<{
    id: string;
    title: string;
    detail?: string;
  }>;
  rationale?: string;
}

/**
 * Critique result structure
 */
export interface Critique {
  issues: string[];
  recommendations: string[];
}

/**
 * Planner interface - generates execution plans
 */
export interface Planner {
  /**
   * Plan a sequence of actions to achieve a goal
   * @param input - Planning input with agent type, goal, and optional context
   * @returns Plan with steps and rationale
   */
  plan(input: { agent: string; goal: string; context?: unknown }): Promise<Plan>;
}

/**
 * Reflector interface - critiques execution artifacts
 */
export interface Reflector {
  /**
   * Critique an artifact (plan or execution output)
   * @param input - Critique input with artifact and optional context
   * @returns Critique with issues and recommendations
   */
  critique(input: { artifact: unknown; context?: unknown }): Promise<Critique>;
}

/**
 * Unified AIService interface combining Planner and Reflector
 */
export interface AIService {
  planner: Planner;
  reflector: Reflector;
}

/**
 * Mock Planner implementation (deterministic, no LLM calls)
 */
class MockPlanner implements Planner {
  async plan(input: { agent: string; goal: string; context?: unknown }): Promise<Plan> {
    // Deterministic mock plan based on agent type
    const steps = [
      { id: 'step-1', title: `Analyze ${input.agent} requirements`, detail: `Goal: ${input.goal}` },
      { id: 'step-2', title: 'Design solution architecture', detail: 'Mock design phase' },
      { id: 'step-3', title: 'Execute implementation', detail: 'Mock execution phase' },
      { id: 'step-4', title: 'Validate output', detail: 'Mock validation phase' },
    ];

    return {
      steps,
      rationale: `Mock plan for ${input.agent} agent to achieve: ${input.goal}`,
    };
  }
}

/**
 * Mock Reflector implementation (deterministic, no LLM calls)
 */
class MockReflector implements Reflector {
  async critique(input: { artifact: unknown; context?: unknown }): Promise<Critique> {
    // Deterministic mock critique
    return {
      issues: [
        'Mock issue: Ensure all steps are executable',
        'Mock issue: Validate artifact completeness',
      ],
      recommendations: [
        'Mock recommendation: Add error handling',
        'Mock recommendation: Include validation checks',
      ],
    };
  }
}

/**
 * Mock AIService implementation (for testing/development)
 */
class MockAIService implements AIService {
  planner: Planner;
  reflector: Reflector;

  constructor() {
    this.planner = new MockPlanner();
    this.reflector = new MockReflector();
  }
}

/**
 * OpenRouter AIService (placeholder - returns mock for now)
 * TODO: Implement real LLM calls when needed
 */
class OpenRouterAIService implements AIService {
  planner: Planner;
  reflector: Reflector;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    // For now, use mock implementations
    // TODO: Replace with real LLM calls
    this.planner = new MockPlanner();
    this.reflector = new MockReflector();
  }
}

/**
 * OpenAI AIService (placeholder - returns mock for now)
 * TODO: Implement real LLM calls when needed
 */
class OpenAIAIService implements AIService {
  planner: Planner;
  reflector: Reflector;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    // For now, use mock implementations
    // TODO: Replace with real LLM calls
    this.planner = new MockPlanner();
    this.reflector = new MockReflector();
  }
}

/**
 * Create AIService instance based on provider
 * @param provider - Provider type ('openrouter' | 'openai' | 'mock')
 * @param apiKey - Optional API key (required for non-mock providers)
 * @returns AIService instance
 */
export function createAIService(provider: 'openrouter' | 'openai' | 'mock', apiKey?: string): AIService {
  switch (provider) {
    case 'openrouter':
      if (!apiKey) {
        console.warn('AI_PROVIDER=openrouter but no AI_API_KEY provided, falling back to mock');
        return new MockAIService();
      }
      return new OpenRouterAIService(apiKey);
    case 'openai':
      if (!apiKey) {
        console.warn('AI_PROVIDER=openai but no AI_API_KEY provided, falling back to mock');
        return new MockAIService();
      }
      return new OpenAIAIService(apiKey);
    case 'mock':
      return new MockAIService();
    default:
      console.warn(`Unknown AI_PROVIDER="${provider}", falling back to mock`);
      return new MockAIService();
  }
}

