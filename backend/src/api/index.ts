import { FastifyInstance } from 'fastify';

export async function indexRoutes(fastify: FastifyInstance) {
  // Root route
  fastify.get('/', async () => {
    return {
      name: 'AKIS Backend',
      status: 'ok',
      version: '0.1.0',
    };
  });
}

