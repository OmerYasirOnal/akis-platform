import { FastifyInstance } from 'fastify';
import { aiKeysRoutes } from './ai-keys.js';

export async function settingsRoutes(fastify: FastifyInstance) {
  await fastify.register(aiKeysRoutes, { prefix: '/settings' });
}
