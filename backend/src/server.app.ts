import 'dotenv/config';
import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyOauth2 from '@fastify/oauth2';
import fastifyRateLimit from '@fastify/rate-limit';
import type { FastifyOAuth2Options } from '@fastify/oauth2';
import type {
  FastifyPluginAsync,
  FastifyReply,
  FastifyRequest,
  FastifyServerOptions,
} from 'fastify';
import { randomUUID } from 'crypto';
import { getEnv } from './config/env.js';
import { buildEnvStatus } from './config/envStatus.js';
import { registerAgents } from './core/agents/registry.js';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { indexRoutes } from './api/index.js';
import { healthRoutes } from './api/health.js';
import { agentsRoutes, setOrchestrator } from './api/agents.js';
import { metricsRoutes, metrics } from './api/metrics.js';
import { authRoutes } from './api/auth.js';
import { githubRoutes } from './api/github.js';
import { AgentOrchestrator } from './core/orchestrator/AgentOrchestrator.js';
import { AIService, ModelRouter, buildDefaultModelRouter } from './services/ai/AIService.js';
import type { MCPTools } from './services/mcp/adapters/index.js';
import { GitHubInstallationTokenService } from './services/mcp/adapters/GitHubInstallationTokenService.js';
import { GitHubMCPService } from './services/mcp/adapters/GitHubMCPService.js';
import { cookiesPlugin } from './plugins/security/cookies.js';
import { corsPlugin } from './plugins/security/cors.js';
import { helmetPlugin } from './plugins/security/helmet.js';

const API_PREFIX = '/api';

export interface CreateAppOptions {
  logger?: FastifyServerOptions['logger'];
  enableDocs?: boolean;
}

export async function createApp(options: CreateAppOptions = {}) {
  const env = getEnv();
  const envStatus = buildEnvStatus(env);
  const isTest = process.env.NODE_ENV === 'test';
  const enableDocs = options.enableDocs ?? true;

  const loggerOption: FastifyServerOptions['logger'] =
    options.logger !== undefined
      ? options.logger
      : isTest
        ? false
        : {
            level: process.env.LOG_LEVEL || 'info',
            transport:
              process.env.NODE_ENV === 'development'
                ? {
                    target: 'pino-pretty',
                    options: { colorize: true },
                  }
                : undefined,
          };

  // register agents
  registerAgents();

  // AI service
  const modelRouter = buildDefaultModelRouter({
    scribe: env.AKIS_MODEL_DEFAULT_SCRIBE,
    trace: env.AKIS_MODEL_DEFAULT_TRACE,
    proto: env.AKIS_MODEL_DEFAULT_PROTO,
  });

  const aiService = new AIService({
    apiKey: env.OPENROUTER_API_KEY,
    baseUrl: env.OPENROUTER_BASE_URL,
    router: modelRouter,
    fallbackModelId: 'mistralai/mistral-nemo:free',
    mock: isTest || !envStatus.flags.aiEnabled,
    appMetadata: {
      referer: env.OPENROUTER_APP_REFERER ?? 'https://akis.local',
      title: env.OPENROUTER_APP_TITLE ?? 'AKIS Platform',
    },
  });

  const mcpTools: MCPTools = {};
  const orchestrator = new AgentOrchestrator({}, aiService, mcpTools);
  setOrchestrator(orchestrator);

  const app = Fastify({
    logger: loggerOption,
    requestIdHeader: 'request-id',
    requestIdLogLabel: 'requestId',
    genReqId: (req: FastifyRequest) => {
      return (req.headers['request-id'] as string) || randomUUID();
    },
  });

  const rateLimitPlugin = fastifyRateLimit as unknown as FastifyPluginAsync<{
    max: number;
    timeWindow: string;
    hook: string;
  }>;

  await app.register(rateLimitPlugin, {
    max: 120,
    timeWindow: '1 minute',
    hook: 'onRequest',
  });

  await app.register(helmetPlugin, {
    enableCSP: env.NODE_ENV === 'production',
  });

  await app.register(corsPlugin, {
    origins: env.CORS_ORIGINS,
  });

  await app.register(cookiesPlugin, {
    name: env.AUTH_COOKIE_NAME,
    maxAge: env.AUTH_SESSION_TTL_SECONDS,
    sameSite: env.AUTH_COOKIE_SAMESITE,
    secure: env.AUTH_COOKIE_SECURE,
    domain: env.AUTH_COOKIE_DOMAIN,
  });

  // app-level decorations
  app.decorate('modelRouter', modelRouter);
  app.decorate('aiService', aiService);
  app.decorate('featureFlags', envStatus.flags);
  app.decorate('envChecklist', envStatus.checklist);
  app.decorate(
    'githubAdapterFactory',
    createGitHubAdapterFactory(env, envStatus.flags.githubAppEnabled)
  );

  // ✅ JWT sadece 1 kere
  await app.register(fastifyJwt, {
    secret: env.AUTH_JWT_SECRET,
    sign: {
      expiresIn: env.AUTH_SESSION_TTL_SECONDS,
    },
  });

  // optional GitHub OAuth
  if (envStatus.flags.githubOAuthEnabled) {
    await app.register(
      fastifyOauth2,
      {
        name: 'githubOAuth2',
        scope: ['read:user', 'user:email'],
        credentials: {
          client: {
            id: env.GITHUB_OAUTH_CLIENT_ID!,
            secret: env.GITHUB_OAUTH_CLIENT_SECRET!,
          },
          auth: {
            authorizeHost: 'https://github.com',
            authorizePath: '/login/oauth/authorize',
            tokenHost: 'https://github.com',
            tokenPath: '/login/oauth/access_token',
          },
        },
        callbackUri: env.GITHUB_OAUTH_CALLBACK_URL!,
      } satisfies FastifyOAuth2Options
    );
  } else if (!isTest) {
    app.log.warn(
      '[env-check] GitHub OAuth disabled (missing client id/secret/callback). Email/password login remains available.'
    );
  }

  // request-id hook
  app.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.requestId = request.id;
  });

  // auth hydrate hook
  app.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    const userRequest = request as FastifyRequest & {
      user?: { id: string; email: string; jti: string } | undefined;
    };

    if (!request.authToken) {
      Reflect.deleteProperty(userRequest, 'user');
    } else {
      try {
        const payload = await app.jwt.verify<{
          sub: string;
          email: string;
          jti: string;
        }>(request.authToken);

        userRequest.user = {
          id: payload.sub,
          email: payload.email,
          jti: payload.jti,
        };
      } catch (error) {
        Reflect.deleteProperty(userRequest, 'user');
        if (typeof reply.clearAuthCookie === 'function') {
          reply.clearAuthCookie();
        }
      }
    }
  });

  // metrics hook
  app.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    const duration = reply.elapsedTime! / 1000;
    const route = request.routerPath || request.url.split('?')[0];
    metrics.httpDuration.observe(
      {
        method: request.method,
        route,
        status_code: reply.statusCode.toString(),
      },
      duration
    );

    if (app.log) {
      app.log.info(
        {
          method: request.method,
          url: request.url,
          statusCode: reply.statusCode,
          requestId: request.id,
          duration,
        },
        'request completed'
      );
    }
  });

  // env checklist banner
  for (const item of envStatus.checklist) {
    const message = `[env-check] ${item.label}: ${
      item.status === 'ok' ? 'OK' : `missing. ${item.hint ?? ''}`
    }`;
    if (item.status === 'ok') {
      app.log.info(message);
    } else {
      app.log.warn(message);
    }
  }
  if (!envStatus.flags.aiEnabled) {
    app.log.warn(
      '[feature] AI completions disabled (OPENROUTER_API_KEY not set). Falling back to deterministic mock responses.'
    );
  }
  if (!envStatus.flags.githubAppEnabled) {
    app.log.warn(
      '[feature] GitHub repository integration disabled (GitHub App credentials missing).'
    );
  }

  if (enableDocs) {
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
      routePrefix: `${API_PREFIX}/docs`,
      uiConfig: {
        docExpansion: 'list',
        deepLinking: false,
      },
      staticCSP: true,
      transformStaticCSP: (header: string) => header,
    });

    const openapiHandler = async (_request: FastifyRequest, reply: FastifyReply) => {
      reply.type('application/json');
      return app.swagger();
    };

    app.get('/openapi.json', openapiHandler);
    app.get(`${API_PREFIX}/openapi.json`, openapiHandler);
  }

  await app.register(indexRoutes);
  await app.register(metricsRoutes);
  await app.register(healthRoutes);

  const registerApiRoutes: FastifyPluginAsync = async (api) => {
    await api.register(indexRoutes);
    await api.register(metricsRoutes);
    await api.register(authRoutes, { prefix: '/auth' });
    await api.register(githubRoutes);
    await api.register(agentsRoutes);
    await api.register(healthRoutes);
  };

  await app.register(registerApiRoutes, { prefix: API_PREFIX });

  app.setNotFoundHandler((request: FastifyRequest, reply: FastifyReply) => {
    reply.code(404).send({
      error: 'Not Found',
      message: `Route ${request.method} ${request.url} not found`,
    });
  });

  return app;
}

export const buildApp = createApp;

function createGitHubAdapterFactory(env: ReturnType<typeof getEnv>, enabled: boolean) {
  if (!enabled) {
    return () => {
      throw new Error('GitHub App integration is disabled by configuration');
    };
  }

  const tokenService = new GitHubInstallationTokenService({
    appId: env.GITHUB_APP_ID!,
    privateKey: env.GITHUB_APP_PRIVATE_KEY!,
    baseUrl: env.GITHUB_MCP_BASE_URL,
  });

  return async (installationId: string) => {
    const { token } = await tokenService.createInstallationToken(installationId);
    return new GitHubMCPService({
      baseUrl: env.GITHUB_MCP_BASE_URL,
      token,
      installationId,
    });
  };
}