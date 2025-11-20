import { AgentFactory, type AgentDependencies } from '../agents/AgentFactory.js';
import { AgentStateMachine } from '../state/AgentStateMachine.js';
import { db } from '../../db/client.js';
import { jobs, jobPlans, jobAudits, type NewJob, type NewJobPlan, type NewJobAudit } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { JobNotFoundError, InvalidStateTransitionError, DatabaseError } from '../errors.js';
import type { AIService } from '../../services/ai/AIService.js';
import type { Plan } from '../../services/ai/AIService.js';
import type { MCPTools } from '../../services/mcp/adapters/index.js';
import { getEnv } from '../../config/env.js';
import { GitHubMCPService } from '../../services/mcp/adapters/GitHubMCPService.js';

/**
 * AgentOrchestrator - Central coordinator for agent workflows
 * Phase 5.D: Extended with Planner→Execute→Reflector pipeline with DI
 * Sole owner of lifecycle/FSM management
 * Agents never call each other; all coordination goes through orchestrator
 */
export class AgentOrchestrator {
  private stateMachines: Map<string, AgentStateMachine> = new Map();
  private tools: AgentDependencies;
  private aiService?: AIService;
  private mcpTools?: MCPTools;

  constructor(tools: AgentDependencies = {}, aiService?: AIService, mcpTools?: MCPTools) {
    this.tools = tools;
    this.aiService = aiService;
    this.mcpTools = mcpTools;
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
      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(`Failed to create job: ${errorMsg}`, error);
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
    } catch (_error) {
      throw new InvalidStateTransitionError(jobId, currentState, 'start');
    }

    // Update database
    try {
      await db.update(jobs).set({ state: 'running', updatedAt: new Date() }).where(eq(jobs.id, jobId));
    } catch (error) {
      throw new DatabaseError(`Failed to update job state: ${error instanceof Error ? error.message : String(error)}`, error);
    }

    // Execute agent with Planner→Execute→Reflector pipeline
    try {
      if (!job) {
        const result = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
        if (!result.length) {
          throw new JobNotFoundError(jobId);
        }
        job = result[0];
      }

      // Prepare dependencies (DI)
      const env = getEnv();
      const resolvedTools: AgentDependencies = { 
        ...this.tools,
        tools: {
          ...(this.tools.tools || {}),
          aiService: this.aiService, // Inject AIService
        }
      };
      
      // Ensure GitHubMCPService is available (MVP: Use global token/URL)
      if (!resolvedTools.tools?.githubMCP && env.GITHUB_MCP_BASE_URL) {
        // In a real app, we'd resolve the token based on job.payload.owner/repo
        const token = env.GITHUB_TOKEN || ''; 
        resolvedTools.tools!.githubMCP = new GitHubMCPService({
          baseUrl: env.GITHUB_MCP_BASE_URL,
          token: token
        });
      }

      const agent = AgentFactory.create(job.type, resolvedTools);
      const playbook = agent.getPlaybook();
      const context = job.payload || {};

      // Phase 5.D: Planning phase (if required)
      let plan: Plan | undefined;
      if (playbook.requiresPlanning && this.aiService) {
        try {
          // Call agent's plan method
          if (agent.plan) {
            plan = await agent.plan(this.aiService.planner, context);

            // Persist plan to DB
            const newPlan: NewJobPlan = {
              jobId,
              steps: plan.steps as unknown as Record<string, unknown>,
              rationale: plan.rationale || null,
            };
            await db.insert(jobPlans).values(newPlan);

            // Audit: log plan phase
            const planAudit: NewJobAudit = {
              jobId,
              phase: 'plan',
              payload: plan as unknown as Record<string, unknown>,
            };
            await db.insert(jobAudits).values(planAudit);
          }
        } catch (planError) {
          // If planning fails, log but continue (unless critical)
          console.error(`Planning failed for job ${jobId}:`, planError);
          // For now, continue without plan
        }
      }

      // Phase 5.D: Execution phase
      let executionResult: unknown;
      if (agent.executeWithTools && this.mcpTools) {
        // Use executeWithTools if available (preferred for complex agents)
        executionResult = await agent.executeWithTools(this.mcpTools, plan, context);
      } else {
        // Fallback to regular execute
        executionResult = await agent.execute(context);
      }

      // Audit: log execute phase
      try {
        const executeAudit: NewJobAudit = {
          jobId,
          phase: 'execute',
          payload: executionResult as unknown as Record<string, unknown>,
        };
        await db.insert(jobAudits).values(executeAudit);
      } catch (auditError) {
        // Don't fail job if audit write fails
        console.error(`Failed to write execute audit for job ${jobId}:`, auditError);
      }

      // Phase 5.D: Reflection phase (if required)
      let finalResult = executionResult;
      if (playbook.requiresReflection && this.aiService && agent.reflect) {
        try {
          const critique = await agent.reflect(this.aiService.reflector, executionResult);

          // Persist critique/audit to DB
          const reflectAudit: NewJobAudit = {
            jobId,
            phase: 'reflect',
            payload: critique as unknown as Record<string, unknown>,
          };
          await db.insert(jobAudits).values(reflectAudit);

          // Append critique to result (optional)
          finalResult = {
            ...(executionResult && typeof executionResult === 'object' ? executionResult : { result: executionResult }),
            critique,
          };
        } catch (reflectError) {
          // If reflection fails, log but don't fail job
          console.error(`Reflection failed for job ${jobId}:`, reflectError);
          // Continue with execution result
        }
      }

      // Auto-complete on success
      await this.completeJob(jobId, finalResult);
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
    } catch (_error) {
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
    } catch (_err) {
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
    // Prepare dependencies (DI) similar to startJob
    const env = getEnv();
    const resolvedTools: AgentDependencies = { 
      ...this.tools,
      tools: {
        ...(this.tools.tools || {}),
        aiService: this.aiService,
      }
    };
    
    if (!resolvedTools.tools?.githubMCP && env.GITHUB_MCP_BASE_URL) {
      const token = env.GITHUB_TOKEN || ''; 
      resolvedTools.tools!.githubMCP = new GitHubMCPService({
        baseUrl: env.GITHUB_MCP_BASE_URL,
        token: token
      });
    }

    const agent = AgentFactory.create(agentType, resolvedTools);
    const stateMachine = new AgentStateMachine('pending');
    const executionId = this.generateExecutionId();

    this.stateMachines.set(executionId, stateMachine);

    try {
      stateMachine.start();

      // Optional: Plan phase (for complex agents)
      let executionContext = context;
      if (agent.plan && this.aiService) {
        const plan = await agent.plan(this.aiService.planner, context);
        executionContext = plan;
      }

      // Execute agent
      const output = await agent.execute(executionContext);

      // Optional: Reflect phase (for complex agents)
      let finalOutput = output;
      if (agent.reflect && this.aiService) {
        const critique = await agent.reflect(this.aiService.reflector, output);
        finalOutput = { ...(output && typeof output === 'object' ? output : { result: output }), critique };
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
