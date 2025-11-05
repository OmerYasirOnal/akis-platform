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
    // TODO: Validate input type against registered agents
    const jobId = randomUUID();
    const newJob: NewJob = {
      id: jobId,
      type: input.type,
      state: 'pending',
      payload: input.payload || null,
    };

    // TODO: Write to database
    // await db.insert(jobs).values(newJob);

    const stateMachine = new AgentStateMachine('pending');
    this.stateMachines.set(jobId, stateMachine);

    return jobId;
  }

  /**
   * Start a job (transition to running state)
   * @param jobId - Job ID
   */
  async startJob(jobId: string): Promise<void> {
    const stateMachine = this.stateMachines.get(jobId);
    if (!stateMachine) {
      throw new Error(`Job ${jobId} not found`);
    }

    stateMachine.start();

    // TODO: Update database
    // await db.update(jobs).set({ state: 'running', updatedAt: new Date() }).where(eq(jobs.id, jobId));
  }

  /**
   * Complete a job (transition to completed state)
   * @param jobId - Job ID
   * @param result - Execution result
   */
  async completeJob(jobId: string, result: unknown): Promise<void> {
    const stateMachine = this.stateMachines.get(jobId);
    if (!stateMachine) {
      throw new Error(`Job ${jobId} not found`);
    }

    stateMachine.complete();

    // TODO: Update database with result
    // await db.update(jobs).set({ state: 'completed', updatedAt: new Date() }).where(eq(jobs.id, jobId));
  }

  /**
   * Fail a job (transition to failed state)
   * @param jobId - Job ID
   * @param error - Error information
   */
  async failJob(jobId: string, error: unknown): Promise<void> {
    const stateMachine = this.stateMachines.get(jobId);
    if (!stateMachine) {
      throw new Error(`Job ${jobId} not found`);
    }

    stateMachine.fail();

    // TODO: Update database with error
    // await db.update(jobs).set({ state: 'failed', updatedAt: new Date() }).where(eq(jobs.id, jobId));
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

