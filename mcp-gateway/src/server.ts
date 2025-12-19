#!/usr/bin/env node
/**
 * AKIS GitHub MCP Gateway
 * HTTP-to-stdio bridge for official GitHub MCP Server
 * 
 * Uses: github/github-mcp-server (official Docker image)
 * Exposes: HTTP JSON-RPC endpoint at POST /mcp
 */
import Fastify from 'fastify';
import { spawn, type ChildProcess } from 'child_process';
import { randomUUID } from 'crypto';

const PORT = parseInt(process.env.MCP_GATEWAY_PORT || '4010', 10);
const HOST = process.env.MCP_GATEWAY_HOST || '0.0.0.0';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

if (!GITHUB_TOKEN) {
  console.error('[MCP Gateway] FATAL: GITHUB_TOKEN (or GITHUB_PERSONAL_ACCESS_TOKEN) environment variable is required');
  console.error('[MCP Gateway] Create token at: https://github.com/settings/tokens');
  console.error('[MCP Gateway] Required scopes: repo, read:org');
  process.exit(1);
}

const DEBUG = LOG_LEVEL === 'debug';

interface JsonRpcRequest {
  jsonrpc: '2.0';
  method: string;
  params?: unknown;
  id: string | number;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
  id: string | number;
}

class GitHubMCPClient {
  private process: ChildProcess | null = null;
  private pendingRequests = new Map<string | number, {
    resolve: (value: JsonRpcResponse) => void;
    reject: (error: Error) => void;
    timer: NodeJS.Timeout;
    correlationId: string;
  }>();
  private buffer = '';
  private readonly REQUEST_TIMEOUT = 30000; // 30 seconds
  private initializePromise: Promise<void> | null = null;

  async start(): Promise<void> {
    if (this.initializePromise) {
      return this.initializePromise;
    }

    this.initializePromise = this._doStart();
    return this.initializePromise;
  }

  private async _doStart(): Promise<void> {
    console.log('[MCP Gateway] Starting official GitHub MCP Server (stdio)...');
    console.log('[MCP Gateway] Using: @modelcontextprotocol/server-github via npx');
    
    // Spawn the official GitHub MCP Server via npx
    // This uses the official npm package which internally uses github-mcp-server
    this.process = spawn('npx', ['-y', '@modelcontextprotocol/server-github'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        GITHUB_PERSONAL_ACCESS_TOKEN: GITHUB_TOKEN,
        NODE_ENV: 'production',
      },
    });

    if (!this.process.stdout || !this.process.stdin) {
      throw new Error('Failed to create MCP process stdio streams');
    }

    this.process.stdout.on('data', (data: Buffer) => {
      this.handleStdout(data);
    });

    this.process.stderr!.on('data', (data: Buffer) => {
      const msg = data.toString();
      if (DEBUG) {
        console.error('[MCP Server stderr]', msg);
      } else if (msg.toLowerCase().includes('error') || msg.toLowerCase().includes('fatal')) {
        console.error('[MCP Server stderr]', msg);
      }
    });

    this.process.on('error', (err) => {
      console.error('[MCP Server error]', err);
      this.cleanup();
    });

    this.process.on('exit', (code, signal) => {
      if (code !== 0) {
        console.error(`[MCP Server] Process exited unexpectedly with code ${code}, signal ${signal}`);
      } else {
        console.log(`[MCP Server] Process exited with code ${code}, signal ${signal}`);
      }
      this.cleanup();
    });

    // Wait for the process to initialize
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (this.process && !this.process.killed) {
      console.log('[MCP Gateway] ✅ GitHub MCP Server started (PID:', this.process.pid, ')');
    } else {
      throw new Error('MCP Server failed to start');
    }
  }

  private handleStdout(data: Buffer): void {
    this.buffer += data.toString();
    
    // Process complete JSON-RPC messages (one per line)
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || ''; // Keep incomplete line in buffer
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      try {
        const response = JSON.parse(line) as JsonRpcResponse;
        const pending = this.pendingRequests.get(response.id);
        
        if (pending) {
          clearTimeout(pending.timer);
          this.pendingRequests.delete(response.id);
          
          if (DEBUG || response.error) {
            console.log(`[MCP Gateway] <- Response [${pending.correlationId}]:`, 
              response.error ? `ERROR ${response.error.code}` : 'OK');
            if (response.error && DEBUG) {
              console.error(`[MCP Gateway] Error details [${pending.correlationId}]:`, response.error);
            }
          }
          
          pending.resolve(response);
        } else {
          console.warn('[MCP Gateway] Received response for unknown request ID:', response.id);
        }
      } catch (err) {
        console.error('[MCP Gateway] Failed to parse MCP response:', line.substring(0, 200), err);
      }
    }
  }

  async sendRequest(request: JsonRpcRequest, correlationId: string): Promise<JsonRpcResponse> {
    if (!this.process || !this.process.stdin || this.process.killed) {
      throw new Error('MCP Server process not running. Try restarting the gateway.');
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(request.id);
        reject(new Error(
          `Request ${request.id} timed out after ${this.REQUEST_TIMEOUT}ms. ` +
          `Method: ${request.method}. Correlation ID: ${correlationId}`
        ));
      }, this.REQUEST_TIMEOUT);

      this.pendingRequests.set(request.id, { resolve, reject, timer, correlationId });

      // Send request to MCP server via stdin
      const requestLine = JSON.stringify(request) + '\n';
      
      if (DEBUG) {
        console.log(`[MCP Gateway] -> Request [${correlationId}]:`, request.method, request.id);
      }
      
      this.process!.stdin!.write(requestLine, (err) => {
        if (err) {
          clearTimeout(timer);
          this.pendingRequests.delete(request.id);
          reject(new Error(`Failed to write to MCP server: ${err.message}. Correlation ID: ${correlationId}`));
        }
      });
    });
  }

  private cleanup(): void {
    for (const [id, pending] of this.pendingRequests.entries()) {
      clearTimeout(pending.timer);
      pending.reject(new Error(`MCP server process terminated. Correlation ID: ${pending.correlationId}`));
    }
    this.pendingRequests.clear();
    this.initializePromise = null;
  }

  async stop(): Promise<void> {
    if (this.process && !this.process.killed) {
      console.log('[MCP Gateway] Stopping MCP Server...');
      this.process.kill('SIGTERM');
      
      // Wait up to 5 seconds for graceful shutdown
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      if (this.process && !this.process.killed) {
        console.warn('[MCP Gateway] Force killing MCP Server...');
        this.process.kill('SIGKILL');
      }
      
      this.process = null;
    }
    this.cleanup();
  }

  isRunning(): boolean {
    return this.process !== null && !this.process.killed;
  }
}

async function main() {
  const app = Fastify({
    logger: DEBUG ? {
      level: 'debug',
    } : {
      level: 'error', // Only log errors in production
    },
  });

  const mcpClient = new GitHubMCPClient();

  // Health check endpoint with MCP server status
  app.get('/health', async () => {
    return { 
      status: 'ok', 
      service: 'akis-github-mcp-gateway',
      mcpServer: {
        running: mcpClient.isRunning(),
      },
    };
  });

  // MCP JSON-RPC endpoint
  app.post('/mcp', async (request, reply) => {
    const correlationId = randomUUID();
    const contentType = request.headers['content-type'] || '';
    
    try {
      // Validate Content-Type
      if (!contentType.includes('application/json')) {
        console.warn(`[MCP Gateway] [${correlationId}] Invalid Content-Type:`, contentType);
        return reply.code(400).send({
          jsonrpc: '2.0',
          error: {
            code: -32700,
            message: 'Parse error: Content-Type must be application/json',
            data: { correlationId, hint: 'Set header: Content-Type: application/json' },
          },
          id: null,
        });
      }

      const body = request.body as JsonRpcRequest;
      
      // Validate JSON-RPC envelope
      if (!body || typeof body !== 'object') {
        console.warn(`[MCP Gateway] [${correlationId}] Invalid body: not an object`);
        return reply.code(400).send({
          jsonrpc: '2.0',
          error: {
            code: -32700,
            message: 'Parse error: Request body must be a JSON object',
            data: { correlationId },
          },
          id: null,
        });
      }

      if (body.jsonrpc !== '2.0') {
        console.warn(`[MCP Gateway] [${correlationId}] Missing or invalid jsonrpc version:`, body.jsonrpc);
        return reply.code(400).send({
          jsonrpc: '2.0',
          error: {
            code: -32600,
            message: 'Invalid Request: jsonrpc field must be "2.0"',
            data: { correlationId, received: body.jsonrpc },
          },
          id: body.id || null,
        });
      }

      if (!body.method || typeof body.method !== 'string') {
        console.warn(`[MCP Gateway] [${correlationId}] Missing or invalid method:`, body.method);
        return reply.code(400).send({
          jsonrpc: '2.0',
          error: {
            code: -32600,
            message: 'Invalid Request: method field is required and must be a string',
            data: { correlationId, hint: 'Common methods: initialize, tools/list, tools/call' },
          },
          id: body.id || null,
        });
      }

      // Check MCP server is running
      if (!mcpClient.isRunning()) {
        console.error(`[MCP Gateway] [${correlationId}] MCP server not running`);
        return reply.code(503).send({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Service Unavailable: MCP server is not running',
            data: { correlationId, hint: 'Try restarting the gateway' },
          },
          id: body.id || null,
        });
      }

      // Ensure request has an ID
      const requestWithId = {
        ...body,
        id: body.id || randomUUID(),
      };

      console.log(`[MCP Gateway] [${correlationId}] -> ${requestWithId.method}`);
      
      // Forward to GitHub MCP Server
      const response = await mcpClient.sendRequest(requestWithId, correlationId);
      
      if (response.error) {
        console.error(`[MCP Gateway] [${correlationId}] <- ERROR ${response.error.code}: ${response.error.message}`);
      } else {
        console.log(`[MCP Gateway] [${correlationId}] <- OK`);
      }
      
      return reply.code(200).send(response);
    } catch (err) {
      const error = err as Error;
      console.error(`[MCP Gateway] [${correlationId}] Request failed:`, error.message);
      
      // Provide actionable error message
      let hint = 'Check gateway logs for details';
      if (error.message.includes('timeout')) {
        hint = 'Request timed out. GitHub API might be slow or rate-limited.';
      } else if (error.message.includes('not running')) {
        hint = 'MCP server process died. Restart the gateway.';
      } else if (error.message.includes('write')) {
        hint = 'Failed to communicate with MCP server. Restart the gateway.';
      }
      
      return reply.code(500).send({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: `Internal error: ${error.message}`,
          data: { 
            correlationId,
            hint,
            timestamp: new Date().toISOString(),
          },
        },
        id: (request.body as JsonRpcRequest)?.id || null,
      });
    }
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`[MCP Gateway] Received ${signal}, shutting down...`);
    await mcpClient.stop();
    await app.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  try {
    // Start MCP client
    await mcpClient.start();
    
    // Start HTTP server
    await app.listen({ port: PORT, host: HOST });
    console.log(`[MCP Gateway] HTTP server listening on http://${HOST}:${PORT}`);
    console.log(`[MCP Gateway] MCP endpoint: http://${HOST}:${PORT}/mcp`);
    console.log(`[MCP Gateway] Health check: http://${HOST}:${PORT}/health`);
  } catch (err) {
    console.error('[MCP Gateway] Failed to start:', err);
    process.exit(1);
  }
}

main();

