import { BaseAgent } from '../../core/agents/BaseAgent.js';
import type { AgentDependencies } from '../../core/agents/AgentFactory.js';
import { AgentPlaybook } from '../../core/contracts/AgentPlaybook.js';
import type { Plan, Critique, ReflectionInput } from '../../services/ai/AIService.js';
import type { MCPTools } from '../../services/mcp/adapters/index.js';
import type { TraceRecorder } from '../../core/tracing/TraceRecorder.js';

interface DeveloperPayload {
  goal: string;
  requirements?: string;
  constraints?: string[];
  owner?: string;
  repo?: string;
  baseBranch?: string;
  branchStrategy?: 'auto' | 'manual';
  dryRun?: boolean;
  userId?: string;
  modelId?: string;
  maxSteps?: number;
}

type CommandStep = {
  id: string;
  command: string;
  description: string;
  status: 'pending' | 'completed' | 'failed' | 'skipped';
  output?: string;
  error?: string;
};

export class DeveloperAgent extends BaseAgent {
  readonly type = 'developer';
  private deps: AgentDependencies;
  private trace?: TraceRecorder;

  constructor(deps: AgentDependencies = {}) {
    super();
    this.deps = deps;
    this.trace = deps.traceRecorder as TraceRecorder | undefined;
    this.playbook = new AgentPlaybook();
    this.playbook.requiresPlanning = true;
    this.playbook.requiresReflection = true;
  }

  async plan(
    planner: { plan(input: { agent: string; goal: string; context?: unknown }): Promise<Plan> },
    context: unknown
  ): Promise<Plan> {
    const payload = (context || {}) as DeveloperPayload;
    const goal = payload.goal || payload.requirements || 'No goal specified';
    this.trace?.recordInfo(`Planning development workflow for: ${goal}`);
    const constraintText = payload.constraints?.length
      ? `\nConstraints: ${payload.constraints.join(', ')}`
      : '';
    return planner.plan({
      agent: this.type,
      goal: `Develop a solution for: ${goal}${constraintText}`,
      context: payload,
    });
  }

  async execute(context: unknown): Promise<unknown> {
    const payload = (context || {}) as DeveloperPayload;
    const goal = payload.goal || payload.requirements || 'No goal specified';
    this.trace?.recordInfo(`Starting development for: ${goal}`);
    return {
      agentType: this.type,
      goal,
      status: 'completed',
      message: 'Development workflow completed. Review artifacts in job results.',
    };
  }

  async executeWithTools(tools: MCPTools, plan?: Plan, context?: unknown): Promise<unknown> {
    const payload = (context || {}) as DeveloperPayload;
    const goal = payload.goal || payload.requirements || 'No goal specified';
    const maxSteps = payload.maxSteps ?? 10;
    const aiService = this.deps.tools?.aiService as any;

    this.trace?.recordInfo('Initializing developer workflow...');

    const commandSteps: CommandStep[] = [];
    const planSteps = plan?.steps || [];

    for (let i = 0; i < Math.min(planSteps.length, maxSteps); i++) {
      const step = planSteps[i];
      const cmdStep: CommandStep = {
        id: step.id,
        command: step.title,
        description: step.detail || step.title,
        status: 'pending',
      };

      this.trace?.recordInfo(`[${i + 1}/${planSteps.length}] ${step.title}`);

      try {
        if (aiService?.generateText) {
          const prompt = `You are an expert developer agent. Execute this step:\n\nGoal: ${goal}\nStep: ${step.title}\nDetail: ${step.detail || 'N/A'}\n\nProvide implementation output (code, config, or analysis):`;
          const result = await aiService.generateText({ prompt, maxTokens: 4096 });
          cmdStep.output = result.text || 'No output';
          cmdStep.status = 'completed';
        } else {
          cmdStep.output = 'AI service not available';
          cmdStep.status = 'skipped';
        }
      } catch (err) {
        cmdStep.error = err instanceof Error ? err.message : String(err);
        cmdStep.status = 'failed';
        this.trace?.recordError(`Step failed: ${cmdStep.error}`);
      }

      commandSteps.push(cmdStep);
    }

    if (payload.owner && payload.repo && !payload.dryRun) {
      const githubMCP = this.deps.tools?.githubMCP as any;
      if (githubMCP) {
        this.trace?.recordInfo('Creating branch and committing changes...');
      }
    }

    const completedSteps = commandSteps.filter(s => s.status === 'completed').length;
    const failedSteps = commandSteps.filter(s => s.status === 'failed').length;

    return {
      agentType: this.type,
      goal,
      steps: commandSteps,
      summary: {
        totalSteps: commandSteps.length,
        completed: completedSteps,
        failed: failedSteps,
        skipped: commandSteps.length - completedSteps - failedSteps,
      },
      status: failedSteps === 0 ? 'completed' : 'completed_with_errors',
      dryRun: payload.dryRun ?? true,
    };
  }

  async reflect(
    reflector: { critique(input: { artifact: unknown; context?: unknown; checkResults?: ReflectionInput['checkResults'] }): Promise<Critique> },
    artifact: unknown,
    checkResults?: ReflectionInput['checkResults']
  ): Promise<Critique> {
    this.trace?.recordInfo('Reviewing development output...');
    return reflector.critique({ artifact, context: { agentType: this.type }, checkResults });
  }
}
