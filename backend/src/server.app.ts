// NOTE: Do NOT import 'dotenv/config' here.
// Env loading is handled by config/env.ts with correct precedence:
// 1) Shell exports  2) backend/.env.local  3) backend/.env
import Fastify from 'fastify';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';
import { getEnv, getAIConfig } from './config/env.js';
import { isEncryptionConfigured } from './utils/crypto.js';
import { isEmailConfigured } from './services/email/index.js';
import { registerAgents } from './core/agents/registry.js';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { indexRoutes } from './api/index.js';
import { healthRoutes } from './api/health.js';
import { agentsRoutes, setOrchestrator } from './api/agents.js';
import { metricsRoutes, metrics } from './api/metrics.js';
import { authRoutes } from './api/auth.js';
import { agentConfigRoutes } from './api/agent-configs.js';
import { integrationsRoutes } from './api/integrations.js';
import { testHelpersRoutes } from './api/test-helpers.js';
import { settingsRoutes } from './api/settings/index.js';
import { usageRoutes } from './api/usage.js';
import { jobEventsRoutes } from './api/job-events.js';
import { webhookRoutes, setWebhookOrchestrator } from './api/webhooks.js';
import { triggersRoutes } from './api/triggers.js';
import { registerPlaybookRoutes } from './api/playbooks.js';
import { dashboardMetricsRoutes } from './api/dashboard-metrics.js';
import { aiModelsRoutes } from './api/ai-models.js';
import { smartAutomationsRoutes } from './api/smart-automations.js';
import { AgentOrchestrator } from './core/orchestrator/AgentOrchestrator.js';
import { createAIService } from './services/ai/AIService.js';
import type { MCPTools } from './services/mcp/adapters/index.js';
import { StaleJobWatchdog } from './core/watchdog/StaleJobWatchdog.js';
import { startAutomationScheduler } from './services/smart-automations/index.js';
import { formatErrorResponse, getStatusCodeForError, type ErrorCode } from './utils/errorHandler.js';
import { ZodError } from 'zod';

const QUIET_ROUTES = new Set([
  '/api/agents/jobs/running',
  '/api/agents/configs',
  '/api/usage/current-month',
  '/health',
  '/ready',
]);

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
  console.log(`[buildApp] AI Base URL: ${configSummary.baseUrl}`);
  console.log(`[buildApp] AI API Key: ${configSummary.hasApiKey ? 'configured' : 'NOT CONFIGURED'}`);

  // Startup diagnostics for encryption, email, and OAuth (no secrets)
  console.log(`[buildApp] Encryption: ${isEncryptionConfigured() ? 'configured' : 'NOT CONFIGURED — AI key save will return 503'}`);
  console.log(`[buildApp] Email: provider=${env.EMAIL_PROVIDER}, configured=${isEmailConfigured(env.EMAIL_PROVIDER)}`);
  console.log(`[buildApp] OAuth: google=${env.GOOGLE_OAUTH_CLIENT_ID ? 'configured' : 'NOT SET'}, github=${env.GITHUB_OAUTH_CLIENT_ID ? 'configured' : 'NOT SET'}`);
  if (env.GOOGLE_OAUTH_CLIENT_ID || env.GITHUB_OAUTH_CLIENT_ID) {
    console.log(`[buildApp] OAuth callback base: ${env.BACKEND_URL}/auth/oauth/<provider>/callback`);
  }

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
  setWebhookOrchestrator(orchestrator);

  // Start stale job watchdog
  const watchdog = new StaleJobWatchdog();
  watchdog.start();

  // Start smart automation scheduler (polls for due automations every 60s)
  startAutomationScheduler();

  // Phase 7.A: Enable structured logging with request-id
  const isTest = process.env.NODE_ENV === 'test';
  const app = Fastify({
    trustProxy: env.TRUST_PROXY,
    logger: isTest
      ? false
      : {
          level: process.env.LOG_LEVEL || 'info',
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
    disableRequestLogging: true,
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
    const duration = reply.elapsedTime! / 1000;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const req = request as any;
    const route: string = req.routeOptions?.url ?? req.routerPath ?? request.url.split('?')[0];
    metrics.httpDuration.observe(
      {
        method: request.method,
        route,
        status_code: reply.statusCode.toString(),
      },
      duration
    );

    if (app.log && !QUIET_ROUTES.has(route)) {
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
    routePrefix: '/api/docs',
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
  await app.register(agentConfigRoutes);
  await app.register(integrationsRoutes);
  await app.register(settingsRoutes, { prefix: '/api' });
  await app.register(usageRoutes);
  await app.register(jobEventsRoutes);
  await app.register(webhookRoutes);
  await app.register(triggersRoutes);
  await app.register(registerPlaybookRoutes);
  await app.register(dashboardMetricsRoutes);
  await app.register(aiModelsRoutes);
  await app.register(smartAutomationsRoutes);
  if (env.NODE_ENV !== 'production' && process.env.SCRIBE_DEV_GITHUB_BOOTSTRAP === 'true') {
    await app.register(testHelpersRoutes, { prefix: '/test' });
  }

  // Phase 7.C: Expose OpenAPI JSON at /openapi.json (after routes are registered)
  app.get('/openapi.json', async (_request: FastifyRequest, reply: FastifyReply) => {
    reply.type('application/json');
    return app.swagger();
  });

  // ── AGT-6: Global error handler ──
  // Catches unhandled errors and formats them using the standard error envelope.
  // Route handlers that use sendError() directly do NOT trigger this handler.
  app.setErrorHandler((error: Error, request: FastifyRequest, reply: FastifyReply) => {
    // ZodError → VALIDATION_ERROR (400)
    if (error instanceof ZodError) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: error.errors,
        },
        requestId: request.id,
      });
    }

    // Fastify validation errors (from JSON schema)
    if ('validation' in error && Array.isArray((error as { validation?: unknown[] }).validation)) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message || 'Request validation failed',
          details: (error as { validation: unknown[] }).validation,
        },
        requestId: request.id,
      });
    }

    // Known application errors → standard envelope
    const envelope = formatErrorResponse(request, error);
    const statusCode = getStatusCodeForError(envelope.error.code as ErrorCode);

    if (statusCode >= 500 && app.log) {
      app.log.error({ err: error, requestId: request.id }, 'Unhandled server error');
    }

    return reply.code(statusCode).send(envelope);
  });

  // 404 handler — standard error envelope (must be registered after all routes)
  app.setNotFoundHandler((request: FastifyRequest, reply: FastifyReply) => {
    reply.code(404).send({
      error: {
        code: 'NOT_FOUND',
        message: `Route ${request.method} ${request.url} not found`,
      },
      requestId: request.id,
    });
  });

  return app;
}
