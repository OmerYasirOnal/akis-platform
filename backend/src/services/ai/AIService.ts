/**
 * AIService - LLM-backed AI service for planning, generation, reflection, and validation
 * 
 * Supports multiple providers (OpenRouter, OpenAI) with ENV-based configuration.
 * Uses different models for different tasks based on cost/capability trade-offs:
 * - Planner: AI_MODEL_PLANNER (can be same as default or specialized)
 * - Worker/Generation: AI_MODEL_DEFAULT (cheaper model for bulk tasks)
 * - Reflection: AI_MODEL_DEFAULT (critique and feedback)
 * - Validation: AI_MODEL_VALIDATION (stronger model for final verification)
 */

import { getEnv, getAIConfig, type AIConfig } from '../../config/env.js';
import { AIRateLimitedError, AIProviderError } from '../../core/errors.js';

// =============================================================================
// Types and Interfaces
// =============================================================================

/**
 * Plan result structure - output of planning phase
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
 * Critique result structure - output of reflection phase
 */
export interface Critique {
  issues: string[];
  recommendations: string[];
  severity?: 'low' | 'medium' | 'high';
}

/**
 * Validation result structure - output of strong-model validation
 */
export interface ValidationResult {
  passed: boolean;
  confidence: number; // 0-1 scale
  issues: string[];
  suggestions: string[];
  summary: string;
}

/**
 * Worker/Generation result structure
 */
export interface WorkerResult {
  content: string;
  metadata?: Record<string, unknown>;
}

/**
 * Input types for various AI operations
 */
export interface PlanInput {
  agent: string;
  goal: string;
  context?: unknown;
}

export interface WorkerInput {
  task: string;
  context?: unknown;
  previousSteps?: string[];
}

export interface ReflectionInput {
  artifact: unknown;
  context?: unknown;
  checkResults?: {
    typecheck?: { passed: boolean; errors?: string[] };
    lint?: { passed: boolean; errors?: string[] };
    test?: { passed: boolean; errors?: string[] };
    build?: { passed: boolean; errors?: string[] };
  };
}

export interface ValidationInput {
  plan?: Plan;
  artifact: unknown;
  reflection?: Critique;
  checkResults?: ReflectionInput['checkResults'];
}

/**
 * Planner interface - generates execution plans
 * (Kept for backward compatibility with existing orchestrator)
 */
export interface Planner {
  plan(input: PlanInput): Promise<Plan>;
}

/**
 * Reflector interface - critiques execution artifacts
 * (Kept for backward compatibility with existing orchestrator)
 */
export interface Reflector {
  critique(input: { 
    artifact: unknown; 
    context?: unknown;
    checkResults?: ReflectionInput['checkResults'];
  }): Promise<Critique>;
}

/**
 * Full AIService interface with all capabilities
 */
export interface AIService {
  /** Legacy interfaces for backward compatibility */
  planner: Planner;
  reflector: Reflector;

  /** New structured methods */
  planTask(input: PlanInput): Promise<Plan>;
  generateWorkArtifact(input: WorkerInput): Promise<WorkerResult>;
  reflectOnArtifact(input: ReflectionInput): Promise<Critique>;
  validateWithStrongModel(input: ValidationInput): Promise<ValidationResult>;

  /** Get current configuration (for debugging/logging, never expose secrets) */
  getConfigSummary(): { provider: string; models: { default: string; planner: string; validation: string } };
}

// =============================================================================
// OpenRouter/OpenAI Compatible Implementation
// =============================================================================

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Real AI Service implementation using OpenRouter/OpenAI compatible APIs
 */
class RealAIService implements AIService {
  private config: AIConfig;
  public planner: Planner;
  public reflector: Reflector;
  
  // Retry configuration - can be overridden via environment
  private readonly maxRetries: number;
  private readonly baseRetryDelay: number;

  constructor(config: AIConfig) {
    this.config = config;
    
    // Configure retry behavior from environment or use defaults
    this.maxRetries = parseInt(process.env.AI_PLANNER_MAX_RETRIES || '3', 10);
    this.baseRetryDelay = parseInt(process.env.AI_RETRY_BASE_DELAY_MS || '1000', 10);

    // Create legacy interfaces that delegate to new methods
    this.planner = {
      plan: (input: PlanInput) => this.planTask(input),
    };

    this.reflector = {
      critique: (input: { artifact: unknown; context?: unknown; checkResults?: ReflectionInput['checkResults'] }) =>
        this.reflectOnArtifact({ artifact: input.artifact, context: input.context, checkResults: input.checkResults }),
    };
  }

  getConfigSummary() {
    return {
      provider: this.config.provider,
      models: {
        default: this.config.modelDefault,
        planner: this.config.modelPlanner,
        validation: this.config.modelValidation,
      },
    };
  }

  /**
   * Delay helper for retry backoff
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Parse retry-after header from response
   */
  private parseRetryAfter(response: Response): number | undefined {
    const retryAfter = response.headers.get('retry-after');
    if (!retryAfter) return undefined;
    
    // Could be seconds (integer) or HTTP-date
    const seconds = parseInt(retryAfter, 10);
    if (!isNaN(seconds)) return seconds * 1000; // Convert to ms
    
    // Try parsing as date
    const date = Date.parse(retryAfter);
    if (!isNaN(date)) {
      const delayMs = date - Date.now();
      return delayMs > 0 ? delayMs : undefined;
    }
    
    return undefined;
  }

  /**
   * Make a chat completion request to the AI API with retry logic
   */
  private async chatCompletion(
    messages: ChatMessage[],
    model: string,
    options: { temperature?: number; maxTokens?: number } = {}
  ): Promise<string> {
    if (!this.config.apiKey) {
      throw new AIProviderError(
        'AI_AUTH_ERROR',
        `AI API key not configured for provider: ${this.config.provider}`,
        this.config.provider
      );
    }

    const endpoint = `${this.config.baseUrl}/chat/completions`;

    const body = {
      model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2048,
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.config.apiKey}`,
            // OpenRouter specific headers (ignored by OpenAI)
            'HTTP-Referer': 'https://akis.dev',
            'X-Title': 'AKIS Platform',
          },
          body: JSON.stringify(body),
        });

        // Handle rate limiting (429)
        if (response.status === 429) {
          const retryAfterMs = this.parseRetryAfter(response) || this.baseRetryDelay * Math.pow(2, attempt);
          const errorText = await response.text().catch(() => 'Rate limited');
          
          console.warn(
            `[AIService] Rate limited by ${this.config.provider} (attempt ${attempt + 1}/${this.maxRetries + 1}), ` +
            `retrying in ${retryAfterMs}ms: ${errorText.substring(0, 200)}`
          );
          
          // If this is the last attempt, throw the error
          if (attempt >= this.maxRetries) {
            throw new AIRateLimitedError(
              this.config.provider,
              Math.ceil(retryAfterMs / 1000),
              errorText.substring(0, 500)
            );
          }
          
          // Wait and retry
          await this.delay(Math.min(retryAfterMs, 30000)); // Cap at 30s
          continue;
        }

        // Handle other errors
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          
          // Auth errors (401, 403)
          if (response.status === 401 || response.status === 403) {
            throw new AIProviderError(
              'AI_AUTH_ERROR',
              `AI API authentication failed (${response.status}): ${errorText.substring(0, 200)}`,
              this.config.provider,
              response.status
            );
          }
          
          // Server errors (5xx) - retry
          if (response.status >= 500 && attempt < this.maxRetries) {
            console.warn(
              `[AIService] Server error from ${this.config.provider} (${response.status}), ` +
              `retrying in ${this.baseRetryDelay * Math.pow(2, attempt)}ms`
            );
            await this.delay(this.baseRetryDelay * Math.pow(2, attempt));
            continue;
          }
          
          throw new AIProviderError(
            'AI_PROVIDER_ERROR',
            `AI API error (${response.status}): ${errorText.substring(0, 500)}`,
            this.config.provider,
            response.status
          );
        }

        const data = (await response.json()) as ChatCompletionResponse;

        if (!data.choices || data.choices.length === 0) {
          throw new AIProviderError(
            'AI_INVALID_RESPONSE',
            'AI API returned no choices',
            this.config.provider
          );
        }

        return data.choices[0].message.content;
      } catch (error) {
        // If it's already our custom error, rethrow
        if (error instanceof AIProviderError) {
          throw error;
        }
        
        // Network errors - retry
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < this.maxRetries) {
          console.warn(
            `[AIService] Network error (attempt ${attempt + 1}/${this.maxRetries + 1}): ${lastError.message}`
          );
          await this.delay(this.baseRetryDelay * Math.pow(2, attempt));
          continue;
        }
      }
    }

    // All retries exhausted
    throw new AIProviderError(
      'AI_NETWORK_ERROR',
      `AI chat completion failed after ${this.maxRetries + 1} attempts: ${lastError?.message || 'Unknown error'}`,
      this.config.provider
    );
  }

  /**
   * Parse JSON from AI response, handling markdown code blocks
   */
  private parseJsonResponse<T>(response: string, fallback: T): T {
    try {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : response.trim();
      return JSON.parse(jsonStr) as T;
    } catch {
      // If parsing fails, return fallback
      console.warn('Failed to parse AI JSON response, using fallback');
      return fallback;
    }
  }

  /**
   * Plan a task - uses AI_MODEL_PLANNER
   */
  async planTask(input: PlanInput): Promise<Plan> {
    const systemPrompt = `You are an AI planning assistant for the AKIS platform.
Your task is to create execution plans for autonomous agents.
Always respond with valid JSON in this exact format:
{
  "steps": [
    { "id": "step-1", "title": "Step title", "detail": "Optional detailed description" }
  ],
  "rationale": "Brief explanation of why this plan achieves the goal"
}`;

    const userPrompt = `Create an execution plan for the ${input.agent} agent.
Goal: ${input.goal}
${input.context ? `Context: ${JSON.stringify(input.context)}` : ''}

Respond ONLY with the JSON plan, no additional text.`;

    const response = await this.chatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      this.config.modelPlanner,
      { temperature: 0.5 }
    );

    return this.parseJsonResponse<Plan>(response, {
      steps: [
        { id: 'step-1', title: `Execute ${input.agent} task`, detail: input.goal },
      ],
      rationale: 'Default plan generated due to parsing error',
    });
  }

  /**
   * Generate work artifact - uses AI_MODEL_DEFAULT
   */
  async generateWorkArtifact(input: WorkerInput): Promise<WorkerResult> {
    const systemPrompt = `You are an AI code and content generation assistant for the AKIS platform.
Generate high-quality output based on the given task.
Be concise, accurate, and follow best practices.`;

    const userPrompt = `Task: ${input.task}
${input.context ? `Context: ${JSON.stringify(input.context)}` : ''}
${input.previousSteps?.length ? `Previous steps completed: ${input.previousSteps.join(', ')}` : ''}

Generate the requested content.`;

    const response = await this.chatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      this.config.modelDefault,
      { temperature: 0.7, maxTokens: 4096 }
    );

    return {
      content: response,
      metadata: {
        model: this.config.modelDefault,
        task: input.task,
      },
    };
  }

  /**
   * Reflect on artifact - uses AI_MODEL_DEFAULT
   */
  async reflectOnArtifact(input: ReflectionInput): Promise<Critique> {
    const systemPrompt = `You are an AI code review and quality assessment assistant for the AKIS platform.
Analyze the given artifact and provide constructive feedback.
Always respond with valid JSON in this exact format:
{
  "issues": ["List of identified issues or problems"],
  "recommendations": ["List of specific recommendations for improvement"],
  "severity": "low" | "medium" | "high"
}`;

    let checkResultsSummary = '';
    if (input.checkResults) {
      const checks = [];
      if (input.checkResults.typecheck) {
        checks.push(`TypeCheck: ${input.checkResults.typecheck.passed ? 'PASSED' : 'FAILED'}`);
        if (input.checkResults.typecheck.errors?.length) {
          checks.push(`  Errors: ${input.checkResults.typecheck.errors.slice(0, 3).join('; ')}`);
        }
      }
      if (input.checkResults.lint) {
        checks.push(`Lint: ${input.checkResults.lint.passed ? 'PASSED' : 'FAILED'}`);
      }
      if (input.checkResults.test) {
        checks.push(`Tests: ${input.checkResults.test.passed ? 'PASSED' : 'FAILED'}`);
      }
      if (input.checkResults.build) {
        checks.push(`Build: ${input.checkResults.build.passed ? 'PASSED' : 'FAILED'}`);
      }
      if (checks.length > 0) {
        checkResultsSummary = `\n\nStatic Check Results:\n${checks.join('\n')}`;
      }
    }

    const artifactStr = typeof input.artifact === 'string' 
      ? input.artifact 
      : JSON.stringify(input.artifact, null, 2);

    const userPrompt = `Review the following artifact and provide feedback:

${artifactStr.substring(0, 8000)}${artifactStr.length > 8000 ? '\n... (truncated)' : ''}
${input.context ? `\nContext: ${JSON.stringify(input.context)}` : ''}${checkResultsSummary}

Respond ONLY with the JSON critique, no additional text.`;

    const response = await this.chatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      this.config.modelDefault,
      { temperature: 0.3 }
    );

    return this.parseJsonResponse<Critique>(response, {
      issues: ['Unable to parse AI response'],
      recommendations: ['Please review the artifact manually'],
      severity: 'medium',
    });
  }

  /**
   * Validate with strong model - uses AI_MODEL_VALIDATION
   */
  async validateWithStrongModel(input: ValidationInput): Promise<ValidationResult> {
    const systemPrompt = `You are an expert AI validator for the AKIS platform.
Your job is to perform final quality validation before marking a job as complete.
Be thorough and critical. Only pass artifacts that meet high quality standards.
Always respond with valid JSON in this exact format:
{
  "passed": true | false,
  "confidence": 0.0 to 1.0,
  "issues": ["List of any issues found"],
  "suggestions": ["List of improvement suggestions"],
  "summary": "Brief summary of validation result"
}`;

    const artifactStr = typeof input.artifact === 'string'
      ? input.artifact
      : JSON.stringify(input.artifact, null, 2);

    const contextParts: string[] = [];
    
    if (input.plan) {
      contextParts.push(`Plan: ${input.plan.steps.map(s => s.title).join(' -> ')}`);
    }
    
    if (input.reflection) {
      contextParts.push(`Prior Reflection Issues: ${input.reflection.issues.join('; ')}`);
    }

    if (input.checkResults) {
      const checkSummary = Object.entries(input.checkResults)
        .map(([key, val]) => `${key}: ${val?.passed ? 'PASSED' : 'FAILED'}`)
        .join(', ');
      contextParts.push(`Check Results: ${checkSummary}`);
    }

    const userPrompt = `Perform final validation on the following artifact:

${artifactStr.substring(0, 10000)}${artifactStr.length > 10000 ? '\n... (truncated)' : ''}

${contextParts.length > 0 ? `Additional Context:\n${contextParts.join('\n')}` : ''}

Respond ONLY with the JSON validation result, no additional text.`;

    const response = await this.chatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      this.config.modelValidation,
      { temperature: 0.2 }
    );

    return this.parseJsonResponse<ValidationResult>(response, {
      passed: false,
      confidence: 0,
      issues: ['Unable to parse validation response'],
      suggestions: ['Please validate manually'],
      summary: 'Validation parsing failed',
    });
  }
}

// =============================================================================
// Mock Implementation (for testing and development without API keys)
// =============================================================================

/**
 * Mock AI Service - deterministic responses for testing
 */
class MockAIService implements AIService {
  public planner: Planner;
  public reflector: Reflector;

  constructor() {
    this.planner = {
      plan: (input: PlanInput) => this.planTask(input),
    };

    this.reflector = {
      critique: (input: { artifact: unknown; context?: unknown; checkResults?: ReflectionInput['checkResults'] }) =>
        this.reflectOnArtifact({ artifact: input.artifact, context: input.context, checkResults: input.checkResults }),
    };
  }

  getConfigSummary() {
    return {
      provider: 'mock',
      models: {
        default: 'mock-model',
        planner: 'mock-model',
        validation: 'mock-model',
      },
    };
  }

  async planTask(input: PlanInput): Promise<Plan> {
    // Deterministic mock plan based on agent type
    return {
      steps: [
      { id: 'step-1', title: `Analyze ${input.agent} requirements`, detail: `Goal: ${input.goal}` },
      { id: 'step-2', title: 'Design solution architecture', detail: 'Mock design phase' },
      { id: 'step-3', title: 'Execute implementation', detail: 'Mock execution phase' },
      { id: 'step-4', title: 'Validate output', detail: 'Mock validation phase' },
      ],
      rationale: `Mock plan for ${input.agent} agent to achieve: ${input.goal}`,
    };
  }

  async generateWorkArtifact(input: WorkerInput): Promise<WorkerResult> {
    return {
      content: `Mock generated content for task: ${input.task}`,
      metadata: {
        model: 'mock-model',
        task: input.task,
        mock: true,
      },
    };
  }

  async reflectOnArtifact(_input: ReflectionInput): Promise<Critique> {
    return {
      issues: [
        'Mock issue: Ensure all steps are executable',
        'Mock issue: Validate artifact completeness',
      ],
      recommendations: [
        'Mock recommendation: Add error handling',
        'Mock recommendation: Include validation checks',
      ],
      severity: 'low',
    };
  }

  async validateWithStrongModel(_input: ValidationInput): Promise<ValidationResult> {
    return {
      passed: true,
      confidence: 0.85,
      issues: [],
      suggestions: ['Mock suggestion: Consider adding more tests'],
      summary: 'Mock validation passed with high confidence',
    };
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create AIService instance based on configuration
 * Uses getAIConfig() to resolve environment variables with legacy fallbacks
 */
export function createAIService(config?: AIConfig): AIService {
  // If no config provided, get from environment
  const resolvedConfig = config || getAIConfig(getEnv());

  if (resolvedConfig.provider === 'mock') {
    console.log('[AIService] Using mock provider (no real AI calls)');
        return new MockAIService();
      }

  if (!resolvedConfig.apiKey) {
    console.warn(
      `[AIService] No API key found for provider "${resolvedConfig.provider}", falling back to mock`
    );
      return new MockAIService();
  }

  console.log(`[AIService] Using ${resolvedConfig.provider} provider`);
  console.log(`[AIService] Models: default=${resolvedConfig.modelDefault}, planner=${resolvedConfig.modelPlanner}, validation=${resolvedConfig.modelValidation}`);
  
  return new RealAIService(resolvedConfig);
}

// Note: Planner and Reflector interfaces are already exported above
