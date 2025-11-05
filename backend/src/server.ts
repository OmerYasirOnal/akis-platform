import Fastify from 'fastify';
import cors from '@fastify/cors';
import { healthRoutes } from './api/health.js';
import { agentsRoutes } from './api/agents.js';

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

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || '0.0.0.0';

server.listen({ port, host }, (err) => {
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
  server.log.info(`Server listening on http://${host}:${port}`);
});
