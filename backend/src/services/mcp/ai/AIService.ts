export type AIProvider = 'openai' | 'openrouter';

export class AIService {
  constructor(private readonly provider: AIProvider = (process.env.AI_PROVIDER as AIProvider) || 'openai') {}

  async plan(prompt: string): Promise<string> {
    // Placeholder; implementation will call provider via MCP if applicable
    return `PLAN: ${prompt}`;
  }

  async reflect(input: string): Promise<string> {
    return `REFLECT: ${input}`;
  }
}


