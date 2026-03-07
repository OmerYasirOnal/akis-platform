/**
 * Pipeline factory — creates the PipelineOrchestrator
 * with all agent dependencies wired up from the main backend services.
 */
import { PipelineOrchestrator, type PipelineStore } from './orchestrator/PipelineOrchestrator.js';
import { ScribeAgent } from '../agents/scribe/ScribeAgent.js';
import { ProtoAgent, type ProtoAIDeps, type ProtoGitHubDeps } from '../agents/proto/ProtoAgent.js';
import { TraceAgent, type TraceAIDeps, type TraceGitHubDeps } from '../agents/trace/TraceAgent.js';
import type { ScribeAIDeps } from '../agents/scribe/ScribeAgent.js';
import type { PipelineState } from './contracts/PipelineTypes.js';

// ─── In-Memory Store ─────────────────────────────
// TODO: Replace with PostgreSQL-backed store using pipeline-schema.ts

export class InMemoryPipelineStore implements PipelineStore {
  private pipelines = new Map<string, PipelineState>();

  async create(userId: string): Promise<PipelineState> {
    const id = crypto.randomUUID();
    const now = new Date();
    const pipeline: PipelineState = {
      id,
      userId,
      stage: 'scribe_clarifying',
      scribeConversation: [],
      metrics: {
        startedAt: now,
        clarificationRounds: 0,
        retryCount: 0,
      },
      createdAt: now,
      updatedAt: now,
    };
    this.pipelines.set(id, pipeline);
    return structuredClone(pipeline);
  }

  async getById(id: string): Promise<PipelineState | null> {
    const p = this.pipelines.get(id);
    return p ? structuredClone(p) : null;
  }

  async listByUser(userId: string): Promise<PipelineState[]> {
    return [...this.pipelines.values()]
      .filter((p) => p.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((p) => structuredClone(p));
  }

  async update(id: string, data: Partial<PipelineState>): Promise<PipelineState> {
    const existing = this.pipelines.get(id);
    if (!existing) throw new Error(`Pipeline ${id} not found`);
    const updated = { ...existing, ...data, updatedAt: new Date() };
    this.pipelines.set(id, updated);
    return structuredClone(updated);
  }
}

// ─── AI Adapter ──────────────────────────────────
// Bridges the existing AIService to agent AI deps interfaces.

export interface AIServiceLike {
  generateWorkArtifact(input: {
    systemPrompt?: string;
    task: string;
    context?: unknown;
    maxTokens?: number;
  }): Promise<{ content: string }>;
}

function createScribeAIDeps(aiService: AIServiceLike): ScribeAIDeps {
  return {
    async generateText(systemPrompt: string, userPrompt: string): Promise<string> {
      const result = await aiService.generateWorkArtifact({
        systemPrompt,
        task: userPrompt,
        maxTokens: 8192,
      });
      return result.content;
    },
  };
}

function createProtoAIDeps(aiService: AIServiceLike): ProtoAIDeps {
  return {
    async generateText(systemPrompt: string, userPrompt: string): Promise<string> {
      const result = await aiService.generateWorkArtifact({
        systemPrompt,
        task: userPrompt,
        maxTokens: 16384,
      });
      return result.content;
    },
  };
}

function createTraceAIDeps(aiService: AIServiceLike): TraceAIDeps {
  return {
    async generateText(systemPrompt: string, userPrompt: string): Promise<string> {
      const result = await aiService.generateWorkArtifact({
        systemPrompt,
        task: userPrompt,
        maxTokens: 16384,
      });
      return result.content;
    },
  };
}

// ─── GitHub Adapter ──────────────────────────────
// Bridges the existing GitHubMCPService to agent GitHub deps interfaces.

export interface GitHubServiceLike {
  createRepository(owner: string, name: string, isPrivate: boolean): Promise<{ url: string }>;
  createBranch(owner: string, repo: string, branch: string, fromBranch?: string): Promise<void>;
  commitFile(owner: string, repo: string, branch: string, filePath: string, content: string, message: string): Promise<void>;
  createPR(owner: string, repo: string, title: string, body: string, head: string, base: string): Promise<{ url: string }>;
  listFiles(owner: string, repo: string, branch: string): Promise<string[]>;
  getFileContent(owner: string, repo: string, branch: string, filePath: string): Promise<string>;
}

function createProtoGitHubDeps(github: GitHubServiceLike): ProtoGitHubDeps {
  return {
    createRepository: (owner, name, isPrivate) => github.createRepository(owner, name, isPrivate),
    createBranch: (owner, repo, branch, fromBranch) => github.createBranch(owner, repo, branch, fromBranch),
    commitFile: (owner, repo, branch, filePath, content, message) =>
      github.commitFile(owner, repo, branch, filePath, content, message),
    createPR: (owner, repo, title, body, head, base) =>
      github.createPR(owner, repo, title, body, head, base),
  };
}

function createTraceGitHubDeps(github: GitHubServiceLike): TraceGitHubDeps {
  return {
    listFiles: (owner, repo, branch) => github.listFiles(owner, repo, branch),
    getFileContent: (owner, repo, branch, filePath) => github.getFileContent(owner, repo, branch, filePath),
    commitFile: (owner, repo, branch, filePath, content, message) =>
      github.commitFile(owner, repo, branch, filePath, content, message),
    createBranch: (owner, repo, branch, fromBranch) => github.createBranch(owner, repo, branch, fromBranch),
    createPR: (owner, repo, title, body, head, base) =>
      github.createPR(owner, repo, title, body, head, base),
  };
}

// ─── Factory ─────────────────────────────────────

export interface CreatePipelineOrchestratorOptions {
  aiService: AIServiceLike;
  githubService: GitHubServiceLike;
  getGitHubOwner: (userId: string) => Promise<string>;
  store?: PipelineStore;
}

export function createPipelineOrchestrator(opts: CreatePipelineOrchestratorOptions): PipelineOrchestrator {
  const store = opts.store ?? new InMemoryPipelineStore();

  const scribeAI = createScribeAIDeps(opts.aiService);
  const protoAI = createProtoAIDeps(opts.aiService);
  const traceAI = createTraceAIDeps(opts.aiService);
  const protoGH = createProtoGitHubDeps(opts.githubService);
  const traceGH = createTraceGitHubDeps(opts.githubService);

  const scribe = new ScribeAgent(scribeAI);
  const proto = new ProtoAgent(protoAI, protoGH);
  const trace = new TraceAgent(traceAI, traceGH);

  return new PipelineOrchestrator(
    store,
    scribe,
    proto,
    trace,
    opts.getGitHubOwner,
  );
}
