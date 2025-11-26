import 'dotenv/config';
import Fastify from 'fastify';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';
import { getEnv, getAIConfig } from './config/env.js';
import { registerAgents } from './core/agents/registry.js';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { indexRoutes } from './api/index.js';
import { healthRoutes } from './api/health.js';
import { agentsRoutes, setOrchestrator } from './api/agents.js';
import { metricsRoutes, metrics } from './api/metrics.js';
import { authRoutes } from './api/auth.js';
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

  // Phase 10: Create AIService with resolved configuration
  // Uses getAIConfig() which handles legacy OPENROUTER_*/OPENAI_* variable fallbacks
  const aiConfig = getAIConfig(env);
  const aiService = createAIService(aiConfig);

  // Log AI service configuration (without secrets)
  const configSummary = aiService.getConfigSummary();
  console.log(`[buildApp] AI Provider: ${configSummary.provider}`);
  console.log(`[buildApp] AI Models: default=${configSummary.models.default}, planner=${configSummary.models.planner}, validation=${configSummary.models.validation}`);

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

  // Phase 7.A: Enable structured logging with request-id
  const isTest = process.env.NODE_ENV === 'test';
  const app = Fastify({
    logger: isTest
      ? false
      : {
          level: process.env.LOG_LEVEL || 'info',
          // Only use pino-pretty in development if available
          transport:
            process.env.NODE_ENV === 'development'
              ? {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                  },
                }
              : undefined,
        },
    requestIdHeader: 'request-id',
    requestIdLogLabel: 'requestId',
    genReqId: (req: FastifyRequest) => {
      // Accept inbound request-id header if present, else generate UUID
      return (req.headers['request-id'] as string) || randomUUID();
    },
  });

  // Phase 7.A: Add request logging hook
  app.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    // Fastify automatically sets request.id from genReqId
    // We can attach it to the reply for later use
    reply.requestId = request.id;
  });

  app.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    // Phase 7.B: Record HTTP duration metric
    const duration = reply.elapsedTime! / 1000; // Convert to seconds
    const route = request.routerPath || request.url.split('?')[0];
    metrics.httpDuration.observe(
      {
        method: request.method,
        route,
        status_code: reply.statusCode.toString(),
      },
      duration
    );

    // Log essential request fields
    if (app.log) {
      app.log.info({
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        requestId: request.id,
        duration,
      }, 'request completed');
    }
  });

  // Phase 7.C: Register Swagger/OpenAPI
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'AKIS Platform API',
        description: 'AI Agent Workflow Engine API',
        version: '0.1.0',
      },
      servers: [
        {
          url: env.BACKEND_URL || 'http://localhost:3000',
          description: 'Development server',
        },
      ],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
    staticCSP: true,
    transformStaticCSP: (header: string) => header,
  });

  // Register routes (order matters: root first, then specific routes)
  await app.register(indexRoutes);
  await app.register(healthRoutes);
  await app.register(metricsRoutes);
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(agentsRoutes);

  // Phase 7.C: Expose OpenAPI JSON at /openapi.json (after routes are registered)
  app.get('/openapi.json', async (_request: FastifyRequest, reply: FastifyReply) => {
    reply.type('application/json');
    return app.swagger();
  });

  // 404 handler (must be registered after all routes)
  app.setNotFoundHandler((request: FastifyRequest, reply: FastifyReply) => {
    reply.code(404).send({
      error: 'Not Found',
      message: `Route ${request.method} ${request.url} not found`,
    });
  });

  return app;
}

