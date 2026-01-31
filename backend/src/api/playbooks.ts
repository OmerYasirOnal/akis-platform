import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getAllPlaybooks, getPlaybook } from '../core/agents/playbooks/index.js';

export async function registerPlaybookRoutes(app: FastifyInstance) {
  app.get('/api/agents/playbooks', async () => {
    return { playbooks: getAllPlaybooks() };
  });

  app.get(
    '/api/agents/playbooks/:type',
    {
      schema: {
        params: {
          type: 'object',
          required: ['type'],
          properties: {
            type: { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { type } = request.params as { type: string };
      const playbook = getPlaybook(type);
      if (!playbook) {
        return reply.code(404).send({
          error: {
            code: 'PLAYBOOK_NOT_FOUND',
            message: `No playbook found for agent type "${type}"`,
          },
        });
      }
      return { playbook };
    },
  );
}
