#!/usr/bin/env node
/**
 * AKIS GitHub MCP Gateway
 * HTTP-to-stdio bridge for GitHub MCP Server
 * 
 * Exposes HTTP endpoint that forwards JSON-RPC requests to GitHub MCP Server via stdio
 */
import Fastify from 'fastify';
import { spawn, type ChildProcess } from 'child_process';
import { randomUUID } from 'crypto';

const PORT = parseInt(process.env.MCP_GATEWAY_PORT || '4010', 10);
const HOST = process.env.MCP_GATEWAY_HOST || '0.0.0.0';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GITHUB_TOKEN) {
  console.error('[MCP Gateway] FATAL: GITHUB_TOKEN environment variable is required');
  process.exit(1);
}

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
  }>();
  private buffer = '';
  private readonly REQUEST_TIMEOUT = 30000; // 30 seconds

  async start(): Promise<void> {
    console.log('[MCP Gateway] Starting GitHub MCP Server (stdio)...');
    
    // Spawn the official GitHub MCP Server
    // Note: The official server expects to run via npx
    this.process = spawn('npx', ['-y', '@modelcontextprotocol/server-github'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        GITHUB_PERSONAL_ACCESS_TOKEN: GITHUB_TOKEN,
      },
    });

    if (!this.process.stdout || !this.process.stdin) {
      throw new Error('Failed to create MCP process stdio streams');
    }

    this.process.stdout.on('data', (data: Buffer) => {
      this.handleStdout(data);
    });

    this.process.stderr!.on('data', (data: Buffer) => {
      console.error('[MCP Server stderr]', data.toString());
    });

    this.process.on('error', (err) => {
      console.error('[MCP Server error]', err);
    });

    this.process.on('exit', (code, signal) => {
      console.log(`[MCP Server] Process exited with code ${code}, signal ${signal}`);
      this.cleanup();
    });

    // Wait a moment for the process to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('[MCP Gateway] GitHub MCP Server started (PID:', this.process.pid, ')');
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
          pending.resolve(response);
        } else {
          console.warn('[MCP Gateway] Received response for unknown request ID:', response.id);
        }
      } catch (err) {
        console.error('[MCP Gateway] Failed to parse MCP response:', line, err);
      }
    }
  }

  async sendRequest(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    if (!this.process || !this.process.stdin) {
      throw new Error('MCP Server process not running');
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(request.id);
        reject(new Error(`Request ${request.id} timed out after ${this.REQUEST_TIMEOUT}ms`));
      }, this.REQUEST_TIMEOUT);

      this.pendingRequests.set(request.id, { resolve, reject, timer });

      // Send request to MCP server via stdin
      const requestLine = JSON.stringify(request) + '\n';
      this.process!.stdin!.write(requestLine, (err) => {
        if (err) {
          clearTimeout(timer);
          this.pendingRequests.delete(request.id);
          reject(new Error(`Failed to write to MCP server: ${err.message}`));
        }
      });
    });
  }

  private cleanup(): void {
    for (const [id, pending] of this.pendingRequests.entries()) {
      clearTimeout(pending.timer);
      pending.reject(new Error('MCP server process terminated'));
    }
    this.pendingRequests.clear();
  }

  async stop(): Promise<void> {
    if (this.process) {
      this.process.kill('SIGTERM');
      this.process = null;
    }
    this.cleanup();
  }
}

async function main() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
    },
  });

  const mcpClient = new GitHubMCPClient();

  // Health check endpoint
  app.get('/health', async () => {
    return { status: 'ok', service: 'akis-github-mcp-gateway' };
  });

  // MCP JSON-RPC endpoint
  app.post('/mcp', async (request, reply) => {
    try {
      const body = request.body as JsonRpcRequest;
      
      // Validate JSON-RPC request
      if (body.jsonrpc !== '2.0' || !body.method) {
        return reply.code(400).send({
          jsonrpc: '2.0',
          error: {
            code: -32600,
            message: 'Invalid Request: Missing jsonrpc or method',
          },
          id: body.id || null,
        });
      }

      // Ensure request has an ID (some clients might omit it)
      const requestWithId = {
        ...body,
        id: body.id || randomUUID(),
      };

      console.log('[MCP Gateway] -> MCP:', requestWithId.method, requestWithId.id);
      
      // Forward to GitHub MCP Server
      const response = await mcpClient.sendRequest(requestWithId);
      
      console.log('[MCP Gateway] <- MCP:', response.id, response.error ? 'ERROR' : 'OK');
      
      return reply.code(200).send(response);
    } catch (err) {
      const error = err as Error;
      console.error('[MCP Gateway] Request failed:', error);
      
      return reply.code(500).send({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: `Internal error: ${error.message}`,
        },
        id: (request.body as JsonRpcRequest).id || null,
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

