/**
 * MCP Gateway Health Check
 * 
 * Provides lightweight health check for MCP Gateway availability.
 * Used by Scribe agent to provide actionable error messages when
 * the gateway is not running.
 */
import { getEnv } from '../../config/env.js';

export interface McpHealthStatus {
  healthy: boolean;
  gatewayUrl: string | null;
  error?: string;
  hint?: string;
}

/**
 * Check if MCP Gateway is reachable
 * Non-blocking: returns status without throwing
 * 
 * @example
 * const status = await checkMcpHealth();
 * if (!status.healthy) {
 *   console.error(`MCP not available: ${status.error}. ${status.hint}`);
 * }
 */
export async function checkMcpHealth(): Promise<McpHealthStatus> {
  const env = getEnv();
  const gatewayUrl = env.GITHUB_MCP_BASE_URL;

  if (!gatewayUrl) {
    return {
      healthy: false,
      gatewayUrl: null,
      error: 'GITHUB_MCP_BASE_URL not configured',
      hint: 'Set GITHUB_MCP_BASE_URL=http://localhost:4010/mcp in backend/.env',
    };
  }

  try {
    // Health endpoint is at /health, not /mcp/health
    const healthUrl = gatewayUrl.replace(/\/mcp$/, '/health');
    const response = await fetch(healthUrl, { 
      signal: AbortSignal.timeout(3000),
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (response.ok) {
      try {
        const data = await response.json() as { status?: string };
        if (data.status === 'ok') {
          return { healthy: true, gatewayUrl };
        }
        return {
          healthy: false,
          gatewayUrl,
          error: `Gateway returned unexpected status: ${JSON.stringify(data)}`,
          hint: 'Check MCP Gateway logs: docker compose -f docker-compose.mcp.yml logs',
        };
      } catch {
        // Response is OK but not JSON - still consider healthy
        return { healthy: true, gatewayUrl };
      }
    }

    return {
      healthy: false,
      gatewayUrl,
      error: `Gateway returned status ${response.status}`,
      hint: 'Check if MCP Gateway is running: curl http://localhost:4010/health',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      healthy: false,
      gatewayUrl,
      error: `Cannot reach gateway: ${message}`,
      hint: 'Start MCP Gateway: docker compose -f docker-compose.mcp.yml up -d',
    };
  }
}

/**
 * Check MCP health and throw if not available
 * Use this when you want to fail fast with an actionable error
 * 
 * @throws Error with actionable message if MCP is not available
 */
export async function requireMcpHealth(): Promise<void> {
  const status = await checkMcpHealth();
  if (!status.healthy) {
    throw new Error(
      `MCP Gateway is not available. ${status.error}. ${status.hint}`
    );
  }
}


