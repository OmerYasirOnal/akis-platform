import { AgentFactory, type AgentDependencies } from '../agents/AgentFactory.js';
import { AgentStateMachine } from '../state/AgentStateMachine.js';
import { db } from '../../db/client.js';
import { jobs, jobPlans, jobAudits, oauthAccounts, type NewJob, type NewJobPlan, type NewJobAudit } from '../../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { JobNotFoundError, InvalidStateTransitionError, DatabaseError, AIProviderError, MissingAIKeyError } from '../errors.js';
import { createAIService, type AIService, type AIServiceObserver } from '../../services/ai/AIService.js';
import type { Plan, Critique } from '../../services/ai/AIService.js';
import { AICallMetricsCollector } from '../../services/ai/ai-metrics.js';
import { getDecryptedUserAiKey } from '../../services/ai/user-ai-keys.js';
import type { MCPTools } from '../../services/mcp/adapters/index.js';
import { getEnv } from '../../config/env.js';
import { GitHubMCPService, McpError, McpConnectionError } from '../../services/mcp/adapters/GitHubMCPService.js';
import { StaticCheckRunner } from '../../services/checks/index.js';
import { createTraceRecorder, type TraceRecorder } from '../tracing/TraceRecorder.js';

export const DEV_GITHUB_BOOTSTRAP_TOKEN_PLACEHOLDER = '__DEV_GITHUB_BOOTSTRAP__';

/**
 * Custom error for missing GitHub integration
 */
export class GitHubNotConnectedError extends Error {
  readonly code = 'GITHUB_NOT_CONNECTED';
  
  constructor(message: string = 'GitHub is not connected. Please connect your GitHub account first.') {
    super(message);
    this.name = 'GitHubNotConnectedError';
  }
}

/**
 * Custom error for missing dependencies
 */
export class MissingDependencyError extends Error {
  readonly code = 'MISSING_DEPENDENCY';
  readonly dependency: string;
  readonly suggestion: string;
  
  constructor(dependency: string, suggestion: string) {
    super(`Missing dependency: ${dependency}. ${suggestion}`);
    this.name = 'MissingDependencyError';
    this.dependency = dependency;
    this.suggestion = suggestion;
  }
}

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
  private checkRunner: StaticCheckRunner;

  constructor(tools: AgentDependencies = {}, aiService?: AIService, mcpTools?: MCPTools) {
    this.tools = tools;
    this.aiService = aiService;
    this.mcpTools = mcpTools;
    this.checkRunner = new StaticCheckRunner();
  }

  /**
   * Resolve GitHub OAuth token for a user
   * @param userId - User ID
   * @returns Access token or null if not connected
   */
  private async resolveGitHubToken(userId: string): Promise<string | null> {
    try {
      const githubOAuth = await db.query.oauthAccounts.findFirst({
        where: and(
          eq(oauthAccounts.userId, userId),
          eq(oauthAccounts.provider, 'github')
        ),
      });
      return githubOAuth?.accessToken || null;
    } catch (error) {
      console.error('Failed to resolve GitHub token:', error);
      return null;
    }
  }

  /**
   * Check if agent type requires GitHub integration
   */
  private agentRequiresGitHub(agentType: string, payload: Record<string, unknown>): boolean {
    // Scribe always requires GitHub for repo operations
    if (agentType === 'scribe') {
      return true;
    }
    
    // Check targetPlatform for any agent
    const targetPlatform = payload.targetPlatform as string | undefined;
    if (targetPlatform === 'github_repo' || targetPlatform === 'github_wiki') {
      return true;
    }
    
    // Check if there are repo-related fields
    if (payload.owner && payload.repo) {
      return true;
    }
    
    return false;
  }

  /**
   * Submit a new job (creates job row with pending state)
   * @param input - Job input (type, payload, requiresStrictValidation)
   * @returns Job ID
   * @throws DatabaseError if DB write fails
   */
  async submitJob(input: { 
    type: string; 
    payload?: unknown; 
    requiresStrictValidation?: boolean;
    aiProvider?: string;
    aiModel?: string;
  }): Promise<string> {
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
      aiProvider: input.aiProvider,
      aiModel: input.aiModel,
      requiresStrictValidation: input.requiresStrictValidation ?? false,
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

    // S1.1: Create TraceRecorder for explainability (outside try so it's available in catch)
    const traceRecorder: TraceRecorder = createTraceRecorder(jobId);
    let aiMetrics: AICallMetricsCollector | null = null;
    let activeAiService: AIService | undefined;

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
      const payload = (job.payload || {}) as Record<string, unknown>;
      const { aiService: jobAiService, metrics } = await this.resolveAiServiceForJob(
        job.type,
        payload,
        traceRecorder
      );
      aiMetrics = metrics;
      
      const resolvedTools: AgentDependencies = { 
        ...this.tools,
        traceRecorder, // S1.1: Inject TraceRecorder
        tools: {
          ...(this.tools.tools || {}),
          aiService: jobAiService || this.aiService, // Inject AIService
        }
      };
      
      // S0.4.6: Fail-fast validation for GitHub-dependent agents
      if (this.agentRequiresGitHub(job.type, payload)) {
        const userId = payload.userId as string | undefined;
        
        if (!userId) {
          throw new MissingDependencyError(
            'userId',
            'Job payload must include userId for GitHub-dependent operations. Ensure the job was created with a valid authenticated session.'
          );
        }
        
        // Resolve user's GitHub OAuth token
        let userGitHubToken = await this.resolveGitHubToken(userId);
        const devBootstrapEnabled = this.isDevGitHubBootstrapEnabled(job.type, payload, env);
        if (userGitHubToken === DEV_GITHUB_BOOTSTRAP_TOKEN_PLACEHOLDER) {
          userGitHubToken = null;
        }

        if (!userGitHubToken && devBootstrapEnabled) {
          userGitHubToken = this.getDevBootstrapToken(env);
          if (!userGitHubToken) {
            throw new MissingDependencyError(
              'SCRIBE_DEV_BOOTSTRAP_GITHUB_TOKEN',
              'Set SCRIBE_DEV_BOOTSTRAP_GITHUB_TOKEN (or GITHUB_TOKEN) in your .env when SCRIBE_DEV_GITHUB_BOOTSTRAP=true.'
            );
          }
          console.warn(`[DevBootstrap] Using shared GitHub token for dry-run job ${jobId}`);
        }
        
        if (!userGitHubToken) {
          throw new GitHubNotConnectedError(
            `GitHub is not connected for user ${userId}. Please connect your GitHub account at /dashboard/agents/scribe before running this job.`
          );
        }
        
        // Create GitHubMCPService with user's token
        if (env.GITHUB_MCP_BASE_URL) {
          resolvedTools.tools!.githubMCP = new GitHubMCPService({
            baseUrl: env.GITHUB_MCP_BASE_URL,
            token: userGitHubToken,
            correlationId: jobId,
          });
          
          // Store gateway URL for diagnostics
          try {
            await db.update(jobs).set({ mcpGatewayUrl: env.GITHUB_MCP_BASE_URL }).where(eq(jobs.id, jobId));
          } catch (error) {
            // Non-critical: log but don't fail job
            console.warn(`Failed to store MCP gateway URL for job ${jobId}:`, error);
          }
        } else {
          throw new MissingDependencyError(
            'GITHUB_MCP_BASE_URL',
            'GITHUB_MCP_BASE_URL environment variable is not configured. Please set it in your .env file.'
          );
        }
      } else if (!resolvedTools.tools?.githubMCP && env.GITHUB_MCP_BASE_URL) {
        // Fallback for non-GitHub-dependent agents (use global token if available)
        const token = env.GITHUB_TOKEN || ''; 
        resolvedTools.tools!.githubMCP = new GitHubMCPService({
          baseUrl: env.GITHUB_MCP_BASE_URL,
          token: token,
          correlationId: jobId,
        });
        
        // Store gateway URL for diagnostics
        try {
          await db.update(jobs).set({ mcpGatewayUrl: env.GITHUB_MCP_BASE_URL }).where(eq(jobs.id, jobId));
        } catch (error) {
          // Non-critical: log but don't fail job
          console.warn(`Failed to store MCP gateway URL for job ${jobId}:`, error);
        }
      }

      const agent = AgentFactory.create(job.type, resolvedTools);
      const playbook = agent.getPlaybook();
      const context = job.payload || {};

      // Phase 5.D: Planning phase (if required)
      // PR-2: Planning failures are now fatal - no more silent success
      let plan: Plan | undefined;
      activeAiService = jobAiService || this.aiService;

      if (playbook.requiresPlanning && activeAiService) {
        // Call agent's plan method
        if (agent.plan) {
          try {
            plan = await agent.plan(activeAiService.planner, context);
          } catch (planError) {
            // PR-2: Planning failure is fatal - throw immediately
            const errorMessage = planError instanceof Error ? planError.message : String(planError);
            console.error(`[AgentOrchestrator] Planning failed for job ${jobId}:`, planError);
            throw new Error(`Planning phase failed: ${errorMessage}`);
          }

          // Persist plan to DB - failure here is also fatal
          try {
            const newPlan: NewJobPlan = {
              jobId,
              steps: plan.steps as unknown as Record<string, unknown>,
              rationale: plan.rationale || null,
            };
            await db.insert(jobPlans).values(newPlan);
          } catch (dbError) {
            // PR-2: DB failure during plan persistence is fatal
            const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);
            console.error(`[AgentOrchestrator] Failed to persist plan for job ${jobId}:`, dbError);
            throw new DatabaseError(`Failed to persist plan: ${errorMessage}`, dbError);
          }

          // Audit: log plan phase
          try {
            const planAudit: NewJobAudit = {
              jobId,
              phase: 'plan',
              payload: plan as unknown as Record<string, unknown>,
            };
            await db.insert(jobAudits).values(planAudit);
          } catch (auditError) {
            // Audit failure is non-fatal but logged
            console.warn(`[AgentOrchestrator] Failed to write plan audit for job ${jobId}:`, auditError);
          }
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

      // Phase 5.D + Phase 10: Tool-Augmented Reflection phase (if required)
      let finalResult = executionResult;
      let critique: Critique | undefined;
      let reflectionCheckResults: Awaited<ReturnType<typeof this.checkRunner.runCriticalChecks>> | undefined;
      
      if (playbook.requiresReflection && activeAiService && agent.reflect) {
        try {
          // Run critical checks before reflection for tool-augmented feedback
          reflectionCheckResults = await this.checkRunner.runCriticalChecks();
          
          // Convert check results to the format expected by ReflectionInput
          const checkResultsForReflection = {
            lint: reflectionCheckResults.lint ? { 
              passed: reflectionCheckResults.lint.passed, 
              errors: reflectionCheckResults.lint.passed ? undefined : (reflectionCheckResults.lint.stderr || reflectionCheckResults.lint.stdout).split('\n').filter(Boolean),
            } : undefined,
            typecheck: reflectionCheckResults.typecheck ? { 
              passed: reflectionCheckResults.typecheck.passed, 
              errors: reflectionCheckResults.typecheck.passed ? undefined : (reflectionCheckResults.typecheck.stderr || reflectionCheckResults.typecheck.stdout).split('\n').filter(Boolean),
            } : undefined,
          };

          // Pass check results to reflection for tool-augmented feedback
          critique = await agent.reflect(activeAiService.reflector, executionResult, checkResultsForReflection);

          // Persist critique/audit to DB (including check results summary)
          const reflectAudit: NewJobAudit = {
            jobId,
            phase: 'reflect',
            payload: {
              ...critique,
              checkResults: {
                lint: { passed: reflectionCheckResults.lint?.passed },
                typecheck: { passed: reflectionCheckResults.typecheck?.passed },
              },
            } as unknown as Record<string, unknown>,
          };
          await db.insert(jobAudits).values(reflectAudit);

          // Append critique to result (optional)
          finalResult = {
            ...(executionResult && typeof executionResult === 'object' ? executionResult : { result: executionResult }),
            critique,
            reflectionChecks: {
              lint: reflectionCheckResults.lint?.passed,
              typecheck: reflectionCheckResults.typecheck?.passed,
            },
          };
        } catch (reflectError) {
          // If reflection fails, log but don't fail job
          console.error(`Reflection failed for job ${jobId}:`, reflectError);
          // Continue with execution result
        }
      }

      // Phase 10: Validation phase (if requiresStrictValidation is true)
      if (job.requiresStrictValidation && activeAiService) {
        try {
          // Run static checks (lint, typecheck) as part of validation
          const checkResults = await this.checkRunner.runCriticalChecks();
          
          // Use strong model for final validation
          const validationResult = await activeAiService.validateWithStrongModel({
            artifact: finalResult,
            plan: plan,
            reflection: critique,
            checkResults: {
              lint: checkResults.lint ? { 
                passed: checkResults.lint.passed, 
                errors: checkResults.lint.passed ? undefined : (checkResults.lint.stderr || checkResults.lint.stdout).split('\n').filter(Boolean),
              } : undefined,
              typecheck: checkResults.typecheck ? { 
                passed: checkResults.typecheck.passed, 
                errors: checkResults.typecheck.passed ? undefined : (checkResults.typecheck.stderr || checkResults.typecheck.stdout).split('\n').filter(Boolean),
              } : undefined,
            },
          });

          // Persist validation audit
          const validateAudit: NewJobAudit = {
            jobId,
            phase: 'validate',
            payload: {
              validationResult,
              checkResults: {
                lint: { passed: checkResults.lint?.passed, exitCode: checkResults.lint?.exitCode },
                typecheck: { passed: checkResults.typecheck?.passed, exitCode: checkResults.typecheck?.exitCode },
              },
              allChecksPassed: checkResults.allPassed,
            } as unknown as Record<string, unknown>,
          };
          await db.insert(jobAudits).values(validateAudit);

          // If validation fails, include feedback in result
          if (!validationResult.passed) {
            finalResult = {
              ...(finalResult && typeof finalResult === 'object' ? finalResult : { result: finalResult }),
              validation: {
                passed: false,
                summary: validationResult.summary,
                issues: validationResult.issues,
                suggestions: validationResult.suggestions,
                confidence: validationResult.confidence,
                checkResults: {
                  lint: checkResults.lint?.passed,
                  typecheck: checkResults.typecheck?.passed,
                },
              },
            };
            console.warn(`Validation failed for job ${jobId}: ${validationResult.summary}`);
          } else {
            finalResult = {
              ...(finalResult && typeof finalResult === 'object' ? finalResult : { result: finalResult }),
              validation: {
                passed: true,
                summary: validationResult.summary,
                confidence: validationResult.confidence,
                checkResults: {
                  lint: checkResults.lint?.passed,
                  typecheck: checkResults.typecheck?.passed,
                },
              },
            };
          }
        } catch (validationError) {
          // If validation fails, log but don't fail job (unless critical)
          console.error(`Validation phase failed for job ${jobId}:`, validationError);
          finalResult = {
            ...(finalResult && typeof finalResult === 'object' ? finalResult : { result: finalResult }),
            validation: {
              passed: false,
              error: validationError instanceof Error ? validationError.message : String(validationError),
            },
          };
        }
      }

      // S1.1: Flush trace recorder before completing
      await traceRecorder.flush();

      if (aiMetrics) {
        const aiTotals = aiMetrics.getTotals();
        const hasAiMetrics =
          aiTotals.totalDurationMs > 0 ||
          aiTotals.totalTokens > 0 ||
          aiTotals.estimatedCostUsd !== null;

        if (hasAiMetrics) {
          await db
            .update(jobs)
            .set({
              aiTotalDurationMs: aiTotals.totalDurationMs,
              aiInputTokens: aiTotals.totalInputTokens,
              aiOutputTokens: aiTotals.totalOutputTokens,
              aiTotalTokens: aiTotals.totalTokens,
              aiEstimatedCostUsd: aiTotals.estimatedCostUsd ?? null,
            })
            .where(eq(jobs.id, jobId));
        }
      }
      
      // Auto-complete on success
      await this.completeJob(jobId, finalResult);
    } catch (error) {
      // S1.1: Record error in trace and flush before failing
      try {
        traceRecorder.recordError(
          error instanceof Error ? error.message : String(error),
          error instanceof McpConnectionError ? error.code :
          error instanceof McpError ? error.code :
          error instanceof GitHubNotConnectedError ? error.code :
          error instanceof MissingDependencyError ? error.code :
          error instanceof MissingAIKeyError ? error.code :
          undefined
        );
        await traceRecorder.flush();
      } catch (traceError) {
        // Don't fail because trace flush failed
        console.error(`Failed to flush traces for job ${jobId}:`, traceError);
      }

      if (aiMetrics) {
        try {
          const aiTotals = aiMetrics.getTotals();
          const hasAiMetrics =
            aiTotals.totalDurationMs > 0 ||
            aiTotals.totalTokens > 0 ||
            aiTotals.estimatedCostUsd !== null;

          if (hasAiMetrics) {
            await db
              .update(jobs)
              .set({
                aiTotalDurationMs: aiTotals.totalDurationMs,
                aiInputTokens: aiTotals.totalInputTokens,
                aiOutputTokens: aiTotals.totalOutputTokens,
                aiTotalTokens: aiTotals.totalTokens,
                aiEstimatedCostUsd: aiTotals.estimatedCostUsd ?? null,
              })
              .where(eq(jobs.id, jobId));
          }
        } catch (metricsError) {
          console.warn(`Failed to persist AI metrics for job ${jobId}:`, metricsError);
        }
      }
      
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

  private isDevGitHubBootstrapEnabled(agentType: string, payload: Record<string, unknown>, env: ReturnType<typeof getEnv>): boolean {
    if (env.NODE_ENV === 'production') {
      return false;
    }
    if (process.env.SCRIBE_DEV_GITHUB_BOOTSTRAP !== 'true') {
      return false;
    }
    const maybePayload = payload as { dryRun?: unknown } | undefined;
    const isDryRun = Boolean(maybePayload?.dryRun === true);
    return agentType === 'scribe' && isDryRun;
  }

  private getDevBootstrapToken(env: ReturnType<typeof getEnv>): string | null {
    return env.SCRIBE_DEV_BOOTSTRAP_GITHUB_TOKEN || env.GITHUB_TOKEN || null;
  }

  private async resolveAiServiceForJob(
    jobType: string,
    payload: Record<string, unknown>,
    traceRecorder: TraceRecorder
  ): Promise<{ aiService?: AIService; metrics: AICallMetricsCollector }> {
    const metrics = new AICallMetricsCollector();
    const observer: AIServiceObserver = {
      onAiCall: (call) => {
        metrics.record(call);
        traceRecorder.recordAiCall(call.purpose, call.success, call.durationMs, {
          provider: call.provider,
          model: call.model,
          usage: call.usage,
          estimatedCostUsd: call.estimatedCostUsd,
          errorCode: call.errorCode,
        });
      },
    };

    if (jobType !== 'scribe') {
      return { aiService: this.aiService, metrics };
    }

    const userId = payload.userId as string | undefined;
    const modelOverride = payload.llmModelOverride as string | undefined;
    if (!userId || !modelOverride) {
      return { aiService: this.aiService, metrics };
    }

    const decrypted = await getDecryptedUserAiKey(userId, 'openai');
    if (!decrypted) {
      throw new MissingAIKeyError('openai');
    }

    const env = getEnv();
    const aiConfig = {
      provider: 'openai' as const,
      apiKey: decrypted.key,
      baseUrl: env.AI_BASE_URL || env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      modelDefault: modelOverride,
      modelPlanner: modelOverride,
      modelValidation: modelOverride,
      siteUrl: env.OPENROUTER_SITE_URL,
      appName: env.OPENROUTER_APP_NAME,
    };

    const aiService = createAIService(aiConfig, observer);
    return { aiService, metrics };
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

    // Extract structured error information
    let errorCode: string | null = null;
    let errorMsg: string | null = null;
    let rawError: string;
    let mcpGatewayUrl: string | null = null;
    let rawErrorPayload: string | null = null;

    if (error instanceof AIProviderError) {
      // AI-specific error - extract structured info
      errorCode = error.code;
      errorMsg = this.getHumanReadableErrorMessage(error);
      rawError = error.message;
      // Serialize full error for diagnostics (no secrets in AIProviderError)
      rawErrorPayload = JSON.stringify({
        type: 'AIProviderError',
        code: error.code,
        message: error.message,
        name: error.name,
      });
    } else if (error instanceof McpConnectionError) {
      // MCP connection error - use stable code and include hint
      errorCode = error.code; // McpErrorCode enum value (e.g., MCP_UNREACHABLE)
      const hint = error.hint ? `\n\nHint: ${error.hint}` : '';
      const gateway = error.gatewayUrl ? ` [Gateway: ${error.gatewayUrl}]` : '';
      errorMsg = `${error.message}${hint}`;
      rawError = `${error.toUserMessage()}${gateway} (cause: ${error.cause || 'unknown'})`;
      mcpGatewayUrl = error.gatewayUrl || null;
      // Serialize full error for diagnostics (gatewayUrl is already redacted)
      rawErrorPayload = JSON.stringify({
        type: 'McpConnectionError',
        code: error.code,
        mcpCode: error.mcpCode,
        method: error.mcpMethod,
        message: error.message,
        correlationId: error.correlationId,
        gatewayUrl: error.gatewayUrl,
        cause: error.cause,
        hint: error.hint,
      });
      // Safe log (no secrets) for operators
      console.error(
        `[AgentOrchestrator] Job ${jobId} MCP connection failed [${error.correlationId}] ` +
          `code=${error.code} cause=${error.cause || 'unknown'} gateway=${error.gatewayUrl || 'unknown'}`
      );
    } else if (error instanceof McpError) {
      // MCP protocol error - use stable code if available
      errorCode = error.code || 'MCP_ERROR';
      const hint = error.hint ? `\n\nHint: ${error.hint}` : '';
      errorMsg = `${error.toUserMessage()}${hint}`;
      rawError = `${error.toUserMessage()} (method: ${error.mcpMethod})`;
      mcpGatewayUrl = error.gatewayUrl || null;
      // Serialize full error for diagnostics (gatewayUrl is already redacted)
      rawErrorPayload = JSON.stringify({
        type: 'McpError',
        code: error.code,
        mcpCode: error.mcpCode,
        method: error.mcpMethod,
        message: error.message,
        correlationId: error.correlationId,
        gatewayUrl: error.gatewayUrl,
        hint: error.hint,
        data: error.mcpData,
      });
      // Safe log (no secrets) for operators
      console.error(
        `[AgentOrchestrator] Job ${jobId} failed with MCP error [${error.correlationId}] ` +
          `code=${error.mcpCode} method=${error.mcpMethod}: ${error.message}`
      );
    } else {
      rawError = error instanceof Error ? error.message : String(error);
      // Generic error - capture basic structure
      if (error instanceof Error) {
        rawErrorPayload = JSON.stringify({
          type: error.name,
          message: error.message,
          stack: error.stack?.split('\n').slice(0, 5).join('\n'), // First 5 lines of stack only
        });
      }
    }

    const truncatedError = rawError.length > 1000 ? rawError.substring(0, 997) + '...' : rawError;
    const truncatedErrorMsg = errorMsg && errorMsg.length > 500 ? errorMsg.substring(0, 497) + '...' : errorMsg;

    // Update database with error
    try {
      await db
        .update(jobs)
        .set({
          state: 'failed',
          error: truncatedError,
          errorCode: errorCode,
          errorMessage: truncatedErrorMsg,
          rawErrorPayload: rawErrorPayload,
          mcpGatewayUrl: mcpGatewayUrl,
          updatedAt: new Date(),
        })
        .where(eq(jobs.id, jobId));
    } catch (err) {
      throw new DatabaseError(`Failed to update job: ${err instanceof Error ? err.message : String(err)}`, err);
    }
  }

  /**
   * Get human-readable error message for AI errors
   */
  private getHumanReadableErrorMessage(error: AIProviderError): string {
    switch (error.code) {
      case 'AI_RATE_LIMITED':
        return 'AI provider is temporarily rate-limited. Please try again later or configure your own API key.';
      case 'AI_AUTH_ERROR':
        return 'AI provider authentication failed. Please check your API key configuration.';
      case 'AI_PROVIDER_ERROR':
        return 'AI provider returned an error. Please try again later.';
      case 'AI_NETWORK_ERROR':
        return 'Unable to connect to AI provider. Please check your network connection.';
      case 'AI_INVALID_RESPONSE':
        return 'AI provider returned an invalid response. Please try again.';
      default:
        return 'An unexpected AI error occurred. Please try again.';
    }
  }

  /**
   * PR-1: Resume an approved job (transition from awaiting_approval to running)
   * Called after human approval to continue job execution
   * @param jobId - Job ID
   * @throws JobNotFoundError if job doesn't exist
   * @throws InvalidStateTransitionError if job is not in awaiting_approval state
   * @throws DatabaseError if DB operations fail
   */
  async resumeApprovedJob(jobId: string): Promise<void> {
    // Load job from DB
    const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
    if (!job) {
      throw new JobNotFoundError(jobId);
    }

    // Validate state is awaiting_approval
    if (job.state !== 'awaiting_approval') {
      throw new InvalidStateTransitionError(jobId, job.state, 'resume');
    }

    // Validate approval
    if (!job.approvedBy || !job.approvedAt) {
      throw new InvalidStateTransitionError(jobId, job.state, 'resume (not approved)');
    }

    // Transition to running
    try {
      await db.update(jobs).set({ 
        state: 'running', 
        updatedAt: new Date() 
      }).where(eq(jobs.id, jobId));
    } catch (error) {
      throw new DatabaseError(`Failed to update job state: ${error instanceof Error ? error.message : String(error)}`, error);
    }

    // Re-create state machine for running state
    const stateMachine = new AgentStateMachine('running');
    this.stateMachines.set(jobId, stateMachine);

    // Continue execution in background (non-blocking)
    this.continueJobExecution(jobId, job).catch(error => {
      console.error(`Failed to continue job ${jobId} after approval:`, error);
    });
  }

  /**
   * PR-1: Continue job execution after approval
   * Internal method that executes the approved plan
   */
  private async continueJobExecution(jobId: string, job: typeof jobs.$inferSelect): Promise<void> {
    const traceRecorder = createTraceRecorder(jobId);

    try {
      // Record approval and resume in trace
      traceRecorder.recordInfo(`Job resumed after approval by ${job.approvedBy}`);

      // TODO: PR-1 Phase 2 - Implement full execution continuation
      // For now, we mark as completed with a note that execution was approved
      const result = {
        approved: true,
        approvedBy: job.approvedBy,
        approvedAt: job.approvedAt,
        message: 'Job approved and execution resumed. Full execution continuation pending PR-1 Phase 2 implementation.',
      };

      await traceRecorder.flush();
      await this.completeJob(jobId, result);
    } catch (error) {
      try {
        traceRecorder.recordError(
          error instanceof Error ? error.message : String(error),
          'EXECUTION_FAILED'
        );
        await traceRecorder.flush();
      } catch (traceError) {
        console.error(`Failed to flush traces for job ${jobId}:`, traceError);
      }

      await this.failJob(jobId, error);
      throw error;
    }
  }

  /**
   * PR-1: Transition job to awaiting_approval state
   * Called when plan generation is complete and approval is required
   * @param jobId - Job ID
   * @throws JobNotFoundError if job doesn't exist
   * @throws InvalidStateTransitionError if state transition is invalid
   * @throws DatabaseError if DB operations fail
   */
  async awaitApproval(jobId: string): Promise<void> {
    // Load state machine from DB if not in memory
    let stateMachine = this.stateMachines.get(jobId);
    if (!stateMachine) {
      const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
      if (!job) {
        throw new JobNotFoundError(jobId);
      }
      stateMachine = new AgentStateMachine(job.state as 'pending' | 'running' | 'completed' | 'failed');
      this.stateMachines.set(jobId, stateMachine);
    }

    // Validate state is running
    const currentState = stateMachine.getState();
    if (currentState !== 'running') {
      throw new InvalidStateTransitionError(jobId, currentState, 'await_approval');
    }

    // Update database
    try {
      await db.update(jobs).set({ 
        state: 'awaiting_approval',
        requiresApproval: true,
        updatedAt: new Date() 
      }).where(eq(jobs.id, jobId));
    } catch (error) {
      throw new DatabaseError(`Failed to update job state: ${error instanceof Error ? error.message : String(error)}`, error);
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
    const payload = (context && typeof context === 'object' ? context : {}) as Record<string, unknown>;
    const executionId = this.generateExecutionId();
    
    const resolvedTools: AgentDependencies = { 
      ...this.tools,
      tools: {
        ...(this.tools.tools || {}),
        aiService: this.aiService,
      }
    };
    
    // S0.4.6: Fail-fast validation for GitHub-dependent agents
    if (this.agentRequiresGitHub(agentType, payload)) {
      const userId = payload.userId as string | undefined;
      
      if (!userId) {
        throw new MissingDependencyError(
          'userId',
          'Context must include userId for GitHub-dependent operations.'
        );
      }
      
      const userGitHubToken = await this.resolveGitHubToken(userId);
      
      if (!userGitHubToken) {
        throw new GitHubNotConnectedError(
          `GitHub is not connected for user ${userId}. Please connect your GitHub account first.`
        );
      }
      
      if (env.GITHUB_MCP_BASE_URL) {
        resolvedTools.tools!.githubMCP = new GitHubMCPService({
          baseUrl: env.GITHUB_MCP_BASE_URL,
          token: userGitHubToken,
          correlationId: executionId,
        });
      } else {
        throw new MissingDependencyError(
          'GITHUB_MCP_BASE_URL',
          'GITHUB_MCP_BASE_URL environment variable is not configured.'
        );
      }
    } else if (!resolvedTools.tools?.githubMCP && env.GITHUB_MCP_BASE_URL) {
      const token = env.GITHUB_TOKEN || ''; 
      resolvedTools.tools!.githubMCP = new GitHubMCPService({
        baseUrl: env.GITHUB_MCP_BASE_URL,
        token: token,
        correlationId: executionId,
      });
    }

    const agent = AgentFactory.create(agentType, resolvedTools);
    const stateMachine = new AgentStateMachine('pending');

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
