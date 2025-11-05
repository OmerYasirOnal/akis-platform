import { FastifyInstance } from 'fastify';

export async function agentsRoutes(fastify: FastifyInstance) {
  // POST /api/agents/submit
  fastify.post('/api/agents/submit', async (request, reply) => {
    reply.code(501).send({ error: 'Not implemented' });
  });

  // GET /api/agents/:id/status
  fastify.get('/api/agents/:id/status', async (request, reply) => {
    reply.code(501).send({ error: 'Not implemented' });
  });
}

