import { FastifyInstance } from 'fastify';

export async function indexRoutes(fastify: FastifyInstance) {
  // Root route
  fastify.get(
    '/',
    {
      schema: {
        description: 'Root endpoint - API information',
        tags: ['meta'],
        response: {
          200: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              status: { type: 'string' },
              version: { type: 'string' },
            },
          },
        },
      },
    },
    async () => {
      return {
        name: 'AKIS Backend',
        status: 'ok',
        version: '0.1.0',
      };
    }
  );
}

