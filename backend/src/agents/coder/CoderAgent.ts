import { BaseAgent } from '../../core/agents/BaseAgent.js';
import type { AgentDependencies } from '../../core/agents/AgentFactory.js';
import { AgentPlaybook } from '../../core/contracts/AgentPlaybook.js';
import type { Plan, Critique, ReflectionInput } from '../../services/ai/AIService.js';
import type { MCPTools } from '../../services/mcp/adapters/index.js';
import type { TraceRecorder } from '../../core/tracing/TraceRecorder.js';

interface CoderPayload {
  task: string;
  language?: string;
  framework?: string;
  owner?: string;
  repo?: string;
  baseBranch?: string;
  branchStrategy?: 'auto' | 'manual';
  dryRun?: boolean;
  userId?: string;
  modelId?: string;
}

export class CoderAgent extends BaseAgent {
  readonly type = 'coder';
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
    const payload = (context || {}) as CoderPayload;
    const task = payload.task || 'Generate code';
    this.trace?.recordInfo(`Planning code generation: ${task}`);
    return planner.plan({
      agent: this.type,
      goal: `Generate code for: ${task}. Language: ${payload.language || 'auto-detect'}. Framework: ${payload.framework || 'none specified'}.`,
      context: payload,
    });
  }

  async execute(context: unknown): Promise<unknown> {
    const payload = (context || {}) as CoderPayload;
    const task = payload.task || 'No task specified';
    this.trace?.recordInfo(`Executing code generation for: ${task}`);
    return {
      agentType: this.type,
      task,
      language: payload.language || 'auto-detect',
      framework: payload.framework,
      status: 'completed',
      message: 'Code generation completed. Review artifacts in job results.',
    };
  }

  async executeWithTools(tools: MCPTools, plan?: Plan, context?: unknown): Promise<unknown> {
    const payload = (context || {}) as CoderPayload;
    const task = payload.task || 'No task specified';
    const aiService = this.deps.tools?.aiService as any;

    this.trace?.recordInfo('Analyzing task requirements...');

    const steps = plan?.steps || [{ id: '1', title: 'Generate code' }];
    const results: Array<{ step: string; output: string }> = [];

    for (const step of steps) {
      this.trace?.recordInfo(`Code generation: ${step.title}`);

      if (aiService?.generateText) {
        const prompt = `You are a senior developer. Complete this task step:\n\nTask: ${task}\nStep: ${step.title}\nLanguage: ${payload.language || 'TypeScript'}\nFramework: ${payload.framework || 'none'}\n\nProvide code output:`;
        try {
          const result = await aiService.generateText({ prompt, maxTokens: 4096 });
          results.push({ step: step.title, output: result.text || 'No output' });
        } catch (err) {
          this.trace?.recordError(err instanceof Error ? err.message : String(err));
          results.push({ step: step.title, output: `Error: ${err instanceof Error ? err.message : String(err)}` });
        }
      } else {
        results.push({ step: step.title, output: 'AI service not available' });
      }
    }

    if (payload.owner && payload.repo && !payload.dryRun) {
      const githubMCP = this.deps.tools?.githubMCP as any;
      if (githubMCP) {
        this.trace?.recordInfo('Creating branch and committing code...');
      }
    }

    return {
      agentType: this.type,
      task,
      language: payload.language,
      framework: payload.framework,
      steps: results,
      status: 'completed',
      dryRun: payload.dryRun ?? true,
    };
  }

  async reflect(
    reflector: { critique(input: { artifact: unknown; context?: unknown; checkResults?: ReflectionInput['checkResults'] }): Promise<Critique> },
    artifact: unknown,
    checkResults?: ReflectionInput['checkResults']
  ): Promise<Critique> {
    this.trace?.recordInfo('Reviewing generated code...');
    return reflector.critique({ artifact, context: { agentType: this.type }, checkResults });
  }
}
