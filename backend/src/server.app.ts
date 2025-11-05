import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { getEnv } from './config/env.js';
import { registerAgents } from './core/agents/registry.js';
import { indexRoutes } from './api/index.js';
import { healthRoutes } from './api/health.js';
import { agentsRoutes } from './api/agents.js';

/**
 * Build Fastify app instance (for testing and production)
 * Separated from server.listen() to allow testing with inject()
 */
export async function buildApp() {
  // Validate environment variables at startup (fail-fast)
  const env = getEnv();

  // Register all agents with the factory
  registerAgents();

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

