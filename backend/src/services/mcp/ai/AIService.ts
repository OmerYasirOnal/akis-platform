import { AsyncLocalStorage } from 'async_hooks';
import { HttpClient } from '../../http/HttpClient.js';
import {
  ModelRouter,
  ModelDescriptor,
  ModelPlan,
  AgentType,
  buildDefaultModelRouter,
} from './ModelRouter.js';

export interface Planner {
  plan(input: { agent: AgentType; goal: string; context?: unknown; modelId?: string }): Promise<{
    steps: Array<{ id: string; title: string; detail?: string }>;
    rationale?: string;
    model: ModelDescriptor;
  }>;
}

export interface Reflector {
  critique(input: {
    agent: AgentType;
    artifact: unknown;
    modelId?: string;
    context?: unknown;
  }): Promise<{
    issues: string[];
    recommendations: string[];
    model: ModelDescriptor;
  }>;
}

export interface CompletionRequest {
  agent: AgentType;
  prompt: string;
  modelId?: string;
  plan?: ModelPlan;
  metadata?: CompletionMetadata;
}

export interface CompletionResult {
  output: string;
  model: ModelDescriptor;
  inputTokens?: number;
  outputTokens?: number;
  meta?: {
    fallbacks?: FallbackRecord[];
  };
}

export interface AIServiceOptions {
  apiKey?: string;
  baseUrl?: string;
  router?: ModelRouter;
  fallbackModelId?: string;
  mock?: boolean;
  appMetadata?: {
    referer?: string;
    title?: string;
  };
}

export interface CompletionMetadata {
  runId?: string;
  tokenEstimate?: number;
  autoChunk?: boolean;
}

export interface FallbackRecord {
  from: string;
  to: string;
  reason: string;
}

export interface FallbackEvent {
  runId: string;
  record: FallbackRecord;
}

const DEFAULT_SYSTEM_PROMPT =
  'You are AKIS Platform\'s AI assistant. Respond concisely and provide actionable steps.';

export class AIService {
  readonly planner: Planner;
  readonly reflector: Reflector;

  private readonly apiKey?: string;
  private readonly baseUrl: string;
  private readonly router: ModelRouter;
  private readonly fallbackModelId: string;
  private readonly httpClient: HttpClient;
  private readonly mock: boolean;
  private readonly appMetadata: { referer: string; title: string };
  private readonly fallbackListeners = new Set<(event: FallbackEvent) => void>();
  private readonly metadataStore = new AsyncLocalStorage<CompletionMetadata>();

  constructor(options: AIServiceOptions = {}) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? 'https://openrouter.ai/api/v1';
    this.router = options.router ?? buildDefaultModelRouter();
    this.fallbackModelId = options.fallbackModelId ?? 'mistralai/mistral-nemo:free';
    this.httpClient = new HttpClient({ timeout: 60000, retries: 1 });
    const isTestEnv = process.env.NODE_ENV === 'test';
    this.mock = options.mock ?? (isTestEnv || !this.apiKey);
    this.appMetadata = {
      referer: options.appMetadata?.referer ?? 'https://akis.local',
      title: options.appMetadata?.title ?? 'AKIS Platform',
    };

    this.planner = {
      plan: async ({ agent, goal, context, modelId }) => {
        const completion = await this.generateCompletion({
          agent,
          prompt: this.buildPlanningPrompt(agent, goal, context),
          modelId,
        });

        return {
          steps: this.parsePlan(completion.output),
          rationale: completion.output.substring(0, 240),
          model: completion.model,
        };
      },
    };

    this.reflector = {
      critique: async ({ agent, artifact, modelId, context }) => {
        const completion = await this.generateCompletion({
          agent,
          prompt: this.buildCritiquePrompt(agent, artifact, context),
          modelId,
        });

        const critique = this.parseCritique(completion.output);
        return {
          ...critique,
          model: completion.model,
        };
      },
    };
  }

  getRouter(): ModelRouter {
    return this.router;
  }

  onFallback(listener: (event: FallbackEvent) => void): () => void {
    this.fallbackListeners.add(listener);
    return () => this.fallbackListeners.delete(listener);
  }

  async generateCompletion(request: CompletionRequest): Promise<CompletionResult> {
    const storeMetadata = this.metadataStore.getStore() ?? {};
    const mergedMetadata: CompletionMetadata = {
      ...storeMetadata,
      ...(request.metadata ?? {}),
    };
    const initialModel = this.router.resolve(request.agent, request.modelId);
    const chain = [initialModel.id, ...this.router.fallbackChain(initialModel.id)];
    const fallbackRecords: FallbackRecord[] = [];

    if (this.mock) {
      return {
        output: this.mockCompletion(request.agent, request.prompt),
        model: initialModel,
        inputTokens: 0,
        outputTokens: 0,
      };
    }

    for (let idx = 0; idx < chain.length; idx += 1) {
      const candidateId = chain[idx];
      const candidateModel = this.router.getById(candidateId);
      if (!candidateModel) {
        continue;
      }

      if (mergedMetadata.tokenEstimate && mergedMetadata.tokenEstimate > candidateModel.contextWindow) {
        const nextModelId = chain[idx + 1];
        if (!nextModelId) {
          throw new Error(
            `Token estimate (${mergedMetadata.tokenEstimate}) exceeds maximum context window for all allowed models.`
          );
        }
        const record: FallbackRecord = {
          from: candidateModel.id,
          to: nextModelId,
          reason: 'token_estimate_exceeds_context',
        };
        fallbackRecords.push(record);
        this.emitFallback(mergedMetadata.runId, record);
        continue;
      }

      try {
        const response = await this.httpClient.send(
          `${this.baseUrl}/chat/completions`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'HTTP-Referer': this.appMetadata.referer,
              'X-Title': this.appMetadata.title,
            },
            body: JSON.stringify({
              model: candidateModel.id,
              stream: false,
              messages: [
                {
                  role: 'system',
                  content: DEFAULT_SYSTEM_PROMPT,
                },
                {
                  role: 'user',
                  content: request.prompt,
                },
              ],
            }),
          },
          this.apiKey
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`OpenRouter request failed (${response.status}) ${errorText}`);
        }

        const json = (await response.json()) as {
          choices: Array<{ message: { content: string } }>;
          usage?: { prompt_tokens: number; completion_tokens: number };
          model: string;
        };

        const output = json.choices[0]?.message.content?.trim() ?? '';

        return {
          output,
          model: candidateModel,
          inputTokens: json.usage?.prompt_tokens,
          outputTokens: json.usage?.completion_tokens,
          meta: fallbackRecords.length > 0 ? { fallbacks: fallbackRecords } : undefined,
        };
      } catch (error) {
        const nextModelId = chain[idx + 1];
        if (!nextModelId) {
          throw new Error(this.sanitizeError(error));
        }
        const record: FallbackRecord = {
          from: candidateModel.id,
          to: nextModelId,
          reason: this.sanitizeError(error),
        };
        fallbackRecords.push(record);
        this.emitFallback(mergedMetadata.runId, record);
        continue;
      }
    }

    throw new Error('No suitable model available after fallback attempts.');
  }

  private buildPlanningPrompt(agent: AgentType, goal: string, context?: unknown): string {
    const ctx = context ? `\nContext:\n${JSON.stringify(context, null, 2)}` : '';
    return `Agent: ${agent.toUpperCase()}
Goal: ${goal}
${ctx}

Produce a numbered plan with 3-6 steps. Each step should include a title and a short detail string.`;
  }

  private buildCritiquePrompt(agent: AgentType, artifact: unknown, context?: unknown): string {
    const contextSection = context
      ? `Context:
${JSON.stringify(context, null, 2)}

`
      : '';
    return `Agent: ${agent.toUpperCase()}
${contextSection}Artifact to review:
${JSON.stringify(artifact, null, 2)}

Provide two sections:
1. Issues - bullet list of concrete problems.
2. Recommendations - bullet list of actionable improvements.`;
  }

  private parsePlan(raw: string): Array<{ id: string; title: string; detail?: string }> {
    const lines = raw.split('\n').map((line) => line.trim()).filter(Boolean);
    const steps = [];
    for (const line of lines) {
      const match = line.match(/^\d+[).\s-]*(.+?)(?:[-:]\s*(.+))?$/);
      if (match) {
        steps.push({
          id: `step-${steps.length + 1}`,
          title: match[1].trim(),
          detail: match[2]?.trim(),
        });
      }
    }

    if (steps.length === 0) {
      return [
        { id: 'step-1', title: 'Review requirements', detail: 'Analyse the provided goal and context.' },
        { id: 'step-2', title: 'Plan execution', detail: 'Outline the necessary actions to deliver the goal.' },
        { id: 'step-3', title: 'Produce artefact', detail: 'Generate the deliverable and validate it.' },
      ];
    }

    return steps;
  }

  private parseCritique(raw: string): { issues: string[]; recommendations: string[] } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    const lines = raw.split('\n');
    let cursor: 'issues' | 'recommendations' | null = null;

    for (const line of lines) {
      const trimmed = line.trim();
      if (/^issues?/i.test(trimmed)) {
        cursor = 'issues';
        continue;
      }
      if (/^recommendations?/i.test(trimmed)) {
        cursor = 'recommendations';
        continue;
      }
      const bullet = trimmed.replace(/^[-*•]\s*/, '');
      if (!bullet) continue;
      if (cursor === 'issues') {
        issues.push(bullet);
      } else if (cursor === 'recommendations') {
        recommendations.push(bullet);
      }
    }

    if (issues.length === 0) {
      issues.push('No critical issues detected.');
    }
    if (recommendations.length === 0) {
      recommendations.push('Proceed with the proposed solution.');
    }

    return { issues, recommendations };
  }

  private mockCompletion(agent: AgentType, prompt: string): string {
    if (prompt.includes('numbered plan')) {
      return `1. Confirm ${agent} requirements
2. Outline deterministic tasks
3. Execute and validate outputs`;
    }

    if (prompt.includes('Provide two sections')) {
      return `Issues:
- Mock observation: verify inputs

Recommendations:
- Mock recommendation: add automated validation`;
    }

    return `Mock response for ${agent}: ${prompt.substring(0, 120)}`;
  }

  private sanitizeError(error: unknown): string {
    if (error instanceof Error) {
      return error.message.replace(/\s+/g, ' ').trim().slice(0, 180);
    }
    return String(error).replace(/\s+/g, ' ').trim().slice(0, 180);
  }

  private emitFallback(runId: string | undefined, record: FallbackRecord) {
    if (!runId) {
      return;
    }
    for (const listener of this.fallbackListeners) {
      listener({ runId, record });
    }
  }

  async withRunMetadata<T>(metadata: CompletionMetadata, fn: () => Promise<T>): Promise<T> {
    return await this.metadataStore.run(metadata, fn);
  }
}


