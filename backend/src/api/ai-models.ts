import { FastifyInstance } from 'fastify';
import { getScribeModelAllowlist } from '../services/ai/modelAllowlist.js';

export async function aiModelsRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/ai/supported-models
   * Returns list of supported AI models for agent jobs
   */
  fastify.get(
    '/api/ai/supported-models',
    {
      schema: {
        description: 'Get list of supported AI models',
        tags: ['ai'],
        response: {
          200: {
            type: 'object',
            properties: {
              models: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    provider: { type: 'string' },
                    recommended: { type: 'boolean' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async () => {
      const allowlist = getScribeModelAllowlist();

      const models = allowlist.map((modelId) => {
        const isOpenAI = modelId.startsWith('gpt-');
        return {
          id: modelId,
          name: modelId,
          provider: isOpenAI ? 'openai' : 'openrouter',
          recommended: modelId === 'gpt-4o-mini',
        };
      });

      return { models };
    }
  );
}
