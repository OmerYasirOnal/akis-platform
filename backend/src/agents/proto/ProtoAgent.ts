import { BaseAgent } from '../../core/agents/BaseAgent.js';

/**
 * ProtoAgent - Generates working MVP prototypes from requirements
 * Extends BaseAgent; signature only (implementation pending)
 * Complex agent: uses plan() → reflect() → execute() pattern
 */
export class ProtoAgent extends BaseAgent {
  readonly type = 'proto';

  async plan(context: unknown): Promise<unknown> {
    // TODO: Implement planning phase
    // - Analyze requirements
    // - Design architecture
    // - Create execution plan
    throw new Error('Not implemented');
  }

  async execute(context: unknown): Promise<unknown> {
    // TODO: Implement ProtoAgent logic
    // - Generate code structure
    // - Implement features
    // - Run tests
    // - Create PR via GitHubMCPService
    throw new Error('Not implemented');
  }

  async reflect(output: unknown, context: unknown): Promise<unknown> {
    // TODO: Implement reflection phase
    // - Critique generated code
    // - Validate against requirements
    // - Suggest improvements
    throw new Error('Not implemented');
  }
}

