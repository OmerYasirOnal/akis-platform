import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { getEnv } from './config/env.js';
import { registerAgents } from './core/agents/registry.js';
import { indexRoutes } from './api/index.js';
import { healthRoutes } from './api/health.js';
import { agentsRoutes } from './api/agents.js';

// Validate environment variables at startup (fail-fast)
const env = getEnv();

// Register all agents with the factory
registerAgents();

const server = Fastify({
  logger: true,
});

// Register CORS
await server.register(cors, {
  origin: true,
});

// Register routes (order matters: root first, then specific routes)
await server.register(indexRoutes);
await server.register(healthRoutes);
await server.register(agentsRoutes);

// 404 handler (must be registered after all routes)
server.setNotFoundHandler((request, reply) => {
  reply.code(404).send({
    error: 'Not Found',
    message: `Route ${request.method} ${request.url} not found`,
  });
});

const port = env.AKIS_PORT;
const host = env.AKIS_HOST;

server.listen({ port, host }, (err) => {
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
  server.log.info(`Server listening on http://${host}:${port}`);
});
