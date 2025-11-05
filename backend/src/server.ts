import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { getEnv } from './config/env.js';
import { healthRoutes } from './api/health.js';
import { agentsRoutes } from './api/agents.js';

// Validate environment variables at startup (fail-fast)
const env = getEnv();

const server = Fastify({
  logger: true,
});

// Register CORS
await server.register(cors, {
  origin: true,
});

// Register routes
await server.register(healthRoutes);
await server.register(agentsRoutes);

const port = env.AKIS_PORT;
const host = env.AKIS_HOST;

server.listen({ port, host }, (err) => {
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
  server.log.info(`Server listening on http://${host}:${port}`);
});
