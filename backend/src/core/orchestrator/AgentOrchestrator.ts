import { AgentFactory, type AgentDependencies } from '../agents/AgentFactory.js';
import { AgentStateMachine } from '../state/AgentStateMachine.js';
import type { IAgent } from '../agents/IAgent.js';
import { db } from '../../db/client.js';
import { jobs, type NewJob } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

/**
 * AgentOrchestrator - Central coordinator for agent workflows
 * Sole owner of lifecycle/FSM management
 * Agents never call each other; all coordination goes through orchestrator
 */
export class AgentOrchestrator {
  private stateMachines: Map<string, AgentStateMachine> = new Map();
  private tools: AgentDependencies;

  constructor(tools: AgentDependencies = {}) {
    this.tools = tools;
  }

  /**
   * Submit a new job (creates job row with pending state)
   * @param input - Job input (type, payload)
   * @returns Job ID
   */
  async submitJob(input: { type: string; payload?: unknown }): Promise<string> {
    // Validate input type against registered agents
    const registeredTypes = AgentFactory.listTypes();
    if (!registeredTypes.includes(input.type)) {
      throw new Error(
        `Agent type "${input.type}" is not registered. Available types: ${registeredTypes.join(', ')}`
      );
    }

    const jobId = randomUUID();
    const newJob: NewJob = {
      id: jobId,
      type: input.type,
      state: 'pending',
      payload: input.payload || null,
      result: null,
      error: null,
    };

    // Write to database
    await db.insert(jobs).values(newJob);

    const stateMachine = new AgentStateMachine('pending');
    this.stateMachines.set(jobId, stateMachine);

    return jobId;
  }

  /**
   * Start a job (transition to running state)
   * Loads state from DB if not in memory, then executes agent
   * @param jobId - Job ID
   */
  async startJob(jobId: string): Promise<void> {
    // Load job from DB if not in memory
    let stateMachine = this.stateMachines.get(jobId);
    if (!stateMachine) {
      const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }
      stateMachine = new AgentStateMachine(job.state as 'pending' | 'running' | 'completed' | 'failed');
      this.stateMachines.set(jobId, stateMachine);
    }

    // Assert current state is pending
    if (stateMachine.getState() !== 'pending') {
      throw new Error(`Cannot start job ${jobId}: current state is ${stateMachine.getState()}, expected pending`);
    }

    // Transition to running
    stateMachine.start();

    // Update database
    await db.update(jobs).set({ state: 'running', updatedAt: new Date() }).where(eq(jobs.id, jobId));

    // Execute agent (stub: returns {ok: true})
    try {
      const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      const agent = AgentFactory.create(job.type, this.tools);
      // TODO: Plan phase (for complex agents)
      // if (agent.plan) {
      //   executionContext = await agent.plan(job.payload);
      // }

      // Execute agent (stub implementation)
      const result = await agent.execute(job.payload || {});

      // Auto-complete on success
      await this.completeJob(jobId, result);
    } catch (error) {
      // Auto-fail on error
      await this.failJob(jobId, error);
      throw error;
    }
  }

  /**
   * Complete a job (transition to completed state)
   * @param jobId - Job ID
   * @param result - Execution result
   */
  async completeJob(jobId: string, result: unknown): Promise<void> {
    // Load state machine from DB if not in memory
    let stateMachine = this.stateMachines.get(jobId);
    if (!stateMachine) {
      const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }
      stateMachine = new AgentStateMachine(job.state as 'pending' | 'running' | 'completed' | 'failed');
      this.stateMachines.set(jobId, stateMachine);
    }

    // Assert current state is running
    if (stateMachine.getState() !== 'running') {
      throw new Error(`Cannot complete job ${jobId}: current state is ${stateMachine.getState()}, expected running`);
    }

    // Transition to completed
    stateMachine.complete();

    // Update database with result
    await db
      .update(jobs)
      .set({
        state: 'completed',
        result: result as Record<string, unknown>,
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, jobId));
  }

  /**
   * Fail a job (transition to failed state)
   * @param jobId - Job ID
   * @param error - Error information
   */
  async failJob(jobId: string, error: unknown): Promise<void> {
    // Load state machine from DB if not in memory
    let stateMachine = this.stateMachines.get(jobId);
    if (!stateMachine) {
      const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }
      stateMachine = new AgentStateMachine(job.state as 'pending' | 'running' | 'completed' | 'failed');
      this.stateMachines.set(jobId, stateMachine);
    }

    // Fail is valid from pending or running
    const currentState = stateMachine.getState();
    if (currentState !== 'pending' && currentState !== 'running') {
      throw new Error(`Cannot fail job ${jobId}: current state is ${currentState}, expected pending or running`);
    }

    // Transition to failed
    stateMachine.fail();

    // Stringify error for storage
    const errorMessage = error instanceof Error ? error.message : String(error);
    const truncatedError = errorMessage.length > 1000 ? errorMessage.substring(0, 997) + '...' : errorMessage;

    // Update database with error
    await db
      .update(jobs)
      .set({
        state: 'failed',
        error: truncatedError,
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, jobId));
  }

  /**
   * Execute an agent by type with given context
   * @param agentType - Type of agent to execute
   * @param context - Task context
   * @returns Execution result
   */
  async executeAgent(agentType: string, context: unknown): Promise<unknown> {
    const agent = AgentFactory.create(agentType, this.tools);
    const stateMachine = new AgentStateMachine('pending');
    const executionId = this.generateExecutionId();

    this.stateMachines.set(executionId, stateMachine);

    try {
      stateMachine.start();

      // Optional: Plan phase (for complex agents)
      let executionContext = context;
      if (agent.plan) {
        executionContext = await agent.plan(context);
      }

      // Execute agent
      const output = await agent.execute(executionContext);

      // Optional: Reflect phase (for complex agents)
      let finalOutput = output;
      if (agent.reflect) {
        finalOutput = await agent.reflect(output, executionContext);
      }

      stateMachine.complete();
      return finalOutput;
    } catch (error) {
      stateMachine.fail();
      throw error;
    } finally {
      // Cleanup after terminal state
      if (stateMachine.isTerminal()) {
        this.stateMachines.delete(executionId);
      }
    }
  }

  /**
   * Get state of an execution
   */
  getExecutionState(executionId: string): string | null {
    const stateMachine = this.stateMachines.get(executionId);
    return stateMachine?.getState() || null;
  }

  /**
   * Generate unique execution ID
   */
  private generateExecutionId(): string {
    return randomUUID();
  }
}

