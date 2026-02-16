/**
 * AgentPlaybook - Strategy/Command pattern for sequencing agent steps
 * Phase 5.C: Extended with planning/reflection flags
 * Defines the sequence of actions an agent should follow
 */

export type PlaybookStep = {
  name: string;
  action: () => Promise<unknown>;
  retryable?: boolean;
};

export class AgentPlaybook {
  private steps: PlaybookStep[] = [];
  private readonly defaultRetryAttempts = 1;
  /**
   * Whether this agent requires planning phase before execution
   * Default: false
   */
  requiresPlanning: boolean = false;

  /**
   * Whether this agent requires reflection phase after execution
   * Default: false
   */
  requiresReflection: boolean = false;

  /**
   * Add a step to the playbook
   */
  addStep(step: PlaybookStep): void {
    this.steps.push(step);
  }

  /**
   * Execute all steps in sequence
   * Returns results of each step
   */
  async execute(): Promise<unknown[]> {
    const results: unknown[] = [];

    for (const step of this.steps) {
      const maxRetries = step.retryable ? this.defaultRetryAttempts : 0;
      let attempt = 0;

      while (true) {
        try {
          const result = await step.action();
          results.push(result);
          break;
        } catch (error) {
          if (attempt >= maxRetries) {
            throw error;
          }
          attempt += 1;
        }
      }
    }

    return results;
  }

  /**
   * Get all steps
   */
  getSteps(): PlaybookStep[] {
    return [...this.steps];
  }

  /**
   * Clear all steps
   */
  clear(): void {
    this.steps = [];
  }
}
