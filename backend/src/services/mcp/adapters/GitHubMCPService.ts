import { HttpClient } from '../../http/HttpClient.js';
import { randomUUID } from 'crypto';

/**
 * GitHubMCPService - MCP client adapter for GitHub
 * Phase 5.B: Implements MCP JSON-RPC 2.0 calls
 * Provides high-level methods that internally use JSON-RPC 2.0 to GitHub MCP endpoint
 */

export interface GitHubMCPServiceOptions {
  baseUrl: string;
  token?: string;
  httpClient?: HttpClient;
  /**
   * Correlation ID forwarded to the MCP Gateway via `x-correlation-id`.
   * If not provided, a UUID is generated per service instance.
   *
   * NOTE: This is safe to surface in UI/logs (no secrets).
   */
  correlationId?: string;
}

interface JsonRpcRequest {
  jsonrpc: '2.0';
  method: string;
  params?: unknown;
  id: string | number | null;
}

interface JsonRpcResponse<T> {
  jsonrpc: '2.0';
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
  id: string | number | null;
}

interface McpToolInfo {
  name: string;
  description?: string;
  inputSchema?: unknown;
}

interface McpToolsListResult {
  tools: McpToolInfo[];
}

interface McpToolCallResult {
  content?: Array<{ type: string; text?: string }>;
  isError?: boolean;
}

export class McpError extends Error {
  readonly mcpCode: number;
  readonly mcpMethod: string;
  readonly correlationId: string;
  readonly mcpData?: unknown;

  constructor(opts: { code: number; method: string; message: string; correlationId: string; data?: unknown }) {
    super(opts.message);
    this.name = 'McpError';
    this.mcpCode = opts.code;
    this.mcpMethod = opts.method;
    this.correlationId = opts.correlationId;
    this.mcpData = opts.data;
  }

  /**
   * Safe, user-facing summary (no secrets, no payload dumps).
   */
  toUserMessage(): string {
    const base = `MCP Error [${this.mcpCode}]: ${this.message}`;
    return `${base} (Correlation ID: ${this.correlationId})`;
  }
}

/**
 * GitHub MCP Service - adapter for GitHub MCP server
 * Used by Scribe, Trace, Proto agents
 */
export class GitHubMCPService {
  private baseUrl: string;
  private token?: string;
  private httpClient: HttpClient;
  private requestId: number = 1;
  private correlationId: string;
  private initialized: boolean = false;
  private toolsCache: McpToolInfo[] | null = null;
  private toolsCacheAt: number | null = null;
  private readonly toolsCacheTtlMs = 5 * 60 * 1000; // 5 minutes

  constructor(opts: GitHubMCPServiceOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.token = opts.token;
    this.httpClient = opts.httpClient || new HttpClient();
    this.correlationId = opts.correlationId || randomUUID();
  }

  private nextId(): number {
    return this.requestId++;
  }

  private async callJsonRpc<T>(method: string, params?: unknown): Promise<{ result: T; correlationId: string }> {
    const payload: JsonRpcRequest = {
      jsonrpc: '2.0',
      method,
      params,
      id: this.nextId(),
    };

    const response = await this.httpClient.post(this.baseUrl, payload, this.token, {
      // Forward correlation ID to gateway for log correlation
      'x-correlation-id': this.correlationId,
    });
    const responseCorrelationId = response.headers.get('x-correlation-id') || this.correlationId;

    let json: JsonRpcResponse<T> | null = null;
    try {
      json = (await response.json()) as JsonRpcResponse<T>;
    } catch {
      // Non-JSON response
      json = null;
    }

    if (!response.ok) {
      const code = json?.error?.code ?? response.status;
      const message = json?.error?.message ?? `MCP Request failed: ${response.status} ${response.statusText}`;
      const data = json?.error?.data;
      throw new McpError({ code, method, message, correlationId: responseCorrelationId, data });
    }

    if (!json) {
      throw new McpError({
        code: -32603,
        method,
        message: 'Invalid MCP response: expected JSON',
        correlationId: responseCorrelationId,
      });
    }

    if (json.error) {
      throw new McpError({
        code: json.error.code,
        method,
        message: json.error.message,
        correlationId: responseCorrelationId,
        data: json.error.data,
      });
    }

    return { result: json.result as T, correlationId: responseCorrelationId };
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;

    await this.callJsonRpc('initialize', {
      protocolVersion: '0.1.0',
      capabilities: {},
      clientInfo: {
        name: 'akis-backend',
        version: '0.1.0',
      },
    });

    this.initialized = true;
  }

  private async listTools(): Promise<McpToolInfo[]> {
    const now = Date.now();
    if (this.toolsCache && this.toolsCacheAt && now - this.toolsCacheAt < this.toolsCacheTtlMs) {
      return this.toolsCache;
    }

    await this.ensureInitialized();
    const { result } = await this.callJsonRpc<McpToolsListResult>('tools/list', {});
    const tools = Array.isArray(result?.tools) ? result.tools : [];
    this.toolsCache = tools;
    this.toolsCacheAt = now;
    return tools;
  }

  private parseToolResultJson<T>(toolResult: McpToolCallResult): T {
    const content = toolResult.content;
    if (!Array.isArray(content)) {
      // Some servers might return raw JSON directly
      return toolResult as unknown as T;
    }

    const firstText = content.find((c) => c && c.type === 'text' && typeof c.text === 'string')?.text;
    if (typeof firstText !== 'string') {
      return toolResult as unknown as T;
    }

    try {
      return JSON.parse(firstText) as T;
    } catch {
      // Not JSON - return raw string
      return firstText as unknown as T;
    }
  }

  private async ensureToolAvailable(toolName: string): Promise<void> {
    const tools = await this.listTools();
    const ok = tools.some((t) => t.name === toolName);
    if (!ok) {
      const available = tools.map((t) => t.name).slice(0, 30).join(', ');
      throw new McpError({
        code: -32601,
        method: 'tools/call',
        message: `Tool not found: ${toolName}. Available tools (first 30): ${available}`,
        correlationId: this.correlationId,
      });
    }
  }

  /**
   * Invalidate cached tool list (e.g., after -32601 suggesting drift)
   */
  private invalidateToolsCache(): void {
    this.toolsCache = null;
    this.toolsCacheAt = null;
  }

  private async callTool<T>(toolName: string, args: Record<string, unknown>, retryOnNotFound = true): Promise<T> {
    await this.ensureInitialized();
    await this.ensureToolAvailable(toolName);

    try {
      const { result } = await this.callJsonRpc<McpToolCallResult>('tools/call', {
        name: toolName,
        arguments: args,
      });

      return this.parseToolResultJson<T>(result);
    } catch (err) {
      // Auto-refresh cache and retry once on -32601 (method/tool not found)
      if (err instanceof McpError && err.mcpCode === -32601 && retryOnNotFound) {
        this.invalidateToolsCache();
        // Recursive call with retry disabled to prevent infinite loop
        return this.callTool<T>(toolName, args, false);
      }
      throw err;
    }
  }

  /**
   * Create a branch in GitHub repository
   */
  async createBranch(
    owner: string,
    repo: string,
    branchName: string,
    fromBranch?: string
  ): Promise<{ branch: string; sha: string }> {
    const ref = await this.callTool<{ ref: string; object: { sha: string } }>('create_branch', {
      owner,
      repo,
      branch: branchName,
      ...(fromBranch ? { from_branch: fromBranch } : {}),
    });
    return { branch: branchName, sha: ref.object.sha };
  }

  /**
   * Commit a file to GitHub repository
   */
  async commitFile(
    owner: string,
    repo: string,
    branch: string,
    filePath: string,
    content: string,
    commitMessage: string
  ): Promise<{ commitSha: string; filePath: string }> {
    const result = await this.callTool<{ commit: { sha: string } }>('create_or_update_file', {
      owner,
      repo,
      path: filePath,
      content,
      message: commitMessage,
      branch,
    });
    return { commitSha: result.commit.sha, filePath };
  }

  /**
   * Get content of a file
   */
  async getFileContent(
    owner: string,
    repo: string,
    branch: string,
    filePath: string
  ): Promise<{ content: string; encoding: 'utf8'; sha: string }> {
    const result = await this.callTool<unknown>('get_file_contents', {
      owner,
      repo,
      path: filePath,
      branch,
    });

    if (!result || typeof result !== 'object' || Array.isArray(result)) {
      throw new Error(`Unexpected get_file_contents result for path '${filePath}'`);
    }

    const record = result as Record<string, unknown>;
    const content = typeof record.content === 'string' ? record.content : '';
    const sha = typeof record.sha === 'string' ? record.sha : '';

    if (!sha) {
      throw new Error(`Missing sha in get_file_contents result for path '${filePath}'`);
    }

    return { content, encoding: 'utf8', sha };
  }

  /**
   * Get changed files between two refs (or for a PR)
   * Used by Scribe to analyze changes
   */
  async getChangedFiles(
    owner: string,
    repo: string,
    base: string,
    head: string
  ): Promise<Array<{ filename: string; status: string; patch?: string }>> {
    // NOTE: The official GitHub MCP server does not currently expose a "compareCommits" tool.
    // Keep this method for future use, but fail with actionable guidance.
    void owner;
    void repo;
    void base;
    void head;
    throw new Error(
      'getChangedFiles is not supported by the official GitHub MCP server. ' +
        'Use PR-based diff tools (e.g., get_pull_request_files) when available.'
    );
  }

  /**
   * List repository issues (for Trace agent)
   */
  async listIssues(
    owner: string,
    repo: string,
    state: 'open' | 'closed' | 'all' = 'open'
  ): Promise<Array<{ number: number; title: string; body?: string }>> {
    return this.callTool<Array<{ number: number; title: string; body?: string }>>('list_issues', {
      owner,
      repo,
      state,
    });
  }

  /**
   * Create a PR draft (for Proto agent)
   */
  async createPRDraft(
    owner: string,
    repo: string,
    title: string,
    body: string,
    head: string,
    base: string
  ): Promise<{ prNumber: number; url: string }> {
    const pr = await this.callTool<{ number: number; html_url: string }>('create_pull_request', {
      owner,
      repo,
      title,
      body,
      head,
      base,
      draft: true,
    });
    return { prNumber: pr.number, url: pr.html_url };
  }
}
