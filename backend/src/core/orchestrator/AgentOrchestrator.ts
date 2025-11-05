import { AgentFactory, type AgentDependencies } from '../agents/AgentFactory.js';
import { AgentStateMachine } from '../state/AgentStateMachine.js';
import type { IAgent } from '../agents/IAgent.js';
import { db } from '../../db/client.js';
import { jobs, type NewJob } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { JobNotFoundError, InvalidStateTransitionError, DatabaseError } from '../errors.js';

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
   * @throws DatabaseError if DB write fails
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

    // Write to database (wrap DB errors)
    try {
      await db.insert(jobs).values(newJob);
    } catch (error) {
      throw new DatabaseError(`Failed to create job: ${error instanceof Error ? error.message : String(error)}`, error);
    }

    const stateMachine = new AgentStateMachine('pending');
    this.stateMachines.set(jobId, stateMachine);

    return jobId;
  }

  /**
   * Start a job (transition to running state)
   * Loads state from DB if not in memory, then executes agent
   * @param jobId - Job ID
   * @throws JobNotFoundError if job doesn't exist
   * @throws InvalidStateTransitionError if state transition is invalid
   * @throws DatabaseError if DB operations fail
   */
  async startJob(jobId: string): Promise<void> {
    // Load job from DB if not in memory
    let stateMachine = this.stateMachines.get(jobId);
    let job;
    if (!stateMachine) {
      try {
        const result = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
        if (!result.length) {
          throw new JobNotFoundError(jobId);
        }
        job = result[0];
        stateMachine = new AgentStateMachine(job.state as 'pending' | 'running' | 'completed' | 'failed');
        this.stateMachines.set(jobId, stateMachine);
      } catch (error) {
        if (error instanceof JobNotFoundError) {
          throw error;
        }
        throw new DatabaseError(`Failed to load job: ${error instanceof Error ? error.message : String(error)}`, error);
      }
    }

    // Assert current state is pending
    const currentState = stateMachine.getState();
    if (currentState !== 'pending') {
      throw new InvalidStateTransitionError(jobId, currentState, 'start');
    }

    // Transition to running (FSM validates internally)
    try {
      stateMachine.start();
    } catch (error) {
      throw new InvalidStateTransitionError(jobId, currentState, 'start');
    }

    // Update database
    try {
      await db.update(jobs).set({ state: 'running', updatedAt: new Date() }).where(eq(jobs.id, jobId));
    } catch (error) {
      throw new DatabaseError(`Failed to update job state: ${error instanceof Error ? error.message : String(error)}`, error);
    }

    // Execute agent (stub: returns {ok: true})
    try {
      if (!job) {
        const result = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
        if (!result.length) {
          throw new JobNotFoundError(jobId);
        }
        job = result[0];
      }

      const agent = AgentFactory.create(job.type, this.tools);
      // TODO: Plan phase (for complex agents)
      // if (agent.plan) {
      //   executionContext = await agent.plan(job.payload);
      // }

      // Execute agent (stub implementation - deterministic)
      const result = await agent.execute(job.payload || {});

      // Auto-complete on success
      await this.completeJob(jobId, result);
    } catch (error) {
      // Auto-fail on error (failJob handles its own errors)
      try {
        await this.failJob(jobId, error);
      } catch (failError) {
        // If failJob itself fails, log but don't mask original error
        console.error(`Failed to mark job ${jobId} as failed:`, failError);
      }
      throw error;
    }
  }

  /**
   * Complete a job (transition to completed state)
   * @param jobId - Job ID
   * @param result - Execution result
   * @throws JobNotFoundError if job doesn't exist
   * @throws InvalidStateTransitionError if state transition is invalid
   * @throws DatabaseError if DB operations fail
   */
  async completeJob(jobId: string, result: unknown): Promise<void> {
    // Load state machine from DB if not in memory
    let stateMachine = this.stateMachines.get(jobId);
    if (!stateMachine) {
      try {
        const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
        if (!job) {
          throw new JobNotFoundError(jobId);
        }
        stateMachine = new AgentStateMachine(job.state as 'pending' | 'running' | 'completed' | 'failed');
        this.stateMachines.set(jobId, stateMachine);
      } catch (error) {
        if (error instanceof JobNotFoundError) {
          throw error;
        }
        throw new DatabaseError(`Failed to load job: ${error instanceof Error ? error.message : String(error)}`, error);
      }
    }

    // Assert current state is running
    const currentState = stateMachine.getState();
    if (currentState !== 'running') {
      throw new InvalidStateTransitionError(jobId, currentState, 'complete');
    }

    // Transition to completed (FSM validates internally)
    try {
      stateMachine.complete();
    } catch (error) {
      throw new InvalidStateTransitionError(jobId, currentState, 'complete');
    }

    // Update database with result
    try {
      await db
        .update(jobs)
        .set({
          state: 'completed',
          result: result as Record<string, unknown>,
          updatedAt: new Date(),
        })
        .where(eq(jobs.id, jobId));
    } catch (error) {
      throw new DatabaseError(`Failed to update job: ${error instanceof Error ? error.message : String(error)}`, error);
    }
  }

  /**
   * Fail a job (transition to failed state)
   * @param jobId - Job ID
   * @param error - Error information
   * @throws JobNotFoundError if job doesn't exist
   * @throws InvalidStateTransitionError if state transition is invalid
   * @throws DatabaseError if DB operations fail
   */
  async failJob(jobId: string, error: unknown): Promise<void> {
    // Load state machine from DB if not in memory
    let stateMachine = this.stateMachines.get(jobId);
    if (!stateMachine) {
      try {
        const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
        if (!job) {
          throw new JobNotFoundError(jobId);
        }
        stateMachine = new AgentStateMachine(job.state as 'pending' | 'running' | 'completed' | 'failed');
        this.stateMachines.set(jobId, stateMachine);
      } catch (err) {
        if (err instanceof JobNotFoundError) {
          throw err;
        }
        throw new DatabaseError(`Failed to load job: ${err instanceof Error ? err.message : String(err)}`, err);
      }
    }

    // Fail is valid from pending or running
    const currentState = stateMachine.getState();
    if (currentState !== 'pending' && currentState !== 'running') {
      throw new InvalidStateTransitionError(jobId, currentState, 'fail');
    }

    // Transition to failed (FSM validates internally)
    try {
      stateMachine.fail();
    } catch (err) {
      throw new InvalidStateTransitionError(jobId, currentState, 'fail');
    }

    // Stringify error for storage
    const errorMessage = error instanceof Error ? error.message : String(error);
    const truncatedError = errorMessage.length > 1000 ? errorMessage.substring(0, 997) + '...' : errorMessage;

    // Update database with error
    try {
      await db
        .update(jobs)
        .set({
          state: 'failed',
          error: truncatedError,
          updatedAt: new Date(),
        })
        .where(eq(jobs.id, jobId));
    } catch (err) {
      throw new DatabaseError(`Failed to update job: ${err instanceof Error ? err.message : String(err)}`, err);
    }
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

