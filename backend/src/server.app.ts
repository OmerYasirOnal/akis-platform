import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { getEnv } from './config/env.js';
import { registerAgents } from './core/agents/registry.js';
import { indexRoutes } from './api/index.js';
import { healthRoutes } from './api/health.js';
import { agentsRoutes, setOrchestrator } from './api/agents.js';
import { AgentOrchestrator } from './core/orchestrator/AgentOrchestrator.js';
import { createAIService } from './services/ai/AIService.js';
import type { MCPTools } from './services/mcp/adapters/index.js';

/**
 * Build Fastify app instance (for testing and production)
 * Phase 5.D: Initialize orchestrator with AIService and MCPTools DI
 * Separated from server.listen() to allow testing with inject()
 */
export async function buildApp() {
  // Validate environment variables at startup (fail-fast)
  const env = getEnv();

  // Register all agents with the factory
  registerAgents();

  // Phase 5.D: Create AIService from env (falls back to mock if not configured)
  const aiService = createAIService(
    (env.AI_PROVIDER as 'openrouter' | 'openai' | 'mock') || 'mock',
    env.AI_API_KEY
  );

  // Phase 5.D: Create MCPTools (signature-only adapters for now)
  // In production, these would be initialized with real tokens/baseUrls
  const mcpTools: MCPTools = {
    // Adapters are signature-only, so we don't instantiate them yet
    // githubMCP: new GitHubMCPService({ baseUrl: env.GITHUB_MCP_BASE_URL || '', token: '...' }),
    // jiraMCP: new JiraMCPService({ baseUrl: env.ATLASSIAN_MCP_BASE_URL || '', token: '...' }),
    // confluenceMCP: new ConfluenceMCPService({ baseUrl: env.ATLASSIAN_MCP_BASE_URL || '', token: '...' }),
  };

  // Phase 5.D: Create orchestrator with DI
  const orchestrator = new AgentOrchestrator({}, aiService, mcpTools);
  setOrchestrator(orchestrator);

  const app = Fastify({
    logger: false, // Disable logger in tests
  });

  // Register CORS
  await app.register(cors, {
    origin: true,
  });

  // Register routes (order matters: root first, then specific routes)
  await app.register(indexRoutes);
  await app.register(healthRoutes);
  await app.register(agentsRoutes);

  // 404 handler (must be registered after all routes)
  app.setNotFoundHandler((request, reply) => {
    reply.code(404).send({
      error: 'Not Found',
      message: `Route ${request.method} ${request.url} not found`,
    });
  });

  return app;
}

