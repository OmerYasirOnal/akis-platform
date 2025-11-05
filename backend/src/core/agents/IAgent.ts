/**
 * IAgent - Core interface for all agents
 * Agents never call each other directly; orchestration is handled by AgentOrchestrator
 */
export interface IAgent {
  /**
   * Unique identifier for this agent type
   */
  readonly type: string;

  /**
   * Execute the agent's primary task
   * @param context - Task-specific context provided by orchestrator
   */
  execute(context: unknown): Promise<unknown>;

  /**
   * Optional: Plan the execution steps (for complex agents)
   */
  plan?(context: unknown): Promise<unknown>;

  /**
   * Optional: Reflect on execution results (for complex agents)
   */
  reflect?(output: unknown, context: unknown): Promise<unknown>;
}

